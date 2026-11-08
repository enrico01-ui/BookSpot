import { test as base, expect } from "@playwright/test";
import type { Credentials } from "./accounts";

let counter = 0;

export function uniqueEmail() {
  return `e2e-${Date.now()}-${process.pid}-${counter++}@example.test`;
}

type Fixtures = {
  /**
   * Login lewat API; cookie refresh token masuk ke browser context.
   * Saat halaman dibuka, AuthProvider memulihkan sesi lewat /auth/refresh.
   * Sengaja TIDAK memakai storageState: refresh token dirotasi, jadi file
   * storageState yang dipakai ulang akan berisi token yang sudah tidak berlaku.
   */
  login: (credentials: Credentials) => Promise<void>;
  /** Customer baru yang dibuat lewat API, aman diubah datanya tanpa mengotori akun seed. */
  freshUser: { name: string; email: string; password: string };
};

export const test = base.extend<Fixtures>({
  login: async ({ context }, provide) => {
    await provide(async ({ email, password }) => {
      const res = await context.request.post("/api/auth/login", { data: { email, password } });
      expect(res.ok(), `Login API untuk ${email} gagal (status ${res.status()})`).toBeTruthy();
    });
  },

  freshUser: async ({ request }, provide) => {
    const user = { name: "E2E User", email: uniqueEmail(), password: "BookSpotDemo123!" };
    const res = await request.post("/api/auth/register", {
      data: { ...user, role: "CUSTOMER" },
    });
    expect(res.ok(), `Register API gagal (status ${res.status()})`).toBeTruthy();
    await provide(user);
  },
});

export { expect };