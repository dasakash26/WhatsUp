import { describe, expect, test } from "bun:test";
import { testServer } from "./setup";

const socketUrl = `ws://localhost:${testServer.port}/ws?clerkToken=mock-token`;

describe("Socket Integration", () => {
  test("creates websocket connection to the server", (done) => {
    const ws = new WebSocket(socketUrl);

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
});
