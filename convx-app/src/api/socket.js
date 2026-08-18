import { io } from "socket.io-client";
import { API_BASE_URL } from "./client";

let socket = null;

export function connectSocket(token) {
  if (socket) socket.disconnect();
  socket = io(API_BASE_URL, {
    auth: { token },
    transports: ["websocket"],
  });
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
