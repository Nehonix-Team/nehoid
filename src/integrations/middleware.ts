/*---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

/**
 * Express middleware integration for NehoID
 * Provides request ID generation and tracking
 */

import { NehoID } from "../mods/nehoid";

/**
 * Express middleware options
 */
export interface MiddlewareOptions {
  /** Header name to use for the request ID */
  header?: string;
  /** ID format to use */
  format?: "standard" | "uuid" | "short" | "nano";
  /** Whether to expose the ID as a response header */
  exposeHeader?: boolean;
  /** Whether to add the ID to the request object */
  addToRequest?: boolean;
  /** Custom ID generator function */
  generator?: () => string;

  /**
   * Generate a name while requesting.
   * @default NehoID
   *
   * @example ```js
   *    const headerId = req.NehoID
   *
   * console.log(headerId) //undefined or something-like-this
   * ```
   *
   */
  name4Req?: string;
}

/**
 * Create Express middleware for request ID generation
 * @param options Middleware configuration options
 * @returns Express middleware function
 */
export function createMiddleware(options: MiddlewareOptions = {}) {
  const {
    header = "X-Request-ID",
    format = "short",
    exposeHeader = true,
    addToRequest = true,
    generator,
  } = options;

  // Return the middleware function
  return function nehoidMiddleware(req: any, res: any, next: Function) {
    // Generate or use existing ID
    let requestId = req.headers[header.toLowerCase()];

    if (!requestId) {
      // Generate new ID based on format or custom generator
      if (generator) {
        requestId = generator();
      } else if (format === "uuid") {
        requestId = NehoID.uuid();
      } else if (format === "nano") {
        requestId = NehoID.nanoid();
      } else if (format === "short") {
        requestId = NehoID.short();
      } else {
        requestId = NehoID.generate();
      }
    }

    // Add ID to request object if enabled
    if (addToRequest) {
      req[options.name4Req || "NehoID"] = requestId;
    }

    // Add ID to response header if enabled
    if (exposeHeader) {
      res.setHeader(header, requestId);
    }

    // Continue with request
    next();
  };
}
