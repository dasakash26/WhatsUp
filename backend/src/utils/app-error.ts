import type { ContentfulStatusCode } from "hono/utils/http-status";

export class AppError extends Error {
  constructor(
    public statusCode: ContentfulStatusCode,
    message: string,
  ) {
    super(message);
  }
}
