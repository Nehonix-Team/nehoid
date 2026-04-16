import { NehoID, Checksum, Encoder, toBytes } from "./src/index.js";

async function verifyAll() {
  console.log("🚀 Starting Comprehensive NehoID Verification\n");

  // 1. Core Generation
  console.log("--- 1. Core Generation ---");
  try {
    const coreId = NehoID.generate({
      size: 16,
      prefix: "PRFX",
      case: "upper",
      includeTimestamp: true,
      includeChecksum: true,
      metadata: { env: "test" },
    });
    console.log(`Mixed Options ID: ${coreId}`);
    console.log(`Checksum valid: ${NehoID.validate(coreId)}`);

    const patternId = NehoID.generate({ pattern: "AA-9999-XXXX" });
    console.log(`Pattern ID: ${patternId}`);

    const compressionId = NehoID.generate({
      compression: "gzip",
      encoding: "base64",
    });
    console.log(`Compression (Gzip+Base64) ID: ${compressionId}`);
  } catch (e) {
    console.error("❌ Core Generation Failed:", e);
  }

  // 2. Specialized Generators
  console.log("\n--- 2. Specialized Generators ---");
  try {
    console.log(`UUID: ${NehoID.uuid()}`);
    console.log(`NanoID: ${NehoID.nanoid()}`);
    console.log(`Short: ${NehoID.short()}`);
    console.log(`Hex: ${NehoID.hex()}`);

    // Test Hierarchical mapping (fixing internal mismatches if any)
    const hId1 = NehoID.hierarchical({ parent: "root", level: 2 });
    const hId2 = NehoID.hierarchical({
      parentId: "parent-id",
      depth: 3,
      separator: ".",
    });
    console.log(`Hierarchical 1 (parent/level): ${hId1}`);
    console.log(`Hierarchical 2 (parentId/depth/separator): ${hId2}`);

    const temporal1 = NehoID.temporal({ precision: "ms", format: "b36" });
    const temporal2 = NehoID.temporal({
      precision: "s",
      format: "hex",
      suffix: false,
    });
    console.log(`Temporal 1 (ms/b36): ${temporal1}`);
    console.log(`Temporal 2 (s/hex/no-suffix): ${temporal2}`);

    const ts = NehoID.fromTemporalToTimestamp(temporal1, { format: "b36" });
    console.log(`Extracted TS 1: ${new Date(ts).toISOString()}`);

    const sequential1 = NehoID.sequential({
      prefix: "SEQ",
      counter: 500,
      padLength: 6,
    });
    const sequential2 = NehoID.sequential({
      prefix: "INV-",
      counter: 1,
      padLength: 4,
      suffix: true,
    });
    console.log(`Sequential 1: ${sequential1}`);
    console.log(`Sequential 2 (with suffix): ${sequential2}`);
  } catch (e) {
    console.error("❌ Specialized Generators Failed:", e);
  }

  // 3. Batch Generation
  console.log("\n--- 3. Batch Generation ---");
  try {
    const batch1 = NehoID.batch({
      count: 10,
      format: "short",
      ensureUnique: true,
    });
    const batch2 = NehoID.batch({ count: 5, format: "uuid" });
    console.log(`Batch 1 (short unique) Count: ${batch1.length}`);
    console.log(`Batch 2 (uuid) Count: ${batch2.length}`);
    const unique = new Set(batch1).size === batch1.length;
    console.log(`Batch 1 unique: ${unique}`);
  } catch (e) {
    console.error("❌ Batch Generation Failed:", e);
  }

  // 4. Validation & Health
  console.log("\n--- 4. Validation & Health ---");
  try {
    const sampleId = NehoID.generate({ size: 10 });
    const health = NehoID.healthCheck(sampleId);
    console.log(
      `Health Score for ${sampleId}: ${health.score} (${health.entropy} entropy)`,
    );
    console.log(
      `Recommendations: ${health.recommendations.join(", ") || "None"}`,
    );

    const batchValidation = NehoID.validateBatch(
      [sampleId, "too-short", sampleId],
      { checkCollisions: true },
    );
    console.log("Batch Validation Report:");
    console.log(`  Valid: ${batchValidation.valid.length}`);
    console.log(`  Invalid: ${batchValidation.invalid.length}`);
    console.log(`  Duplicates: ${batchValidation.duplicates.length}`);
  } catch (e) {
    console.error("❌ Validation Failed:", e);
  }

  // 5. Compression Utility
  console.log("\n--- 5. Compression Utility ---");
  try {
    const data = "I am a very repetitive string. ".repeat(10);
    for (const method of ["lz77", "gzip"] as const) {
      const compressed = Encoder.compress(data, method);
      const decompressed = Encoder.decompress(compressed, method);
      const ratio = (compressed.length / data.length).toFixed(2);
      console.log(
        `${method}: compressed=${compressed.length}, ratio=${ratio}, match=${data === decompressed}`,
      );
    }
  } catch (e) {
    console.error("❌ Compression Failed:", e);
  }

  // 6. Monitoring
  console.log("\n--- 6. Monitoring ---");
  try {
    NehoID.startMonitoring();
    for (let i = 0; i < 5; i++) NehoID.generate();
    const stats = NehoID.getStats();
    console.log(
      `Generated: ${stats.generated}, Avg Time: ${stats.averageGenerationTime}`,
    );
    NehoID.stopMonitoring();
  } catch (e) {
    console.error("❌ Monitoring Failed:", e);
  }

  // 7. Checksum & toBytes (New exports)
  console.log("\n--- 7. Checksum & toBytes ---");
  try {
    const testData = "NehoID-Integration-Test";
    const bytes = toBytes(testData);
    console.log(
      `toBytes input: "${testData}" -> bytes length: ${bytes.length}`,
    );
    const djb2 = Checksum.generate(testData, "djb2");
    console.log(`DJB2 Checksum: ${djb2}`);
    const crc32 = Checksum.generate(testData, "crc32");
    console.log(`CRC32 Checksum: ${crc32}`);
  } catch (e) {
    console.error("❌ Checksum/toBytes Failed:", e);
  }

  // 8. Collision-Safe Generation
  console.log("\n--- 8. Collision-Safe Generation ---");
  try {
    const existingIds = new Set(["taken-1", "taken-2"]);
    const safeId = await NehoID.safe({
      name: "safe-test",
      maxAttempts: 5,
      backoffType: "linear",
      checkFunction: async (id) => {
        const isSafe = !existingIds.has(id);
        console.log(`  Checking ${id}: ${isSafe ? "SAFE" : "TAKEN"}`);
        return isSafe;
      },
    });
    console.log(`Safe ID: ${safeId}`);
  } catch (e) {
    console.error("❌ Collision-Safe Generation Failed:", e);
  }

  console.log("\n✅ COMPREHENSIVE VERIFICATION FINISHED!");
}

verifyAll().catch(console.error);
