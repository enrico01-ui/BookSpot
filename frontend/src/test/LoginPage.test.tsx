import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { Route, Routes, useLocation } from "react-router-dom";
import LoginPage from "../pages/Auth/LoginPage";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";

// Penanda halaman tujuan, supaya test tidak bergantung pada isi Dashboard
function Where() {
  const { pathname } = useLocation();
  return <p>PATH:{pathname}</p>;
}

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="*" element={<Where />} />
    </Routes>,
    { initialEntries: ["/login"] },
  );
}

const customer = {
  id: 1,
  name: "Andi Pratama",
  email: "customer.andi@bookspot.demo",
  role: "CUSTOMER",
  status: "ACTIVE",
  phone: null,
  avatarUrl: null,
};

describe("LoginPage", () => {
  it("menampilkan error jika form kosong", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Email wajib diisi.")).toBeInTheDocument();
    expect(screen.getByText("Password wajib diisi.")).toBeInTheDocument();
  });

  it("menolak format email yang salah", async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email"), "bukan-email");
    await user.type(screen.getByLabelText("Password"), "apa-saja");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Format email tidak valid.")).toBeInTheDocument();
  });

  it("menampilkan pesan jika email atau password salah", async () => {
    server.use(
      http.post("*/api/auth/login", () =>
        HttpResponse.json({ message: "Invalid credentials" }, { status: 401 }),
      ),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email"), customer.email);
    await user.type(screen.getByLabelText("Password"), "password-salah");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("Email atau password salah.")).toBeInTheDocument();
  });

  it("login berhasil: kirim kredensial dan pindah ke /dashboard", async () => {
    let body: unknown;
    server.use(
      http.post("*/api/auth/login", async ({ request }) => {
        body = await request.json();
        return HttpResponse.json({ token: "access-token", user: customer });
      }),
    );
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText("Email"), customer.email);
    await user.type(screen.getByLabelText("Password"), "BookSpotDemo123!");
    await user.click(screen.getByRole("button", { name: "Login" }));

    expect(await screen.findByText("PATH:/dashboard")).toBeInTheDocument();
    expect(body).toEqual({ email: customer.email, password: "BookSpotDemo123!" });
  });
});