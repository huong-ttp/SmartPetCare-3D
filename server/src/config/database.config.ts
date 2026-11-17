import { Pool, types } from "pg";
import dotenv from "dotenv";

dotenv.config();

// Đảm bảo kiểu DATE trong PostgreSQL (OID 1082) luôn trả về chuỗi 'YYYY-MM-DD' nguyên bản,
// tránh bị node-postgres ép thành Date object rồi bị JSON.stringify lùi 1 ngày do múi giờ UTC.
types.setTypeParser(1082, (val: string) => val);

// Đảm bảo kiểu TIMESTAMP without time zone trong PostgreSQL (OID 1114) luôn được parse theo chuẩn UTC,
// tránh bị node-postgres parse theo local timezone của máy tính rồi bị trừ lùi 7 tiếng khi serialize JSON.
types.setTypeParser(1114, (val: string) => {
  if (!val) return val;
  const isoStr = val.includes("T") ? val : val.replace(" ", "T");
  return new Date(isoStr.endsWith("Z") ? isoStr : isoStr + "Z");
});

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