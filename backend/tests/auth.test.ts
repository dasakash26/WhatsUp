import { describe, expect, test } from "bun:test";
import app from "../src";

const modules: Record<
  string,
  { method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"; path: string }[]
> = {
  chat: [
    { method: "GET", path: "" },
    { method: "POST", path: "" },
    { method: "GET", path: "/123" },
    { method: "PUT", path: "/123" },
    { method: "DELETE", path: "/123" },
  ],
  message: [
    { method: "GET", path: "/123" },
    { method: "POST", path: "/123" },
    { method: "PATCH", path: "/123" },
    { method: "DELETE", path: "/123" },
    { method: "DELETE", path: "/123/all" },
  ],
};

describe("Security Gatekeeper Tests", () => {
  for (const [module, endpoints] of Object.entries(modules)) {
    describe(`${module.toUpperCase()} MODULE`, () => {
      for (const { method, path } of endpoints) {
        const route = `/api/${module}${path}`;
        test(`${method} ${route} - returns 403 when unauthenticated`, async () => {
          const res = await app.request(route, { method });
          expect(res.status).toBe(403);
        });
      }
    });
  }
});
