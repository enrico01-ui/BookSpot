import { prisma } from "../src/lib/prisma.js";
import { Prisma } from "../src/generated/prisma/client.js";

// Semua data di bawah adalah data DEMO. Dipanggil dari prisma/seed.ts.

const DEMO_DOMAIN = "@bookspot.demo";
const MIN = 60_000;
const HOUR = 3_600_000;
const DAY = 86_400_000;
const WIB = 7 * HOUR;

// ---------- Helper waktu (WIB, UTC+7) ----------

// Jam dinding WIB `hour` pada hari (hari ini WIB + dayOffset) -> Date (UTC instant)
function wib(dayOffset: number, hour: number): Date {
  const shifted = new Date(Date.now() + WIB);
  return new Date(
    Date.UTC(
      shifted.getUTCFullYear(),
      shifted.getUTCMonth(),
      shifted.getUTCDate() + dayOffset,
      hour
    ) - WIB
  );
}

// Sama dengan pricing rule di seed venue: weekday 08-17 = base,
// weekday 17-22 dan weekend = base x 1.2
function hourPrice(base: number, start: Date): number {
  const local = new Date(start.getTime() + WIB);
  const day = local.getUTCDay();
  const hour = local.getUTCHours();
  const weekend = day === 0 || day === 6;
  return weekend || hour >= 17 ? Math.round(base * 1.2) : base;
}

function fmt(d: Date): string {
  return d.toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------- Data ----------

const customers = [
  { email: "customer.andi@bookspot.demo", name: "Andi Pratama", phone: "081234560001" },
  { email: "customer.siti@bookspot.demo", name: "Siti Rahma", phone: "081234560002" },
  { email: "customer.budi@bookspot.demo", name: "Budi Santoso", phone: "081234560003" },
  { email: "customer.dewi@bookspot.demo", name: "Dewi Lestari", phone: "081234560004" },
  { email: "customer.rizky@bookspot.demo", name: "Rizky Maulana", phone: "081234560005" },
];

// Customer yang mengajukan jadi Owner
const applicants = [
  { email: "applicant.pending@bookspot.demo", name: "Rina Kusuma", phone: "081234560006" },
  { email: "applicant.rejected@bookspot.demo", name: "Hendra Wijaya", phone: "081234560007" },
];

const ownerBusinesses: Record<string, { name: string; description: string }> = {
  "owner.futsal@bookspot.demo": {
    name: "Jogja Futsal Group",
    description: "Pengelola beberapa lapangan futsal dan mini soccer di DIY.",
  },
  "owner.badminton@bookspot.demo": {
    name: "Smash Sport Management",
    description: "Pengelola gedung badminton dan pusat olahraga komunitas.",
  },
  "owner.studio@bookspot.demo": {
    name: "Frame Creative Collective",
    description: "Studio foto dan kreatif untuk kebutuhan personal dan komersial.",
  },
  "owner.cowork@bookspot.demo": {
    name: "Ruang Kerja Bersama",
    description: "Co-working space dan ruang meeting untuk freelancer dan tim kecil.",
  },
};

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";
type PaymentStatus = "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "REFUNDED";

type BookingSeed = {
  code: string;
  customer: string;
  venue: string;
  resource: string;
  dayOffset: number; // relatif terhadap hari ini (WIB)
  startHour: number; // jam mulai WIB
  hours: number; // durasi (jam)
  status: BookingStatus;
  payment: PaymentStatus;
  provider?: "MIDTRANS" | "XENDIT";
  cancellationReason?: string;
  review?: { rating: number; comment: string; ownerReply?: string };
};

// Tidak ada overlap antar booking PENDING/CONFIRMED pada resource yang sama,
// jadi aman jika nanti ditambah exclusion constraint (Sprint 4).
const bookings: BookingSeed[] = [
  // --- COMPLETED (lampau) + review ---
  {
    code: "BK-DEMO-001", customer: "customer.andi@bookspot.demo",
    venue: "Jogja Arena Futsal", resource: "Court A",
    dayOffset: -14, startHour: 19, hours: 2, status: "COMPLETED", payment: "PAID",
    review: { rating: 5, comment: "Lapangan bagus, rumputnya masih empuk dan lampunya terang." },
  },
  {
    code: "BK-DEMO-002", customer: "customer.siti@bookspot.demo",
    venue: "Smash Point Badminton", resource: "Court 1",
    dayOffset: -10, startHour: 18, hours: 1, status: "COMPLETED", payment: "PAID", provider: "XENDIT",
    review: { rating: 4, comment: "Lantai nyaman, cuma parkiran agak penuh saat malam." },
  },
  {
    code: "BK-DEMO-003", customer: "customer.budi@bookspot.demo",
    venue: "Frame Studio Jogja", resource: "Studio A",
    dayOffset: -7, startHour: 10, hours: 2, status: "COMPLETED", payment: "PAID",
    review: {
      rating: 5,
      comment: "Pencahayaan profesional, backdrop lengkap. Hasil foto produk memuaskan.",
      ownerReply: "Terima kasih Kak Budi! Ditunggu sesi berikutnya.",
    },
  },
  {
    code: "BK-DEMO-004", customer: "customer.dewi@bookspot.demo",
    venue: "Ruang Kerja Jogja", resource: "Meeting Room A",
    dayOffset: -5, startHour: 13, hours: 2, status: "COMPLETED", payment: "PAID", provider: "XENDIT",
    review: { rating: 4, comment: "Ruangan nyaman dan WiFi kencang, AC agak dingin." },
  },
  {
    code: "BK-DEMO-005", customer: "customer.rizky@bookspot.demo",
    venue: "Tirta Futsal Center", resource: "Field 1",
    dayOffset: -9, startHour: 20, hours: 1, status: "COMPLETED", payment: "PAID",
    review: {
      rating: 3,
      comment: "Lapangan luas tapi ruang ganti kurang bersih.",
      ownerReply: "Terima kasih masukannya, ruang ganti sudah kami perbaiki.",
    },
  },
  {
    code: "BK-DEMO-006", customer: "customer.andi@bookspot.demo",
    venue: "Victory Badminton Hall", resource: "Court A",
    dayOffset: -3, startHour: 16, hours: 2, status: "COMPLETED", payment: "PAID", provider: "XENDIT",
    review: { rating: 5, comment: "Harga terjangkau, lapangan terawat." },
  },
  {
    code: "BK-DEMO-007", customer: "customer.siti@bookspot.demo",
    venue: "Jogja Arena Futsal", resource: "Court B",
    dayOffset: -2, startHour: 18, hours: 1, status: "COMPLETED", payment: "PAID",
  },

  // --- CONFIRMED (akan datang, sudah dibayar) ---
  {
    code: "BK-DEMO-008", customer: "customer.budi@bookspot.demo",
    venue: "Jogja Arena Futsal", resource: "Court A",
    dayOffset: 1, startHour: 19, hours: 2, status: "CONFIRMED", payment: "PAID",
  },
  {
    code: "BK-DEMO-009", customer: "customer.dewi@bookspot.demo",
    venue: "Smash Point Badminton", resource: "Court 2",
    dayOffset: 2, startHour: 17, hours: 2, status: "CONFIRMED", payment: "PAID", provider: "XENDIT",
  },
  {
    code: "BK-DEMO-010", customer: "customer.rizky@bookspot.demo",
    venue: "Frame Studio Jogja", resource: "Studio B",
    dayOffset: 3, startHour: 14, hours: 3, status: "CONFIRMED", payment: "PAID",
  },
  {
    code: "BK-DEMO-011", customer: "customer.andi@bookspot.demo",
    venue: "Ruang Kerja Jogja", resource: "Private Desk",
    dayOffset: 1, startHour: 9, hours: 4, status: "CONFIRMED", payment: "PAID",
  },

  // --- PENDING (menunggu pembayaran, expiresAt 15 menit dari dibuat) ---
  {
    code: "BK-DEMO-012", customer: "customer.siti@bookspot.demo",
    venue: "Tirta Futsal Center", resource: "Field 2",
    dayOffset: 4, startHour: 19, hours: 1, status: "PENDING", payment: "PENDING",
  },
  {
    code: "BK-DEMO-013", customer: "customer.rizky@bookspot.demo",
    venue: "Victory Badminton Hall", resource: "Court B",
    dayOffset: 2, startHour: 18, hours: 1, status: "PENDING", payment: "PENDING", provider: "XENDIT",
  },

  // --- CANCELLED ---
  {
    code: "BK-DEMO-014", customer: "customer.dewi@bookspot.demo",
    venue: "Jogja Arena Futsal", resource: "Court C",
    dayOffset: 5, startHour: 20, hours: 1, status: "CANCELLED", payment: "REFUNDED",
    cancellationReason: "Jadwal tim bentrok dengan acara lain.",
  },
  {
    code: "BK-DEMO-015", customer: "customer.budi@bookspot.demo",
    venue: "Smash Point Badminton", resource: "Court 3",
    dayOffset: 3, startHour: 19, hours: 1, status: "CANCELLED", payment: "FAILED", provider: "XENDIT",
    cancellationReason: "Pembayaran gagal, dibatalkan oleh customer.",
  },

  // --- EXPIRED (tidak dibayar dalam 15 menit) ---
  {
    code: "BK-DEMO-016", customer: "customer.andi@bookspot.demo",
    venue: "Tirta Futsal Center", resource: "Field 1",
    dayOffset: 1, startHour: 19, hours: 1, status: "EXPIRED", payment: "EXPIRED",
  },
  {
    code: "BK-DEMO-017", customer: "customer.siti@bookspot.demo",
    venue: "Frame Studio Jogja", resource: "Studio A",
    dayOffset: 6, startHour: 11, hours: 2, status: "EXPIRED", payment: "EXPIRED", provider: "XENDIT",
  },
];

const favorites: Record<string, string[]> = {
  "customer.andi@bookspot.demo": ["Jogja Arena Futsal", "Victory Badminton Hall"],
  "customer.siti@bookspot.demo": ["Smash Point Badminton", "Frame Studio Jogja"],
  "customer.budi@bookspot.demo": ["Frame Studio Jogja", "Ruang Kerja Jogja"],
  "customer.dewi@bookspot.demo": ["Ruang Kerja Jogja", "Smash Point Badminton"],
  "customer.rizky@bookspot.demo": ["Tirta Futsal Center", "Jogja Arena Futsal"],
};

// Tutup venue (libur / renovasi)
const venueClosures = [
  { venue: "Jogja Arena Futsal", from: [10, 8], to: [10, 22], reason: "Perawatan rumput sintetis" },
  { venue: "Ruang Kerja Jogja", from: [20, 8], to: [20, 22], reason: "Libur operasional" },
  { venue: "Frame Studio Jogja", from: [8, 8], to: [9, 22], reason: "Renovasi backdrop dan lighting" },
  { venue: "Smash Point Badminton", from: [14, 8], to: [14, 12], reason: "Penggantian lantai lapangan" },
];

// Blokir resource (maintenance)
const resourceBlocks = [
  { venue: "Jogja Arena Futsal", resource: "Court C", day: 3, from: 8, to: 12, reason: "Perbaikan gawang" },
  { venue: "Frame Studio Jogja", resource: "Studio B", day: 5, from: 9, to: 13, reason: "Penggantian lampu studio" },
  { venue: "Smash Point Badminton", resource: "Court 3", day: 7, from: 8, to: 17, reason: "Maintenance net dan lantai" },
  { venue: "Ruang Kerja Jogja", resource: "Meeting Room B", day: 2, from: 13, to: 17, reason: "Perbaikan proyektor" },
  { venue: "Tirta Futsal Center", resource: "Field 2", day: 8, from: 8, to: 22, reason: "Turnamen internal" },
];

// ---------- Cleanup ----------

// Hapus data aktivitas demo. WAJIB dipanggil sebelum seed venue, karena seed venue
// menghapus & membuat ulang resource (BookingItem -> Resource tidak cascade).
export async function cleanupDemoActivity() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: DEMO_DOMAIN } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);

  if (ids.length > 0) {
    await prisma.$transaction([
      prisma.payment.deleteMany({ where: { booking: { customerId: { in: ids } } } }), // events cascade
      prisma.review.deleteMany({ where: { customerId: { in: ids } } }),
      prisma.booking.deleteMany({ where: { customerId: { in: ids } } }), // items cascade
      prisma.favorite.deleteMany({ where: { userId: { in: ids } } }),
      prisma.notification.deleteMany({ where: { userId: { in: ids } } }),
      prisma.ownerApplication.deleteMany({ where: { userId: { in: ids } } }),
      prisma.auditLog.deleteMany({ where: { actorId: { in: ids } } }),
      prisma.idempotencyKey.deleteMany({ where: { userId: { in: ids } } }),
    ]);
  }

  await prisma.venueClosure.deleteMany({
    where: { venue: { owner: { email: { endsWith: DEMO_DOMAIN } } } },
  });
}

// ---------- Seed ----------

export async function seedDemoActivity(opts: { adminId: number; passwordHash: string }) {
  const { adminId, passwordHash } = opts;
  console.log("Seeding demo activity (customers, bookings, payments, reviews, ...)");

  // 1. Customer + applicant
  for (const u of [...customers, ...applicants]) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, phone: u.phone, role: "CUSTOMER", status: "ACTIVE", deletedAt: null, passwordHash },
      create: {
        name: u.name, email: u.email, phone: u.phone, passwordHash,
        role: "CUSTOMER", status: "ACTIVE", emailVerifiedAt: new Date(),
      },
    });
  }

  const users = await prisma.user.findMany({ where: { email: { endsWith: DEMO_DOMAIN } } });
  const userByEmail = new Map(users.map((u) => [u.email, u]));
  const getUser = (email: string) => {
    const u = userByEmail.get(email);
    if (!u) throw new Error(`Demo user not found: ${email}`);
    return u;
  };

  // 2. Venue + resource hasil seed sebelumnya
  const venues = await prisma.venue.findMany({
    where: { deletedAt: null, owner: { email: { endsWith: DEMO_DOMAIN } } },
    include: { resources: true },
  });
  const venueByName = new Map(venues.map((v) => [v.name, v]));
  const getVenue = (name: string) => {
    const v = venueByName.get(name);
    if (!v) throw new Error(`Demo venue not found: ${name}`);
    return v;
  };
  const getResource = (venueName: string, resourceName: string) => {
    const r = getVenue(venueName).resources.find((x) => x.name === resourceName);
    if (!r) throw new Error(`Resource not found: ${venueName} / ${resourceName}`);
    return r;
  };

  // 3. Owner applications
  for (const [email, biz] of Object.entries(ownerBusinesses)) {
    await prisma.ownerApplication.create({
      data: {
        userId: getUser(email).id,
        status: "APPROVED",
        businessName: biz.name,
        businessDescription: biz.description,
        reviewedBy: adminId,
        reviewedAt: new Date(Date.now() - 30 * DAY),
      },
    });
  }
  await prisma.ownerApplication.create({
    data: {
      userId: getUser("applicant.pending@bookspot.demo").id,
      status: "PENDING",
      businessName: "Padel Arena Jogja",
      businessDescription: "Rencana pengelolaan lapangan padel indoor di Sleman.",
    },
  });
  await prisma.ownerApplication.create({
    data: {
      userId: getUser("applicant.rejected@bookspot.demo").id,
      status: "REJECTED",
      businessName: "Hendra Rental",
      businessDescription: "Rental ruang serbaguna.",
      reviewedBy: adminId,
      reviewedAt: new Date(Date.now() - 7 * DAY),
      rejectionReason: "Data bisnis tidak lengkap, silakan ajukan ulang dengan dokumen pendukung.",
    },
  });

  // 4. Venue closures
  await prisma.venueClosure.createMany({
    data: venueClosures.map((c) => ({
      venueId: getVenue(c.venue).id,
      startAt: wib(c.from[0], c.from[1]),
      endAt: wib(c.to[0], c.to[1]),
      reason: c.reason,
    })),
  });

  // 5. Resource blocks
  await prisma.resourceBlock.createMany({
    data: resourceBlocks.map((b) => ({
      resourceId: getResource(b.venue, b.resource).id,
      startAt: wib(b.day, b.from),
      endAt: wib(b.day, b.to),
      reason: b.reason,
    })),
  });

  // 6. Bookings + items + payments + payment events + idempotency + reviews
  const now = new Date();
  const notifications: Prisma.NotificationCreateManyInput[] = [];
  const auditLogs: Prisma.AuditLogCreateManyInput[] = [];
  const idempotencyKeys: Prisma.IdempotencyKeyCreateManyInput[] = [];

  for (const b of bookings) {
    const customer = getUser(b.customer);
    const venue = getVenue(b.venue);
    const resource = getResource(b.venue, b.resource);
    const base = Number(resource.basePrice);

    const start = wib(b.dayOffset, b.startHour);
    const end = new Date(start.getTime() + b.hours * HOUR);

    // Satu BookingItem per slot 1 jam; harga = snapshot saat booking dibuat
    const slots = Array.from({ length: b.hours }, (_, i) => {
      const s = new Date(start.getTime() + i * HOUR);
      return { startAt: s, endAt: new Date(s.getTime() + HOUR), price: hourPrice(base, s) };
    });
    const total = slots.reduce((sum, s) => sum + s.price, 0);

    // createdAt harus selalu di masa lalu
    let createdAt: Date;
    if (b.status === "PENDING") createdAt = new Date(now.getTime() - 2 * MIN);
    else if (b.status === "EXPIRED") createdAt = new Date(now.getTime() - 3 * HOUR);
    else createdAt = new Date(Math.min(start.getTime() - 2 * DAY, now.getTime() - 6 * HOUR));

    const expiresAt = new Date(createdAt.getTime() + 15 * MIN);
    const paidAt =
      b.payment === "PAID" || b.payment === "REFUNDED"
        ? new Date(createdAt.getTime() + 10 * MIN)
        : null;
    const cancelledAt =
      b.status === "CANCELLED" ? new Date(createdAt.getTime() + 3 * HOUR) : null;

    const provider = b.provider ?? "MIDTRANS";
    const eventBase = { order_id: b.code, provider, gross_amount: total, currency: "IDR" };

    const events: Prisma.PaymentEventCreateWithoutPaymentInput[] = [];
    if (b.payment === "PAID" || b.payment === "REFUNDED") {
      events.push({
        providerEventId: `evt-${b.code}-paid`,
        eventType: "payment.paid",
        payload: { ...eventBase, status: "paid" },
        processedAt: paidAt,
        createdAt: paidAt ?? undefined,
      });
    }
    if (b.payment === "REFUNDED") {
      events.push({
        providerEventId: `evt-${b.code}-refund`,
        eventType: "payment.refunded",
        payload: { ...eventBase, status: "refunded" },
        processedAt: cancelledAt,
        createdAt: cancelledAt ?? undefined,
      });
    }
    if (b.payment === "FAILED") {
      events.push({
        providerEventId: `evt-${b.code}-failed`,
        eventType: "payment.failed",
        payload: { ...eventBase, status: "failed" },
        processedAt: new Date(createdAt.getTime() + 5 * MIN),
      });
    }
    if (b.payment === "EXPIRED") {
      events.push({
        providerEventId: `evt-${b.code}-expired`,
        eventType: "payment.expired",
        payload: { ...eventBase, status: "expired" },
        processedAt: expiresAt,
        createdAt: expiresAt,
      });
    }

    const created = await prisma.booking.create({
      data: {
        bookingCode: b.code,
        customerId: customer.id,
        status: b.status,
        expiresAt,
        totalAmount: new Prisma.Decimal(total),
        cancelledAt,
        cancellationReason: b.cancellationReason ?? null,
        createdAt,
        items: {
          create: slots.map((s) => ({
            resourceId: resource.id,
            startAt: s.startAt,
            endAt: s.endAt,
            unitPrice: new Prisma.Decimal(s.price),
            subtotal: new Prisma.Decimal(s.price),
            createdAt,
          })),
        },
        payments: {
          create: {
            provider,
            externalId: `mock-pay-${b.code}`,
            status: b.payment,
            amount: new Prisma.Decimal(total),
            currency: "IDR",
            paidAt,
            expiresAt,
            createdAt,
            events: { create: events },
          },
        },
      },
      include: { payments: true },
    });

    const payment = created.payments[0];
    const label = `${b.venue} - ${b.resource}`;
    const when = `${fmt(start)}-${fmt(end).split(", ").pop() ?? ""}`;
    const isPast = b.dayOffset < 0;

    // Notifikasi customer
    notifications.push({
      userId: customer.id, type: "BOOKING_CREATED", createdAt,
      title: "Booking dibuat",
      message: `Booking ${b.code} untuk ${label} (${when}) berhasil dibuat.`,
      readAt: isPast ? new Date(createdAt.getTime() + HOUR) : null,
    });
    if (b.payment === "PAID") {
      notifications.push({
        userId: customer.id, type: "PAYMENT_SUCCESS", createdAt: paidAt!,
        title: "Pembayaran berhasil",
        message: `Pembayaran Rp${total.toLocaleString("id-ID")} untuk booking ${b.code} diterima.`,
        readAt: isPast ? new Date(paidAt!.getTime() + HOUR) : null,
      });
    }
    if (b.status === "EXPIRED") {
      notifications.push({
        userId: customer.id, type: "BOOKING_EXPIRED", createdAt: expiresAt,
        title: "Booking kedaluwarsa",
        message: `Booking ${b.code} dibatalkan otomatis karena belum dibayar.`,
        readAt: null,
      });
    }
    if (b.status === "CANCELLED") {
      notifications.push({
        userId: customer.id, type: "BOOKING_CANCELLED", createdAt: cancelledAt!,
        title: "Booking dibatalkan",
        message: `Booking ${b.code} telah dibatalkan.`,
        readAt: null,
      });
    }
    if (b.status === "CONFIRMED" && b.dayOffset <= 2) {
      notifications.push({
        userId: customer.id, type: "BOOKING_REMINDER", createdAt: new Date(now.getTime() - HOUR),
        title: "Pengingat booking",
        message: `Jangan lupa, booking ${label} pada ${fmt(start)}.`,
        readAt: null,
      });
    }

    // Notifikasi owner
    notifications.push({
      userId: venue.ownerId, type: "BOOKING_CREATED", createdAt,
      title: "Booking baru masuk",
      message: `${customer.name ?? "Customer"} memesan ${resource.name} (${when}).`,
      readAt: isPast ? new Date(createdAt.getTime() + 2 * HOUR) : null,
    });
    if (b.payment === "PAID") {
      notifications.push({
        userId: venue.ownerId, type: "PAYMENT_SUCCESS", createdAt: paidAt!,
        title: "Pembayaran diterima",
        message: `Booking ${b.code} sudah dibayar (Rp${total.toLocaleString("id-ID")}).`,
        readAt: isPast ? new Date(paidAt!.getTime() + 2 * HOUR) : null,
      });
    }

    // Idempotency key untuk booking aktif
    if (b.status === "PENDING" || b.status === "CONFIRMED") {
      idempotencyKeys.push({
        userId: customer.id,
        key: `demo-idem-${b.code}`,
        endpoint: "POST /api/bookings",
        responseCode: 201,
        responseBody: { id: created.id, bookingCode: b.code, status: "PENDING" },
        createdAt,
        expiresAt: new Date(createdAt.getTime() + DAY),
      });
    }

    // Audit log
    if (b.status === "CANCELLED") {
      auditLogs.push({
        actorId: customer.id, action: "UPDATE", entityType: "BOOKING", entityId: created.id,
        metadata: { from: "CONFIRMED", to: "CANCELLED", reason: b.cancellationReason ?? null },
        createdAt: cancelledAt!,
      });
    }
    if (b.payment === "REFUNDED") {
      auditLogs.push({
        actorId: adminId, action: "REFUND", entityType: "PAYMENT", entityId: payment.id,
        metadata: { bookingCode: b.code, amount: total },
        createdAt: new Date(cancelledAt!.getTime() + 30 * MIN),
      });
    }

    // Review (hanya booking COMPLETED)
    if (b.review) {
      const review = await prisma.review.create({
        data: {
          bookingId: created.id,
          customerId: customer.id,
          venueId: venue.id,
          rating: b.review.rating,
          comment: b.review.comment,
          ownerReply: b.review.ownerReply ?? null,
          createdAt: new Date(end.getTime() + 3 * HOUR),
        },
      });
      auditLogs.push({
        actorId: customer.id, action: "CREATE", entityType: "REVIEW", entityId: review.id,
        metadata: { rating: b.review.rating, venueId: venue.id },
        createdAt: review.createdAt,
      });
    }
  }

  // 7. Favorites
  await prisma.favorite.createMany({
    data: Object.entries(favorites).flatMap(([email, names]) =>
      names.map((name) => ({ userId: getUser(email).id, venueId: getVenue(name).id }))
    ),
    skipDuplicates: true,
  });

  // 8. Notifikasi sistem + audit log venue / role
  for (const venue of venues) {
    auditLogs.push({
      actorId: venue.ownerId, action: "CREATE", entityType: "VENUE", entityId: venue.id,
      metadata: { name: venue.name },
    });

    if (venue.status === "PUBLISHED") {
      auditLogs.push({
        actorId: adminId, action: "UPDATE", entityType: "VENUE", entityId: venue.id,
        metadata: { decision: "APPROVE", from: "PENDING_APPROVAL", to: "PUBLISHED" },
      });
    } else if (venue.status === "PENDING_APPROVAL") {
      auditLogs.push({
        actorId: venue.ownerId, action: "UPDATE", entityType: "VENUE", entityId: venue.id,
        metadata: { from: "DRAFT", to: "PENDING_APPROVAL" },
      });
      notifications.push({
        userId: adminId, type: "SYSTEM",
        title: "Venue menunggu persetujuan",
        message: `Venue "${venue.name}" menunggu review Admin.`,
        readAt: null,
      });
    } else if (venue.status === "REJECTED") {
      auditLogs.push({
        actorId: adminId, action: "UPDATE", entityType: "VENUE", entityId: venue.id,
        metadata: { decision: "REJECT", from: "PENDING_APPROVAL", to: "REJECTED", reason: venue.rejectionReason },
      });
      notifications.push({
        userId: venue.ownerId, type: "SYSTEM",
        title: "Venue ditolak",
        message: `Venue "${venue.name}" ditolak: ${venue.rejectionReason ?? "-"}`,
        readAt: null,
      });
    }
  }

  for (const email of Object.keys(ownerBusinesses)) {
    const owner = getUser(email);
    auditLogs.push({
      actorId: adminId, action: "CHANGE_ROLE", entityType: "USER", entityId: owner.id,
      metadata: { from: "CUSTOMER", to: "OWNER" },
    });
    notifications.push({
      userId: owner.id, type: "SYSTEM",
      title: "Pengajuan Owner disetujui",
      message: "Selamat! Akun Anda sekarang dapat mengelola venue di BookSpot.",
      readAt: new Date(Date.now() - 29 * DAY),
    });
  }

  await prisma.idempotencyKey.createMany({ data: idempotencyKeys });
  await prisma.notification.createMany({ data: notifications });
  await prisma.auditLog.createMany({ data: auditLogs });

  console.log(
    `Seeded: ${customers.length + applicants.length} customers, ${bookings.length} bookings, ` +
      `${notifications.length} notifications, ${auditLogs.length} audit logs.`
  );
  console.log(`Customer login: customer.andi${DEMO_DOMAIN} (password sama dengan akun demo lain)`);
}