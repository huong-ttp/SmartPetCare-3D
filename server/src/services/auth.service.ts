import bcrypt from "bcrypt";
import pool from "../config/database.config";
import AppError from "../utils/AppError";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt";
import jwt, { JwtPayload } from "jsonwebtoken";
import { generateOTP } from "../utils/otp";
import { sendOTPEmail } from "../utils/mail";
interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
}
interface LoginData {
  email: string;
  password: string;
}

interface ResetPasswordData {
  email: string;
  otp: string;
  new_password: string;
}
interface ForgotPasswordData {
  email: string;
}
class AuthService {
  async register(data: RegisterData) {
    const existingUser = await pool.query(
    `
    SELECT user_id
    FROM users
    WHERE email = $1
  `,
  [data.email]
);
 if (existingUser.rows.length > 0) {
    throw new AppError("Email already exists", 409);
}
const hashedPassword = await bcrypt.hash(data.password, 10);
const result = await pool.query(
  `
    INSERT INTO users (
      full_name,
      email,
      password_hash,
      phone,
      address,
      role,
      is_active
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING
      user_id,
      full_name,
      email,
      phone,
      address,
      role,
      is_active,
      created_at;
  `,
  [
    data.full_name,
    data.email,
    hashedPassword,
    data.phone ?? null,
    data.address ?? null,
    "owner",
    true,
  ]
);

return {
  message: "Register successfully",
  user: result.rows[0],
};
}
async login(data: LoginData) {
  const result = await pool.query(
    `
      SELECT *
      FROM users
      WHERE email = $1
    `,
    [data.email]
  );
  if (result.rows.length === 0) {
  throw new AppError(
    "Email hoặc mật khẩu không đúng",
    401
  );
}

const user = result.rows[0];
const isMatch = await bcrypt.compare(
  data.password,
  user.password_hash
);
if (!isMatch) {
  throw new AppError(
    "Email hoặc mật khẩu không đúng",
    401
  );
}
const accessToken = generateAccessToken({
  user_id: user.user_id,
  role: user.role,
});
const refreshToken = generateRefreshToken({
  user_id: user.user_id,
  role: user.role,
});
return {
  message: "Login successful",
  access_token: accessToken,
  refresh_token: refreshToken,
  user: {
    user_id: user.user_id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role,
  },
};
}
async refreshToken(refreshToken: string) {
  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!
    ) as JwtPayload & {
      user_id: number;
      role: string;
    };

    const accessToken = generateAccessToken({
      user_id: decoded.user_id,
      role: decoded.role,
    });

    return {
      access_token: accessToken,
    };
  } catch {
    throw new AppError("Invalid refresh token", 401);
  }
}
async getProfile(userId: number) {
  const result = await pool.query(
    `
      SELECT
        user_id,
        full_name,
        email,
        phone,
        address,
        role,
        is_active,
        created_at
      FROM users
      WHERE user_id = $1
    `,
    [userId]
  );

  if (result.rows.length === 0) {
    throw new AppError("User not found", 404);
  }

  return result.rows[0];
}
async logout() {
  return {
    message: "Logout successful",
  };
}
async forgotPassword(
  data: ForgotPasswordData
) {
  // Kiểm tra email có tồn tại
  const userResult = await pool.query(
    `
      SELECT user_id, email
      FROM users
      WHERE email = $1
    `,
    [data.email]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(
      "Email không tồn tại",
      404
    );
  }

  const user = userResult.rows[0];

  // Sinh OTP
  const otp = generateOTP();

  // OTP hết hạn sau 5 phút
  const expiresAt = new Date(
    Date.now() + 5 * 60 * 1000
  );

  // Xóa OTP cũ nếu có
  await pool.query(
    `
      DELETE FROM password_resets
      WHERE user_id = $1
    `,
    [user.user_id]
  );

  // Lưu OTP mới
  await pool.query(
    `
      INSERT INTO password_resets (
        user_id,
        otp,
        expires_at
      )
      VALUES ($1, $2, $3)
    `,
    [
      user.user_id,
      otp,
      expiresAt,
    ]
  );

  // Gửi email
  await sendOTPEmail(
    user.email,
    otp
  );

  return {
    message:
      "OTP đã được gửi tới email của bạn",
  };
}

async resetPassword(
  data: ResetPasswordData
) {
  // 1. Kiểm tra email
  const userResult = await pool.query(
    `
      SELECT user_id
      FROM users
      WHERE email = $1
    `,
    [data.email]
  );

  if (userResult.rows.length === 0) {
    throw new AppError(
      "Email không tồn tại",
      404
    );
  }

  const user = userResult.rows[0];

  // 2. Lấy OTP
  const otpResult = await pool.query(
    `
      SELECT *
      FROM password_resets
      WHERE user_id = $1
    `,
    [user.user_id]
  );

  if (otpResult.rows.length === 0) {
    throw new AppError(
      "OTP không hợp lệ",
      400
    );
  }

  const otpData = otpResult.rows[0];

  // 3. Kiểm tra OTP
  if (otpData.otp !== data.otp) {
    throw new AppError(
      "OTP không đúng",
      400
    );
  }

  // 4. Kiểm tra hết hạn
  if (new Date() > otpData.expires_at) {
    throw new AppError(
      "OTP đã hết hạn",
      400
    );
  }

  // 5. Hash password mới
  const hashedPassword =
    await bcrypt.hash(data.new_password, 10);

  // 6. Update password
  await pool.query(
    `
      UPDATE users
      SET password_hash = $1
      WHERE user_id = $2
    `,
    [
      hashedPassword,
      user.user_id,
    ]
  );

  // 7. Xóa OTP
  await pool.query(
    `
      DELETE FROM password_resets
      WHERE user_id = $1
    `,
    [user.user_id]
  );

  return {
    message: "Đặt lại mật khẩu thành công",
  };
}
}

export default new AuthService();
