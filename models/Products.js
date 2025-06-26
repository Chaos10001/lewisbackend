import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Product title is required"],
    trim: true,
    maxlength: [100, "Title cannot exceed 100 characters"],
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [1000, "Price must be at least 1000"],
  },
  picture: {
    type: String,
    required: [true, "Product image is required"],
    validate: {
      validator: function (v) {
        return /\.(jpg|jpeg|png|webp)$/i.test(v);
      },
      message: (props) => `${props.value} is not a valid image file!`,
    },
  },
  url: {
    type: String,
    required: [true, "Product URL is required"],
    validate: {
      validator: function (v) {
        return /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(
          v
        );
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
});

const Product = mongoose.model("Product", productSchema);

export default Product;
