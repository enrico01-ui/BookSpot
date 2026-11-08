

const password = process.env.E2E_PASSWORD ?? "BookSpotDemo123!";

export const accounts = {
  customer: {
    email: process.env.E2E_CUSTOMER_EMAIL ?? "customer.andi@bookspot.demo",
    name: process.env.E2E_CUSTOMER_NAME ?? "Andi Pratama",
    password,
  },
  owner: {
    email: process.env.E2E_OWNER_EMAIL ?? "owner.futsal@bookspot.demo",
    name: process.env.E2E_OWNER_NAME ?? "Futsal Owner",
    password,
  },
  admin: {
    email: process.env.E2E_ADMIN_EMAIL ?? "admin@bookspot.demo",
    name: process.env.E2E_ADMIN_NAME ?? "BookSpot Admin",
    password,
  },
} as const;

export type Credentials = { email: string; password: string };