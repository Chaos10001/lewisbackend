import mongoose from "mongoose";

export const validateObjectId = (req, res, next) => {
  const { productId } = req.params;

  // Enhanced validation
  const isValid =
    typeof productId === "string" &&
    productId.length === 24 &&
    /^[0-9a-fA-F]+$/.test(productId) &&
    mongoose.Types.ObjectId.isValid(productId);

  if (!isValid) {
    return res.status(400).json({
      status: "fail",
      message: "ID validation failed",
      diagnostic: {
        receivedValue: productId,
        receivedType: typeof productId,
        length: productId.length,
        hexCheck: /^[0-9a-fA-F]+$/.test(productId),
        mongooseValidation: mongoose.Types.ObjectId.isValid(productId),
        exampleValidId: new mongoose.Types.ObjectId().toString(),
      },
    });
  }

  next();
};
