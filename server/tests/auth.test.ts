import test from "node:test";
import assert from "node:assert";
import jwt from "jsonwebtoken";
import { registerSchema, loginSchema, refreshTokenSchema } from "../src/validations/auth.validation";
import { generateAccessToken, generateRefreshToken } from "../src/utils/jwt";
import { generateOTP } from "../src/utils/otp";

test("Auth Validations: registerSchema", async (t) => {
  await t.test("hợp lệ khi đủ các trường bắt buộc cơ bản", () => {
    const validData = {
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      password: "password123",
      phone: "0912345678",
      address: "123 Đường ABC, Hà Nội",
    };
    const result = registerSchema.safeParse(validData);
    assert.strictEqual(result.success, true);
  });

  await t.test("báo lỗi khi email sai định dạng", () => {
    const invalidData = {
      full_name: "Nguyễn Văn A",
      email: "invalid-email-format",
      password: "password123",
    };
    const result = registerSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("email")));
    }
  });

  await t.test("báo lỗi khi mật khẩu quá ngắn (< 8 ký tự)", () => {
    const invalidData = {
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      password: "123",
    };
    const result = registerSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("password")));
    }
  });

  await t.test("báo lỗi khi số điện thoại không đúng chuẩn Việt Nam (0xxxxxxxxx)", () => {
    const invalidData = {
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      password: "password123",
      phone: "123456",
    };
    const result = registerSchema.safeParse(invalidData);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("phone")));
    }
  });

  await t.test("ràng buộc thú cưng: có pet_name thì phải có pet_species", () => {
    const dataWithoutSpecies = {
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      password: "password123",
      pet_name: "Miu Miu",
    };
    const result = registerSchema.safeParse(dataWithoutSpecies);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("pet_species")));
    }
  });

  await t.test("ràng buộc thú cưng: có pet_species thì phải có pet_name", () => {
    const dataWithoutName = {
      full_name: "Nguyễn Văn A",
      email: "nguyenvana@example.com",
      password: "password123",
      pet_species: "Cat",
    };
    const result = registerSchema.safeParse(dataWithoutName);
    assert.strictEqual(result.success, false);
    if (!result.success) {
      assert.ok(result.error.issues.some((i) => i.path.includes("pet_name")));
    }
  });
});

test("Auth Validations: loginSchema", async (t) => {
  await t.test("hợp lệ khi email và password đúng cấu trúc", () => {
    const valid = {
      email: "user@test.com",
      password: "password123",
    };
    const result = loginSchema.safeParse(valid);
    assert.strictEqual(result.success, true);
  });

  await t.test("thất bại khi thiếu password hoặc password < 8 ký tự", () => {
    const invalid = {
      email: "user@test.com",
      password: "123",
    };
    const result = loginSchema.safeParse(invalid);
    assert.strictEqual(result.success, false);
  });
});

test("Auth Validations: refreshTokenSchema", async (t) => {
  await t.test("hợp lệ khi có refresh_token không rỗng", () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: "sample.token.here" });
    assert.strictEqual(result.success, true);
  });

  await t.test("thất bại khi refresh_token rỗng", () => {
    const result = refreshTokenSchema.safeParse({ refresh_token: "" });
    assert.strictEqual(result.success, false);
  });
});

test("Auth Utils: JWT Token generation & verification", async (t) => {
  process.env.JWT_SECRET = "test_jwt_secret_key_123456";
  process.env.JWT_EXPIRES_IN = "1h";
  process.env.JWT_REFRESH_SECRET = "test_jwt_refresh_secret_key_123456";
  process.env.JWT_REFRESH_EXPIRES_IN = "7d";

  await t.test("sinh access token chứa đầy đủ user_id và role", () => {
    const token = generateAccessToken({
      user_id: 99,
      role: "owner",
      email: "test@example.com",
    });
    assert.ok(typeof token === "string" && token.length > 20);

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    assert.strictEqual(decoded.user_id, 99);
    assert.strictEqual(decoded.role, "owner");
    assert.strictEqual(decoded.email, "test@example.com");
  });

  await t.test("sinh refresh token hợp lệ và giải mã đúng payload", () => {
    const refreshToken = generateRefreshToken({
      user_id: 100,
      role: "doctor",
    });
    assert.ok(typeof refreshToken === "string" && refreshToken.length > 20);

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;
    assert.strictEqual(decoded.user_id, 100);
    assert.strictEqual(decoded.role, "doctor");
  });
});

test("Auth Utils: OTP Generator", () => {
  const otp1 = generateOTP();
  const otp2 = generateOTP();

  assert.strictEqual(otp1.length, 6);
  assert.ok(/^\d{6}$/.test(otp1), "OTP phải gồm 6 chữ số");
  assert.strictEqual(otp2.length, 6);
});
