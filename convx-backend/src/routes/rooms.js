const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const createRoomSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(300).optional(),
  isPrivate: z.boolean().optional(),
});

// List public rooms
router.get("/", async (req, res) => {
  const rooms = await prisma.room.findMany({
    where: { isPrivate: false },
    include: { _count: { select: { members: true } }, owner: { select: { username: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  res.json(rooms);
});

// Create a room (creator auto-joins as owner)
router.post("/", requireAuth, async (req, res) => {
  const parsed = createRoomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const room = await prisma.room.create({
    data: {
      ...parsed.data,
      ownerId: req.user.id,
      members: {
        create: { userId: req.user.id, role: "owner" },
      },
    },
    include: { members: true },
  });
  res.status(201).json(room);
});

// Get a single room (with members + recent messages)
router.get("/:id", async (req, res) => {
  const room = await prisma.room.findUnique({
    where: { id: req.params.id },
    include: {
      members: { include: { user: { select: { id: true, username: true, avatarUrl: true } } } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 50,
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
    },
  });
  if (!room) return res.status(404).json({ error: "Room not found" });
  res.json(room);
});

// Join a room
router.post("/:id/join", requireAuth, async (req, res) => {
  const room = await prisma.room.findUnique({ where: { id: req.params.id } });
  if (!room) return res.status(404).json({ error: "Room not found" });

  const membership = await prisma.roomMember.upsert({
    where: { roomId_userId: { roomId: room.id, userId: req.user.id } },
    update: {},
    create: { roomId: room.id, userId: req.user.id },
  });
  res.status(200).json(membership);
});

// Leave a room
router.post("/:id/leave", requireAuth, async (req, res) => {
  await prisma.roomMember.deleteMany({
    where: { roomId: req.params.id, userId: req.user.id },
  });
  res.status(204).send();
});

module.exports = router;
