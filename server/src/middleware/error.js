export const notFound = (req, res, next) => {
  res.status(404);
  next(new Error(`Not found: ${req.originalUrl}`));
};

export const errorHandler = (err, req, res, next) => {
  let status = err.statusCode || (res.statusCode !== 200 ? res.statusCode : 500);
  let message = err.message || "Server error";

  if (err.name === "CastError") {
    status = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((e) => e.message).join(", ");
  }
  if (err.code === 11000) {
    status = 409;
    message = "Duplicate value: " + Object.keys(err.keyValue || {}).join(", ");
  }

  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
  });
};