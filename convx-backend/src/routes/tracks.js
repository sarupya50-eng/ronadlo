const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads", "tracks");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/flac",
  "audio/x-flac",
]);
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || "";
    const safeName = `${crypto.randomUUID()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_BYTES },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error("Unsupported file type. Allowed: mp3, m4a, wav, ogg, flac"));
    }
    cb(null, true);
  },
});

router.post("/", requireAuth, (req, res) => {
  upload.single("file")(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded (expected field name 'file')" });
    }

    const title = (req.body.title || req.file.originalname || "Untitled").slice(0, 120);
    const artist = req.body.artist ? String(req.body.artist).slice(0, 120) : null;

    try {
      const track = await prisma.track.create({
        data: {
          title,
          artist,
          uploaderId: req.user.id,
          fileUrl: `/uploads/tracks/${req.file.filename}`,
        },
      });
      res.status(201).json(track);
    } catch (e) {
      fs.unlink(req.file.path, () => {});
      res.status(500).json({ error: "Failed to save track metadata" });
    }
  });
});

router.get("/", async (req, res) => {
  const tracks = await prisma.track.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { uploader: { select: { id: true, username: true } } },
  });
  res.json(tracks);
});

router.post("/:trackId/queue/:roomId", requireAuth, async (req, res) => {
  const { trackId, roomId } = req.params;

  const membership = await prisma.roomMember.findUnique({
    where: { roomId_userId: { roomId, userId: req.user.id } },
  });
  if (!membership) return res.status(403).json({ error: "Not a member of this room" });

  const track = await prisma.track.findUnique({ where: { id: trackId } });
  if (!track) return res.status(404).json({ error: "Track not found" });

  const lastItem = await prisma.queueItem.findFirst({
    where: { roomId },
    orderBy: { position: "desc" },
  });
  const nextPosition = lastItem ? lastItem.position + 1 : 0;

  const queueItem = await prisma.queueItem.create({
    data: { roomId, trackId, position: nextPosition },
    include: { track: true },
  });
  res.status(201).json(queueItem);
});

router.get("/queue/:roomId", async (req, res) => {
  const items = await prisma.queueItem.findMany({
    where: { roomId: req.params.roomId },
    orderBy: { position: "asc" },
    include: { track: { include: { uploader: { select: { username: true } } } } },
  });
  res.json(items);
});

module.exports = router;
