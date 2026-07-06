import { test, expect, describe } from "bun:test";
import app from "../src";
import { authenticateAs, testUsers } from "./mocks";

describe("User Module", () => {
  describe("GET /api/user", () => {
    test("should return 200 and details of registered user when querying by email", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/user?email=${testUsers[0]!.email}`);
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { email: string; clerkId: string };
      expect(body.email).toBe(testUsers[0]!.email);
      expect(body.clerkId).toBe(testUsers[0]!.clerkId);
    });
  });
});
