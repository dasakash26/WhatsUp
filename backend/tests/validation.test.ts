import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { authenticateAs, testUsers } from "./setup";

const modules = {
  chat: [
    {
      method: "POST",
      path: "",
      name: "participants missing",
      body: { name: "CIA" },
    },
    {
      method: "POST",
      path: "",
      name: "participants empty",
      body: { name: "CIA", participants: [] },
    },
    {
      method: "POST",
      path: "",
      name: "participants not array",
      body: { name: "CIA", participants: "not-array" },
    },
  ],
  message: [
    { method: "POST", path: "/123", name: "empty body", body: {} },
    { method: "PATCH", path: "/123", name: "empty content", body: {} },
  ],
  user: [
    {
      method: "GET",
      path: "",
      name: "email is not defined",
      query: "",
    },
    {
      method: "GET",
      path: "",
      name: "email is not correct",
      query: "email='bad-email'",
    },
  ],
} as const;

describe("Validation Error Tests (400)", () => {
  beforeAll(() => authenticateAs(testUsers[0]!.clerkId));
  afterAll(() => authenticateAs(null));

  for (const [module, endpoints] of Object.entries(modules)) {
    describe(`${module.toUpperCase()} MODULE`, () => {
      for (const { method, path, name, ...rest } of endpoints) {
        test(`returns 400 when ${name}`, async () => {
          const query = "query" in rest ? `${rest.query}` : "";
          const body = "body" in rest ? rest.body : null;

          const res = await app.request(`/api/${module}${path}?${query}`, {
            method,
            headers: body ? { "Content-Type": "application/json" } : undefined,
            body: body ? JSON.stringify(body) : undefined,
          });

          expect(res.status).toBe(400);
        });
      }
    });
  }
});
