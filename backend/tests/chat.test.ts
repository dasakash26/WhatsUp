import { test, expect, describe, afterAll } from "bun:test";
import app from "../src";
import { seededTestUsers } from "./setup";
import { authenticateAs, testUsers } from "./mocks";
import type { ChatMember } from "../generated/prisma/browser";
import { prisma } from "../src/lib/prisma";

describe("Chat Module", () => {
  let chatId: string;

  afterAll(async () => {
    if (chatId) {
      try {
        await prisma.chat.delete({
          where: { id: chatId },
        });
      } catch {}
    }
  });

  describe("POST /api/chat", () => {
    test("should return 200 and create the chat with correct member roles when user is logged in", async () => {
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

      const body = (await res.json()) as {
        id: string;
        name: string;
        members: ChatMember[];
      };
      chatId = body.id;
      expect(body.members).toBeArrayOfSize(seededTestUsers.length);

      const creatorMember = body.members.find(
        (m) => m.userId === seededTestUsers[0]!.id,
      );
      expect(creatorMember!.role).toBe("SUPERADMIN");
    });
  });

  describe("GET /api/chat", () => {
    test("should return 200 with all chats user belongs to when user is logged in", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request("/api/chat");
      authenticateAs(null);
      expect(res.status).toBe(200);
      expect(await res.json()).toBeArray();
    });
  });

  describe("GET /api/chat/:chatId", () => {
    test("should return 200 with single chat details when user is member of chat", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/chat/${chatId}`);
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { id: string; name: string };
      expect(body.id).toBe(chatId);
      expect(body.name).toBe("CIA");
    });
  });

  describe("PUT /api/chat/:chatId", () => {
    test("should return 200 and update chat details when user has administrative privileges", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/chat/${chatId}`, {
        method: "PUT",
        body: JSON.stringify({
          name: "Updated Group Name",
        }),
      });
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { name: string };
      expect(body.name).toBe("Updated Group Name");
    });
  });

  describe("DELETE /api/chat/:chatId", () => {
    test("should return 200 and delete the chat when user has administrative privileges", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/chat/${chatId}`, {
        method: "DELETE",
      });
      authenticateAs(null);

      expect(res.status).toBe(200);
      chatId = "";
    });
  });
});
