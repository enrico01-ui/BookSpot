
import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "../app.js";

describe("GET /api/health", () => {
  it("returns 200 when the API and database are healthy", async () => {
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});