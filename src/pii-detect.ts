/**
 * 텍스트·로그에서 개인정보(PII)를 탐지하고 가립니다.
 * 로그 유출 방지, 사용자 입력 정제 등에 사용.
 */

export type PiiType = "rrn" | "card" | "phone" | "email";

export interface PiiMatch {
  type: PiiType;
  value: string;
  index: number;
  length: number;
}

// 패턴 (priority 낮을수록 우선 — 겹칠 때 우선 채택)
const PATTERNS: Array<{ type: PiiType; re: RegExp; priority: number }> = [
  // 주민등록번호: YYMMDD + 성별(1~4) + 6자리
  { type: "rrn", priority: 1, re: /\b\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])[-\s]?[1-4]\d{6}\b/g },
  // 카드번호: 4-4-4-4
  { type: "card", priority: 2, re: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g },
  // 이메일
  { type: "email", priority: 3, re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  // 전화/휴대폰: 0으로 시작
  { type: "phone", priority: 4, re: /\b0(?:1[016789]|2|[3-6]\d)[-.\s]?\d{3,4}[-.\s]?\d{4}\b/g },
];

const DEFAULT_LABELS: Record<PiiType, string> = {
  rrn: "[주민등록번호]",
  card: "[카드번호]",
  phone: "[전화번호]",
  email: "[이메일]",
};

export interface DetectOptions {
  /** 탐지할 종류 (기본 전체) */
  types?: PiiType[];
}

/** 텍스트에서 PII를 모두 찾아 위치와 함께 반환(겹침 제거). */
export function detectPII(text: string, opts: DetectOptions = {}): PiiMatch[] {
  const s = text ?? "";
  const enabled = opts.types;
  const raw: Array<PiiMatch & { priority: number }> = [];

  for (const { type, re, priority } of PATTERNS) {
    if (enabled && !enabled.includes(type)) continue;
    for (const m of s.matchAll(re)) {
      raw.push({ type, value: m[0], index: m.index ?? 0, length: m[0].length, priority });
    }
  }

  // 겹침 제거: 시작 위치 → 우선순위 → 길이 순으로 정렬 후 비겹침만 채택
  raw.sort((a, b) => a.index - b.index || a.priority - b.priority || b.length - a.length);
  const result: PiiMatch[] = [];
  let end = -1;
  for (const m of raw) {
    if (m.index >= end) {
      result.push({ type: m.type, value: m.value, index: m.index, length: m.length });
      end = m.index + m.length;
    }
  }
  return result;
}

/** PII가 하나라도 있는지. */
export function hasPII(text: string, opts: DetectOptions = {}): boolean {
  return detectPII(text, opts).length > 0;
}

function maskKeep(value: string, keepStart: number, keepEnd: number, maskChar: string): string {
  const total = (value.match(/\d/g) ?? []).length;
  let idx = 0;
  let out = "";
  for (const ch of value) {
    if (ch >= "0" && ch <= "9") {
      out += idx < keepStart || idx >= total - keepEnd ? ch : maskChar;
      idx++;
    } else {
      out += ch;
    }
  }
  return out;
}

function maskEmail(value: string, maskChar: string): string {
  const at = value.indexOf("@");
  if (at < 0) return value;
  const local = value.slice(0, at);
  const keep = local.length > 2 ? 2 : 1;
  return local.slice(0, keep) + maskChar.repeat(Math.max(local.length - keep, 1)) + value.slice(at);
}

function maskValue(type: PiiType, value: string, maskChar: string): string {
  switch (type) {
    case "rrn":
      return maskKeep(value, 7, 0, maskChar);
    case "card":
      return maskKeep(value, 4, 4, maskChar);
    case "phone":
      return maskKeep(value, 3, 4, maskChar);
    case "email":
      return maskEmail(value, maskChar);
  }
}

export interface RedactOptions extends DetectOptions {
  /** "mask"(부분 가림, 기본) | "label"(예: [주민등록번호]) */
  mode?: "mask" | "label";
  maskChar?: string;
  /** label 모드에서 종류별 치환 문구 */
  labels?: Partial<Record<PiiType, string>>;
}

/** 탐지된 PII를 마스킹하거나 라벨로 치환한 텍스트를 반환. */
export function redactPII(text: string, opts: RedactOptions = {}): string {
  const s = text ?? "";
  const mode = opts.mode ?? "mask";
  const maskChar = opts.maskChar ?? "*";
  const labels = { ...DEFAULT_LABELS, ...(opts.labels ?? {}) };

  const matches = detectPII(s, opts);
  let out = "";
  let cursor = 0;
  for (const m of matches) {
    out += s.slice(cursor, m.index);
    out += mode === "label" ? labels[m.type] : maskValue(m.type, m.value, maskChar);
    cursor = m.index + m.length;
  }
  out += s.slice(cursor);
  return out;
}
