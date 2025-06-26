import express from "express";

import {
  signup,
  verifyOtp,
  resendOtp,
  login,
  getUserDetaiils,
  updateUserName,
  changePassword,
} from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/verify-otp", verifyOtp);
router.post("/resend-otp", resendOtp);
router.post("/login", login);
router.get("/me", protect, getUserDetaiils);
router.patch("/update-name", protect, updateUserName);
router.patch("/change-password", protect, changePassword);


export default router;
