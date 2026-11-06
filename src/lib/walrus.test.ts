import assert from "node:assert/strict";
import { test } from "node:test";
import { readJson } from "./walrus";

test("rejects untrusted blob IDs before an outbound request", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = () => { throw new Error("network request escaped validation"); };
  try {
    for (const id of ["../metadata", "https://localhost/admin", "a".repeat(42)]) {
      await assert.rejects(readJson(id), RangeError);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
