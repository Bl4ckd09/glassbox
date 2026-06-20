import { NextResponse } from "next/server";
import { getAllSummaries } from "@/lib/deepbook";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const markets = await getAllSummaries();
    return NextResponse.json({ markets, source: "deepbook-indexer.mainnet" });
  } catch (e) {
    return NextResponse.json({ error: String(e), markets: [] }, { status: 502 });
  }
}
