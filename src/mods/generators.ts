import { Generator } from "../core/generator";
import {
  IdGeneratorOptions,
  CollisionStrategy,
  BatchOptions,
} from "../types/index";

/**
 * Core generation methods for NehoID
 */
export class CoreGenerators {
  static generate(options: Partial<IdGeneratorOptions> = {}): string {
    return Generator.generate(options);
  }

  static async safe(options: CollisionStrategy): Promise<string> {
    return await Generator.safe(options);
  }

  static uuid(): string {
    return Generator.uuid();
  }

  static nanoid(length?: number): string {
    return Generator.nano(length);
  }

  static short(length?: number): string {
    return Generator.short(length);
  }

  static hex(length?: number): string {
    return Generator.hex(length);
  }

  static batch(options: BatchOptions): string[] {
    return Generator.batch(options);
  }
}
