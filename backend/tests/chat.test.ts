import { test, expect, describe } from "bun:test";
import app from "../src";
import { authenticateAs, seededTestUsers, testUsers } from "./setup";
import type { ChatMember } from "../generated/prisma/browser";
import { prisma } from "../src/lib/prisma";

describe("Chat Module", () => {
  describe("GET /api/chat/", () => {
    test("returns 200 with chats the user blongs to when user is logged in", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request("/api/chat");
      authenticateAs(null);
      expect(res.status).toBe(200);
      expect(await res.json()).toBeArray();
    });
  });

  describe("POST /api/chat/", () => {
    test("returns 200 and creates the group chat with proper member roles, when user is logged in", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request("/api/chat", {
        method: "POST",
        body: JSON.stringify({
          name: "CIA",
          participants: seededTestUsers.map((user) => user.id),
        }),
      });
      authenticateAs(null);

      expect(res.status).toBe(200);

      const body = await res.json();
      // console.log(body);
      const chat = body as {
        id: string;
        name: string;
        members: ChatMember[];
      };
      expect(chat.members).toBeArrayOfSize(seededTestUsers.length);

      const dbChat = await prisma.chat.findUnique({
        where: { id: chat.id },
        include: { members: true },
      });
      expect(dbChat).not.toBeNull();
      expect(dbChat!.name).toBe("CIA");
      // console.log(dbChat!.members, seededTestUsers.length);
      expect(dbChat!.members).toBeArrayOfSize(seededTestUsers.length);

      const creatorMember = dbChat!.members.find(
        (m) => m.userId === seededTestUsers[0]!.id,
      );
      expect(creatorMember!.role).toBe("SUPERADMIN");

      const otherMember = dbChat!.members.find(
        (m) => m.userId === seededTestUsers[1]!.id,
      );
      expect(otherMember!.role).toBe("MEMBER");
    });
  });
});
