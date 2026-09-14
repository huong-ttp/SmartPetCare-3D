import dotenv from "dotenv";
dotenv.config();
import app from "./app";
import pool from "./src/config/database.config";
import { sendTestEmail } from "./src/utils/mail";
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



const PORT = process.env.PORT || 3000;

connectDatabase().then(() => {
  app.listen(PORT, () => {
    
    console.log(`Server running at http://localhost:${PORT}`);
  });
  
});

