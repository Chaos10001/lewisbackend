export const errorHandler = (err, req, res, next) => {
  console.error("Error Stack:", err.stack);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    return res.status(400).json({
      status: "fail",
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }

  // MongoDB duplicate key
  if (err.code === 11000) {
    return res.status(400).json({
      status: "fail",
      message: "Duplicate field value entered",
      field: Object.keys(err.keyValue)[0],
    });
  }

  // Mongoose CastError (invalid ID format)
  if (err.name === "CastError") {
    return res.status(400).json({
      status: "fail",
      message: `Invalid ${err.path}: ${err.value}`,
    });
  }

  // Custom errors
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  }

  // Unknown errors (development)
  if (process.env.NODE_ENV === "development") {
    return res.status(500).json({
      status: "error",
      message: err.message,
      stack: err.stack,
    });
  }

  // Unknown errors (production)
  res.status(500).json({
    status: "error",
    message: "Something went wrong!",
  });
};
