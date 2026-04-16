import { ValidationOptions, HealthScore } from "../types/index.js";

export class Validator {
  private static readonly UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  private static readonly NANO_REGEX = /^[A-Za-z0-9_-]+$/;

  static validate(id: string, options: ValidationOptions = {}): boolean {
    const { checkFormat = true } = options;

    if (!id || typeof id !== "string") {
      return false;
    }

    if (checkFormat) {
      // Basic format validation
      if (id.length < 8) {
        return false;
      }

      // Check for invalid characters (including Base64 characters for metadata/encoding)
      if (/[^A-Za-z0-9_+\/=-]/.test(id)) {
        return false;
      }
    }

    return true;
  }

  static validateBatch(
    ids: string[],
    options: ValidationOptions = {},
  ): {
    valid: string[];
    invalid: string[];
    duplicates: string[];
  } {
    const result = {
      valid: [] as string[],
      invalid: [] as string[],
      duplicates: [] as string[],
    };

    const seen = new Set<string>();

    for (const id of ids) {
      if (!this.validate(id, options)) {
        result.invalid.push(id);
        continue;
      }

      if (options.checkCollisions && seen.has(id)) {
        result.duplicates.push(id);
        continue;
      }

      result.valid.push(id);
      seen.add(id);
    }

    return result;
  }

  static healthCheck(id: string): HealthScore {
    const score = this.calculateHealthScore(id);
    const entropy = this.calculateEntropy(id);
    const predictability = this.assessPredictability(id);
    const recommendations = this.generateRecommendations(
      score,
      entropy,
      id.length,
    );

    return {
      score,
      entropy: entropy > 0.75 ? "high" : entropy > 0.5 ? "medium" : "low",
      predictability:
        predictability < 0.3 ? "low" : predictability < 0.6 ? "medium" : "high",
      recommendations,
    };
  }

  private static calculateHealthScore(id: string): number {
    let score = 1.0;

    // Length check
    if (id.length < 8) score *= 0.5;
    if (id.length > 32) score *= 0.9;

    // Character variety
    const hasUpper = /[A-Z]/.test(id);
    const hasLower = /[a-z]/.test(id);
    const hasNumber = /[0-9]/.test(id);
    const hasSpecial = /[^A-Za-z0-9]/.test(id);

    if (!hasUpper) score *= 0.9;
    if (!hasLower) score *= 0.9;
    if (!hasNumber) score *= 0.9;
    if (!hasSpecial) score *= 0.95;

    return Math.min(1, Math.max(0, score));
  }

  private static calculateEntropy(id: string): number {
    const charFreq = new Map<string, number>();
    for (const char of id) {
      charFreq.set(char, (charFreq.get(char) || 0) + 1);
    }

    let entropy = 0;
    const length = id.length;

    for (const freq of charFreq.values()) {
      const probability = freq / length;
      entropy -= probability * Math.log2(probability);
    }

    return entropy / Math.log2(charFreq.size);
  }

  private static assessPredictability(id: string): number {
    let predictability = 0;

    // Check for patterns
    const hasRepeatingPattern = /(.+?)\1+/.test(id);
    if (hasRepeatingPattern) predictability += 0.3;

    // Check for sequential characters
    const hasSequential = /(?:abc|123|xyz)/i.test(id);
    if (hasSequential) predictability += 0.2;

    // Check for common words
    const hasCommonWords = /(?:test|admin|user|temp)/i.test(id);
    if (hasCommonWords) predictability += 0.4;

    return Math.min(1, predictability);
  }

  private static generateRecommendations(
    score: number,
    entropy: number,
    length: number,
  ): string[] {
    const recommendations: string[] = [];

    if (score < 0.8) {
      if (length < 12) recommendations.push("increase_length");
      if (entropy < 0.6) recommendations.push("increase_complexity");
    }

    if (length > 50) recommendations.push("consider_shorter");
    if (entropy < 0.4) recommendations.push("add_more_variety");

    return recommendations;
  }
}
