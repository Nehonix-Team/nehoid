/*---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Wrapper for nehonix-uri-processor with browser-safe fallbacks
 * This prevents Express from being bundled in browser environments
 */

// Try to import processor, but don't fail if it's not available
let processor: any = null;

try {
  // Dynamic import to prevent bundling in browser
  if (typeof window === 'undefined') {
    // Only import in Node.js environment
    processor = require('nehonix-uri-processor').__processor__;
  }
} catch (e) {
  // Processor not available, will use fallbacks
}

// Simple fallback encoders for browser environments
const fallbackEncoders = {
  base64: (str: string) => {
    if (typeof btoa !== 'undefined') {
      return btoa(str);
    }
    return Buffer.from(str).toString('base64');
  },
  
  hex: (str: string) => {
    return Array.from(str)
      .map(c => c.charCodeAt(0).toString(16).padStart(2, '0'))
      .join('');
  },
  
  rawHex: (str: string) => str,
  
  base58: (str: string) => {
    // Simple base58 implementation
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    const bytes = Array.from(str).map(c => c.charCodeAt(0));
    let num = BigInt(0);
    for (const byte of bytes) {
      num = num * BigInt(256) + BigInt(byte);
    }
    
    let encoded = '';
    while (num > 0) {
      const remainder = Number(num % BigInt(58));
      encoded = ALPHABET[remainder] + encoded;
      num = num / BigInt(58);
    }
    
    return encoded || ALPHABET[0];
  }
};

const fallbackDecoders = {
  base64: (str: string) => {
    if (typeof atob !== 'undefined') {
      return atob(str);
    }
    return Buffer.from(str, 'base64').toString();
  },
  
  hex: (str: string) => {
    const bytes = str.match(/.{1,2}/g) || [];
    return bytes.map(byte => String.fromCharCode(parseInt(byte, 16))).join('');
  },
  
  rawHex: (str: string) => str,
  
  base58: (str: string) => {
    // Simple base58 decode
    const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let num = BigInt(0);
    for (const char of str) {
      const index = ALPHABET.indexOf(char);
      if (index === -1) throw new Error('Invalid base58 character');
      num = num * BigInt(58) + BigInt(index);
    }
    
    const bytes: number[] = [];
    while (num > 0) {
      bytes.unshift(Number(num % BigInt(256)));
      num = num / BigInt(256);
    }
    
    return String.fromCharCode(...bytes);
  }
};

export const __processor__ = {
  encode: (input: string, encoding: string): string => {
    if (processor) {
      return processor.encode(input, encoding);
    }
    
    // Use fallback
    const encoder = fallbackEncoders[encoding as keyof typeof fallbackEncoders];
    return encoder ? encoder(input) : input;
  },
  
  decode: (input: string, encoding: string): string => {
    if (processor) {
      return processor.decode(input, encoding);
    }
    
    // Use fallback
    const decoder = fallbackDecoders[encoding as keyof typeof fallbackDecoders];
    return decoder ? decoder(input) : input;
  },
  
  encodeMultiple: (input: string, encodings: string[]): any => {
    if (processor) {
      return processor.encodeMultiple(input, encodings);
    }
    
    // Fallback: apply encodings in sequence
    let result = input;
    const results = encodings.map(encoding => {
      const encoder = fallbackEncoders[encoding as keyof typeof fallbackEncoders];
      result = encoder ? encoder(result) : result;
      return { encoded: result, encoding };
    });
    
    return { results };
  },
  
  encodeMultipleAsync: async (input: string, encodings: string[]): Promise<any> => {
    if (processor) {
      return await processor.encodeMultipleAsync(input, encodings);
    }
    
    // Fallback: same as sync version
    return __processor__.encodeMultiple(input, encodings);
  },
  
  autoDetectAndDecode: (input: string): any => {
    if (processor) {
      return processor.autoDetectAndDecode(input);
    }
    
    // Fallback: try to detect encoding
    const hexRegex = /^[0-9a-f]+$/i;
    const base64Regex = /^[A-Za-z0-9+/]+=*$/;
    
    if (hexRegex.test(input)) {
      return { val: () => fallbackDecoders.hex(input) };
    } else if (base64Regex.test(input) && input.length % 4 === 0) {
      try {
        return { val: () => fallbackDecoders.base64(input) };
      } catch {
        return { val: () => input };
      }
    }
    
    return { val: () => input };
  }
};
