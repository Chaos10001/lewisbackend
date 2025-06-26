import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { purchaseProduct } from "../controllers/purchaseController.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import mongoose from "mongoose";

const router = express.Router();

router.use("/:productId", (req, res, next) => {
  console.log("Raw URL:", req.originalUrl);
  console.log("Received ID:", req.params.productId);
  console.log("ID Length:", req.params.productId.length);
  console.log("ID Type:", typeof req.params.productId);
  next();
});
router.post("/:productId", validateObjectId, protect, purchaseProduct);

// router.post(
//   "/:productId",
//   (req, res, next) => {
//     console.log("Raw ID:", req.params.productId);
//     console.log(
//       "Mongoose Valid:",
//       mongoose.Types.ObjectId.isValid(req.params.productId)
//     );
//     next();
//   },
//   protect,
//   purchaseProduct
// );
export default router;
