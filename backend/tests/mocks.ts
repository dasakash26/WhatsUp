import { mock } from "bun:test";

export let clerkId: string | null = null;

export function authenticateAs(id: string | null) {
  clerkId = id;
}

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

mock.module("@clerk/hono", () => ({
  clerkMiddleware: () => async (c: any, next: any) => {
    if (clerkId) {
      c.set("clerkAuth", { userId: clerkId });
    }
    c.set("clerk", {
      users: {
        getUser: async (id: string) => {
          const user = testUsers.find((u) => u.clerkId === id);
          if (user) {
            return {
              fullName: `${user.firstName} ${user.lastName}`,
              username: user.firstName.toLowerCase(),
              imageUrl: "https://example.com/avatar.jpg",
            };
          }
          return null;
        },
      },
    });
    await next();
  },
  getAuth: (c: any) => ({
    userId: c.get("clerkAuth")?.userId || null,
  }),
}));

mock.module("@clerk/backend", () => ({
  verifyToken: async (token: string, options: any) => {
    if (token && token.startsWith("user_")) {
      return { sub: token };
    }
    if (token === "mock-token") {
      return { sub: testUsers[0]?.clerkId };
    }
    throw new Error("Invalid mock token");
  },
}));

mock.module("@stream-io/node-sdk", () => ({
  StreamClient: class {
    upsertUsers = async (users: any[]) => {
      return { users };
    };
    generateUserToken = (options: { user_id: string }) => {
      return `mock-stream-token-for-${options.user_id}`;
    };
  },
}));
