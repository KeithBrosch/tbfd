import { NextResponse } from "next/server";
import { scrapeKeepTradeCutPlayer } from "@/lib/keepTradeCut";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug");
  if (!slug) {
    return NextResponse.json({ message: "Player slug is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await scrapeKeepTradeCutPlayer(slug));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Player scrape failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}