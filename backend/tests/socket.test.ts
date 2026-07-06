import { describe, expect, test } from "bun:test";
import { client, seededTestUsers, testServer } from "./setup";
import { authenticateAs, testUsers } from "./mocks";
import { prisma } from "../src/lib/prisma";

const getsocketUrl = (token: string) =>
  `ws://localhost:${testServer.port}/ws?clerkToken=${token}`;

const getNextMessage = (ws: WebSocket): Promise<any> =>
  new Promise((resolve, reject) => {
    ws.onmessage = (event) => {
      try {
        resolve(JSON.parse(event.data.toString()));
      } catch (err) {
        reject(err);
      }
    };
    ws.onerror = (err) => reject(err);
  });

describe("Socket Module", () => {
  describe("GET /ws", () => {
    test("should establish websocket connection and ping/pong successfully", (done) => {
      const ws = new WebSocket(getsocketUrl("mock-token"));

      ws.onopen = () => {
        ws.send("ping");
      };

      ws.onmessage = (event) => {
        expect(event.data).toBe("pong");
        ws.close();
        done();
      };

      ws.onerror = (err) => {
        done(err);
      };
    });

    test("should receive message broadcast in realtime when message is posted via REST", async (done) => {
      let chatId: string | null = null;
      let ws: WebSocket | null = null;

      const cleanup = async (err?: any) => {
        ws?.close();
        if (chatId) {
          try {
            await prisma.chat.delete({
              where: { id: chatId },
            });
          } catch (dbErr) {
            console.error("Cleanup database delete failed:", dbErr);
          }
        }
        authenticateAs(null);
        done(err);
      };

      try {
        authenticateAs(testUsers[0]!.clerkId);
        const chatRes = await client.api.chat.$post({
          json: {
            name: "CIA",
            participants: seededTestUsers.map((u) => u.id),
          },
        });
        chatId = (await chatRes.json()).id;

        ws = new WebSocket(getsocketUrl(testUsers[1]!.clerkId));
        await new Promise((resolve) => {
          ws!.onopen = () => resolve(null);
        });

        // register the listner
        const sendPromise = getNextMessage(ws);
        // send message
        await client.api.message[":chatId"].$post({
          param: { chatId: chatId! },
          form: { content: "How is Epstein doing?" },
        });
        // resolve
        const payload1 = await sendPromise;
        // check
        expect(payload1.type).toBe("NEW_MESSAGE");
        expect(payload1.message.content).toBe("How is Epstein doing?");
        const messageId = payload1.message.id;

        const editPromise = getNextMessage(ws);
        await client.api.message[":messageId"].$patch({
          param: { messageId },
          form: { content: "How is Epstein doing? Updated" },
        });
        const payload2 = await editPromise;

        expect(payload2.type).toBe("EDIT_MESSAGE");
        expect(payload2.message.content).toBe("How is Epstein doing? Updated");
        expect(payload2.message.id).toBe(messageId);

        const deletePromise = getNextMessage(ws);
        await client.api.message[":messageId"].$delete({
          param: { messageId },
        });
        const payload3 = await deletePromise;

        expect(payload3.type).toBe("DELETE_MESSAGE");
        expect(payload3.messageId).toBe(messageId);
        expect(payload3.chatId).toBe(chatId);

        cleanup();
      } catch (err) {
        await cleanup(err);
      }
    });
  });
});
