import { AppError } from "../../utils/app-error";
import type { Context } from "hono";

export async function getUserFromId(c: Context) {
  const userId = c.req.param("userId");
  const clerkClient = c.get("clerk");

  if (!userId) {
    throw new AppError(400, "user ID is required");
  }

  const user = await clerkClient.users.getUser(userId);

  if (!user) {
    throw new AppError(404, "User not found");
  }

  return c.json(user, 200);
}
