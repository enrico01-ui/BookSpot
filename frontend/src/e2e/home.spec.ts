import { expect, test } from "./fixtures";

test("halaman utama menampilkan daftar venue dari seed", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1, name: /Booking lapangan/ })).toBeVisible();
  await expect(page.locator('a[href^="/venues/"]').first()).toBeVisible();
});

test("halaman utama tidak melebar horizontal", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator('a[href^="/venues/"]').first()).toBeVisible();

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(0);
});