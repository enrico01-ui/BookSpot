
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";

import { app } from "../../../app.js";
import { env } from "../../../config/env.js";
import type { VenueStatus } from "../../../generated/prisma/enums.js";
import { prisma } from "../../../lib/prisma.js";
import { redis } from "../../../lib/redis.js";
// --------------------------------------------------
// Test helpers
// --------------------------------------------------

type Role = "CUSTOMER" | "OWNER" | "ADMIN";

interface TestUser {
  id: number;
  token: string;
}

const RUN = Date.now().toString(36);
const EMAIL_SUFFIX = `.${RUN}@vitest.local`;
const CITY = `Kota${RUN}`;

const sign = (sub: number, role: Role) =>
  jwt.sign(
    { sub, role },
    env.JWT_SECRET,
    {
      algorithm: "HS256",
      expiresIn: "1h",
    },
  );

const as = (user: TestUser) => ({
  Authorization: `Bearer ${user.token}`,
});

const nameOf = (label: string) => `${label} ${RUN}`;

const validBody = (name: string) => ({
  name,
  address: "Jl. Contoh No. 10",
  city: CITY,
  latitude: -7.797068,
  longitude: 110.370529,
  description: "Venue untuk pengujian lifecycle BookSpot.",
});

const assertTestDatabase = () => {
  const databaseUrl = process.env.DATABASE_URL ?? "";
  const databaseName = new URL(databaseUrl).pathname.slice(1);

  if (!/test/i.test(databaseName)) {
    throw new Error(
      `Test dihentikan karena database "${databaseName}" bukan database test. ` +
      "Pastikan DATABASE_URL menggunakan .env.test.",
    );
  }
};

const createUser = async (
  label: string,
  role: Role,
): Promise<TestUser> => {
  const email = `${label}${EMAIL_SUFFIX}`;

  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: label,
      email,
      password: "TestPassword123!",
    });

  expect(response.status).toBe(201);

  const user = await prisma.user.update({
    where: { email },
    data: { role },
  });

  return {
    id: user.id,
    token: sign(user.id, role),
  };
};

const seedVenue = async (
  ownerId: number,
  name: string,
  status: VenueStatus = "DRAFT",
) => {
  return prisma.venue.create({
    data: {
      ownerId,
      ...validBody(name),
      status,
    },
  });
};

// Membuat venue yang memenuhi seluruh syarat completeness.
const seedCompleteVenue = async (
  ownerId: number,
  name: string,
  status: VenueStatus = "DRAFT",
) => {
  const venue = await seedVenue(ownerId, name, status);

  const facility = await prisma.facility.create({
    data: {
      name: `Facility ${name}`,
      description: "Fasilitas untuk integration test.",
    },
  });

  await prisma.venueImage.create({
    data: {
      venueId: venue.id,
      url: `https://example.com/${RUN}/${venue.id}.jpg`,
    },
  });

  await prisma.venueFacility.create({
    data: {
      venueId: venue.id,
      facilityId: facility.id,
    },
  });

  await prisma.operatingHour.create({
    data: {
      venueId: venue.id,
      dayOfWeek: 1,
      openTime: "08:00",
      closeTime: "22:00",
      isClosed: false,
    },
  });

  await prisma.resource.create({
    data: {
      venueId: venue.id,
      name: `Lapangan ${name}`,
      type: "FUTSAL",
      description: "Resource untuk integration test.",
      basePrice: 100000,
      status: "ACTIVE",
    },
  });

  return venue;
};

const getVenue = (id: number) =>
  prisma.venue.findUniqueOrThrow({
    where: { id },
  });

// --------------------------------------------------
// Test setup
// --------------------------------------------------

let ownerA: TestUser;
let ownerB: TestUser;
let customer: TestUser;
let admin: TestUser;

const venueIds: number[] = [];

const rememberVenue = <T extends { id: number }>(venue: T): T => {
  venueIds.push(venue.id);
  return venue;
};

beforeAll(async () => {
  assertTestDatabase();

  ownerA = await createUser("owner-a", "OWNER");
  ownerB = await createUser("owner-b", "OWNER");
  customer = await createUser("customer", "CUSTOMER");
  admin = await createUser("admin", "ADMIN");
});

afterAll(async () => {
  // Hapus data relasi yang dibuat oleh test.
  await prisma.bookingItem.deleteMany({
    where: { resource: { venueId: { in: venueIds } } },
  });

  await prisma.resource.deleteMany({
    where: { venueId: { in: venueIds } },
  });

  await prisma.operatingHour.deleteMany({
    where: { venueId: { in: venueIds } },
  });

  await prisma.venueImage.deleteMany({
    where: { venueId: { in: venueIds } },
  });

  await prisma.venueFacility.deleteMany({
    where: { venueId: { in: venueIds } },
  });

  await prisma.facility.deleteMany({
    where: {
      name: { startsWith: "Facility " },
    },
  });

  await prisma.venue.deleteMany({
    where: { id: { in: venueIds } },
  });

  await prisma.$disconnect();
  await redis.quit();
});

// --------------------------------------------------
// Venue lifecycle integration tests
// --------------------------------------------------

describe("Venue Status Lifecycle", () => {

  // 1. OWNER submit venue lengkap
  it("OWNER can submit a complete venue for approval", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Complete Venue"),
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/pending-approval`)
      .set(as(ownerA));

    expect(response.status).toBe(200);
    expect(response.body.venue.status).toBe("PENDING_APPROVAL");

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("PENDING_APPROVAL");
  });

  // 2. OWNER submit venue tidak lengkap
  it("OWNER cannot submit an incomplete venue", async () => {
    const venue = rememberVenue(
      await seedVenue(
        ownerA.id,
        nameOf("Incomplete Venue"),
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/pending-approval`)
      .set(as(ownerA));

    expect(response.status).toBe(400);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("DRAFT");
  });

  // 3. OWNER submit venue milik orang lain
  it("OWNER cannot submit another owner's venue", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerB.id,
        nameOf("Other Owner Venue"),
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/pending-approval`)
      .set(as(ownerA));

    expect(response.status).toBe(404);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("DRAFT");
  });

  // 4. ADMIN publish PENDING_APPROVAL
  it("ADMIN can publish a venue awaiting approval", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Pending Venue"),
        "PENDING_APPROVAL",
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/publish`)
      .set(as(admin));

    expect(response.status).toBe(204);

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("PUBLISHED");
  });

  // 5. ADMIN publish DRAFT
  it("ADMIN cannot publish a DRAFT venue directly", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Draft Publish Venue"),
        "DRAFT",
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/publish`)
      .set(as(admin));

    expect(response.status).toBe(409);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("DRAFT");
  });

  // 6. ADMIN reject dengan alasan
  it("ADMIN can reject a pending venue with a reason", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Reject Venue"),
        "PENDING_APPROVAL",
      ),
    );

    const reason = "Dokumen dan informasi venue belum sesuai.";

    const response = await request(app)
      .post(`/api/venues/${venue.id}/reject`)
      .set(as(admin))
      .send({ reason });

    expect(response.status).toBe(204);

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("REJECTED");
    expect(updated.rejectionReason).toBe(reason);
  });

  // 7. ADMIN reject tanpa alasan
  it("ADMIN cannot reject a venue without a reason", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Reject Without Reason"),
        "PENDING_APPROVAL",
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/reject`)
      .set(as(admin))
      .send({});

    // Ditolak oleh rejectVenueSchema.
    expect([400, 422]).toContain(response.status);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("PENDING_APPROVAL");
    expect(unchanged.rejectionReason).toBeNull();
  });

  // 8. ADMIN suspend PUBLISHED
  it("ADMIN can suspend a published venue with a reason", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Suspend Published Venue"),
        "PUBLISHED",
      ),
    );

    const reason = "Pelanggaran ketentuan penggunaan platform.";

    const response = await request(app)
      .post(`/api/venues/${venue.id}/suspend`)
      .set(as(admin))
      .send({ reason });

    expect(response.status).toBe(204);

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("SUSPENDED");
    expect(updated.suspensionReason).toBe(reason);
  });

  // 9. ADMIN suspend DRAFT
  it("ADMIN cannot suspend a DRAFT venue", async () => {
    const venue = rememberVenue(
      await seedVenue(
        ownerA.id,
        nameOf("Suspend Draft Venue"),
        "DRAFT",
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/suspend`)
      .set(as(admin))
      .send({
        reason: "Pelanggaran ketentuan platform.",
      });

    expect(response.status).toBe(409);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("DRAFT");
    expect(unchanged.suspensionReason).toBeNull();
  });
  
  // 10. OWNER reaktivasi venue SUSPENDED miliknya
  it("OWNER can reactivate their own suspended venue", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Reactivate Own Venue"),
        "SUSPENDED",
      ),
    );

    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        suspensionReason: "Pelanggaran ketentuan platform.",
      },
    });

    const response = await request(app)
      .post(`/api/venues/${venue.id}/reactivate`)
      .set(as(ownerA));

    expect(response.status).toBe(200);
    expect(response.body.venue.status).toBe("PUBLISHED");

    const updated = await getVenue(venue.id);

    expect(updated.status).toBe("PUBLISHED");
    expect(updated.suspensionReason).toBeNull();
  });

  // 11. OWNER tidak boleh reaktivasi venue milik OWNER lain
  it("OWNER cannot reactivate another owner's suspended venue", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerB.id,
        nameOf("Reactivate Other Owner Venue"),
        "SUSPENDED",
      ),
    );

    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        suspensionReason: "Pelanggaran ketentuan platform.",
      },
    });

    const response = await request(app)
      .post(`/api/venues/${venue.id}/reactivate`)
      .set(as(ownerA));

    expect(response.status).toBe(409);

    const unchanged = await getVenue(venue.id);

    expect(unchanged.status).toBe("SUSPENDED");
    expect(unchanged.suspensionReason).toBe(
      "Pelanggaran ketentuan platform.",
    );
  });

  // 12. OWNER mengembalikan PENDING_APPROVAL ke DRAFT
  it("OWNER can return PENDING_APPROVAL venue to DRAFT", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Return Pending Venue"),
        "PENDING_APPROVAL",
      ),
    );

    const response = await request(app)
      .post(`/api/venues/${venue.id}/draft`)
      .set(as(ownerA));

    expect(response.status).toBe(200);
    expect(response.body.venue.status).toBe("DRAFT");

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("DRAFT");
  });

  // 13. OWNER memperbaiki REJECTED menjadi DRAFT
  it("OWNER can return a rejected venue to DRAFT", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Fix Rejected Venue"),
        "REJECTED",
      ),
    );

    await prisma.venue.update({
      where: { id: venue.id },
      data: {
        rejectionReason: "Informasi venue belum lengkap.",
      },
    });

    const response = await request(app)
      .post(`/api/venues/${venue.id}/draft`)
      .set(as(ownerA));

    expect(response.status).toBe(200);
    expect(response.body.venue.status).toBe("DRAFT");

    const updated = await getVenue(venue.id);
    expect(updated.status).toBe("DRAFT");
    expect(updated.rejectionReason).toBeNull();
  });

  // 14. CUSTOMER mencoba menjalankan aksi OWNER/ADMIN
  it("CUSTOMER cannot execute OWNER or ADMIN lifecycle actions", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Customer Forbidden Venue"),
        "PENDING_APPROVAL",
      ),
    );

    const ownerAction = await request(app)
      .post(`/api/venues/${venue.id}/pending-approval`)
      .set(as(customer));

    const draftAction = await request(app)
      .post(`/api/venues/${venue.id}/draft`)
      .set(as(customer));

    const adminAction = await request(app)
      .post(`/api/venues/${venue.id}/publish`)
      .set(as(customer));

    const rejectAction = await request(app)
      .post(`/api/venues/${venue.id}/reject`)
      .set(as(customer))
      .send({ reason: "Test rejection." });

    const suspendAction = await request(app)
      .post(`/api/venues/${venue.id}/suspend`)
      .set(as(customer))
      .send({ reason: "Test suspension." });

    expect(ownerAction.status).toBe(403);
    expect(draftAction.status).toBe(403);
    expect(adminAction.status).toBe(403);
    expect(rejectAction.status).toBe(403);
    expect(suspendAction.status).toBe(403);

    const unchanged = await getVenue(venue.id);
    expect(unchanged.status).toBe("PENDING_APPROVAL");
  });

  // 15. Dua request transisi status berjalan bersamaan
  it("only one concurrent status transition can succeed", async () => {
    const venue = rememberVenue(
      await seedCompleteVenue(
        ownerA.id,
        nameOf("Concurrent Venue"),
        "PENDING_APPROVAL",
      ),
    );

    const [first, second] = await Promise.all([
      request(app)
        .post(`/api/venues/${venue.id}/publish`)
        .set(as(admin)),

      request(app)
        .post(`/api/venues/${venue.id}/reject`)
        .set(as(admin))
        .send({
          reason: "Ditolak dalam concurrent test.",
        }),
    ]);

    const responses = [first, second];

    expect(
      responses.filter((response) => response.status === 204),
    ).toHaveLength(1);

    expect(
      responses.filter((response) => response.status === 409),
    ).toHaveLength(1);

    const updated = await getVenue(venue.id);

    expect(["PUBLISHED", "REJECTED"]).toContain(updated.status);
  });
});
