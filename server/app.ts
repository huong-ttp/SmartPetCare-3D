import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./src/routes";
import errorHandler from "./src/middleware/error.middleware";
import petRoute from "./src/routes/pet.routes";
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
  res.json({
    success: true,
    message: "Welcome to SmartPetCare API",
  });
});
app.use("/api", routes);

app.use(errorHandler);

app.use("/api/pets", petRoute);

export default app;