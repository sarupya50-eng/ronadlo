const express = require("express");

const router = express.Router();

const JAMENDO_CLIENT_ID = process.env.JAMENDO_CLIENT_ID;
const JAMENDO_BASE = "https://api.jamendo.com/v3.0";

router.get("/search", async (req, res) => {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: "Missing query parameter 'q'" });
  }

  try {
    const url = `${JAMENDO_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=25&search=${encodeURIComponent(query)}&include=musicinfo&audioformat=mp32`;
    const response = await fetch(url);
    const data = await response.json();

    const tracks = (data.results || []).map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      albumArt: t.image,
      durationSec: t.duration,
      streamUrl: t.audio,
    }));

    res.json(tracks);
  } catch (err) {
    console.error("Jamendo search error:", err);
    res.status(502).json({ error: "Failed to reach Jamendo" });
  }
});

router.get("/trending", async (req, res) => {
  try {
    const url = `${JAMENDO_BASE}/tracks/?client_id=${JAMENDO_CLIENT_ID}&format=json&limit=25&order=popularity_total&audioformat=mp32`;
    const response = await fetch(url);
    const data = await response.json();

    const tracks = (data.results || []).map((t) => ({
      id: t.id,
      title: t.name,
      artist: t.artist_name,
      albumArt: t.image,
      durationSec: t.duration,
      streamUrl: t.audio,
    }));

    res.json(tracks);
  } catch (err) {
    console.error("Jamendo trending error:", err);
    res.status(502).json({ error: "Failed to reach Jamendo" });
  }
});

module.exports = router;
