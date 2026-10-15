import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const dayHours = [
  { dayOfWeek: 0, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 1, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 2, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 3, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 4, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 5, openTime: "08:00", closeTime: "22:00" },
  { dayOfWeek: 6, openTime: "08:00", closeTime: "23:00" },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@bookspot.com" },
    update: {},
    create: {
      name: "Admin User",
      email: "admin@bookspot.com",
      passwordHash,
      role: "ADMIN",
      phone: "11111111",
      status: "ACTIVE",
    },
  });
  console.log("Admin user created:", admin.email);

  const owner = await prisma.user.upsert({
    where: { email: "owner@bookspot.com" },
    update: {},
    create: {
      name: "Owner User",
      email: "owner@bookspot.com",
      passwordHash,
      role: "OWNER",
      phone: "22222222",
      status: "ACTIVE",
    },
  });
  console.log("Owner user created:", owner.email);

  const customer = await prisma.user.upsert({
    where: { email: "customer@bookspot.com" },
    update: {},
    create: {
      name: "Customer User",
      email: "customer@bookspot.com",
      passwordHash,
      role: "CUSTOMER",
      phone: "33333333",
      status: "ACTIVE",
    },
  });
  console.log("Customer user created:", customer.email);

  const parking = await prisma.facility.upsert({
    where: { name: "Parkir" },
    update: {},
    create: {
      name: "Parkir",
      description: "Area parkir untuk kendaraan pelanggan",
    },
  });

  const toilet = await prisma.facility.upsert({
    where: { name: "Toilet" },
    update: {},
    create: {
      name: "Toilet",
      description: "Toilet umum untuk pelanggan",
    },
  });

  const mushola = await prisma.facility.upsert({
    where: { name: "Mushola" },
    update: {},
    create: {
      name: "Mushola",
      description: "Mushola untuk pelanggan",
    },
  });
  console.log("Facilities created:", parking.name, toilet.name, mushola.name);

  // Venue tidak punya unique key selain id, jadi cek manual agar seed bisa dijalankan ulang.
  let venue = await prisma.venue.findFirst({
    where: { ownerId: owner.id, name: "Football Arena" },
  });

  if (!venue) {
    venue = await prisma.venue.create({
      data: {
        ownerId: owner.id,
        name: "Football Arena",
        address: "Jl. Kaliurang km 5",
        city: "Yogyakarta",
        latitude: -7.7599,
        longitude: 110.3785,
        description:
          "Venue futsal modern dengan fasilitas lengkap untuk olahraga dan komunitas.",
        status: "PUBLISHED",
        images: {
          create: [
            {
              url: "https://placehold.co/1200x800?text=BookSpot+Futsal",
              sortOrder: 0,
            },
            {
              url: "https://placehold.co/1200x800?text=Court+Futsal",
              sortOrder: 1,
            },
          ],
        },
        facilities: {
          create: [
            { facilityId: parking.id },
            { facilityId: toilet.id },
            { facilityId: mushola.id },
          ],
        },
        operatingHours: {
          create: dayHours,
        },
      },
    });
    console.log("Venue created:", venue.name);

    await prisma.resource.create({
      data: {
        venueId: venue.id,
        name: "Lapangan Basket",
        type: "BASKET",
        description:
          "Lapangan basket indoor dengan lantai kayu dan ring standar.",
        basePrice: 100000,
        pricingRules: {
          create: [
            { dayType: "WEEKDAY", startTime: "08:00", endTime: "17:00", price: 100000 },
            { dayType: "WEEKDAY", startTime: "17:00", endTime: "22:00", price: 130000 },
            { dayType: "WEEKEND", startTime: "08:00", endTime: "23:00", price: 150000 },
          ],
        },
      },
    });

    await prisma.resource.create({
      data: {
        venueId: venue.id,
        name: "Lapangan Futsal",
        type: "FUTSAL",
        description:
          "Lapangan futsal indoor dengan lantai karet dan gawang standar.",
        basePrice: 80000,
        pricingRules: {
          create: [
            { dayType: "WEEKDAY", startTime: "08:00", endTime: "17:00", price: 80000 },
            { dayType: "WEEKDAY", startTime: "17:00", endTime: "22:00", price: 100000 },
            { dayType: "WEEKEND", startTime: "08:00", endTime: "23:00", price: 120000 },
          ],
        },
      },
    });
    console.log("Resources created: Lapangan Basket, Lapangan Futsal");

    await prisma.notification.create({
      data: {
        userId: customer.id,
        type: "SYSTEM",
        title: "Selamat datang di BookSpot",
        message:
          "Selamat datang! Temukan dan booking venue olahraga favoritmu.",
      },
    });
  } else {
    console.log("Venue sudah ada, skip:", venue.name);
  }

  await prisma.favorite.upsert({
    where: { userId_venueId: { userId: customer.id, venueId: venue.id } },
    update: {},
    create: { userId: customer.id, venueId: venue.id },
  });

  console.log("");
  console.log("Seed selesai!");
  console.log("");
  console.log("Test accounts:");
  console.log("Admin    : admin@bookspot.com");
  console.log("Owner    : owner@bookspot.com");
  console.log("Customer : customer@bookspot.com");
  console.log("Password : password123");
  console.log("");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
