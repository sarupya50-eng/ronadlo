import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim() || "";
  const clientId = process.env.JAMENDO_CLIENT_ID;
  if (!clientId) return NextResponse.json({ error: "JAMENDO_CLIENT_ID is not configured" }, { status: 500 });

  const params = new URLSearchParams({
    client_id: clientId,
    format: "json",
    limit: "30",
    audioformat: "mp32",
    imagesize: "300",
    type: "single albumtrack",
    order: "relevance"
  });
  if (q) params.set("search", q);

  const response = await fetch(`https://api.jamendo.com/v3.0/tracks/?${params}`, { next: { revalidate: 30 } });
  if (!response.ok) return NextResponse.json({ error: "Jamendo API request failed" }, { status: 502 });
  const data = await response.json();
  return NextResponse.json(data);
}