import { clerkClient } from "@clerk/express";
import expressAsyncHandler from "express-async-handler";

export const getUserFromId = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;

  const user = await clerkClient.users.getUser(userId);

  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});
