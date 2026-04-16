# NehoID

NehoID is a high-performance TypeScript library designed for generating, validating, and managing unique identifiers in enterprise-grade applications. It provides a comprehensive suite of features including collision-resistant strategies, multi-algorithm encoding, cryptographic security, and real-time monitoring.

## Key Features

- **Versatile Generation**: Support for UUID, NanoID, sequential, hierarchical, and temporal identifiers.
- **Collision Resistance**: Configurable retry strategies (linear, exponential) and validation callbacks.
- **Encoding & Compression**: Advanced processing pipelines using Gzip, LZ77, and various encoding schemes (Base64, Hex).
- **Integrity Checks**: Integrated checksum support (CRC32, Adler32, DJB2, etc.) for data corruption detection.
- **Health Monitoring**: Real-time tracking of generation performance, collision rates, and memory usage.
- **Developer Experience**: Comprehensive JSDoc documentation and full ESM/TypeScript support.

## Installation

Install NehoID using the XyPriss Package Manager:

```bash
xfpm install nehoid
```

## API Reference

### Core Generation

#### `NehoID.generate(options?: IdGeneratorOptions): string`

The primary entry point for ID generation. Supports custom sizes, prefixes, suffixes, case transformation, charsets, and metadata embedding.

```typescript
const id = NehoID.generate({
  size: 32,
  prefix: "USR",
  metadata: { version: "1.0" },
  includeChecksum: true,
});
```

#### `NehoID.safe(strategy: CollisionStrategy): Promise<string>`

Asynchronous generation with collision detection and automatic retries.

### Specialized Generators

#### `NehoID.uuid(): string`

Generates a standard RFC 4122 v4 UUID.

#### `NehoID.nanoid(length?: number): string`

Generates a compact, URL-safe NanoID.

#### `NehoID.hierarchical(options: HierarchicalOptions): string`

Encodes parent-child relationships into the identifier.

- `parentId` / `parent`: String reference to the parent node.
- `depth` / `level`: Hierarchical depth level.
- `separator`: Custom separator (default `/`).

#### `NehoID.temporal(options: TemporalOptions): string`

Generates time-ordered IDs for natural chronological sorting.

- `precision`: 'ms' | 's' | 'm' | 'h' | 'd'.
- `format`: 'hex' | 'dec' | 'b36'.
- `suffix`: Append random characters for uniqueness (default: `true`).

#### `NehoID.sequential(options: SequentialOptions): string`

Generates identifiers with incrementing counters.

- `counter`: Current sequence number.
- `prefix`: Constant string prefix.
- `padLength`: Number of zeros for padding.

### Validation & Analysis

#### `NehoID.validate(id: string, options?: ValidationOptions): boolean`

Performs basic or thorough integrity checks on an identifier.

#### `NehoID.validateBatch(ids: string[], options?: ValidationOptions): Report`

Validates multiple IDs and returns a categorized report of valid, invalid, and duplicate entries.

#### `NehoID.healthCheck(id: string): HealthScore`

Analyzes ID quality, assessing entropy, predictability, and distribution.

### Performance & Monitoring

#### `NehoID.startMonitoring() / stopMonitoring(): void`

Enables or disables real-time performance tracking.

#### `NehoID.getStats(): Stats`

Returns metrics including average generation time, collision counts, and memory usage.

## Utilities

### Encoding & Compression

The library includes a robust `Encoder` class for processing IDs through compression and encoding pipelines.

```typescript
import { Encoder } from "nehoid";

const data = "example-data-to-compress";
const compressed = Encoder.compress(data, "lz77");
const decompressed = Encoder.decompress(compressed, "lz77");
```

### Checksums

Integrated support for multiple checksum algorithms via the `Checksum` module.

```typescript
import { Checksum, toBytes } from "nehoid";

const sum = Checksum.generate("input-string", "crc32");
```

## Technical Architecture

NehoID uses a modular architecture optimized for the XyPriss ecosystem. It leverages `fflate` for industry-standard compression and `strulink` for robust string transformations.

## License

MIT License. Copyright (c) NEHONIX. All rights reserved.
