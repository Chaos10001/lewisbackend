// utils/autoFundScheduler.js
import cron from "node-cron";
import User from "../models/User.js";
import FundingTransaction from "../models/FundingTransaction.js";

const AUTO_FUND_AMOUNT = 5000;
const AUTO_FUND_INTERVAL = "* * * * *"; // Every minute

const fundAllUsers = async () => {
  try {
    console.log("Running auto-funding...");

    const users = await User.find({});

    for (const user of users) {
      try {
        // Update wallet
        await User.findByIdAndUpdate(user._id, {
          $inc: { wallet: AUTO_FUND_AMOUNT },
        });

        // Record funding-specific transaction
        await FundingTransaction.create({
          user: user._id,
          type: "AUTO_FUNDING",
          amount: AUTO_FUND_AMOUNT,
        });

        // console.log(`Funded ₦${AUTO_FUND_AMOUNT} to user ${user.email}`);
      } catch (userError) {
        console.error(`Error funding user ${user._id}:`, userError.message);
      }
    }
  } catch (error) {
    console.error("Auto-funding failed:", error.message);
  }
};

export const startAutoFunding = () => {
  cron.schedule(AUTO_FUND_INTERVAL, fundAllUsers);
  console.log("Auto-funding scheduled to run every minute");
};
