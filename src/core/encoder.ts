import { StruLink } from "strulink";
import { __processor__ } from "../utils/processor-wrapper";
import * as fflate from "fflate";

/**
 * Supported encoding types for data transformation.
 *
 * These encoding schemes provide various methods for transforming strings,
 * including standard encodings, cryptographic preparations, and specialized formats.
 * Each type corresponds to a specific encoding algorithm with different properties
 * such as reversibility, URL-safety, and security characteristics.
 */
export type ENC_TYPE = Parameters<typeof StruLink.encode>[1];

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
    encodings: ENC_TYPE | ENC_TYPE[],
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
    },
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

    try {
      const data = new TextEncoder().encode(input);
      let compressed: Uint8Array;

      switch (method) {
        case "lz77":
          // Deflate is used for LZ77-style compression
          compressed = fflate.deflateSync(data);
          break;
        case "gzip":
          compressed = fflate.gzipSync(data);
          break;
        default:
          return input;
      }

      // Convert Uint8Array to Base64 safely
      let binary = "";
      const len = compressed.byteLength;
      for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(compressed[i]);
      }
      return btoa(binary);
    } catch (error) {
      console.error(`Compression error (${method}):`, error);
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

    try {
      // Decode Base64 to Uint8Array safely
      const binaryString = atob(input);
      const data = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        data[i] = binaryString.charCodeAt(i);
      }

      let decompressed: Uint8Array;
      switch (method) {
        case "lz77":
          decompressed = fflate.inflateSync(data);
          break;
        case "gzip":
          decompressed = fflate.gunzipSync(data);
          break;
        default:
          return input;
      }

      return new TextDecoder().decode(decompressed);
    } catch (error) {
      console.error(`Decompression error (${method}):`, error);
      return input;
    }
  }
}
