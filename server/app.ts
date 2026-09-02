import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
const app = express();

// Security
app.use(helmet());

// Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON request body
app.use(express.json());

// HTTP request logger
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.send("SmartPetCare Backend Running");
});

export default app;