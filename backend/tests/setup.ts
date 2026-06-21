import { afterAll, beforeAll, mock } from "bun:test";
import { prisma } from "../src/lib/prisma";
import type { User } from "../generated/prisma/browser";

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

export const testUsers: {
  clerkId: string;
  email: string;
  firstName: string;
  lastName: string;
}[] = [
  {
    clerkId: "user_007",
    email: "user7@example.com",
    firstName: "Test7",
    lastName: "User",
  },
  {
    clerkId: "user_008",
    email: "user8@example.com",
    firstName: "Test8",
    lastName: "User",
  },
  {
    clerkId: "user_009",
    email: "user9@example.com",
    firstName: "Test9",
    lastName: "User9",
  },
];

export let seededTestUsers: User[];

beforeAll(async () => {
  try {
    const users = testUsers.map((tu) => prisma.user.create({ data: tu }));
    seededTestUsers = await Promise.all(users);
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    const delUsers = testUsers.map((tu) =>
      prisma.user.deleteMany({
        where: {
          clerkId: tu.clerkId,
        },
      }),
    );

    await Promise.all(delUsers);
  } catch (error) {
    console.error("Test cleanup failed:", error);
    throw error;
  }
});
