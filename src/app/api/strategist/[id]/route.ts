import { NextRequest, NextResponse } from "next/server";
import { callsFor, getStrategist, resultFor, trackRecordFor } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const strategist = getStrategist(id);
  if (!strategist) return NextResponse.json({ error: "not found" }, { status: 404 });
  const calls = callsFor(id).map((c) => ({ call: c, result: resultFor(c.id) ?? null }));
  return NextResponse.json({ strategist, record: trackRecordFor(id), calls });
}
