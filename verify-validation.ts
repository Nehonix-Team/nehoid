import { NehoID } from "./src/mods/nehoid";

async function verify() {
  console.log("Testing validation refactor...");

  const testCases = [
    {
      name: "Standard Batch",
      ids: ["valid_id_1", "valid_id_2", "short", "valid_id_1"],
      options: { checkCollisions: true },
    },
    {
      name: "Empty Batch",
      ids: [],
      options: {},
    },
    {
      name: "No Collisions Check",
      ids: ["valid_id_1", "valid_id_1"],
      options: { checkCollisions: false },
    },
  ];

  for (const { name, ids, options } of testCases) {
    console.log(`\n--- ${name} ---`);
    console.log(`Input IDs: ${JSON.stringify(ids)}`);
    console.log(`Options: ${JSON.stringify(options)}`);

    try {
      const result = NehoID.validateBatch(ids, options);
      console.log("Result:", JSON.stringify(result, null, 2));

      // Validation logic check
      if (name === "Standard Batch") {
        const isValid =
          result.valid.length === 2 &&
          result.invalid.length === 1 &&
          result.duplicates.length === 1;
        console.log(`Test PASSED: ${isValid}`);
        if (!isValid) process.exit(1);
      }
    } catch (e) {
      console.error(`ERROR in ${name}:`, e);
      process.exit(1);
    }
  }

  console.log("\n✅ Manual verification successful!");
}

verify();
