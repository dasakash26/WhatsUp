import { test, expect } from "bun:test";
import app from "../src";

test("Health Check", async () => {
  const res = await app.request("/");
  expect(res.status).toBe(200);
});
