import { NextRequest, NextResponse } from "next/server";
import { generateCall } from "@/lib/engine";
import { addLiveCall } from "@/lib/store";
import { SUPPORTED_POOLS } from "@/lib/deepbook";
import { aiConfigured } from "@/lib/narrate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Generate a fresh, explainable call from LIVE DeepBook data and anchor it to Walrus.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const pool = String(body.pool || "SUI_USDC");
    const strategistId = String(body.strategistId || "aletheia");
    if (!SUPPORTED_POOLS.some((p) => p.pool === pool)) {
      return NextResponse.json({ error: `unsupported pool ${pool}` }, { status: 400 });
    }
    const call = await generateCall(strategistId, pool, { anchor: true });
    addLiveCall(call);
    return NextResponse.json({ call, aiNarration: aiConfigured() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
