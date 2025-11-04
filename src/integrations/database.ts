/**
 * Database ORM integrations for NehoID
 * Provides adapters for popular ORMs and database libraries
 */

import { NehoID } from '../mods/nehoid';

/**
 * Options for ID field generation
 */
export interface IdFieldOptions {
  /** Prefix to add to the ID */
  prefix?: string;
  /** ID format to use */
  format?: 'standard' | 'uuid' | 'short' | 'nano' | 'semantic';
  /** Whether to ensure uniqueness in the database */
  ensureUnique?: boolean;
  /** Custom ID generator function */
  generator?: () => string;
  /** Additional options for semantic IDs */
  semantic?: {
    region?: string;
    department?: string;
    year?: number;
    customSegments?: Record<string, string | number>;
  };
}

/**
 * Generate a default ID field for Mongoose schemas
 * @param options ID field options
 * @returns Mongoose schema field definition
 */
export function mongooseField(options: IdFieldOptions = {}) {
  const {
    prefix = '',
    format = 'standard',
    ensureUnique = true,
    generator,
    semantic
  } = options;
  
  // Return a Mongoose schema field definition
  return {
    type: String,
    default: function() {
      // Use custom generator if provided
      if (generator) {
        return generator();
      }
      
      // Generate ID based on format
      if (format === 'uuid') {
        return NehoID.uuid();
      } else if (format === 'nano') {
        return NehoID.nanoid();
      } else if (format === 'short') {
        return NehoID.short();
      } else if (format === 'semantic' && semantic) {
        return NehoID.semantic({
          prefix,
          ...semantic
        });
      } else {
        return NehoID.generate({ prefix });
      }
    },
    unique: ensureUnique,
    required: true,
    index: true
  };
}

/**
 * Generate a default ID field for Sequelize models
 * @param options ID field options
 * @returns Sequelize model field definition
 */
export function sequelizeField(options: IdFieldOptions = {}) {
  const {
    prefix = '',
    format = 'standard',
    ensureUnique = true,
    generator,
    semantic
  } = options;
  
  // Return a Sequelize field definition
  return {
    type: 'STRING',
    primaryKey: true,
    defaultValue: () => {
      // Use custom generator if provided
      if (generator) {
        return generator();
      }
      
      // Generate ID based on format
      if (format === 'uuid') {
        return NehoID.uuid();
      } else if (format === 'nano') {
        return NehoID.nanoid();
      } else if (format === 'short') {
        return NehoID.short();
      } else if (format === 'semantic' && semantic) {
        return NehoID.semantic({
          prefix,
          ...semantic
        });
      } else {
        return NehoID.generate({ prefix });
      }
    },
    unique: ensureUnique
  };
}

/**
 * Generate a default ID field for TypeORM entities
 * @param options ID field options
 * @returns TypeORM decorator factory
 */
export function typeormDecorator(options: IdFieldOptions = {}) {
  const {
    prefix = '',
    format = 'standard',
    ensureUnique = true,
    generator,
    semantic
  } = options;
  
  // Return a decorator factory function
  return function() {
    return function(target: any, propertyKey: string) {
      // Define property descriptor
      Object.defineProperty(target, propertyKey, {
        get: function() {
          // Generate ID if not already set
          if (!this[`_${propertyKey}`]) {
            // Use custom generator if provided
            if (generator) {
              this[`_${propertyKey}`] = generator();
            } else if (format === 'uuid') {
              this[`_${propertyKey}`] = NehoID.uuid();
            } else if (format === 'nano') {
              this[`_${propertyKey}`] = NehoID.nanoid();
            } else if (format === 'short') {
              this[`_${propertyKey}`] = NehoID.short();
            } else if (format === 'semantic' && semantic) {
              this[`_${propertyKey}`] = NehoID.semantic({
                prefix,
                ...semantic
              });
            } else {
              this[`_${propertyKey}`] = NehoID.generate({ prefix });
            }
          }
          return this[`_${propertyKey}`];
        },
        set: function(value: string) {
          this[`_${propertyKey}`] = value;
        },
        enumerable: true,
        configurable: true
      });
    };
  };
}