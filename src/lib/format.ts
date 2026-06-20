export function pct(n: number, digits = 2): string {
  return `${n >= 0 ? "+" : ""}${n.toFixed(digits)}%`;
}

export function price(n: number): string {
  if (n >= 1000) return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
  if (n >= 1) return n.toFixed(4);
  return n.toPrecision(4);
}

export function shortId(id: string, head = 8, tail = 6): string {
  if (id.length <= head + tail + 1) return id;
  return `${id.slice(0, head)}…${id.slice(-tail)}`;
}

export function timeAgo(ms: number): string {
  const d = Date.now() - ms;
  const m = Math.round(d / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

export function sideColor(side: string): string {
  if (side === "BUY") return "text-emerald-400";
  if (side === "SELL") return "text-rose-400";
  return "text-zinc-400";
}

export function outcomeColor(o: string): string {
  if (o === "WIN") return "text-emerald-400";
  if (o === "LOSS") return "text-rose-400";
  return "text-zinc-400";
}
