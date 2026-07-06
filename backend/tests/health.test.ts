import { describe, expect, test } from "bun:test";
import app from "../src";

describe("Health Module", () => {
  describe("GET /", () => {
    test("should return 200 health status", async () => {
      const res = await app.request("/");
      expect(res.status).toBe(200);
    });
  });
});
