import { test, expect, describe } from "bun:test";
import app from "../src";
import { authenticateAs, testUsers } from "./mocks";

describe("Call Module", () => {
  describe("GET /api/get-token", () => {
    test("should return 200 and Stream token details when user is logged in", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/get-token?user_id=${testUsers[0]!.clerkId}`);
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        apiKey: string;
        userId: string;
        token: string;
      };
      expect(body.userId).toBe(testUsers[0]!.clerkId);
      expect(body.token).toBe(`mock-stream-token-for-${testUsers[0]!.clerkId}`);
    });
  });
});
