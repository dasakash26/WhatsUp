import { test, expect, describe, beforeAll, afterAll } from "bun:test";
import app from "../src";
import { seededTestUsers } from "./setup";
import { authenticateAs, testUsers } from "./mocks";
import { prisma } from "../src/lib/prisma";

describe("Message Module", () => {
  let chatId: string;
  let messageId: string;

  beforeAll(async () => {
    authenticateAs(testUsers[0]!.clerkId);
    const res = await app.request("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        name: "Test Chat",
        participants: seededTestUsers.map((u) => u.id),
      }),
    });
    const chat = (await res.json()) as { id: string };
    chatId = chat.id;
    authenticateAs(null);
  });

  afterAll(async () => {
    if (chatId) {
      await prisma.chat.delete({
        where: { id: chatId },
      });
    }
  });

  describe("POST /api/message/:chatId", () => {
    test("should return 201 and create the message when parameters are valid", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const formData = new FormData();
      formData.append("content", "Hello world");
      const res = await app.request(`/api/message/${chatId}`, {
        method: "POST",
        body: formData,
      });
      authenticateAs(null);

      expect(res.status).toBe(201);
      const body = (await res.json()) as {
        message: { id: string; content: string };
      };
      messageId = body.message.id;
      expect(body.message.content).toBe("Hello world");
    });
  });

  describe("GET /api/message/:chatId", () => {
    test("should return 200 and return all messages in the chat room", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/message/${chatId}`);
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        messages: { id: string }[];
      };
      expect(body.messages).toBeArrayOfSize(1);
      expect(body.messages[0]!.id).toBe(messageId);
    });
  });

  describe("PATCH /api/message/:messageId", () => {
    test("should return 200 and update the message content", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const formData = new FormData();
      formData.append("content", "Hello updated");
      const res = await app.request(`/api/message/${messageId}`, {
        method: "PATCH",
        body: formData,
      });
      authenticateAs(null);

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        message: { content: string };
      };
      expect(body.message.content).toBe("Hello updated");
    });
  });

  describe("DELETE /api/message/:messageId", () => {
    test("should return 200 and delete the message", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const res = await app.request(`/api/message/${messageId}`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);

      const checkRes = await app.request(`/api/message/${chatId}`);
      authenticateAs(null);

      const body = (await checkRes.json()) as {
        messages: any[];
      };
      expect(body.messages).toBeArrayOfSize(0);
    });
  });

  describe("DELETE /api/message/:chatId/all", () => {
    test("should return 200 and delete all messages in the chat room", async () => {
      authenticateAs(testUsers[0]!.clerkId);
      const formData = new FormData();
      formData.append("content", "Temp message");
      await app.request(`/api/message/${chatId}`, {
        method: "POST",
        body: formData,
      });

      const res = await app.request(`/api/message/${chatId}/all`, {
        method: "DELETE",
      });

      expect(res.status).toBe(200);

      const checkRes = await app.request(`/api/message/${chatId}`);
      authenticateAs(null);

      const body = (await checkRes.json()) as {
        messages: any[];
      };
      expect(body.messages).toBeArrayOfSize(0);
    });
  });
});
