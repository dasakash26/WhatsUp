app.get("/api/get-token", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(user_id as string);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    const newUser = {
      id: user_id as string,
      role: "user",
      name: user.fullName || user.username || "Unknown User",
      image:
        user.imageUrl ||
        "https://getstream.io/random_svg/?id=whatsup&name=whatsup",
    };

    await client.upsertUsers([newUser]);

    const token = client.generateUserToken({ user_id: user_id as string });
    res.status(200).json({
      apiKey: STREAM_API_KEY,
      userId: user_id,
      token,
    });
    return;
  } catch (error) {
    res.status(404).json({ error: "User not found" });
    return;
  }
});
