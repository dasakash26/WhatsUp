import type { ErrorHandler } from "hono";
import { AppError } from "../utils/app-error";

export const errorHandler: ErrorHandler = (err, c) => {
  console.error(err);

  if (err instanceof AppError) {
    return c.json(
      {
        error: err.message,
      },
      err.statusCode,
    );
  }

  return c.json(
    {
      error: "Internal Server Error",
    },
    500,
  );
};
