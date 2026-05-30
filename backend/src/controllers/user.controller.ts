import { clerkClient } from "@clerk/express";
import expressAsyncHandler from "express-async-handler";
import { Cache } from "../lib/cacheManager";

export const getUserFromId = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const cacheKey = Cache.getUserKey(userId);

  const cached = await Cache.get(cacheKey);

  if (cached) {
    res.status(200).json(cached);
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  await Cache.set(cacheKey, user, Cache.USER_TTL);

  res.status(200).json(user);
});
