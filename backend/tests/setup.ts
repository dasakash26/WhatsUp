import { afterAll, beforeAll, mock } from "bun:test";
import { prisma } from "../src/lib/prisma";

export let clerkId: string | null = null;

export function authenticateAs(id: string | null) {
  clerkId = id;
}

mock.module("@clerk/hono", () => ({
  clerkMiddleware: () => async (c: any, next: any) => {
    if (clerkId) {
      c.set("clerkAuth", { userId: clerkId });
    }
    await next();
  },
  getAuth: (c: any) => ({
    userId: c.get("clerkAuth")?.userId || null,
  }),
}));

export const testUser = {
  clerkId: "user_007",
  email: "user@example.com",
  firstName: "Test",
  lastName: "User",
};

beforeAll(async () => {
  try {
    await prisma.user.create({ data: testUser });
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await prisma.user.deleteMany({
      where: {
        clerkId: testUser.clerkId,
      },
    });
  } catch (error) {
    console.error("Test cleanup failed:", error);
    throw error;
  }
});
