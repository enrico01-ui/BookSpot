import { accounts } from "./accounts";
import { expect, test, uniqueEmail } from "./fixtures";

test.describe("Register", () => {
  test("customer baru mendaftar lalu login ke dashboard", async ({ page }) => {
    const email = uniqueEmail();
    const password = "BookSpotDemo123!";

    await page.goto("/register");
    await page.getByLabel("Nama lengkap").fill("Pengguna Baru");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Buat akun" }).click();

    await expect(page.getByText("Akun berhasil dibuat")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill(password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("email yang sudah terdaftar ditolak", async ({ page, freshUser }) => {
    await page.goto("/register");
    await page.getByLabel("Nama lengkap").fill("Nama Lain");
    await page.getByLabel("Email").fill(freshUser.email);
    await page.getByLabel("Password").fill("BookSpotDemo123!");
    await page.getByRole("button", { name: "Buat akun" }).click();

    await expect(page.getByText("Email sudah terdaftar. Coba masuk.")).toBeVisible();
    await expect(page).toHaveURL(/\/register$/);
  });
});

test.describe("Login", () => {
  test("password salah menampilkan error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(accounts.customer.email);
    await page.getByLabel("Password").fill("password-salah-123");
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page.getByText("Email atau password salah.")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("login berhasil mengarah ke dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill(accounts.customer.email);
    await page.getByLabel("Password").fill(accounts.customer.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("user yang sudah login tidak melihat halaman login", async ({ page, login }) => {
    await login(accounts.customer);
    await page.goto("/login");

    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

test.describe("Route terproteksi", () => {
  test("tanpa login diarahkan ke /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("setelah login kembali ke halaman tujuan semula", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login$/);

    await page.getByLabel("Email").fill(accounts.customer.email);
    await page.getByLabel("Password").fill(accounts.customer.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/profile$/);
  });
});

test.describe("Sesi dan profil", () => {
  test("sesi bertahan setelah reload", async ({ page, login }) => {
    await login(accounts.customer);
    await page.goto("/profile");
    await expect(
      page.getByRole("heading", { level: 1, name: accounts.customer.name }),
    ).toBeVisible();

    await page.reload();

    await expect(page).toHaveURL(/\/profile$/);
    await expect(
      page.getByRole("heading", { level: 1, name: accounts.customer.name }),
    ).toBeVisible();
  });

  test("logout menutup akses ke halaman terproteksi", async ({ page, login }) => {
    await login(accounts.customer);
    await page.goto("/profile");

    await page.getByRole("button", { name: "Keluar" }).click();
    await expect(page).toHaveURL(/\/login$/);

    await page.goto("/profile");
    await expect(page).toHaveURL(/\/login$/);
  });

  test("ubah nama di profil tersimpan", async ({ page, login, freshUser }) => {
    await login(freshUser);
    await page.goto("/profile");

    await page.getByLabel("Nama lengkap").fill("Nama Sudah Diubah");
    await page.getByRole("button", { name: "Simpan perubahan" }).click();

    await expect(page.getByText("Profil berhasil diperbarui.")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: "Nama Sudah Diubah" }),
    ).toBeVisible();

    // Bertahan setelah reload (data berasal dari server, bukan state lokal)
    await page.reload();
    await expect(
      page.getByRole("heading", { level: 1, name: "Nama Sudah Diubah" }),
    ).toBeVisible();
  });
});