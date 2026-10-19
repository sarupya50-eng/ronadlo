import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q");

  if (!q) {
    return NextResponse.json(
      { error: "Missing search query" },
      { status: 400 }
    );
  }

  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY is not configured" },
      { status: 500 }
    );
  }

  try {
    // Search for videos
    const searchUrl = new URL(
      "https://www.googleapis.com/youtube/v3/search"
    );

    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", q);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("videoCategoryId", "10");
    searchUrl.searchParams.set("maxResults", "10");
    searchUrl.searchParams.set("key", apiKey);

    const searchResponse = await fetch(searchUrl.toString(), {
      cache: "no-store",
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok) {
      console.error("YouTube search error:", searchData);

      return NextResponse.json(
        {
          error:
            searchData?.error?.message ||
            "YouTube search failed",
        },
        { status: searchResponse.status }
      );
    }

    const items = searchData.items || [];

    if (!items.length) {
      return NextResponse.json({ results: [] });
    }

    // Get actual video durations
    const videoIds = items
      .map((item: any) => item.id?.videoId)
      .filter(Boolean)
      .join(",");

    const videosUrl = new URL(
      "https://www.googleapis.com/youtube/v3/videos"
    );

    videosUrl.searchParams.set("part", "contentDetails");
    videosUrl.searchParams.set("id", videoIds);
    videosUrl.searchParams.set("key", apiKey);

    const videosResponse = await fetch(videosUrl.toString(), {
      cache: "no-store",
    });

    const videosData = await videosResponse.json();

    if (!videosResponse.ok) {
      console.error("YouTube videos error:", videosData);
    }

    const durationMap = new Map<string, string>();
    const secondsMap = new Map<string, number>();

    function isoToSeconds(iso: string): number {
      const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (!match) return 0;
      const hours = Number(match[1] || 0);
      const minutes = Number(match[2] || 0);
      const seconds = Number(match[3] || 0);
      return hours * 3600 + minutes * 60 + seconds;
    }

    for (const video of videosData.items || []) {
      const duration = video.contentDetails?.duration;

      if (duration) {
        durationMap.set(video.id, formatDuration(duration));
        secondsMap.set(video.id, isoToSeconds(duration));
      }
    }

    // Filter out YouTube Shorts (typically 60 seconds or less)
    const SHORTS_THRESHOLD = 61;

    const results = items
      .map((item: any) => {
        const id = item.id.videoId;

        return {
          id,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          album: null,
          thumbnail:
            item.snippet.thumbnails?.high?.url ||
            item.snippet.thumbnails?.medium?.url ||
            item.snippet.thumbnails?.default?.url ||
            null,
          duration: durationMap.get(id) || null,
          _seconds: secondsMap.get(id) ?? null,
        };
      })
      .filter((item: any) => {
        // Keep items with unknown duration (fail-open) or duration above threshold
        return item._seconds === null || item._seconds >= SHORTS_THRESHOLD;
      })
      .map(({ _seconds, ...rest }: any) => rest);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);

    return NextResponse.json(
      { error: "Failed to search YouTube" },
      { status: 500 }
    );
  }
}

function formatDuration(iso: string): string {
  const match = iso.match(
    /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  );

  if (!match) return "--:--";

  const hours = Number(match[1] || 0);
  const minutes = Number(match[2] || 0);
  const seconds = Number(match[3] || 0);

  const totalSeconds =
    hours * 3600 +
    minutes * 60 +
    seconds;

  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${String(mins % 60).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;
  }

  return `${mins}:${String(secs).padStart(2, "0")}`;
}
