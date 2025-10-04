import WebSocket from "ws";
import { ConnectionAck } from "./websocket.types";
export class User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  imageUrl?: string;
  socket?: WebSocket;
  constructor(
    id: string,
    firstName: string,
    lastName: string,
    username: string,
    imageUrl?: string
  ) {
    this.id = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.username = username;
    this.imageUrl = imageUrl;
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }

  setSocket(socket: WebSocket) {
    this.socket = socket;
  }

  clearSocket() {
    this.socket = undefined;
  }

  isOnline() {
    return (
      this.socket !== undefined && this.socket.readyState === WebSocket.OPEN
    );
  }

  send(data: any) {
    if (this.isOnline() && this.socket) {
      this.socket.send(JSON.stringify(data));
    }
  }

  ackConnection() {
    if (this.isOnline() && this.socket) {
      const ackPayload: ConnectionAck = {
        type: "CONNECTION_ESTABLISHED",
        userId: this.id,
        timestamp: new Date(),
      };
      this.socket.send(JSON.stringify(ackPayload));
    }
  }

  toJSON() {
    return {
      id: this.id,
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      imageUrl: this.imageUrl,
      isOnline: this.isOnline(),
    };
  }
}
