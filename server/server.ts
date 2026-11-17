import dotenv from "dotenv";
dotenv.config();

import http from "http";
import app from "./app";
import pool from "./src/config/database.config";
import { initSocketIO } from "./src/socket";

async function connectDatabase() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("PostgreSQL connected successfully");
    console.log(`🕒 Database time: ${result.rows[0].now}`);
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 8000;
const httpServer = http.createServer(app);

// Khởi tạo Socket.IO
initSocketIO(httpServer);

connectDatabase().then(() => {
  httpServer.listen(PORT, () => {
    console.log(`Server with WebSocket running at http://localhost:${PORT}`);
  });
});



