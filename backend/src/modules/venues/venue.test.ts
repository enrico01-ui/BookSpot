import jwt from "jsonwebtoken";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { app } from "../../app.js";
import { env } from "../../config/env.js";
import type { VenueStatus } from "../../generated/prisma/enums.js";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";



type Role = "CUSTOMER" | "OWNER" | "ADMIN";
interface TestUser {
  id: number;
  token: string;
}

const RUN = Date.now().toString(36); // pembeda antar eksekusi test
const EMAIL_SUFFIX = `.${RUN}@vitest.local`; // dipakai juga untuk pembersihan
const CITY = `Kota${RUN}`; // kota unik: hasil filter tidak tercampur data lain
const PAGE_CITY = `Pagi${RUN}`;
const NOT_FOUND_ID = 2_000_000_000;

const sign = (sub: number, role: Role) =>
  jwt.sign({ sub, role }, env.JWT_SECRET, { algorithm: "HS256", expiresIn: "1h" });

const as = (user: TestUser) => ({ Authorization: `Bearer ${user.token}` });
const validBody = (name: string) => ({ name, address: "Jl. Contoh No. 10", city: CITY });
const nameOf = (label: string) => `${label} ${RUN}`;

/** Pengaman: test menghapus dan membuat data, jadi tidak boleh menyentuh database dev. */
function assertTestDatabase() {
  const dbName = new URL(process.env.DATABASE_URL ?? "postgresql://invalid").pathname.slice(1);
  if (!/test/i.test(dbName)) {
    throw new Error(
      `Menolak menjalankan test pada database "${dbName}". Arahkan DATABASE_URL ke database test lewat .env.test.`,
    );
  }
}


async function createUser(label: string, role: Role): Promise<TestUser> {
  const email = `${label}${EMAIL_SUFFIX}`;
  const res = await request(app)
    .post("/api/auth/register")
    .send({
      name: `Test ${label}`,
      email,
      password: "password123",
      role: role === "ADMIN" ? "CUSTOMER" : role, // ADMIN tidak bisa mendaftar sendiri
    });
  if (res.status >= 300) throw new Error(`Gagal membuat user uji "${label}" (${res.status}): ${res.text}`);

  const user = await prisma.user.findUniqueOrThrow({ where: { email: res.body.user.email } });
  if (role === "ADMIN") await prisma.user.update({ where: { id: user.id }, data: { role: "ADMIN" } });
  return { id: user.id, token: sign(user.id, role) };
}

interface SeedOverrides {
  status?: VenueStatus;
  city?: string;
  description?: string | null;
  latitude?: number | null;
  longitude?: number | null;
}

const seedVenue = (ownerId: number, name: string, overrides: SeedOverrides = {}) =>
  prisma.venue.create({
    data: { ownerId, name, address: "Jl. Contoh No. 1", city: CITY, status: "DRAFT", ...overrides },
  });

const row = (id: number) => prisma.venue.findUnique({ where: { id } });



let ownerA: TestUser;
let ownerB: TestUser;
let customer: TestUser;
let admin: TestUser;
let bDraftId: number;
let bPublishedId: number;
let aPublishedId: number;

beforeAll(async () => {
  assertTestDatabase();
  [ownerA, ownerB, customer, admin] = await Promise.all([
    createUser("ownerA", "OWNER"),
    createUser("ownerB", "OWNER"),
    createUser("customer", "CUSTOMER"),
    createUser("admin", "ADMIN"),
  ]);

  bDraftId = (await seedVenue(ownerB.id, nameOf("B Draft"))).id;
  bPublishedId = (await seedVenue(ownerB.id, nameOf("B Published"), { status: "PUBLISHED" })).id;
  aPublishedId = (await seedVenue(ownerA.id, nameOf("A Published"), { status: "PUBLISHED" })).id;
});

afterAll(async () => {
  // Hanya venue milik user uji yang dihapus. User dibiarkan karena database test memang sekali pakai.
  await prisma.venue.deleteMany({ where: { owner: { email: { endsWith: EMAIL_SUFFIX } } } });
  await prisma.$disconnect();
  await redis.quit();
});

/* ============================================================================ */

describe("POST /api/venues", () => {
  it("tanpa token → 401", async () => {
    const res = await request(app).post("/api/venues").send(validBody(nameOf("X")));
    expect(res.status).toBe(401);
  });

  it("sebagai CUSTOMER → 403", async () => {
    const res = await request(app).post("/api/venues").set(as(customer)).send(validBody(nameOf("X")));
    expect(res.status).toBe(403);
  });

  it("sebagai OWNER → 201, status DRAFT, pemilik diambil dari token", async () => {
    const res = await request(app).post("/api/venues").set(as(ownerA)).send(validBody(nameOf("Baru")));
    expect(res.status).toBe(201);
    expect(res.body.venue).toMatchObject({ name: nameOf("Baru"), status: "DRAFT", ownerId: ownerA.id });
  });

  it("field ownerId dan status dari client tidak pernah dipakai", async () => {
    const res = await request(app)
      .post("/api/venues")
      .set(as(ownerA))
      .send({ ...validBody(nameOf("Curang")), ownerId: ownerB.id, status: "PUBLISHED" });

    // 400 bila schema memakai .strict(); 201 bila field asing dibuang. Keduanya aman, asal nilai klien tidak terpakai.
    expect([201, 400]).toContain(res.status);
    if (res.status === 201) {
      const saved = await row(res.body.venue.id);
      expect(saved?.ownerId).toBe(ownerA.id);
      expect(saved?.status).toBe("DRAFT");
    }
  });

  it("input tidak valid → 400 dengan daftar field bermasalah", async () => {
    const res = await request(app).post("/api/venues").set(as(ownerA)).send({ name: "ab", address: "x", city: "S" });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("BAD_REQUEST");
    expect(res.body.error.details.map((d: { path: string }) => d.path)).toEqual(
      expect.arrayContaining(["name", "address", "city"]),
    );
  });

  it("JSON rusak → 400 (bukan 500)", async () => {
    const res = await request(app)
      .post("/api/venues")
      .set(as(ownerA))
      .set("Content-Type", "application/json")
      .send('{"rusak":');
    expect(res.status).toBe(400);
  });
});

describe("GET /api/venues dan /api/venues/:id: visibilitas", () => {
  const listCity = (user?: TestUser, extra = "") => {
    const req = request(app).get(`/api/venues?city=${CITY}&limit=50${extra}`);
    return user ? req.set(as(user)) : req;
  };
  const idsOf = (res: request.Response) => res.body.venues.map((v: { id: number }) => v.id);

  it("tamu: list hanya berisi venue PUBLISHED", async () => {
    const res = await listCity();
    expect(res.status).toBe(200);
    expect(idsOf(res)).toEqual(expect.arrayContaining([aPublishedId, bPublishedId]));
    expect(idsOf(res)).not.toContain(bDraftId);
  });

  it("bentuk respons list: { venues, meta }", async () => {
    const res = await request(app).get("/api/venues");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.venues)).toBe(true);
    expect(res.body.meta).toEqual(
      expect.objectContaining({ total: expect.any(Number), page: 1, limit: 10, totalPages: expect.any(Number) }),
    );
  });

  it("tamu: detail venue PUBLISHED → 200", async () => {
    expect((await request(app).get(`/api/venues/${bPublishedId}`)).status).toBe(200);
  });

  it("tamu: detail venue DRAFT → 404", async () => {
    expect((await request(app).get(`/api/venues/${bDraftId}`)).status).toBe(404);
  });

  it("Owner lain: detail DRAFT milik orang lain → 404", async () => {
    expect((await request(app).get(`/api/venues/${bDraftId}`).set(as(ownerA))).status).toBe(404);
  });

  it("pemilik: detail DRAFT miliknya → 200", async () => {
    expect((await request(app).get(`/api/venues/${bDraftId}`).set(as(ownerB))).status).toBe(200);
  });

  it("Admin: detail DRAFT siapa pun → 200", async () => {
    expect((await request(app).get(`/api/venues/${bDraftId}`).set(as(admin))).status).toBe(200);
  });

  it("tamu: ?status=DRAFT → kosong", async () => {
    const res = await listCity(undefined, "&status=DRAFT");
    expect(res.status).toBe(200);
    expect(res.body.venues).toHaveLength(0);
  });

  it("pemilik: ?status=DRAFT → hanya draft miliknya", async () => {
    const res = await listCity(ownerB, "&status=DRAFT");
    expect(idsOf(res)).toContain(bDraftId);
    expect(res.body.venues.every((v: { ownerId: number }) => v.ownerId === ownerB.id)).toBe(true);
  });

  it("filter kota: tidak peka huruf besar/kecil dan cocok sebagian", async () => {
    const res = await request(app).get(`/api/venues?city=${CITY.toLowerCase().slice(0, -2)}&limit=50`);
    expect(res.status).toBe(200);
    expect(idsOf(res)).toEqual(expect.arrayContaining([aPublishedId, bPublishedId]));
  });

  it("token rusak di route publik → 401", async () => {
    const res = await request(app).get("/api/venues").set("Authorization", "Bearer token.yang.rusak");
    expect(res.status).toBe(401);
  });
});

describe("GET: not found dan input tidak valid", () => {
  it("ID tidak ada → 404 (bukan 500)", async () => {
    const res = await request(app).get(`/api/venues/${NOT_FOUND_ID}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });

  it("ID bukan angka → 400", async () => {
    expect((await request(app).get("/api/venues/abc")).status).toBe(400);
  });

  it("?page=2 → 200 (query tervalidasi di Express 5)", async () => {
    const res = await request(app).get("/api/venues?page=2");
    expect(res.status).toBe(200);
    expect(res.body.meta.page).toBe(2);
  });

  it("URL yang tidak dikenal → 404 berformat JSON", async () => {
    const res = await request(app).get(`/api/tidak-ada-${RUN}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});

describe("PATCH /api/venues/:id", () => {
  it("tanpa token → 401", async () => {
    expect((await request(app).patch(`/api/venues/${aPublishedId}`).send({ name: "x y z" })).status).toBe(401);
  });

  it("sebagai CUSTOMER → 403", async () => {
    const res = await request(app).patch(`/api/venues/${aPublishedId}`).set(as(customer)).send({ name: "x y z" });
    expect(res.status).toBe(403);
  });

  it("Owner mengubah venue Owner lain → 404 dan data tidak berubah", async () => {
    const res = await request(app).patch(`/api/venues/${bPublishedId}`).set(as(ownerA)).send({ name: "Dibajak" });
    expect(res.status).toBe(404);
    expect((await row(bPublishedId))?.name).toBe(nameOf("B Published"));
  });

  it("pemilik mengubah venue sendiri → 200", async () => {
    const venue = await seedVenue(ownerA.id, nameOf("Ubah Saya"));
    const res = await request(app).patch(`/api/venues/${venue.id}`).set(as(ownerA)).send({ name: nameOf("Nama Baru") });
    expect(res.status).toBe(200);
    expect(res.body.venue.name).toBe(nameOf("Nama Baru"));
    expect((await row(venue.id))?.name).toBe(nameOf("Nama Baru"));
  });

  it("null mengosongkan deskripsi, latitude, dan longitude", async () => {
    const venue = await seedVenue(ownerA.id, nameOf("Isi Penuh"), {
      description: "Ada deskripsi",
      latitude: -7.8,
      longitude: 110.4,
    });
    const res = await request(app)
      .patch(`/api/venues/${venue.id}`)
      .set(as(ownerA))
      .send({ description: null, latitude: null, longitude: null });
    expect(res.status).toBe(200);
    expect(await row(venue.id)).toMatchObject({ description: null, latitude: null, longitude: null });
  });

  it("field status dan ownerId dari client tidak mengubah apa pun", async () => {
    const venue = await seedVenue(ownerA.id, nameOf("Jangan Self-Publish"));
    const res = await request(app)
      .patch(`/api/venues/${venue.id}`)
      .set(as(ownerA))
      .send({ status: "PUBLISHED", ownerId: ownerB.id });

    expect([200, 400]).toContain(res.status); // 400 bila .strict(); 200 (tanpa efek) bila field asing dibuang
    expect(await row(venue.id)).toMatchObject({ status: "DRAFT", ownerId: ownerA.id });
  });

  it("input tidak valid → 400", async () => {
    const res = await request(app).patch(`/api/venues/${aPublishedId}`).set(as(ownerA)).send({ name: "ab" });
    expect(res.status).toBe(400);
  });

  it("Admin boleh mengubah venue siapa pun → 200", async () => {
    const venue = await seedVenue(ownerB.id, nameOf("Diubah Admin"));
    const res = await request(app).patch(`/api/venues/${venue.id}`).set(as(admin)).send({ city: CITY });
    expect(res.status).toBe(200);
  });
});

describe("DELETE /api/venues/:id (soft delete)", () => {
  it("tanpa token → 401, CUSTOMER → 403", async () => {
    expect((await request(app).delete(`/api/venues/${aPublishedId}`)).status).toBe(401);
    expect((await request(app).delete(`/api/venues/${aPublishedId}`).set(as(customer))).status).toBe(403);
  });

  it("Owner menghapus venue Owner lain → 404 dan venue tetap utuh", async () => {
    const res = await request(app).delete(`/api/venues/${bPublishedId}`).set(as(ownerA));
    expect(res.status).toBe(404);
    expect((await row(bPublishedId))?.deletedAt).toBeNull();
  });

  it("pemilik menghapus → 204; baris tetap ada dengan deletedAt terisi", async () => {
    const venue = await seedVenue(ownerB.id, nameOf("Akan Dihapus"), { status: "PUBLISHED" });
    const res = await request(app).delete(`/api/venues/${venue.id}`).set(as(ownerB));
    expect(res.status).toBe(204);
    expect((await row(venue.id))?.deletedAt).not.toBeNull();
  });

  it("setelah dihapus: detail 404, hilang dari list (juga untuk Admin), dan hapus ulang 404", async () => {
    const venue = await seedVenue(ownerB.id, nameOf("Hilang"), { status: "PUBLISHED" });
    await request(app).delete(`/api/venues/${venue.id}`).set(as(ownerB)).expect(204);

    expect((await request(app).get(`/api/venues/${venue.id}`)).status).toBe(404);
    expect((await request(app).get(`/api/venues/${venue.id}`).set(as(admin))).status).toBe(404);

    const list = await request(app).get(`/api/venues?city=${CITY}&limit=50`).set(as(admin));
    expect(list.body.venues.map((v: { id: number }) => v.id)).not.toContain(venue.id);

    expect((await request(app).delete(`/api/venues/${venue.id}`).set(as(admin))).status).toBe(404);
  });
});

describe("Pagination", () => {
  beforeAll(async () => {
    await prisma.venue.createMany({
      data: Array.from({ length: 25 }, (_, i) => ({
        ownerId: ownerA.id,
        name: `Pagi ${String(i + 1).padStart(2, "0")} ${RUN}`,
        address: "Jl. Contoh No. 1",
        city: PAGE_CITY,
        status: "PUBLISHED" as const,
        createdAt: new Date(Date.UTC(2026, 0, 1, 10, 0, i)), // urutan waktu yang jelas
      })),
    });
  });

  const page = (n: number, limit = 10) => request(app).get(`/api/venues?city=${PAGE_CITY}&limit=${limit}&page=${n}`);

  it("25 data, limit 10 → halaman 10, 10, 5 tanpa duplikat; total dan totalPages benar", async () => {
    const [p1, p2, p3] = await Promise.all([page(1), page(2), page(3)]);
    const ids = [...p1.body.venues, ...p2.body.venues, ...p3.body.venues].map((v: { id: number }) => v.id);

    expect([p1.body.venues.length, p2.body.venues.length, p3.body.venues.length]).toEqual([10, 10, 5]);
    expect(new Set(ids).size).toBe(25);
    expect(p1.body.meta).toMatchObject({ total: 25, page: 1, limit: 10, totalPages: 3 });
  });

  it("urutan: yang terbaru dulu", async () => {
    const res = await page(1);
    expect(res.body.venues[0].name).toBe(`Pagi 25 ${RUN}`);
    expect(res.body.venues[9].name).toBe(`Pagi 16 ${RUN}`);
  });

  it("halaman di luar jangkauan → 200 dengan daftar kosong", async () => {
    const res = await page(4);
    expect(res.status).toBe(200);
    expect(res.body.venues).toHaveLength(0);
  });

  it("page=0 dan limit=0 → 400", async () => {
    expect((await request(app).get("/api/venues?page=0")).status).toBe(400);
    expect((await request(app).get("/api/venues?limit=0")).status).toBe(400);
  });
});
describe("Sorting", () => {
  it("sortBy=name&sortOrder=asc → urutan A-Z", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&sortBy=name&sortOrder=asc&limit=50`);
    expect(res.status).toBe(200);
    const names = res.body.venues.map((v: { name: string }) => v.name);
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  });
  it("sortBy=name&sortOrder=desc → urutan Z-A", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&sortBy=name&sortOrder=desc&limit=50`);
    expect(res.status).toBe(200);
    const names = res.body.venues.map((v: { name: string }) => v.name);
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    
    expect(names).toEqual(sorted);
  });
  it("sortBy=createdAt&sortOrder=asc → urutan lama ke baru", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&sortBy=createdAt&sortOrder=asc&limit=50`);
    expect(res.status).toBe(200);
    const createdAts = res.body.venues.map((v: { createdAt: string }) => new Date(v.createdAt).getTime());
    const sorted = [...createdAts].sort((a, b) => a - b);
    expect(createdAts).toEqual(sorted);
  });
  it("sortBy=createdAt&sortOrder=desc → urutan baru ke lama", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&sortBy=createdAt&sortOrder=desc&limit=50`);
    expect(res.status).toBe(200);
    const createdAts = res.body.venues.map((v: { createdAt: string }) => new Date(v.createdAt).getTime());
    const sorted = [...createdAts].sort((a, b) => b - a);
    expect(createdAts).toEqual(sorted);
  });
});

describe("Filtering", () => {
  it("filter by name → hanya yang mengandung substring (case-insensitive)", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&name=1&limit=50`);
    expect(res.status).toBe(200);
    expect(res.body.venues.every((v: { name: string }) => v.name.toLowerCase().includes("1"))).toBe(true);
  });
  
it("filter by type → hanya yang mengandung substring (case-insensitive)", async () => {
    const res = await request(app).get(`/api/venues?city=${PAGE_CITY}&type=conference&limit=50`);
    expect(res.status).toBe(200);
    expect(res.body.venues.every((v: { type: string }) => v.type.toLowerCase().includes("conference"))).toBe(true);
  })
});

/* Item yang belum diterapkan: akan menjadi test setelah kodenya ada. */
describe("belum diterapkan", () => {
  it.todo("POST dan PATCH menolak field yang tidak dikenal (.strict())");
  it.todo("PATCH dengan body kosong ditolak (minimal satu field)");
  it.todo("DELETE ditolak bila venue punya booking mendatang (Sprint 3, Card 14)");
});