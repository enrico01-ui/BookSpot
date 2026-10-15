
import { afterEach, describe, expect, it } from "vitest";
import request from "supertest";
import { randomUUID } from "node:crypto";

import { app } from "../../app.js";
import { prisma } from "../../lib/prisma.js";

const testEmails: string[] = [];

function createTestUser() {
  const email = `test-${randomUUID()}@bookspot.test`;

  testEmails.push(email);

  return {
    name: "Test BookSpot User",
    email,
    password: "SecurePass123!",
  };
}

afterEach(async () => {
  // Hapus user yang dibuat oleh test.
  // RefreshToken akan ikut terhapus melalui relasi cascade.
  if (testEmails.length > 0) {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: testEmails,
        },
      },
    });

    testEmails.length = 0;
  }
});

describe("POST /api/auth/register", () => {
  it("registers a user and does not expose passwordHash", async () => {
    const userData = createTestUser();

    const response = await request(app)
      .post("/api/auth/register")
      .send(userData);

    expect(response.status).toBe(201);
    expect(response.body.user).toMatchObject({
      name: userData.name,
      email: userData.email,
      role: "CUSTOMER",
    });
    expect(response.body.user).not.toHaveProperty("passwordHash");

    // Pastikan data benar-benar tersimpan di database.
    const savedUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    expect(savedUser).not.toBeNull();
    expect(savedUser?.passwordHash).not.toBe(userData.password);
  });

  it("rejects a duplicate email", async () => {
    const userData = createTestUser();

    const firstResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);

    expect(firstResponse.status).toBe(201);

    const secondResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);

    // Controller register saat ini mengembalikan 400
    // ketika proses registrasi gagal.
    expect(secondResponse.status).toBe(400);

    // Pastikan hanya satu user dengan email tersebut.
    const userCount = await prisma.user.count({
      where: { email: userData.email },
    });

    expect(userCount).toBe(1);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in a registered user and sets a refresh cookie", async () => {
    const userData = createTestUser();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: userData.email,
        password: userData.password,
      });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      message: "Login successful",
      user: {
        email: userData.email,
        name: userData.name,
        role: "CUSTOMER",
      },
    });

    expect(response.body.token).toEqual(expect.any(String));
    expect(response.body.user).not.toHaveProperty("passwordHash");

    const cookies = response.headers["set-cookie"];

    expect(cookies).toBeDefined();
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining("HttpOnly"),
      ]),
    );

    // Login seharusnya menyimpan hash refresh token,
    // bukan refresh token mentahnya.
    const savedUser = await prisma.user.findUniqueOrThrow({
      where: { email: userData.email },
    });

    const refreshTokens = await prisma.refreshToken.findMany({
      where: { userId: savedUser.id },
    });

    expect(refreshTokens).toHaveLength(1);
    expect(refreshTokens[0]?.tokenHash).toBeTruthy();
  });

  it("rejects an incorrect password", async () => {
    const userData = createTestUser();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(userData);

    expect(registerResponse.status).toBe(201);

    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: userData.email,
        password: "WrongPassword123!",
      });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe("Login failed");
    expect(response.body).not.toHaveProperty("token");
  });
});
