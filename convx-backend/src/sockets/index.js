const { verifySocketToken } = require("../middleware/auth");
const prisma = require("../lib/prisma");

// In-memory presence + playback state per room.
// Fine for a single-server MVP; move to Redis when you scale beyond one instance.
const roomPresence = new Map(); // roomId -> Set of { socketId, userId, username }
const roomPlayback = new Map(); // roomId -> { trackId, positionMs, isPlaying, updatedAt }

function addPresence(roomId, member) {
  if (!roomPresence.has(roomId)) roomPresence.set(roomId, new Map());
  roomPresence.get(roomId).set(member.socketId, member);
}

function removePresence(roomId, socketId) {
  const set = roomPresence.get(roomId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) roomPresence.delete(roomId);
}

function listPresence(roomId) {
  const set = roomPresence.get(roomId);
  if (!set) return [];
  return Array.from(set.values()).map(({ userId, username }) => ({ userId, username }));
}

function initSockets(io) {
  // Auth middleware for socket handshake
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) throw new Error("No token provided");
      const payload = verifySocketToken(token);
      socket.userId = payload.sub;
      socket.username = payload.username;
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    let currentRoomId = null;

    socket.on("room:join", async ({ roomId }) => {
      try {
        const membership = await prisma.roomMember.findUnique({
          where: { roomId_userId: { roomId, userId: socket.userId } },
        });
        if (!membership) {
          return socket.emit("error", { message: "Not a member of this room" });
        }

        currentRoomId = roomId;
        socket.join(roomId);
        addPresence(roomId, { socketId: socket.id, userId: socket.userId, username: socket.username });

        socket.to(roomId).emit("presence:update", { presence: listPresence(roomId) });
        socket.emit("presence:update", { presence: listPresence(roomId) });

        const playback = roomPlayback.get(roomId);
        if (playback) socket.emit("playback:state", playback);
      } catch (err) {
        socket.emit("error", { message: "Failed to join room" });
      }
    });

    socket.on("room:leave", ({ roomId }) => {
      socket.leave(roomId);
      removePresence(roomId, socket.id);
      socket.to(roomId).emit("presence:update", { presence: listPresence(roomId) });
      if (currentRoomId === roomId) currentRoomId = null;
    });

    socket.on("chat:message", async ({ roomId, content }) => {
      if (!content || !content.trim() || content.length > 1000) return;
      try {
        const message = await prisma.message.create({
          data: { roomId, userId: socket.userId, content: content.trim() },
          include: { user: { select: { id: true, username: true, avatarUrl: true } } },
        });
        io.to(roomId).emit("chat:message", message);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Playback sync: any member can propose state; server broadcasts as source of truth.
    // Simplest model — room owner/host controls; extend with role checks as needed.
    socket.on("playback:update", ({ roomId, trackId, positionMs, isPlaying }) => {
      const state = { trackId, positionMs, isPlaying, updatedAt: Date.now() };
      roomPlayback.set(roomId, state);
      socket.to(roomId).emit("playback:state", state);
    });

    socket.on("disconnect", () => {
      if (currentRoomId) {
        removePresence(currentRoomId, socket.id);
        socket.to(currentRoomId).emit("presence:update", { presence: listPresence(currentRoomId) });
      }
    });
  });
}

module.exports = { initSockets };
