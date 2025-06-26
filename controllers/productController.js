import Product from "../models/Products.js";

// create a new product
export const createProduct = async (req, res) => {
  try {
    const { title, price, picture, url } = req.body;

    //   create new product
    const product = await Product.create({
      title,
      price,
      picture,
      url,
      createdBy: req.user.id,
    });

    res.status(201).json({
      status: "status",
      data: {
        product,
      },
    });
  } catch (err) {
    // Handle validation errors
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(", "),
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get all products
export const getProducts = async (req, res) => {
  try {
    const products = await Product.find().populate("createdBy", "name email");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get a single product
export const getSingleProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "createdBy",
      "name email"
    );

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "No product found with that ID",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid product ID",
      });
    }

    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get products created by current user
export const getUserProducts = async (req, res) => {
  try {
    const products = await Product.find({ createdBy: req.user.id })
      .sort("-createdAt")
      .populate("createdBy", "name email");

    res.status(200).json({
      status: "success",
      results: products.length,
      data: {
        products,
      },
    });
  } catch (err) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Get single product (with ownership check)
export const getUserSingleProduct = async (req, res) => {
  try {
    const product = await Product.findOne({
      _id: req.params.id,
      createdBy: req.user.id,
    }).populate("createdBy", "name email");

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "No product found with that ID or you dont have permission",
      });
    }
    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (err) {
    if (err.name === "CastError") {
      return res.status(400).json({
        status: "fail",
        message: "Invalid product ID",
      });
    }
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Update product
export const updateUserProduct = async (req, res) => {
  try {
    const { title, price, picture, url } = req.body;

    const product = await Product.findOneAndUpdate(
      {
        _id: req.params.id,
        createdBy: req.user.id,
      },
      { title, price, picture, url },
      {
        new: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      status: "success",
      data: {
        product,
      },
    });
  } catch (err) {
    if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((val) => val.message);
      return res.status(400).json({
        status: "fail",
        message: messages.join(", "),
      });
    }
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};

// Delete Product
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.id,
    });

    if (!product) {
      return res.status(404).json({
        status: "fail",
        message: "No product found with that ID or you dont have permission",
      });
    }
    res.status(200).json({
      status: "success",
      data: null,
      message: "This product has been successfully deleted",
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
};
