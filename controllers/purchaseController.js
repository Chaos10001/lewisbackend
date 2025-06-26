import mongoose from "mongoose";
import Product from "../models/Products.js";
import Transaction from "../models/Transaction.js";
import User from "../models/User.js";

export const purchaseProduct = async (req, res) => {
  // Start session only if using transactions
  const usingTransactions =
    mongoose.connection.readyState === 1 &&
    mongoose.connection.host.includes("mongodb.net"); // Atlas check

  const session = usingTransactions ? await mongoose.startSession() : null;
  if (session) session.startTransaction();

  try {
    const { productId } = req.params;
    const buyerId = req.user.id;

    console.log("Received productId:", productId);

    // Explicit validation
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        status: "fail",
        message: "Invalid product ID format",
        receivedId: productId,
        expectedFormat: "24-character hexadecimal string",
      });
    }

    // 1. VALIDATE ALL INPUTS FIRST -------------------------
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      throw {
        statusCode: 400,
        message: "Invalid product ID format",
        type: "validation",
      };
    }

    // 2. GET PRODUCT WITH VALIDATION -----------------------
    const product = await Product.findById(productId)
      .populate("createdBy")
      .session(session || null);

    if (!product) {
      throw {
        statusCode: 404,
        message: "Product not found",
        type: "validation",
      };
    }

    // 3. CHECK OWNERSHIP -----------------------------------
    if (product.createdBy._id.toString() === buyerId) {
      throw {
        statusCode: 400,
        message: "Cannot buy your own product",
        type: "validation",
      };
    }

    // 4. VERIFY BALANCE ------------------------------------
    const totalAmount = product.price + 100;
    const buyer = await User.findById(buyerId).session(session || null);

    if (buyer.wallet < totalAmount) {
      throw {
        statusCode: 400,
        message: `Insufficient funds. Need ₦${totalAmount}`,
        type: "validation",
      };
    }

    // 5. PERFORM MONEY TRANSFERS (ONLY AFTER ALL VALIDATIONS PASS) -----
    await User.findByIdAndUpdate(
      buyerId,
      { $inc: { wallet: -totalAmount } },
      { session: session || null }
    );

    await User.findByIdAndUpdate(
      product.createdBy._id,
      { $inc: { wallet: product.price } },
      { session: session || null }
    );

    // 6. RECORD TRANSACTION --------------------------------
    const transaction = await Transaction.create(
      [
        {
          product: productId,
          buyer: buyerId,
          seller: product.createdBy._id,
          productPrice: product.price,
          platformFee: 100,
          totalAmount,
        },
      ],
      { session: session || null }
    );

    // 7. COMMIT IF USING TRANSACTIONS ----------------------
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    res.status(200).json({
      status: "success",
      data: {
        transaction: transaction[0],
        newBalance: buyer.wallet - totalAmount,
      },
    });
  } catch (err) {
    // ROLLBACK IF USING TRANSACTIONS
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }

    // SPECIAL HANDLING FOR MONGOOSE ERRORS
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid ID format",
      });
    }

    // HANDLE OUR CUSTOM ERRORS
    if (err.type === "validation") {
      return res.status(err.statusCode).json({
        status: "fail",
        message: err.message,
      });
    }

    // GENERIC ERROR HANDLING
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
