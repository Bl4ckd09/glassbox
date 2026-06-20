import type { MarketSnapshot } from "./types";

// DeepBook v3 on-chain CLOB, read via Mysten's public indexer (mainnet).
// All market data here is real, on-chain DeepBook data.
const INDEXER = "https://deepbook-indexer.mainnet.mystenlabs.com";

// Curated, liquid pools we surface to users.
export const SUPPORTED_POOLS = [
  { pool: "SUI_USDC", base: "SUI", quote: "USDC" },
  { pool: "DEEP_USDC", base: "DEEP", quote: "USDC" },
  { pool: "WAL_USDC", base: "WAL", quote: "USDC" },
  { pool: "XBTC_USDC", base: "XBTC", quote: "USDC" },
] as const;

interface SummaryRow {
  trading_pairs: string;
  last_price: number;
  highest_bid: number;
  lowest_ask: number;
  price_change_percent_24h: number;
  highest_price_24h: number;
  lowest_price_24h: number;
  base_volume: number;
  quote_volume: number;
  base_currency: string;
  quote_currency: string;
}

interface TradeRow {
  price: number;
  timestamp: number;
  base_volume: number;
  type: string;
}

async function getJson<T>(path: string, timeoutMs = 15000): Promise<T> {
  const res = await fetch(`${INDEXER}${path}`, { signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  if (!res.ok) throw new Error(`DeepBook ${path} -> ${res.status}`);
  return (await res.json()) as T;
}

export async function getSnapshot(pool: string): Promise<MarketSnapshot> {
  const [summary, orderbook] = await Promise.all([
    getJson<SummaryRow[]>("/summary"),
    getJson<{ bids: [string, string][]; asks: [string, string][] }>(`/orderbook/${pool}?level=1`).catch(
      () => ({ bids: [], asks: [] })
    ),
  ]);
  const row = summary.find((r) => r.trading_pairs === pool);
  if (!row) throw new Error(`pool ${pool} not found in DeepBook summary`);

  const bid = orderbook.bids?.[0] ? Number(orderbook.bids[0][0]) : row.highest_bid;
  const ask = orderbook.asks?.[0] ? Number(orderbook.asks[0][0]) : row.lowest_ask;
  const mid = bid && ask ? (bid + ask) / 2 : row.last_price;
  const spreadBps = bid && ask && mid ? ((ask - bid) / mid) * 10000 : 0;

  return {
    pool,
    baseSymbol: row.base_currency,
    quoteSymbol: row.quote_currency,
    lastPrice: row.last_price,
    highestBid: bid,
    lowestAsk: ask,
    priceChangePct24h: row.price_change_percent_24h,
    high24h: row.highest_price_24h,
    low24h: row.lowest_price_24h,
    baseVolume24h: row.base_volume,
    quoteVolume24h: row.quote_volume,
    spreadBps: Number(spreadBps.toFixed(2)),
    takenAt: Date.now(),
    source: "deepbook-indexer.mainnet",
  };
}

// Real close-price series built from recent on-chain DeepBook trades (oldest->newest).
export async function getCloseSeries(pool: string, limit = 200): Promise<number[]> {
  const trades = await getJson<TradeRow[]>(`/trades/${pool}?limit=${limit}`).catch(() => []);
  if (!trades.length) return [];
  const sorted = [...trades].sort((a, b) => a.timestamp - b.timestamp);
  return sorted.map((t) => t.price).filter((p) => p > 0);
}

export async function getAllSummaries(): Promise<MarketSnapshot[]> {
  const summary = await getJson<SummaryRow[]>("/summary");
  const wanted = new Set<string>(SUPPORTED_POOLS.map((p) => p.pool));
  return summary
    .filter((r) => wanted.has(r.trading_pairs))
    .map((row) => {
      const mid = row.highest_bid && row.lowest_ask ? (row.highest_bid + row.lowest_ask) / 2 : row.last_price;
      const spreadBps =
        row.highest_bid && row.lowest_ask && mid ? ((row.lowest_ask - row.highest_bid) / mid) * 10000 : 0;
      return {
        pool: row.trading_pairs,
        baseSymbol: row.base_currency,
        quoteSymbol: row.quote_currency,
        lastPrice: row.last_price,
        highestBid: row.highest_bid,
        lowestAsk: row.lowest_ask,
        priceChangePct24h: row.price_change_percent_24h,
        high24h: row.highest_price_24h,
        low24h: row.lowest_price_24h,
        baseVolume24h: row.base_volume,
        quoteVolume24h: row.quote_volume,
        spreadBps: Number(spreadBps.toFixed(2)),
        takenAt: Date.now(),
        source: "deepbook-indexer.mainnet",
      } satisfies MarketSnapshot;
    });
}
