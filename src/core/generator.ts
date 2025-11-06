import { __processor__ } from "../utils/processor-wrapper";
import {
  IdGeneratorOptions,
  CollisionStrategy,
  BatchOptions,
} from "../types/index.js";
import { Encoder } from "./encoder.js";

export class Generator {
  private static readonly DEFAULT_OPTIONS: Partial<IdGeneratorOptions> = {
    size: 8,
    segments: 4,
    separator: "-",
    encoding: "rawHex",
    prefix: "",
    includeTimestamp: false,
    alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
    compression: "none",
    reversible: false,
    // New options with defaults
    randomness: 'fast',
    includeChecksum: false,
  };

  private static generateRandomString(
    length: number,
    alphabet: string
  ): string {
    return Array.from(
      { length },
      () => alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  }

  static generate(options: Partial<IdGeneratorOptions> = {}): string {
    const opts = {
      size: 8,
      segments: 4,
      separator: "-",
      encoding: "rawHex" as const,
      prefix: "",
      includeTimestamp: false,
      alphabet: "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
      compression: "none" as const,
      reversible: false,
      randomness: 'fast' as const,
      includeChecksum: false,
      ...this.DEFAULT_OPTIONS,
      ...options
    };
    const segments: string[] = [];

    if (opts.includeTimestamp) {
      const timestamp = Date.now().toString(36);
      segments.push(timestamp);
    }

    for (let i = 0; i < opts.segments; i++) {
      const randomString = this.generateRandomString(opts.size, opts.alphabet);
      const multiEnc = __processor__.encodeMultiple(
        randomString,
        Array.isArray(opts.encoding) ? opts.encoding : []
      );

      const encoded = Array.isArray(opts.encoding)
        ? multiEnc.results[multiEnc.results.length - 1].encoded
        : __processor__.encode(randomString, opts.encoding);
      segments.push(encoded);
    }

    let id = segments.join(opts.separator);

    if (opts.compression !== "none") {
      id = Encoder.compress(id, opts.compression);
    }

    return opts.prefix ? `${opts.prefix}${opts.separator}${id}` : id;
  }

  static async safe(options: CollisionStrategy): Promise<string> {
    let attempts = 0;
    let id: string;

    while (attempts < options.maxAttempts) {
      id = this.generate();

      if (await options.checkFunction(id)) {
        return id;
      }

      attempts++;
      if (options.backoffType === "exponential") {
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, attempts))
        );
      } else {
        await new Promise((resolve) => setTimeout(resolve, 100 * attempts));
      }
    }

    throw new Error(
      `Failed to generate unique ID after ${options.maxAttempts} attempts`
    );
  }

  static batch(options: BatchOptions): string[] {
    const ids = new Set<string>();
    const { count, format = "standard", ensureUnique = true } = options;

    while (ids.size < count) {
      const id =
        format === "standard"
          ? this.generate()
          : format === "uuid"
          ? this.uuid()
          : format === "nano"
          ? this.nano()
          : this.short();

      if (!ensureUnique || !ids.has(id)) {
        ids.add(id);
      }
    }

    return Array.from(ids);
  }

  static uuid(): string {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static nano(size: number = 12): string {
    return this.generateRandomString(
      size,
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
    );
  }

  static short(length: number = 8): string {
    return this.generate({
      size: length,
      segments: 1,
      encoding: "urlSafeBase64",
    });
  }

  static hex(length: number = 32): string {
    return this.generateRandomString(length, "0123456789abcdef");
  }
}
