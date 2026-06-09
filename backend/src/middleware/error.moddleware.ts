import type { ErrorRequestHandler } from "express";
import { AppError } from "../utils/app-error";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  res.status(500).json({
    error: "Internal Server Error",
  });
};
