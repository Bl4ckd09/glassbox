import { NextRequest, NextResponse } from "next/server";
import { readJson, aggregatorUrl } from "@/lib/walrus";

export const dynamic = "force-dynamic";

// Independent verification: pull the blob straight from a public Walrus
// aggregator. This is the same thing any third party could do without GlassBox.
export async function GET(req: NextRequest) {
  const blobId = req.nextUrl.searchParams.get("blobId");
  if (!blobId) return NextResponse.json({ error: "blobId required" }, { status: 400 });
  try {
    const data = await readJson(blobId);
    return NextResponse.json({
      blobId,
      aggregatorUrl: aggregatorUrl(blobId),
      verified: true,
      data,
    });
  } catch (e) {
    return NextResponse.json({ blobId, verified: false, error: String(e) }, { status: 502 });
  }
}
