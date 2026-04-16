/*---------------------------------------------------------------------------------------------
 *  Copyright (c) NEHONIX INC. All rights reserved.
 *  Licensed under the MIT License. See LICENSE in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { __strl__, StruLink } from "strulink";
import { ENC_TYPE } from "../core/encoder";

export const __processor__ = {
  encode: (input: string, encoding: ENC_TYPE): string => {
    return __strl__.encode(input, encoding);
  },

  decode: (
    input: string,
    encoding: Parameters<typeof StruLink.decode>[1],
  ): string => {
    return __strl__.decode(input, encoding);
  },

  encodeMultiple: (input: string, encodings: ENC_TYPE[]): any => {
    return __strl__.encodeMultiple(input, encodings);
  },

  encodeMultipleAsync: async (
    input: string,
    encodings: ENC_TYPE[],
  ): Promise<any> => {
    return await __strl__.encodeMultipleAsync(input, encodings);
  },

  autoDetectAndDecode: (input: string): any => {
    return __strl__.autoDetectAndDecode(input);
  },
};
