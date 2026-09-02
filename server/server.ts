import dotenv from "dotenv";
dotenv.config();

import express from "express";
import pool from "./src/config/database.config";

const app = express();

app.use(express.json());

app.get("/", (req, res) => {
  res.send("SmartPetCare Backend Running");
});

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      success: true,
      time: result.rows[0],
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      error,
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});