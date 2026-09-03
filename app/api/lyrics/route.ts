import { NextRequest, NextResponse } from "next/server";

type LyricsResult = {
  id: number;
  trackName: string;
  artistName: string;
  albumName: string | null;
  duration: number;
  instrumental: boolean;
  plainLyrics: string | null;
  syncedLyrics: string | null;
};

function cleanTitle(title: string) {
  return title
    .replace(/\(official.*?\)/gi, "")
    .replace(/\[official.*?\]/gi, "")
    .replace(/\(lyrics?\)/gi, "")
    .replace(/\[lyrics?\]/gi, "")
    .replace(/\(audio\)/gi, "")
    .replace(/\[audio\]/gi, "")
    .replace(/\(slowed.*?\)/gi, "")
    .replace(/\[slowed.*?\]/gi, "")
    .replace(/\(reverb.*?\)/gi, "")
    .replace(/\[reverb.*?\]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function searchLRCLIB(query: string) {
  const url =
    `https://lrclib.net/api/search?q=${encodeURIComponent(query)}`;

  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Auralis Music/1.0 (https://github.com/auralis-music)",
    },
    cache: "no-store",
  });

  if (!response.ok) return [];

  return (await response.json()) as LyricsResult[];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const track = params.get("track")?.trim();
  const artist = params.get("artist")?.trim();
  const durationParam = params.get("duration");
  const targetDuration = durationParam ? Number(durationParam) : null;

  if (!track) {
    return NextResponse.json(
      { error: "Missing track" },
      { status: 400 }
    );
  }

  try {
    const clean = cleanTitle(track);

    const queries = [
      `${clean} ${artist || ""}`.trim(),
      clean,
      track,
    ];

    let matches: LyricsResult[] = [];

    for (const query of queries) {
      matches = await searchLRCLIB(query);

      if (matches.length > 0) {
        break;
      }
    }

    if (!matches.length) {
      return NextResponse.json({
        lyrics: [],
        syncedLyrics: null,
        found: false,
      });
    }

    // Prefer results containing lyrics.
    const withLyrics = matches.filter(
      (item) => item.plainLyrics || item.syncedLyrics
    );

    if (!withLyrics.length) {
      return NextResponse.json({
        lyrics: [],
        syncedLyrics: null,
        found: false,
      });
    }

    const normalizedTrack = clean.toLowerCase();
    const normalizedArtist = (artist || "").toLowerCase();

    // Prefer candidates whose duration is close to the real song's
    // duration — this is the strongest signal to avoid picking a
    // wrong-language cover, remix, or unrelated track with a similar title.
    const durationMatches = targetDuration
      ? withLyrics.filter(
          (item) =>
            typeof item.duration === "number" &&
            Math.abs(item.duration - targetDuration) <= 4
        )
      : [];

    const pool = durationMatches.length > 0 ? durationMatches : withLyrics;

    const best =
      pool.find((item) => {
        const itemTrack = item.trackName.toLowerCase();
        const itemArtist = item.artistName.toLowerCase();

        return (
          itemTrack.includes(normalizedTrack) &&
          (!normalizedArtist ||
            itemArtist.includes(normalizedArtist))
        );
      }) ||
      pool.find((item) =>
        item.trackName.toLowerCase().includes(normalizedTrack)
      ) ||
      pool[0];

    if (!best) {
      return NextResponse.json({
        lyrics: [],
        syncedLyrics: null,
        found: false,
      });
    }

    return NextResponse.json({
      found: true,
      title: best.trackName,
      artist: best.artistName,
      album: best.albumName,
      duration: best.duration,

      lyrics: best.plainLyrics
        ? best.plainLyrics
            .split(/\r?\n/)
            .map((line) => line.trim())
            .filter(Boolean)
        : [],

      syncedLyrics: best.syncedLyrics || null,
    });
  } catch (error) {
    console.error("Lyrics API error:", error);

    return NextResponse.json(
      {
        lyrics: [],
        syncedLyrics: null,
        found: false,
        error: "Failed to fetch lyrics",
      },
      { status: 500 }
    );
  }
}
