import type { Request, Response } from "express";
import { clerkClient } from "@clerk/express";
import { AppError } from "../../utils/app-error";

export async function getUserFromId(
  req: Request<{ userId: string }>,
  res: Response
) {
  const { userId } = req.params;

  if (!userId) {
    throw new AppError(400, "user ID is required");
  }

  try {
    const user = await clerkClient.users.getUser(userId);
    
    if (!user) {
      throw new AppError(404, "User not found");
    }

    return res.status(200).json(user);
  } catch (error) {
    throw new AppError(404, "User not found");
  }
}
