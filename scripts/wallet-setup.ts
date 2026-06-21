/**
 * Provisions a Sui testnet wallet for server-side use (Walrus SDK writes,
 * attestation objects, DeepBook BalanceManager). Generates a keypair, requests
 * faucet SUI, verifies the on-chain balance, and writes the key to .env.
 *   npx tsx scripts/wallet-setup.ts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";
import { getFaucetHost, requestSuiFromFaucetV2 } from "@mysten/sui/faucet";

const NETWORK = "testnet";
const RPC_URL = "https://fullnode.testnet.sui.io:443";

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const j = await res.json();
  if (j.error) throw new Error(JSON.stringify(j.error));
  return j.result;
}

async function getBalance(address: string): Promise<number> {
  const b = await rpc("suix_getBalance", [address, "0x2::sui::SUI"]);
  return Number(b.totalBalance) / 1e9;
}

async function main() {
  // Reuse an existing key from .env if present, else generate a new one.
  let keypair: Ed25519Keypair;
  let secret: string;
  const envPath = ".env";
  const existing =
    existsSync(envPath) && readFileSync(envPath, "utf8").match(/^SUI_SIGNER_KEY=(suiprivkey[\w]+)/m);
  if (existing) {
    secret = existing[1];
    keypair = Ed25519Keypair.fromSecretKey(secret);
    console.log("reusing existing key from .env");
  } else {
    keypair = Ed25519Keypair.generate();
    secret = keypair.getSecretKey(); // bech32 suiprivkey...
    console.log("generated new keypair");
  }

  const address = keypair.getPublicKey().toSuiAddress();
  console.log("address:", address);

  
  let bal = await getBalance(address);
  console.log(`starting balance: ${bal} SUI`);

  if (bal < 0.5) {
    console.log("requesting faucet SUI…");
    try {
      await requestSuiFromFaucetV2({ host: getFaucetHost(NETWORK), recipient: address });
      console.log("faucet request submitted; waiting for funds…");
    } catch (e) {
      console.warn("SDK faucet failed:", String(e));
      console.warn(`-> fall back to the web faucet: https://faucet.sui.io  (paste ${address}, pick Testnet)`);
    }
    // poll up to ~40s for the coin to arrive
    for (let i = 0; i < 20; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      bal = await getBalance(address);
      if (bal > 0) break;
    }
    console.log(`balance after faucet: ${bal} SUI`);
  }

  // persist to .env (gitignored)
  const line = `SUI_SIGNER_KEY=${secret}`;
  let env = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  if (/^SUI_SIGNER_KEY=/m.test(env)) env = env.replace(/^SUI_SIGNER_KEY=.*$/m, line);
  else env += (env && !env.endsWith("\n") ? "\n" : "") + line + "\n";
  if (!/^SUI_SIGNER_ADDRESS=/m.test(env)) env += `SUI_SIGNER_ADDRESS=${address}\n`;
  else env = env.replace(/^SUI_SIGNER_ADDRESS=.*$/m, `SUI_SIGNER_ADDRESS=${address}`);
  writeFileSync(envPath, env);
  console.log(`wrote SUI_SIGNER_KEY + SUI_SIGNER_ADDRESS to ${envPath} (gitignored)`);

  console.log(bal > 0 ? "\n✅ wallet funded with SUI" : "\n⚠️ no SUI yet — use the web faucet, then re-run");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
