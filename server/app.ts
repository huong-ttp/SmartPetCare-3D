import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./src/routes";
import errorHandler from "./src/middleware/error.middleware";
const app = express();

// Security
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

// Cross-Origin Resource Sharing
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Parse JSON request body (ảnh được upload trực tiếp qua Multer/Cloudinary)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// HTTP request logger
app.use(morgan("dev"));

// Routes
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Welcome to SmartPetCare API",
  });
});

app.use("/api", routes);

app.use(errorHandler);


export default app;