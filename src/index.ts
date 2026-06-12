/**
 * @hm-soft/pii-detect
 * 텍스트·로그에서 개인정보 탐지·마스킹 (의존성 0).
 *
 *   import { detectPII, redactPII, hasPII } from "@hm-soft/pii-detect";
 */
export { detectPII, redactPII, hasPII } from "./pii-detect.js";
export type { PiiType, PiiMatch, DetectOptions, RedactOptions } from "./pii-detect.js";
