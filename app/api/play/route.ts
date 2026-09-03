import { NextRequest } from "next/server";

const BACKEND = "http://127.0.0.1:8000";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return new Response("Missing song ID", { status: 400 });
  }

  try {
    const response = await fetch(
      `${BACKEND}/play?id=${encodeURIComponent(id)}`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      const text = await response.text();

      console.error(
        "Music backend error:",
        response.status,
        text
      );

      return new Response("Could not get audio", {
        status: response.status,
      });
    }

    const data = await response.json();

    if (!data.url) {
      console.error("Backend returned no audio URL:", data);

      return new Response("No audio URL returned", {
        status: 502,
      });
    }

    return Response.json({
      url: data.url,
    });
  } catch (error) {
    console.error("Playback API error:", error);

    return new Response(
      "Could not connect to music backend",
      { status: 502 }
    );
  }
}
