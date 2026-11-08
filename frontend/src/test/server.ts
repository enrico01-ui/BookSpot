import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";

// "*/api/..." cocok dengan baseURL "/api" maupun VITE_API_URL absolut.
export const handlers = [
  // AuthProvider memanggil refresh saat mount. Default: belum login.
  http.post("*/api/auth/refresh", () =>
    HttpResponse.json({ message: "Unauthorized" }, { status: 401 }),
  ),
];

export const server = setupServer(...handlers);