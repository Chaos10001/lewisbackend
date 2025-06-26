import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createProduct,
  deleteProduct,
  getProducts,
  getSingleProduct,
  getUserProducts,
  getUserSingleProduct,
  updateUserProduct,
} from "../controllers/productController.js";

const router = express.Router();

// Protected routes (require authentication)
router.use(protect);
router.post("/create-products", createProduct);
router.get("/get-products", getProducts);
router.get("/get-single-product/:id", getSingleProduct);
router.get("/get-user-product", getUserProducts);
router.get("/get-user-single-product/:id", getUserSingleProduct);
router.patch("/update-user-single-product/:id", updateUserProduct);
router.delete("/delete-user-single-product/:id", deleteProduct);

export default router;
