import { clerkClient } from "@clerk/express";
import expressAsyncHandler from "express-async-handler";
import { Cache } from "@/lib/cacheManager";

export const getUserFromId = expressAsyncHandler(async (req, res) => {
  const { userId } = req.params;
  const cacheKey =Cache.getUserKey(userId);

  const cached = await Cache.get(cacheKey);

  if (cached) {
    res.status(304).json(cached);
    return;
  }

  const user = await clerkClient.users.getUser(userId);
  await Cache.set(cacheKey, user, 300); 
  
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  res.status(200).json(user);
});
