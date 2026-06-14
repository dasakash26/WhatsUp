import { test, expect, describe } from "bun:test";
import app from "../src";
import { authenticateAs, testUser } from "./setup";

describe("Chat Module", () => {
  describe("GET /api/chat/", () => {
    test("returns 403 when unauthenticated", async () => {
      const res = await app.request("/api/chat");
      expect(res.status).toBe(403);
    });

    test("returns 200 with chat list when user is logged in", async () => {
      authenticateAs(testUser.clerkId);
      const res = await app.request("/api/chat");
      expect(res.status).toBe(200);
    });
  });
});
