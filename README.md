# NehoID - Enterprise-Grade Unique Identifier Generation

A comprehensive TypeScript library for generating, managing, and validating unique identifiers with advanced features for enterprise applications. NehoID provides multiple generation strategies, collision detection, encoding pipelines, and monitoring capabilities designed for production environments.

## Key Differentiators

NehoID distinguishes itself from other ID generators through:

- **Multi-Layer Encoding Pipeline**: 20+ encoding algorithms with configurable compression and reversibility
- **Intelligent Collision Detection**: Multiple retry strategies with exponential backoff and custom validation functions
- **Context-Aware Generation**: Environment, device, and behavioral data integration
- **Advanced Analytics**: Real-time performance monitoring and statistical analysis
- **Format Migration Tools**: Seamless conversion between different ID formats
- **Batch Processing**: High-performance bulk operations with parallel execution
- **Custom Character Sets**: Domain-specific alphabets and character restrictions
- **Quality Assessment**: Entropy analysis and ID health scoring algorithms

## Installation

```bash
npm install nehoid
# or
yarn add nehoid
# or
bun add nehoid
```

## Quick Start

```typescript
import { NehoID } from "nehoid";

// Basic ID generation
const id = NehoID.generate();
console.log(id); // "6a617977416b714d-7938716a56515a52-79764d5a50775555"

// Advanced generation with multiple options
const customId = NehoID.generate({
  size: 16,
  prefix: "user",
  case: "lower",
  includeTimestamp: true,
  format: "nanoid",
});

// Collision-safe generation
const safeId = await NehoID.safe({
  name: "database-check",
  maxAttempts: 5,
  backoffType: "exponential",
  checkFunction: async (id) => !(await database.exists(id)),
});
```

## Core Features

### 1. Advanced ID Generation

The `generate()` method supports extensive customization options for various use cases:

```typescript
// Preset formats
const uuid = NehoID.generate({ format: "uuid" });
const nanoid = NehoID.generate({ format: "nanoid" });
const cuid = NehoID.generate({ format: "cuid" });

// Character set control
const numericOnly = NehoID.generate({
  charset: { numbers: true, lowercase: false, uppercase: false },
  size: 12,
});

// URL-safe generation
const urlSafe = NehoID.generate({
  quality: { urlSafe: true },
  charset: { exclude: ["+", "/", "="] },
});

// Case transformations
const upperCase = NehoID.generate({ case: "upper" });
const camelCase = NehoID.generate({ case: "camel" });
const snakeCase = NehoID.generate({ case: "snake" });

// Pattern-based generation
const phoneFormat = NehoID.generate({ pattern: "XXX-XXX-XXXX" });
const licensePlate = NehoID.generate({ pattern: "AA-9999" });

// Sequential numbering
const orderId = NehoID.generate({
  sequential: { context: "orders", start: 1000, padLength: 6 },
});

// Temporal features
const tempId = NehoID.generate({
  expiresIn: 24 * 60 * 60 * 1000, // 24 hours
  version: "v2",
  domain: "api",
});

// Quality requirements
const secureId = NehoID.generate({
  randomness: "crypto",
  quality: {
    minEntropy: "high",
    avoidPatterns: true,
  },
  size: 32,
});

// Metadata embedding
const taggedId = NehoID.generate({
  metadata: { createdBy: "system", environment: "production" },
  includeChecksum: true,
});
```

### 2. Specialized Generators

```typescript
// Standard formats
const uuid = NehoID.uuid(); // RFC 4122 UUID
const nanoid = NehoID.nanoid(12); // NanoID-compatible
const shortId = NehoID.short(8); // URL-safe short ID
const hexId = NehoID.hex(32); // Hexadecimal ID

// Advanced formats
const hierarchicalId = NehoID.hierarchical({
  parentId: "parent-123",
  level: 2,
});

const temporalId = NehoID.temporal({
  precision: "milliseconds",
  includeRandom: true,
});

const semanticId = NehoID.semantic({
  prefix: "ORDER",
  region: "US-WEST",
  department: "SALES",
  year: 2024,
});

const sequentialId = NehoID.sequential({
  prefix: "INV",
  counter: 1001,
  padLength: 6,
});
```

### 3. Collision Detection and Safety

```typescript
// Basic collision avoidance
const safeId = await NehoID.safe({
  name: "user-registration",
  maxAttempts: 10,
  backoffType: "exponential",
  checkFunction: async (id) => {
    const user = await database.collection("users").findOne({ id });
    return !user;
  },
});

// Custom retry strategy
const customSafeId = await NehoID.safe({
  name: "payment-transaction",
  maxAttempts: 3,
  backoffType: "linear",
  checkFunction: async (id) => {
    return !(await redis.exists(`payment:${id}`));
  },
});
```

### 4. Encoding Pipeline

```typescript
import { EncodingPipeline } from "nehoid";

// Build custom encoding pipeline
const pipeline = new EncodingPipeline()
  .addEncoder("base64")
  .addEncoder("hex")
  .addCompression("lz77")
  .enableReversibility()
  .addMetadata("version", "2.1.0");

// Use in generation
const encodedId = NehoID.generate({
  pipeline: pipeline,
  reversible: true,
});

// Reverse encoding if needed
const original = pipeline.reverse(encodedId);
```

### 5. Batch Operations

```typescript
// High-performance batch generation
const userIds = NehoID.batch({
  count: 1000,
  format: "uuid",
  parallel: true,
  ensureUnique: true,
});

// Bulk validation
const validationResults = NehoID.validateBatch(userIds, {
  checkFormat: true,
  checkCollisions: false,
  repairCorrupted: true,
});

// Filtered results
const validIds = validationResults.filter((result) => result.valid);
```

### 6. Analytics and Monitoring

```typescript
// Enable performance monitoring
NehoID.startMonitoring();

// Generate IDs and collect statistics
for (let i = 0; i < 1000; i++) {
  NehoID.generate({ format: "nanoid" });
}

// Retrieve comprehensive statistics
const stats = NehoID.getStats();
console.log({
  totalGenerated: stats.generated,
  collisionIncidents: stats.collisions,
  averageGenerationTime: stats.averageGenerationTime,
  memoryFootprint: stats.memoryUsage,
  distributionQuality: stats.distributionScore,
});

// Individual ID quality assessment
const healthScore = NehoID.healthCheck("user-abc123def");
console.log({
  overallScore: healthScore.score, // 0.0 to 1.0
  entropyLevel: healthScore.entropy, // "low" | "medium" | "high"
  predictability: healthScore.predictability,
  improvementSuggestions: healthScore.recommendations,
});
```

### 7. Context-Aware Generation

```typescript
// Device fingerprinting
const deviceId = NehoID.contextual({
  includeDevice: true,
  includeTimezone: true,
  includeBrowser: true,
  includeScreen: true,
});

// Business context
const businessId = NehoID.semantic({
  prefix: "ORD",
  region: "EU-CENTRAL",
  department: "FULFILLMENT",
  year: 2024,
  customSegments: {
    priority: "HIGH",
    channel: "WEB",
  },
});

// User behavior patterns
const behavioralId = NehoID.contextual({
  userBehavior: "premium-subscriber",
  includeLocation: true,
  includeTimezone: true,
});
```

### 8. Temporal Conversions

```typescript
// Convert timestamp to temporal ID
const timestamp = Date.now();
const temporalId = NehoID.fromTemporal(timestamp);

// Extract timestamp from temporal ID
const extractedTimestamp = NehoID.fromTemporalToTimestamp(temporalId);

// Time-based queries
const recentIds = await database.collection
  .find({
    temporalId: {
      $gte: NehoID.fromTemporal(Date.now() - 24 * 60 * 60 * 1000),
    },
  })
  .sort({ temporalId: 1 });
```

### 9. Checksum and Integrity

```typescript
import { Checksum } from "nehoid";

// Generate checksums with different algorithms
const crc32Checksum = Checksum.generate("important-data", "crc32", 8);
const fnv1aChecksum = Checksum.generate("important-data", "fnv1a", 6);

// Validate integrity
const isValid = Checksum.validate("important-data", crc32Checksum, "crc32", 8);

// Safe operations (no exceptions)
const safeChecksum = Checksum.tryGenerate("data");
const safeValidation = Checksum.tryValidate("data", checksum);
```

## Advanced Configuration

### Custom Encoding Strategies

```typescript
import { NehoID, EncodingPipeline, Checksum } from "nehoid";

// Complex encoding pipeline
const securePipeline = new EncodingPipeline()
  .addEncoders(["base64", "hex", "rot13"])
  .addCompression("gzip")
  .enableReversibility()
  .addMetadata("encryption", "AES256")
  .addMetadata("created", new Date().toISOString());

// Generate with full configuration
const enterpriseId = NehoID.generate({
  size: 32,
  prefix: "ENT",
  encoding: ["base64", "urlSafeBase64"],
  compression: "lz77",
  reversible: true,
  includeChecksum: true,
  expiresIn: 30 * 24 * 60 * 60 * 1000, // 30 days
  version: "3.1.0",
  domain: "enterprise",
  quality: {
    minEntropy: "high",
    urlSafe: true,
    avoidPatterns: true,
  },
  charset: {
    numbers: true,
    lowercase: true,
    uppercase: true,
    exclude: ["0", "O", "I", "l"], // Avoid ambiguous characters
  },
  metadata: {
    department: "security",
    classification: "confidential",
    retention: "7-years",
  },
});
```

### Migration and Compatibility

```typescript
// Migrate existing UUIDs to NehoID format
const migratedIds = await NehoID.migrate({
  from: "uuid",
  to: "nehoid-v2",
  preserveOrder: true,
  batchSize: 500,
  ids: existingUuids,
});

// Cross-platform compatibility
const crossPlatformId = NehoID.compatible({
  platform: ["javascript", "python", "go", "rust"],
  format: "alphanumeric",
  length: 16,
});
```

## Performance Characteristics

| Operation               | NehoID                     | Performance | Memory Usage | Notes                 |
| ----------------------- | -------------------------- | ----------- | ------------ | --------------------- |
| Single ID Generation    | generate()                 | <0.1ms      | ~2KB         | Basic generation      |
| Batch Generation (1K)   | batch({count: 1000})       | ~5ms        | ~50KB        | Parallel processing   |
| Batch Generation (100K) | batch({count: 100000})     | ~450ms      | ~5MB         | Memory efficient      |
| Collision Check         | safe()                     | <1ms        | ~5KB         | Database dependent    |
| Validation              | validate()                 | <0.5ms      | ~1KB         | Regex-based           |
| Health Check            | healthCheck()              | <2ms        | ~10KB        | Entropy analysis      |
| Encoding Pipeline       | EncodingPipeline.process() | <5ms        | ~8KB         | Compression dependent |

_Benchmarks performed on Intel i7-9750H, Node.js 18.17.0, 16GB RAM_

## API Reference

### Core Methods

#### ID Generation

- `NehoID.generate(options?)` - Generate ID with full configuration options
- `NehoID.safe(options)` - Generate collision-resistant ID
- `NehoID.batch(options)` - Bulk ID generation

#### Validation & Analysis

- `NehoID.validate(id, options?)` - Validate ID format and integrity
- `NehoID.validateBatch(ids, options?)` - Bulk validation
- `NehoID.healthCheck(id)` - Comprehensive ID quality assessment

#### Specialized Generators

- `NehoID.uuid()` - RFC 4122 compliant UUID
- `NehoID.nanoid(length?)` - NanoID compatible format
- `NehoID.short(length?)` - URL-safe short identifier
- `NehoID.hex(length?)` - Hexadecimal identifier
- `NehoID.hierarchical(options)` - Tree-structured identifiers
- `NehoID.temporal(options)` - Time-ordered identifiers
- `NehoID.semantic(options)` - Business-meaningful identifiers
- `NehoID.sequential(options)` - Database-friendly sequences

#### Context & Behavior

- `NehoID.contextual(options)` - Environment-aware generation
- `NehoID.fromTemporal(timestamp)` - Convert timestamp to temporal ID
- `NehoID.fromTemporalToTimestamp(temporalId)` - Extract timestamp from temporal ID

#### Utilities

- `NehoID.migrate(options)` - Format conversion and migration
- `NehoID.compatible(options)` - Cross-platform identifier generation
- `NehoID.startMonitoring()` - Enable performance tracking
- `NehoID.getStats()` - Retrieve generation statistics

### Classes

#### EncodingPipeline

Fluent API for building complex encoding workflows:

```typescript
const pipeline = new EncodingPipeline()
  .addEncoder("base64")
  .addCompression("gzip")
  .enableReversibility();
```

#### Checksum

Multiple algorithm support for data integrity:

```typescript
const crc32 = Checksum.generate(data, "crc32");
const isValid = Checksum.validate(data, crc32, "crc32");
```

## Security Considerations

- **Cryptographic Randomness**: Configurable entropy levels for security requirements
- **Timing Attack Resistance**: Consistent-time operations prevent side-channel attacks
- **No Predictable Patterns**: Advanced entropy analysis prevents sequential prediction
- **Optional Encryption Layer**: Pipeline-based encryption support
- **Audit Trail Support**: Comprehensive generation logging and monitoring
- **Input Validation**: Strict parameter validation prevents injection attacks
- **Memory Safety**: Controlled memory usage prevents DoS through resource exhaustion

## Framework Integrations

### Express.js Middleware

```typescript
import express from "express";
import { NehoID } from "nehoid";

const app = express();

// Request ID middleware
app.use(
  NehoID.middleware("express", {
    header: "X-Request-ID",
    format: "short",
    includeTimestamp: true,
  })
);

// Route-specific ID generation
app.post("/users", (req, res) => {
  const userId = NehoID.generate({
    prefix: "usr",
    includeChecksum: true,
  });
  // ... user creation logic
});
```

### Database ORM Integration

```typescript
// Mongoose schema
const UserSchema = new mongoose.Schema({
  _id: {
    type: String,
    default: () => NehoID.generate({ prefix: "usr", includeChecksum: true }),
  },
  email: String,
  createdAt: { type: Date, default: Date.now },
});

// Sequelize model
class Order extends Model {
  @NehoID.database.sequelize("Order")
  id: string;

  @Column
  total: number;
}

// TypeORM entity
@Entity()
export class Product {
  @NehoID.database.typeorm("Product")
  id: string;

  @Column()
  name: string;
}
```

## Configuration Types

### IdGeneratorOptions

```typescript
interface IdGeneratorOptions {
  // Basic configuration
  size?: number;
  segments?: number;
  separator?: string;

  // Format presets
  format?: "uuid" | "nanoid" | "cuid" | "ksuid" | "xid" | "pushid";

  // Character control
  charset?: {
    numbers?: boolean;
    lowercase?: boolean;
    uppercase?: boolean;
    special?: boolean;
    exclude?: string[];
  };

  // Case transformations
  case?: "lower" | "upper" | "mixed" | "camel" | "pascal" | "snake";

  // Quality requirements
  quality?: {
    minEntropy?: "low" | "medium" | "high";
    avoidPatterns?: boolean;
    urlSafe?: boolean;
  };

  // Advanced features
  expiresIn?: number;
  version?: string | number;
  domain?: string;
  includeChecksum?: boolean;
  pattern?: string;

  // And more options...
}
```

## Contributing

We welcome contributions from the community. Please see CONTRIBUTING.md for detailed guidelines on:

- Code style and standards
- Testing requirements
- Documentation standards
- Pull request process
- Issue reporting

## License

Licensed under the MIT License. See LICENSE file for complete terms.

## Support

- Documentation: [Full API Reference](https://lab.nehonix.space/nehoid)
- Issues: [GitHub Issues](https://github.com/iDevo-ll/nehoid/issues)
- Discussions: [GitHub Discussions](https://github.com/iDevo-ll/nehoid/discussions)
- Email: libnehoid.support@nehonix.space
