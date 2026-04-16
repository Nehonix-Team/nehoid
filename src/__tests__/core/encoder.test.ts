import { Encoder } from "../../core/encoder";

describe("Encoder Compression", () => {
  const testString =
    "Hello world! This is a test string for compression. Hello world! This is a test string for compression.";

  describe("gzip", () => {
    it("should compress and decompress correctly", () => {
      const compressed = Encoder.compress(testString, "gzip");
      expect(compressed).not.toBe(testString);
      const decompressed = Encoder.decompress(compressed, "gzip");
      expect(decompressed).toBe(testString);
    });

    it("should handle empty strings", () => {
      const compressed = Encoder.compress("", "gzip");
      expect(compressed).toBe("");
      const decompressed = Encoder.decompress("", "gzip");
      expect(decompressed).toBe("");
    });
  });

  describe("lz77", () => {
    it("should compress and decompress correctly", () => {
      const compressed = Encoder.compress(testString, "lz77");
      expect(compressed).not.toBe(testString);
      const decompressed = Encoder.decompress(compressed, "lz77");
      expect(decompressed).toBe(testString);
    });

    it("should handle empty strings", () => {
      const compressed = Encoder.compress("", "lz77");
      expect(compressed).toBe("");
      const decompressed = Encoder.decompress("", "lz77");
      expect(decompressed).toBe("");
    });
  });
});
