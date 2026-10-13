import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Đảm bảo kiểu DATE trong PostgreSQL (OID 1082) luôn trả về chuỗi 'YYYY-MM-DD' nguyên bản,
// tránh bị node-postgres ép thành Date object rồi bị JSON.stringify lùi 1 ngày do múi giờ UTC.
types.setTypeParser(1082, (val: string) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.on("error", (err) => {
  console.error("Unexpected PostgreSQL error:", err);
});

export default pool;