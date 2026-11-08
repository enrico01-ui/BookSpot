import "dotenv/config";
import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma.js";
import { Prisma } from "../src/generated/prisma/client";
import { cleanupDemoActivity, seedDemoActivity } from "./seed-activity.js";

// Semua data di bawah adalah data DEMO, bukan bisnis sungguhan.

const facilities = [
  { name: "Parking Area", description: "Area parkir kendaraan." },
  { name: "Toilet", description: "Toilet untuk pengunjung." },
  { name: "Mushola", description: "Tempat ibadah." },
  { name: "WiFi", description: "Akses internet WiFi." },
  { name: "Locker", description: "Tempat penyimpanan barang." },
  { name: "Shower", description: "Fasilitas kamar mandi dan shower." },
  { name: "Canteen", description: "Area makanan dan minuman." },
  { name: "Air Conditioner", description: "Pendingin ruangan." },
  { name: "Sound System", description: "Perangkat audio." },
  { name: "Changing Room", description: "Ruang ganti." },
];

const venues = [
  {
    ownerEmail: "owner.futsal@bookspot.demo",
    name: "Jogja Arena Futsal",
    city: "Yogyakarta",
    address: "Jl. Magelang, Yogyakarta",
    latitude: -7.758,
    longitude: 110.361,
    description: "Lapangan futsal indoor dengan rumput sintetis dan fasilitas lengkap.",
    status: "PUBLISHED" as const,
    facilities: ["Parking Area", "Toilet", "Mushola", "Locker", "Canteen"],
    images: [
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018",
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20",
    ],
    resources: [
      { name: "Court A", type: "FUTSAL", price: 150000 },
      { name: "Court B", type: "FUTSAL", price: 150000 },
      { name: "Court C", type: "FUTSAL", price: 125000 },
    ],
  },
  {
    ownerEmail: "owner.badminton@bookspot.demo",
    name: "Smash Point Badminton",
    city: "Yogyakarta",
    address: "Jl. Kaliurang, Yogyakarta",
    latitude: -7.747,
    longitude: 110.378,
    description: "Gedung badminton dengan lapangan berkualitas untuk latihan dan pertandingan.",
    status: "PUBLISHED" as const,
    facilities: ["Parking Area", "Toilet", "Mushola", "Locker", "Shower"],
    images: [
      "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea",
      "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0",
    ],
    resources: [
      { name: "Court 1", type: "BADMINTON", price: 50000 },
      { name: "Court 2", type: "BADMINTON", price: 50000 },
      { name: "Court 3", type: "BADMINTON", price: 45000 },
    ],
  },
  {
    ownerEmail: "owner.studio@bookspot.demo",
    name: "Frame Studio Jogja",
    city: "Yogyakarta",
    address: "Jl. Gejayan, Yogyakarta",
    latitude: -7.773,
    longitude: 110.389,
    description: "Studio fotografi dengan berbagai pilihan backdrop dan pencahayaan profesional.",
    status: "PUBLISHED" as const,
    facilities: ["Parking Area", "Toilet", "Air Conditioner", "WiFi", "Changing Room"],
    images: [
      "https://images.unsplash.com/photo-1497366754035-f200968a6e72",
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32",
    ],
    resources: [
      { name: "Studio A", type: "PHOTO_STUDIO", price: 200000 },
      { name: "Studio B", type: "PHOTO_STUDIO", price: 250000 },
    ],
  },
  {
    ownerEmail: "owner.cowork@bookspot.demo",
    name: "Ruang Kerja Jogja",
    city: "Yogyakarta",
    address: "Jl. Prawirotaman, Yogyakarta",
    latitude: -7.818,
    longitude: 110.369,
    description: "Co-working space nyaman untuk bekerja, belajar, dan berkolaborasi.",
    status: "PUBLISHED" as const,
    facilities: ["WiFi", "Air Conditioner", "Parking Area", "Toilet", "Canteen"],
    images: [
      "https://images.unsplash.com/photo-1497366811353-6870744d04b2",
      "https://images.unsplash.com/photo-1497366216548-37526070297c",
    ],
    resources: [
      { name: "Meeting Room A", type: "MEETING_ROOM", price: 100000 },
      { name: "Meeting Room B", type: "MEETING_ROOM", price: 125000 },
      { name: "Private Desk", type: "COWORKING", price: 35000 },
    ],
  },
  {
    ownerEmail: "owner.futsal@bookspot.demo",
    name: "Tirta Futsal Center",
    city: "Sleman",
    address: "Jl. Seturan, Sleman",
    latitude: -7.765,
    longitude: 110.414,
    description: "Tempat bermain futsal dengan lapangan indoor yang luas.",
    status: "PUBLISHED" as const,
    facilities: ["Parking Area", "Toilet", "Mushola", "Shower"],
    images: ["https://images.unsplash.com/photo-1574629810360-7efbbe195018"],
    resources: [
      { name: "Field 1", type: "FUTSAL", price: 140000 },
      { name: "Field 2", type: "FUTSAL", price: 140000 },
    ],
  },
  {
    ownerEmail: "owner.badminton@bookspot.demo",
    name: "Victory Badminton Hall",
    city: "Sleman",
    address: "Jl. Godean, Sleman",
    latitude: -7.768,
    longitude: 110.329,
    description: "Gedung olahraga badminton dengan beberapa lapangan.",
    status: "PUBLISHED" as const,
    facilities: ["Parking Area", "Toilet", "Locker", "Canteen"],
    images: ["https://images.unsplash.com/photo-1626224583764-f87db24ac4ea"],
    resources: [
      { name: "Court A", type: "BADMINTON", price: 45000 },
      { name: "Court B", type: "BADMINTON", price: 45000 },
    ],
  },
  {
    ownerEmail: "owner.studio@bookspot.demo",
    name: "Lensa Creative Studio",
    city: "Bantul",
    address: "Jl. Parangtritis, Bantul",
    latitude: -7.847,
    longitude: 110.369,
    description: "Studio kreatif untuk fotografi produk, portrait, dan kebutuhan komersial.",
    status: "PENDING_APPROVAL" as const,
    facilities: ["Parking Area", "Toilet", "Air Conditioner", "WiFi"],
    images: ["https://images.unsplash.com/photo-1497366754035-f200968a6e72"],
    resources: [{ name: "Studio Main", type: "PHOTO_STUDIO", price: 175000 }],
  },
  {
    ownerEmail: "owner.cowork@bookspot.demo",
    name: "Collaborate Space",
    city: "Sleman",
    address: "Jl. Babarsari, Sleman",
    latitude: -7.781,
    longitude: 110.416,
    description: "Ruang kerja bersama untuk freelancer, mahasiswa, dan tim startup.",
    status: "PENDING_APPROVAL" as const,
    facilities: ["WiFi", "Air Conditioner", "Parking Area", "Toilet"],
    images: ["https://images.unsplash.com/photo-1497366216548-37526070297c"],
    resources: [
      { name: "Meeting Room", type: "MEETING_ROOM", price: 90000 },
      { name: "Shared Desk", type: "COWORKING", price: 30000 },
    ],
  },
  {
    ownerEmail: "owner.futsal@bookspot.demo",
    name: "Champion Mini Soccer",
    city: "Bantul",
    address: "Jl. Ring Road Selatan, Bantul",
    latitude: -7.836,
    longitude: 110.355,
    description: "Venue olahraga untuk latihan dan pertandingan komunitas.",
    status: "DRAFT" as const,
    facilities: ["Parking Area", "Toilet", "Mushola"],
    images: ["https://images.unsplash.com/photo-1522778119026-d647f0596c20"],
    resources: [{ name: "Mini Soccer Field", type: "FUTSAL", price: 200000 }],
  },
  {
    ownerEmail: "owner.badminton@bookspot.demo",
    name: "Prime Sport Center",
    city: "Yogyakarta",
    address: "Jl. Wonosari, Yogyakarta",
    latitude: -7.816,
    longitude: 110.407,
    description: "Venue olahraga untuk komunitas dan pemain badminton.",
    status: "REJECTED" as const,
    rejectionReason: "Informasi fasilitas venue perlu dilengkapi.",
    facilities: ["Parking Area", "Toilet"],
    images: ["https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0"],
    resources: [{ name: "Court 1", type: "BADMINTON", price: 40000 }],
  },
];

async function main() {
  console.log("Starting BookSpot seeder...");

  // 0. Bersihkan data aktivitas demo (booking, payment, review, ...) SEBELUM resource
  //    dibuat ulang di bawah, karena BookingItem -> Resource tidak cascade.
  await cleanupDemoActivity();

  // 1. Create demo accounts.
  const passwordHash = await bcrypt.hash("BookSpotDemo123!", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bookspot.demo" },
    update: {
      name: "BookSpot Admin",
      role: "ADMIN",
      status: "ACTIVE",
      deletedAt: null,
      passwordHash,
    },
    create: {
      name: "BookSpot Admin",
      email: "admin@bookspot.demo",
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    },
  });

  const ownerEmails = [
    "owner.futsal@bookspot.demo",
    "owner.badminton@bookspot.demo",
    "owner.studio@bookspot.demo",
    "owner.cowork@bookspot.demo",
  ];

  const ownerNames = ["Futsal Owner", "Badminton Owner", "Studio Owner", "Co-working Owner"];

  for (let i = 0; i < ownerEmails.length; i++) {
    await prisma.user.upsert({
      where: { email: ownerEmails[i] },
      update: {
        name: ownerNames[i],
        role: "OWNER",
        status: "ACTIVE",
        deletedAt: null,
        passwordHash,
      },
      create: {
        name: ownerNames[i],
        email: ownerEmails[i],
        passwordHash,
        role: "OWNER",
        status: "ACTIVE",
        emailVerifiedAt: new Date(),
      },
    });
  }

  // 2. Create shared facilities.
  const facilityMap = new Map<string, number>();

  for (const facility of facilities) {
    const saved = await prisma.facility.upsert({
      where: { name: facility.name },
      update: { description: facility.description },
      create: facility,
    });

    facilityMap.set(saved.name, saved.id);
  }

  // 3. Create venue data and its relations.
  for (const item of venues) {
    const owner = await prisma.user.findUniqueOrThrow({
      where: { email: item.ownerEmail },
    });

    // Find only this demo venue under its assigned owner.
    const existing = await prisma.venue.findFirst({
      where: {
        ownerId: owner.id,
        name: item.name,
        deletedAt: null,
      },
    });

    const venueData = {
      ownerId: owner.id,
      name: item.name,
      address: item.address,
      city: item.city,
      latitude: new Prisma.Decimal(item.latitude),
      longitude: new Prisma.Decimal(item.longitude),
      description: item.description,
      status: item.status,
      rejectionReason: item.status === "REJECTED" ? item.rejectionReason : null,
    };

    const venue = existing
      ? await prisma.venue.update({
          where: { id: existing.id },
          data: venueData,
        })
      : await prisma.venue.create({
          data: venueData,
        });

    // Replace only child data belonging to this demo venue.
    await prisma.$transaction(async (tx) => {
      await tx.venueImage.deleteMany({ where: { venueId: venue.id } });
      await tx.venueFacility.deleteMany({ where: { venueId: venue.id } });
      await tx.operatingHour.deleteMany({ where: { venueId: venue.id } });
      await tx.resource.deleteMany({ where: { venueId: venue.id } });

      await tx.venueImage.createMany({
        data: item.images.map((url, index) => ({
          venueId: venue.id,
          url,
          sortOrder: index,
        })),
      });

      await tx.venueFacility.createMany({
        data: item.facilities.map((name) => ({
          venueId: venue.id,
          facilityId: facilityMap.get(name)!,
        })),
      });

      // dayOfWeek: 0 Sunday ... 6 Saturday
      await tx.operatingHour.createMany({
        data: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          venueId: venue.id,
          dayOfWeek,
          openTime: "08:00",
          closeTime: "22:00",
          isClosed: false,
        })),
      });

      for (const resourceData of item.resources) {
        const resource = await tx.resource.create({
          data: {
            venueId: venue.id,
            name: resourceData.name,
            type: resourceData.type,
            description: `${resourceData.name} at ${item.name}`,
            basePrice: new Prisma.Decimal(resourceData.price),
            status: "ACTIVE",
          },
        });

        // Example weekday and weekend pricing.
        await tx.resourcePricingRule.createMany({
          data: [
            {
              resourceId: resource.id,
              dayType: "WEEKDAY",
              startTime: "08:00",
              endTime: "17:00",
              price: new Prisma.Decimal(resourceData.price),
            },
            {
              resourceId: resource.id,
              dayType: "WEEKDAY",
              startTime: "17:00",
              endTime: "22:00",
              price: new Prisma.Decimal(Math.round(resourceData.price * 1.2)),
            },
            {
              resourceId: resource.id,
              dayType: "WEEKEND",
              startTime: "08:00",
              endTime: "22:00",
              price: new Prisma.Decimal(Math.round(resourceData.price * 1.2)),
            },
          ],
        });
      }
    });

    console.log(`Seeded venue: ${venue.name} (${venue.status})`);
  }

  // 4. Customer, booking, payment, review, dll. yang terhubung ke venue di atas.
  await seedDemoActivity({ adminId: admin.id, passwordHash });

  console.log("BookSpot seeder completed.");
  console.log(`Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error("Seeder failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });