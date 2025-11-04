import { __processor__ } from "nehonix-uri-processor";
import { ENC_TYPE, Encoder } from "./encoder";

/**
 * Advanced encoding pipeline for processing and transforming IDs.
 *
 * The EncodingPipeline provides a fluent interface for building complex encoding workflows
 * that can combine multiple encoding schemes, compression, and metadata preservation.
 * It supports both forward encoding and reverse decoding operations, making it ideal
 * for secure ID transformations and data serialization.
 *
 * @example
 * ```typescript
 * // Basic encoding pipeline
 * const pipeline = new EncodingPipeline()
 *   .addEncoder('base64')
 *   .addEncoder('urlSafeBase64')
 *   .addCompression('gzip');
 *
 * const encoded = pipeline.process('my-sensitive-id');
 *
 * // Reverse the encoding
 * const original = pipeline.reverse(encoded);
 * ```
 *
 * @example
 * ```typescript
 * // Complex pipeline with metadata
 * const securePipeline = new EncodingPipeline()
 *   .addEncoders(['base64', 'hex', 'rot13'])
 *   .addCompression('lz77')
 *   .enableReversibility()
 *   .addMetadata('version', '1.0')
 *   .addMetadata('timestamp', Date.now());
 *
 * const result = securePipeline.process('user-data-123');
 * console.log('Config:', securePipeline.getConfig());
 * ```
 */
export class EncodingPipeline {
  private encoders: ENC_TYPE[] = [];
  private compressionMethod: "none" | "lz77" | "gzip" = "none";
  private isReversible: boolean = false;
  private metadata: Record<string, any> = {};

  /**
   * Add a single encoder to the pipeline.
   *
   * Encoders are applied in the order they are added. Each encoder transforms
   * the output of the previous step in the pipeline.
   *
   * @param encoder - The encoding type to add to the pipeline
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .addEncoder('urlSafeBase64');
   * ```
   */
  addEncoder(encoder: ENC_TYPE): EncodingPipeline {
    this.encoders.push(encoder);
    return this;
  }

  /**
   * Add multiple encoders to the pipeline at once.
   *
   * This is more efficient than calling addEncoder multiple times
   * and maintains the order of the encoders array.
   *
   * @param encoders - Array of encoding types to add
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoders(['base64', 'hex', 'rot13']);
   * ```
   */
  addEncoders(encoders: ENC_TYPE[]): EncodingPipeline {
    this.encoders.push(...encoders);
    return this;
  }

  /**
   * Add compression to the pipeline.
   *
   * Compression is applied after all encoders and can significantly reduce
   * the size of the encoded output. Supports LZ77 and GZIP-style compression.
   *
   * @param method - The compression method to use ('lz77' or 'gzip')
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .addCompression('lz77');
   * ```
   */
  addCompression(method: "lz77" | "gzip"): EncodingPipeline {
    this.compressionMethod = method;
    return this;
  }

  /**
   * Enable reversibility for the pipeline.
   *
   * When enabled, the pipeline stores its configuration as metadata
   * in the encoded output, allowing for automatic reversal using the reverse() method.
   *
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .enableReversibility();
   *
   * const encoded = pipeline.process('data');
   * const decoded = pipeline.reverse(encoded); // Works automatically
   * ```
   */
  enableReversibility(): EncodingPipeline {
    this.isReversible = true;
    return this;
  }

  /**
   * Disable reversibility for the pipeline.
   *
   * When disabled, the pipeline configuration is not stored,
   * making the output more compact but irreversible.
   *
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .disableReversibility(); // Explicitly disable
   * ```
   */
  disableReversibility(): EncodingPipeline {
    this.isReversible = false;
    return this;
  }

  /**
   * Add custom metadata to the pipeline.
   *
   * Metadata is preserved in reversible pipelines and can be used
   * for versioning, debugging, or additional context information.
   *
   * @param key - The metadata key
   * @param value - The metadata value (can be any serializable type)
   * @returns The pipeline instance for method chaining
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addMetadata('version', '2.1.0')
   *   .addMetadata('created', new Date().toISOString())
   *   .addMetadata('environment', 'production');
   * ```
   */
  addMetadata(key: string, value: any): EncodingPipeline {
    this.metadata[key] = value;
    return this;
  }

  /**
   * Process input through the complete encoding pipeline.
   *
   * Applies all configured encoders, compression, and metadata in sequence.
   * If reversibility is enabled, the pipeline configuration is prepended to the output.
   *
   * @param input - The string to process through the pipeline
   * @returns The fully encoded and processed string
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoders(['base64', 'hex'])
   *   .addCompression('gzip')
   *   .enableReversibility();
   *
   * const result = pipeline.process('sensitive-data');
   * // Result includes encoded data + pipeline config for reversal
   * ```
   */
  process(input: string): string {
    let result = input;

    // Apply encoders in sequence
    if (this.encoders.length > 0) {
      const enc = __processor__.encodeMultiple(result, this.encoders);
      result = enc.results[enc.results.length - 1].encoded;
    }

    // Apply compression if specified
    if (this.compressionMethod !== "none") {
      result = Encoder.compress(result, this.compressionMethod);
    }

    // If reversible, prepend metadata
    if (this.isReversible) {
      // Store pipeline configuration as a prefix
      const config = {
        e: this.encoders,
        c: this.compressionMethod,
        m: this.metadata,
      };

      // Convert to JSON and encode in base64
      const configStr = __processor__.encode(JSON.stringify(config), "base64");

      // Add as prefix with separator
      result = `${configStr}:${result}`;
    }

    return result;
  }

  /**
   * Reverse the pipeline processing to recover original input.
   *
   * Only works if the pipeline was configured with reversibility enabled.
   * Automatically extracts the pipeline configuration from the encoded string
   * and applies reverse transformations in the correct order.
   *
   * @param input - The encoded string to reverse
   * @returns The original input string, or null if reversal is not possible
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .enableReversibility();
   *
   * const encoded = pipeline.process('my-data');
   * const original = pipeline.reverse(encoded);
   * // original === 'my-data'
   * ```
   *
   * @example
   * ```typescript
   * // Error handling
   * const result = pipeline.reverse('invalid-encoded-string');
   * if (result === null) {
   *   console.error('Could not reverse the encoding');
   * }
   * ```
   */
  reverse(input: string): string | null {
    // Check if input has reversible format
    if (!input.includes(":")) {
      return null;
    }

    try {
      // Split into config and content
      const [configStr, content] = input.split(":", 2);

      // Decode and parse config
      const config = JSON.parse(atob(configStr));

      let result = content;

      // Reverse compression if applied
      if (config.c !== "none") {
        result = Encoder.decompress(result, config.c);
      }

      // Reverse encoders in reverse order
      if (config.e.length > 0) {
        result = Encoder.decode(result, config.e);
      }

      return result;
    } catch (e) {
      console.error("Error reversing pipeline:", e);
      return null;
    }
  }

  /**
   * Get the current pipeline configuration.
   *
   * Returns a snapshot of all pipeline settings including encoders,
   * compression method, reversibility flag, and metadata.
   *
   * @returns Configuration object containing all pipeline settings
   *
   * @example
   * ```typescript
   * const pipeline = new EncodingPipeline()
   *   .addEncoder('base64')
   *   .addCompression('gzip')
   *   .addMetadata('version', '1.0');
   *
   * const config = pipeline.getConfig();
   * console.log(config);
   * // {
   * //   encoders: ['base64'],
   * //   compression: 'gzip',
   * //   reversible: false,
   * //   metadata: { version: '1.0' }
   * // }
   * ```
   */
  getConfig(): {
    encoders: ENC_TYPE[];
    compression: "none" | "lz77" | "gzip";
    reversible: boolean;
    metadata: Record<string, any>;
  } {
    return {
      encoders: [...this.encoders],
      compression: this.compressionMethod,
      reversible: this.isReversible,
      metadata: { ...this.metadata },
    };
  }
}
