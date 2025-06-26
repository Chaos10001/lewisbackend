// models/FundingTransaction.js
import mongoose from "mongoose";

const fundingTransactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ["AUTO_FUNDING", "MANUAL_FUNDING"],
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true }
);

export default mongoose.model("FundingTransaction", fundingTransactionSchema);
