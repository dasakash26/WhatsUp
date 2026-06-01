import { verifyWebhook } from "@clerk/express/webhooks";
import { Router, raw } from "express";
import {
  deleteUser,
  extractUserFromEventData,
  upsertUser,
} from "./user.service";

const router = Router();

router.post("/", raw({ type: "application/json" }), async (req, res) => {
  try {
    console.log("hit webhook");
    const evt = await verifyWebhook(req);
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

    return res.send("Webhook received");
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return res.status(400).send("Error verifying webhook");
  }
});

export default router;
