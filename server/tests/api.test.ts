import test, { before, after } from "node:test";
import assert from "node:assert";
import http from "node:http";
import app from "../app";
import { generateAccessToken } from "../src/utils/jwt";

let server: http.Server;
let baseUrl: string;

before(async () => {
  process.env.JWT_SECRET = "test_jwt_secret_key_123456";
  process.env.JWT_EXPIRES_IN = "1h";

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((err) => (err ? reject(err) : resolve()));
  });
});

test("API Endpoints: Root & Health Check", async (t) => {
  await t.test("GET / trả về thông điệp chào mừng và status 200", async () => {
    const res = await fetch(`${baseUrl}/`);
    const data = await res.json() as any;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, "Welcome to SmartPetCare API");
  });

  await t.test("GET /api/health trả về thông tin API đang chạy", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    const data = await res.json() as any;

    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.message, "SmartPetCare API is running");
  });
});

test("API Security & RBAC: Token & Permissions", async (t) => {
  await t.test("GET /api/pets không có Header Authorization -> trả về 401", async () => {
    const res = await fetch(`${baseUrl}/api/pets`);
    const data = await res.json() as any;

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, "Unauthorized");
  });

  await t.test("GET /api/pets với Bearer token sai / không hợp lệ -> trả về 401", async () => {
    const res = await fetch(`${baseUrl}/api/pets`, {
      headers: {
        Authorization: "Bearer invalid.token.payload",
      },
    });
    const data = await res.json() as any;

    assert.strictEqual(res.status, 401);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, "Unauthorized");
  });

  await t.test("GET /api/admin/users với vai trò Owner -> bị chặn 403 Forbidden", async () => {
    const ownerToken = generateAccessToken({
      user_id: 4,
      role: "owner",
      email: "owner@test.com",
    });

    const res = await fetch(`${baseUrl}/api/admin/users`, {
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
    });
    const data = await res.json() as any;

    assert.strictEqual(res.status, 403);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, "Forbidden");
  });

  await t.test("GET /api/admin/shifts với vai trò Doctor -> bị chặn 403 Forbidden", async () => {
    const doctorToken = generateAccessToken({
      user_id: 2,
      role: "doctor",
      email: "doctor@test.com",
    });

    const res = await fetch(`${baseUrl}/api/admin/shifts?startDate=2026-11-01&endDate=2026-11-30`, {
      headers: {
        Authorization: `Bearer ${doctorToken}`,
      },
    });
    const data = await res.json() as any;

    assert.strictEqual(res.status, 403);
    assert.strictEqual(data.success, false);
    assert.strictEqual(data.message, "Forbidden");
  });
});

test("API Validation Middleware: Request Payloads", async (t) => {
  await t.test("POST /api/auth/register dữ liệu rỗng -> trả về 400 và chi tiết lỗi", async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json() as any;

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });

  await t.test("POST /api/auth/login mật khẩu sai quy chuẩn -> trả về 400", async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "invalid-email",
        password: "123",
      }),
    });
    const data = await res.json() as any;

    assert.strictEqual(res.status, 400);
    assert.strictEqual(data.success, false);
  });
});
