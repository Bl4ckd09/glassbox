/**
 * Proves the cryptographic-authorship flow: derive a strategist's Sui identity,
 * sign a call, verify it, then show that any tampering breaks the signature.
 *   npx tsx scripts/sign-demo.ts
 */
import { addressForStrategist, signCall, verifyCallSignature } from "../src/lib/sign";

async function main() {
  const fields = {
    strategistId: "aletheia",
    pool: "SUI_USDC",
    side: "BUY",
    entryPrice: 0.7123,
    confidence: 0.42,
    createdAt: 1_750_000_000_000,
  };

  console.log("strategist identity:", addressForStrategist("aletheia"));
  const sig = await signCall("aletheia", fields);
  console.log("signed by:", sig.signerAddress);
  console.log("scheme:", sig.scheme);

  const ok = await verifyCallSignature(sig, fields);
  console.log("verify (untampered):", ok, ok ? "✅" : "❌");

  // tamper: flip the side BUY -> SELL and re-verify with the original signature
  const tampered = { ...fields, side: "SELL" };
  const bad = await verifyCallSignature(sig, tampered);
  console.log("verify (tampered side):", bad, bad ? "❌ (should be false!)" : "✅ correctly rejected");

  // impersonation: someone else's signature can't claim aletheia's address
  const mia = await signCall("momentum-mia", fields);
  console.log("mia address differs:", mia.signerAddress !== sig.signerAddress ? "✅" : "❌");

  if (ok && !bad) console.log("\nAUTHORSHIP PROOF WORKS ✅\n");
  else process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
