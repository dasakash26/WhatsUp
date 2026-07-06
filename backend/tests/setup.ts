import { afterAll, beforeAll } from "bun:test";
import { prisma } from "../src/lib/prisma";
import type { User } from "../generated/prisma/browser";
import { hc } from "hono/client";
import type { AppType } from "../src/";

import { testUsers } from "./mocks";

export let testServer: any;
export let client: any;
export let seededTestUsers: User[];

beforeAll(async () => {
  try {
    const serverConfig = (await import("../src")).default;

    testServer = Bun.serve({
      fetch: serverConfig.fetch,
      websocket: serverConfig.websocket,
      port: 0,
    });

    client = hc<AppType>(`http://localhost:${testServer.port}/`);

    const users = testUsers.map((tu) => prisma.user.create({ data: tu }));
    seededTestUsers = await Promise.all(users);
  } catch (error) {
    console.error("Test setup failed:", error);
    throw error;
  }
});

afterAll(async () => {
  try {
    testServer?.stop();

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
