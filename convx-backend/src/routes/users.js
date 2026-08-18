const express = require("express");
const { z } = require("zod");
const prisma = require("../lib/prisma");
const { requireAuth } = require("../middleware/auth");

const router = express.Router();

router.get("/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

const updateSchema = z.object({
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().optional(),
  genres: z.array(z.string()).max(10).optional(),
});

router.patch("/me", requireAuth, async (req, res) => {
  const parsed = updateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: parsed.data,
  });
  const { passwordHash, ...safe } = user;
  res.json(safe);
});

router.get("/:username", async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } });
  if (!user) return res.status(404).json({ error: "User not found" });
  const { passwordHash, email, ...publicProfile } = user;
  res.json(publicProfile);
});

module.exports = router;
