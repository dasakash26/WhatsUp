import { describe, expect, test } from "bun:test";
import app from "../src";

const endpoints: { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string }[] = [
  { method: "GET", path: "/api/chat" },
  { method: "POST", path: "/api/chat" },
  { method: "GET", path: "/api/chat/123" },
  { method: "PUT", path: "/api/chat/123" },
  { method: "DELETE", path: "/api/chat/123" },
  { method: "GET", path: "/api/message/123" },
  { method: "POST", path: "/api/message/123" },
  { method: "PATCH", path: "/api/message/123" },
  { method: "DELETE", path: "/api/message/123" },
  { method: "DELETE", path: "/api/message/123/all" },
];

describe("Security Tests", () => {
  for (const { method, path } of endpoints) {
    test(`${method} ${path} - should return 403 when unauthenticated`, async () => {
      const res = await app.request(path, { method });
      expect(res.status).toBe(403);
    });
  }
});
