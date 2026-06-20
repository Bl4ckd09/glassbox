import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { verifyPersonalMessageSignature } from "@mysten/sui/verify";
import type { CallSignature } from "./types";

// Cryptographic authorship for calls. Each strategist has a Sui keypair and
// signs the canonical call payload. This proves WHO made the call, not just that
// the content exists — so a call can't be forged in someone else's name, and the
// signed bytes are what gets anchored to Walrus.
//
// NOTE: demo keys are derived deterministically from a strategist id + a local
// secret. In production a provider signs with their own wallet (the server never
// holds their key).

const DEMO_SECRET = process.env.GLASSBOX_SIGNING_SECRET || "glassbox-demo-signing-secret-v1";

function seedFor(strategistId: string): string {
  // Deterministic 32-byte (64 hex) seed from id + secret (demo only). Simple
  // multi-lane FNV-1a so we don't need BigInt; fully reproducible.
  const s = `${DEMO_SECRET}:${strategistId}`;
  let hex = "";
  for (let lane = 0; lane < 8; lane++) {
    let h = 0x811c9dc5 ^ (lane * 0x01000193);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i) + lane;
      h = Math.imul(h, 0x01000193) >>> 0;
    }
    hex += h.toString(16).padStart(8, "0");
  }
  return hex.slice(0, 64);
}

const keypairCache = new Map<string, Ed25519Keypair>();

export function keypairForStrategist(strategistId: string): Ed25519Keypair {
  let kp = keypairCache.get(strategistId);
  if (!kp) {
    kp = Ed25519Keypair.deriveKeypairFromSeed(seedFor(strategistId));
    keypairCache.set(strategistId, kp);
  }
  return kp;
}

export function addressForStrategist(strategistId: string): string {
  return keypairForStrategist(strategistId).getPublicKey().toSuiAddress();
}

// Canonical, stable serialization of the signed fields (order-independent of JSON).
export function canonicalPayload(fields: {
  strategistId: string;
  pool: string;
  side: string;
  entryPrice: number;
  confidence: number;
  createdAt: number;
}): Uint8Array {
  const canonical = [
    fields.strategistId,
    fields.pool,
    fields.side,
    fields.entryPrice,
    fields.confidence,
    fields.createdAt,
  ].join("|");
  return new TextEncoder().encode(canonical);
}

export async function signCall(
  strategistId: string,
  fields: Parameters<typeof canonicalPayload>[0]
): Promise<CallSignature> {
  const kp = keypairForStrategist(strategistId);
  const msg = canonicalPayload(fields);
  const { signature } = await kp.signPersonalMessage(msg);
  return { signerAddress: kp.getPublicKey().toSuiAddress(), signature, scheme: "ed25519-personalmessage" };
}

// Verify a signature: confirms the bytes were signed by the claimed address.
export async function verifyCallSignature(
  sig: CallSignature,
  fields: Parameters<typeof canonicalPayload>[0]
): Promise<boolean> {
  try {
    const msg = canonicalPayload(fields);
    const pub = await verifyPersonalMessageSignature(msg, sig.signature);
    return pub.toSuiAddress() === sig.signerAddress;
  } catch {
    return false;
  }
}
