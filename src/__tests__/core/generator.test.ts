import { NehoID } from "../../index";
import { Generator } from "../../core/generator";

describe("NehoID Generator", () => {
  test("generates standard ID by default", () => {
    const id = NehoID.generate();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  test("generates hex format with crypto randomBytes", () => {
    const defaultHex = NehoID.generate({ format: "hex" });
    expect(defaultHex).toHaveLength(32);
    expect(defaultHex).toMatch(/^[0-9a-f]{32}$/);

    const customSizeHex = NehoID.generate({ format: "hex", size: 16 });
    expect(customSizeHex).toHaveLength(16);
    expect(customSizeHex).toMatch(/^[0-9a-f]{16}$/);

    const hashAlias = NehoID.generate({ format: "hash", size: 24 });
    expect(hashAlias).toHaveLength(24);
    expect(hashAlias).toMatch(/^[0-9a-f]{24}$/);
  });

  test("applies prefix, case, and transform on hex format", () => {
    const prefixed = NehoID.generate({
      format: "hex",
      size: 10,
      prefix: "HASH",
      case: "upper",
    });
    expect(prefixed.startsWith("HASH-")).toBe(true);
    const hexPart = prefixed.replace("HASH-", "");
    expect(hexPart).toMatch(/^[0-9A-F]{10}$/);

    const transformed = NehoID.generate({
      format: "hex",
      size: 8,
      transform: (id) => `custom_${id}`,
    });
    expect(transformed.startsWith("custom_")).toBe(true);
  });

  test("supports convert option with encodings and functions", () => {
    const convertedFn = NehoID.generate({
      convert: (id) => id.toUpperCase(),
    });
    expect(convertedFn).toBe(convertedFn.toUpperCase());

    const convertedHex = NehoID.generate({
      convert: "rawHex",
    });
    expect(typeof convertedHex).toBe("string");
    expect(convertedHex.length).toBeGreaterThan(0);
  });

  test("Generator.getRandomBytes produces valid random bytes", () => {
    const bytes = Generator.getRandomBytes(16);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBe(16);
  });

  test("NehoID.hex produces cryptographically sound hex strings", () => {
    const hex16 = NehoID.hex(16);
    expect(hex16).toHaveLength(16);
    expect(hex16).toMatch(/^[0-9a-f]{16}$/);

    const hexDefault = NehoID.hex();
    expect(hexDefault).toHaveLength(32);
    expect(hexDefault).toMatch(/^[0-9a-f]{32}$/);
  });

  test("NehoID.batch supports hex format", () => {
    const batch = NehoID.batch({ count: 5, format: "hex" as any, ensureUnique: true });
    expect(batch).toHaveLength(5);
    batch.forEach((id) => {
      expect(id).toMatch(/^[0-9a-f]{32}$/);
    });
    expect(new Set(batch).size).toBe(5);
  });

  test("NehoID.safe collision strategy works", async () => {
    const existingIds = new Set<string>();
    const safeId = await NehoID.safe({
      name: "test-collision-strategy",
      backoffType: "linear",
      checkFunction: async (id) => !existingIds.has(id),
      maxAttempts: 3,
    });
    expect(typeof safeId).toBe("string");
    expect(safeId.length).toBeGreaterThan(0);
  });
});
