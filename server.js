import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/db.js";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { startAutoFunding } from "./utils/autoFundScheduler.js";

connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/purchase", purchaseRoutes);

app.use(errorHandler);

// Test Routes
app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

startAutoFunding();
