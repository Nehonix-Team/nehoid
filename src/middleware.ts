/* ---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 * -------------------------------------------------------------------------------------------
 */

/**
 * @fileoverview Middleware entry point for server-side frameworks.
 * This file should only be imported in Node.js/server environments.
 * 
 * @example
 * ```typescript
 * // Import from separate entry point
 * import { NehoIDMiddleware } from 'nehoid/middleware';
 * 
 * app.use(NehoIDMiddleware());
 * ```
 */

export { createMiddleware, createMiddleware as NehoIDMiddleware } from './integrations/middleware';
export type { MiddlewareOptions } from './integrations/middleware';
