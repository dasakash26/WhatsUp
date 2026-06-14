import { Hono, type Context } from "hono";
import { StreamClient } from "@stream-io/node-sdk";
import { STREAM_API_KEY, STREAM_API_SECRET } from "../../utils/secrets";
import { AppError } from "../../utils/app-error";

const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
const router = new Hono();

export async function getCallToken(c: Context) {
  const userId = c.req.query("user_id");

  if (!userId) {
    throw new AppError(400, "user_id is required");
  }

  try {
    const clerkClient = c.get("clerk");
    const user = await clerkClient.users.getUser(userId);
    if (!user) {
      throw new AppError(404, "User not found");
    }

    const newUser = {
      id: userId,
      role: "user",
      name: user.fullName || user.username || "Unknown User",
      image:
        user.imageUrl ||
        "https://getstream.io/random_svg/?id=whatsup&name=whatsup",
    };

    await client.upsertUsers([newUser]);

    const token = client.generateUserToken({ user_id: userId });
    return c.json(
      {
        apiKey: STREAM_API_KEY,
        userId,
        token,
      },
      200,
    );
  } catch (error) {
    console.error("Error generating call token:", error);
    throw new AppError(500, "Failed to generate call token");
  }
}

router.get("/get-token", getCallToken);

export default router;
