import bcrypt from "bcrypt";
import pool from "../config/database.config";
import AppError from "../utils/AppError";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../utils/jwt";
import jwt, { JwtPayload } from "jsonwebtoken";
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
}

export default new AuthService();
