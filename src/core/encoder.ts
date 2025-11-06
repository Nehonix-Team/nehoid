import { __processor__ } from "../utils/processor-wrapper";

/**
 * Supported encoding types for data transformation.
 *
 * These encoding schemes provide various methods for transforming strings,
 * including standard encodings, cryptographic preparations, and specialized formats.
 * Each type corresponds to a specific encoding algorithm with different properties
 * such as reversibility, URL-safety, and security characteristics.
 */
export type ENC_TYPE =
  | "percentEncoding"
  | "doublepercent"
  | "base64"
  | "hex"
  | "unicode"
  | "htmlEntity"
  | "punycode"
  | "asciihex"
  | "asciioct"
  | "rot13"
  | "base32"
  | "urlSafeBase64"
  | "jsEscape"
  | "cssEscape"
  | "utf7"
  | "quotedPrintable"
  | "decimalHtmlEntity"
  | "rawHexadecimal"
  | "jwt"
  | "url"
  | "rawHex";

/**
 * Core encoding utilities for data transformation and compression.
 *
 * The Encoder class provides a comprehensive set of encoding and decoding methods
 * supporting multiple algorithms including base64, hex, ROT13, compression schemes,
 * and specialized encodings. It serves as the foundation for NehoID's transformation
 * capabilities and supports both synchronous and asynchronous operations.
 *
 * @example
 * ```typescript
 * // Basic encoding and decoding
 * const encoded = await Encoder.encode('hello world', 'base64');
 * const decoded = Encoder.decode(encoded, 'base64');
 *
 * // Multiple encodings in sequence
 * const multiEncoded = await Encoder.encode('data', ['base64', 'hex']);
 * const multiDecoded = Encoder.decode(multiEncoded, ['hex', 'base64']);
 *
 * // Compression
 * const compressed = Encoder.compress('long text to compress', 'gzip');
 * const decompressed = Encoder.decompress(compressed, 'gzip');
 * ```
 */
export class Encoder {
  /**
   * Encode a string using one or more encoding schemes asynchronously.
   *
   * Applies encoding transformations in sequence, where each encoding
   * is applied to the result of the previous encoding. This allows for
   * complex encoding pipelines to be built programmatically.
   *
   * @param input - The string to encode
   * @param encodings - Single encoding type or array of encoding types to apply in sequence
   * @returns Promise that resolves to the encoded string
   *
   * @example
   * ```typescript
   * // Single encoding
   * const base64Result = await Encoder.encode('hello', 'base64');
   * // Output: 'aGVsbG8='
   *
   * // Multiple encodings
   * const result = await Encoder.encode('data', ['base64', 'hex']);
   * // Applies base64 first, then hex to the result
   *
   * // URL-safe encoding
   * const urlSafe = await Encoder.encode('user input', 'urlSafeBase64');
   * ```
   */
  static async encode(
    input: string,
    encodings: ENC_TYPE | ENC_TYPE[]
  ): Promise<string> {
    const encodingArray = Array.isArray(encodings) ? encodings : [encodings];
    let result = input;

    const enc = await __processor__.encodeMultipleAsync(result, encodingArray);

    result = enc.results[enc.results.length - 1].encoded;
    return result;
  }

  /**
   * Decode a string using one or more decoding schemes.
   *
   * Reverses encoding transformations by applying decodings in reverse order.
   * Supports both manual specification of decoding types and automatic detection.
   *
   * @param input - The encoded string to decode
   * @param encodings - Single decoding type or array of decoding types to apply in reverse order
   * @param opt - Optional decoding configuration
   * @param opt.autoDetect - Whether to attempt automatic encoding detection (experimental)
   * @returns The decoded string
   *
   * @example
   * ```typescript
   * // Single decoding
   * const original = Encoder.decode('aGVsbG8=', 'base64');
   * // Output: 'hello'
   *
   * // Multiple decodings (reverse order)
   * const result = Encoder.decode(encodedData, ['hex', 'base64']);
   * // Decodes hex first, then base64
   *
   * // With auto-detection
   * const decoded = Encoder.decode(encodedStr, 'base64', { autoDetect: true });
   * ```
   */
  static decode(
    input: string,
    encodings: ENC_TYPE | ENC_TYPE[],
    opt?: {
      autoDetect?: boolean;
    }
  ): string {
    const encodingArray = Array.isArray(encodings) ? encodings : [encodings];
    let result = input;

    // Decode in reverse order
    for (const encoding of encodingArray.reverse()) {
      if (opt?.autoDetect) {
        result = __processor__.autoDetectAndDecode(result).val();
      } else {
        result = __processor__.decode(result, encoding);
      }
    }

    return result;
  }

  /**
   * Compress a string using LZ77 or GZIP-style compression.
   *
   * Reduces the size of input strings using dictionary-based compression algorithms.
   * LZ77 uses sliding window compression, while GZIP uses LZW-style dictionary compression.
   * Both methods are lossless and can be reversed using the decompress method.
   *
   * @param input - The string to compress
   * @param method - Compression algorithm to use ('lz77' or 'gzip')
   * @returns The compressed and base64-encoded string
   *
   * @example
   * ```typescript
   * // LZ77 compression (good for repetitive data)
   * const compressed = Encoder.compress('abababababab', 'lz77');
   * const decompressed = Encoder.decompress(compressed, 'lz77');
   *
   * // GZIP compression (good for large texts)
   * const text = 'A very long string with lots of repetition and patterns...';
   * const gzipped = Encoder.compress(text, 'gzip');
   * const original = Encoder.decompress(gzipped, 'gzip');
   *
   * // Measure compression ratio
   * const ratio = gzipped.length / text.length;
   * console.log(`Compression ratio: ${ratio.toFixed(2)}`);
   * ```
   */
  static compress(input: string, method: "lz77" | "gzip"): string {
    if (!input) return "";

    switch (method) {
      case "lz77":
        // Basic LZ77-inspired compression
        let compressed = "";
        let i = 0;

        while (i < input.length) {
          // Look for repeated sequences
          let maxLength = 0;
          let maxOffset = 0;

          // Search window (limited to previous 255 chars for simplicity)
          const searchLimit = Math.min(i, 255);

          for (let offset = 1; offset <= searchLimit; offset++) {
            let length = 0;
            while (
              i + length < input.length &&
              input[i - offset + length] === input[i + length] &&
              length < 255 // Limit match length
            ) {
              length++;
            }

            if (length > maxLength) {
              maxLength = length;
              maxOffset = offset;
            }
          }

          if (maxLength >= 4) {
            // Only use compression for sequences of 4+ chars
            // Format: <flag><offset><length><next char>
            compressed += String.fromCharCode(0xff); // Flag for compressed sequence
            compressed += String.fromCharCode(maxOffset);
            compressed += String.fromCharCode(maxLength);
            i += maxLength;
          } else {
            // Literal character
            if (input.charCodeAt(i) === 0xff) {
              // Escape the flag character
              compressed += String.fromCharCode(0xff) + String.fromCharCode(0);
            } else {
              compressed += input[i];
            }
            i++;
          }
        }

        return btoa(compressed); // Base64 encode for safe storage

      case "gzip":
        // For gzip, we'll use a dictionary-based approach since we can't use native gzip in browser
        const dictionary: Record<string, number> = {};
        let nextCode = 256; // Start after ASCII
        let result = [];

        // Initialize dictionary with single characters
        for (let i = 0; i < 256; i++) {
          dictionary[String.fromCharCode(i)] = i;
        }

        let currentSequence = "";

        for (let i = 0; i < input.length; i++) {
          const char = input[i];
          const newSequence = currentSequence + char;

          if (dictionary[newSequence] !== undefined) {
            currentSequence = newSequence;
          } else {
            // Output code for current sequence
            result.push(dictionary[currentSequence]);

            // Add new sequence to dictionary if there's room
            if (nextCode < 65536) {
              // Limit dictionary size
              dictionary[newSequence] = nextCode++;
            }

            currentSequence = char;
          }
        }

        // Output code for remaining sequence
        if (currentSequence !== "") {
          result.push(dictionary[currentSequence]);
        }

        // Convert to string and base64 encode
        return btoa(result.map((code) => String.fromCharCode(code)).join(""));

      default:
        return input;
    }
  }

  /**
   * Decompress a string that was compressed using the compress method.
   *
   * Reverses the compression applied by the compress method, restoring the
   * original string. Supports both LZ77 and GZIP decompression algorithms.
   *
   * @param input - The compressed string to decompress
   * @param method - Decompression algorithm to use ('lz77' or 'gzip')
   * @returns The decompressed original string
   *
   * @example
   * ```typescript
   * // Round-trip compression
   * const original = 'This is a long string with repetitive patterns...';
   * const compressed = Encoder.compress(original, 'lz77');
   * const decompressed = Encoder.decompress(compressed, 'lz77');
   * // decompressed === original
   *
   * // Error handling
   * try {
   *   const result = Encoder.decompress('invalid-compressed-data', 'gzip');
   * } catch (error) {
   *   console.error('Decompression failed:', error);
   * }
   *
   * // Check decompression success
   * const result = Encoder.decompress(compressedData, 'lz77');
   * if (!result) {
   *   console.error('Decompression returned empty result');
   * }
   * ```
   */
  static decompress(input: string, method: "lz77" | "gzip"): string {
    if (!input) return "";

    switch (method) {
      case "lz77":
        try {
          // Base64 decode
          const compressed = atob(input);
          let decompressed = "";
          let i = 0;

          while (i < compressed.length) {
            if (compressed.charCodeAt(i) === 0xff) {
              i++;

              if (i < compressed.length && compressed.charCodeAt(i) === 0) {
                // Escaped flag character
                decompressed += String.fromCharCode(0xff);
                i++;
              } else if (i + 1 < compressed.length) {
                // Compressed sequence
                const offset = compressed.charCodeAt(i);
                const length = compressed.charCodeAt(i + 1);
                i += 2;

                // Copy sequence from already decompressed data
                const start = decompressed.length - offset;
                for (let j = 0; j < length; j++) {
                  decompressed += decompressed[start + j];
                }
              }
            } else {
              // Literal character
              decompressed += compressed[i];
              i++;
            }
          }

          return decompressed;
        } catch (e) {
          console.error("LZ77 decompression error:", e);
          return input;
        }

      case "gzip":
        try {
          // Base64 decode
          const compressed = atob(input);
          const codes = Array.from(compressed).map((char) =>
            char.charCodeAt(0)
          );

          // Initialize dictionary with single characters
          const dictionary: string[] = [];
          for (let i = 0; i < 256; i++) {
            dictionary[i] = String.fromCharCode(i);
          }

          let nextCode = 256;
          let result = "";
          let oldCode = codes[0];
          let character = dictionary[oldCode];
          result = character;

          for (let i = 1; i < codes.length; i++) {
            const code = codes[i];
            let entry: string;

            if (code < dictionary.length) {
              entry = dictionary[code];
            } else if (code === nextCode) {
              entry = character + character[0];
            } else {
              throw new Error("Invalid code");
            }

            result += entry;

            // Add to dictionary
            if (nextCode < 65536) {
              // Limit dictionary size
              dictionary[nextCode++] = character + entry[0];
            }

            character = entry;
          }

          return result;
        } catch (e) {
          console.error("Dictionary decompression error:", e);
          return input;
        }

      default:
        return input;
    }
  }
}
