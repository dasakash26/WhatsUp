import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import app from "../src";
import { authenticateAs, testUsers } from "./mocks";

const testCases = [
  {
    method: "POST",
    path: "/api/chat",
    name: "participants missing",
    body: { name: "CIA" },
  },
  {
    method: "POST",
    path: "/api/chat",
    name: "participants empty",
    body: { name: "CIA", participants: [] },
  },
  {
    method: "POST",
    path: "/api/chat",
    name: "participants not array",
    body: { name: "CIA", participants: "not-array" },
  },
  {
    method: "POST",
    path: "/api/message/123",
    name: "empty body",
    body: {},
  },
  {
    method: "PATCH",
    path: "/api/message/123",
    name: "empty content",
    body: {},
  },
  {
    method: "GET",
    path: "/api/user",
    name: "email is not defined",
    query: "",
  },
  {
    method: "GET",
    path: "/api/user",
    name: "email is not correct",
    query: "email='bad-email'",
  },
  {
    method: "GET",
    path: "/api/get-token",
    name: "user_id is missing",
    query: "",
  },
] as const;

describe("Validation Tests", () => {
  beforeAll(() => authenticateAs(testUsers[0]!.clerkId));
  afterAll(() => authenticateAs(null));

  for (const { method, path, name, ...rest } of testCases) {
    test(`${method} ${path} - should return 400 when ${name}`, async () => {
      const query = "query" in rest ? `${rest.query}` : "";
      const body = "body" in rest ? rest.body : null;

      const res = await app.request(`${path}?${query}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });

      expect(res.status).toBe(400);
    });
  }
});
