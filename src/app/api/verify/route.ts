import { NextRequest, NextResponse } from "next/server";
import { readJson, aggregatorUrl } from "@/lib/walrus";
import { verifyCallSignature } from "@/lib/sign";
import type { TradingCall } from "@/lib/types";

export const dynamic = "force-dynamic";

// Independent verification: pull the blob straight from a public Walrus
// aggregator (anyone can do this without GlassBox), then — if it's a call —
// cryptographically verify the strategist's signature over the canonical payload.
export async function GET(req: NextRequest) {
  const blobId = req.nextUrl.searchParams.get("blobId");
  if (!blobId) return NextResponse.json({ error: "blobId required" }, { status: 400 });
  try {
    const data = (await readJson(blobId)) as { kind?: string; call?: TradingCall };
    let signatureValid: boolean | null = null;
    let signerAddress: string | null = null;
    const call = data?.call;
    if (call?.signature) {
      signerAddress = call.signature.signerAddress;
      signatureValid = await verifyCallSignature(call.signature, {
        strategistId: call.strategistId,
        pool: call.pool,
        side: call.side,
        entryPrice: call.entryPrice,
        confidence: call.confidence,
        createdAt: call.createdAt,
      });
    }
    return NextResponse.json({
      blobId,
      aggregatorUrl: aggregatorUrl(blobId),
      verified: true,
      signatureValid,
      signerAddress,
      data,
    });
  } catch (e) {
    return NextResponse.json({ blobId, verified: false, error: String(e) }, { status: 502 });
  }
}
