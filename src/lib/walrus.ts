import type { WalrusProof } from "./types";

// Public Walrus testnet HTTP endpoints. A "publisher" performs the on-chain
// write flow; an "aggregator" serves the blob back over plain HTTP so ANYONE can
// independently verify a call without trusting GlassBox.
const PUBLISHERS = [
  "https://publisher.walrus-testnet.walrus.space",
  "https://wal-publisher-testnet.staketab.org",
];
const AGGREGATORS = [
  "https://aggregator.walrus-testnet.walrus.space",
  "https://wal-aggregator-testnet.staketab.org",
];

export const PRIMARY_AGGREGATOR = AGGREGATORS[0];
export const WALRUS_NETWORK: "testnet" = "testnet";

export function aggregatorUrl(blobId: string): string {
  return `${PRIMARY_AGGREGATOR}/v1/blobs/${blobId}`;
}

interface StoreResponse {
  newlyCreated?: {
    blobObject: { id: string; blobId: string; registeredEpoch: number; certifiedEpoch: number | null };
  };
  alreadyCertified?: { blobId: string; endEpoch: number };
}

// Store an arbitrary JSON-serialisable object on Walrus. Returns a verifiable proof.
export async function storeJson(data: unknown, epochs = 5): Promise<WalrusProof> {
  const body = JSON.stringify(data);
  let lastErr: unknown;
  for (const pub of PUBLISHERS) {
    try {
      const res = await fetch(`${pub}/v1/blobs?epochs=${epochs}`, {
        method: "PUT",
        body,
        headers: { "Content-Type": "application/json" },
        // generous timeout via AbortSignal
        signal: AbortSignal.timeout(45000),
      });
      if (!res.ok) {
        lastErr = new Error(`publisher ${pub} -> ${res.status}`);
        continue;
      }
      const json = (await res.json()) as StoreResponse;
      if (json.newlyCreated) {
        const o = json.newlyCreated.blobObject;
        return {
          blobId: o.blobId,
          suiObjectId: o.id,
          storedEpoch: o.registeredEpoch,
          network: WALRUS_NETWORK,
          aggregatorUrl: aggregatorUrl(o.blobId),
          certified: o.certifiedEpoch != null,
        };
      }
      if (json.alreadyCertified) {
        return {
          blobId: json.alreadyCertified.blobId,
          storedEpoch: json.alreadyCertified.endEpoch,
          network: WALRUS_NETWORK,
          aggregatorUrl: aggregatorUrl(json.alreadyCertified.blobId),
          certified: true,
        };
      }
      lastErr = new Error("unexpected publisher response");
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Walrus store failed: ${String(lastErr)}`);
}

// Read a blob back from Walrus (proves independent verifiability).
export async function readJson<T = unknown>(blobId: string): Promise<T> {
  let lastErr: unknown;
  for (const agg of AGGREGATORS) {
    try {
      const res = await fetch(`${agg}/v1/blobs/${blobId}`, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) {
        lastErr = new Error(`aggregator ${agg} -> ${res.status}`);
        continue;
      }
      return (await res.json()) as T;
    } catch (e) {
      lastErr = e;
    }
  }
  throw new Error(`Walrus read failed: ${String(lastErr)}`);
}
