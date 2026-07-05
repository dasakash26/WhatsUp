import type { Context } from "hono";
import { AppError } from "../utils/app-error";

export function errorHandler(err: Error, c: Context) {
  // console.error(err);

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
}
