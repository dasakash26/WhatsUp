import {
  deleteUser,
  extractUserFromEventData,
  upsertUser,
} from "./user.service";
import { Context, Hono } from "hono";
import { verifyWebhook } from "@clerk/hono/webhooks";
import { AppError } from "../../utils/app-error";

const router = new Hono();

router.post("/", async (c: Context) => {
  try {
    console.log("hit webhook");
    const evt = await verifyWebhook(c);
    const { id } = evt.data;
    const eventType = evt.type;

    console.log(
      `Received webhook with ID ${id} and event type of ${eventType}`,
    );

    switch (eventType) {
      case "user.created":
      case "user.updated":
        const user = extractUserFromEventData(evt["data"]);
        await upsertUser(user);
        break;
      case "user.deleted":
        if (id) await deleteUser(id);
        break;
      default:
        console.log(`Ignoring webhook event: ${eventType}`);
        break;
    }

    return c.text("Webhook received");
  } catch (err) {
    console.error("Error verifying webhook:", err);
    throw new AppError(500, "Error verifying webhook:");
  }
});

export default router;
