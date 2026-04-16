import { Encoder } from "./src/core/encoder";

async function verify() {
  console.log("Testing compression refactor...");

  const testStrings = [
    "Hello world!",
    "A very repetitive string: " + "abc".repeat(100),
    "A long text with patterns. Patterns are good for compression. ".repeat(10),
    "",
  ];

  const methods: ("gz" | "lz77" | "gzip")[] = ["lz77", "gzip"] as any;

  for (const str of testStrings) {
    console.log(`\nInput length: ${str.length}`);
    for (const method of methods) {
      try {
        const compressed = Encoder.compress(str, method as any);
        const decompressed = Encoder.decompress(compressed, method as any);

        const ratio =
          str.length > 0 ? (compressed.length / str.length).toFixed(2) : "N/A";
        console.log(
          `${method}: Compressed length=${compressed.length}, Ratio=${ratio}, Match=${str === decompressed}`,
        );

        if (str !== decompressed) {
          console.error(`ERROR: Decompression failed for ${method}`);
          process.exit(1);
        }
      } catch (e) {
        console.error(`ERROR in ${method}:`, e);
        process.exit(1);
      }
    }
  }

  console.log("\n✅ Verification successful!");
}

verify();
