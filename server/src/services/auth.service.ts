import pool from "../config/database.config";
interface RegisterData {
  full_name: string;
  email: string;
  password: string;
  phone?: string;
  address?: string;
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
  throw new Error("Email already exists");
}
return {
  message: "Email is available",
  user: data,

};
}
}
export default new AuthService();
