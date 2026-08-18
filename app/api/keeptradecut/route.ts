import { NextResponse } from "next/server";
import { scrapeAndMapKeepTradeCut } from "@/lib/keepTradeCut";
import { ComprehensiveLeagueData } from "@/lib/sleeper";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const data = (await request.json()) as ComprehensiveLeagueData;
    if (!data?.players || !data?.rosters) {
      return NextResponse.json(
        { message: "League data is required" },
        { status: 400 }
      );
    }

    const result = await scrapeAndMapKeepTradeCut(data);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "KTC scrape failed";
    return NextResponse.json({ message }, { status: 502 });
  }
}
