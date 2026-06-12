import { test } from "node:test";
import assert from "node:assert/strict";
import { detectPII, redactPII, hasPII } from "../dist/index.js";

const SAMPLE = "연락처 010-1234-5678, 메일 a@b.com, 주민 901010-1234567 입니다";

test("detectPII: 종류별 탐지", () => {
  const found = detectPII(SAMPLE);
  const types = found.map((f) => f.type).sort();
  assert.deepEqual(types, ["email", "phone", "rrn"]);
});

test("hasPII", () => {
  assert.equal(hasPII(SAMPLE), true);
  assert.equal(hasPII("그냥 평범한 문장입니다"), false);
});

test("카드번호 탐지", () => {
  const found = detectPII("카드 1234-5678-9012-3456");
  assert.equal(found.length, 1);
  assert.equal(found[0].type, "card");
});

test("redactPII: 마스킹 모드", () => {
  const out = redactPII(SAMPLE);
  assert.match(out, /010-\*\*\*\*-5678/);
  assert.match(out, /a\*@b\.com/);
  assert.match(out, /901010-1\*{6}/);
  assert.doesNotMatch(out, /1234567\b/); // 원본 주민 뒷자리 사라짐
});

test("redactPII: 라벨 모드", () => {
  const out = redactPII(SAMPLE, { mode: "label" });
  assert.match(out, /\[전화번호\]/);
  assert.match(out, /\[이메일\]/);
  assert.match(out, /\[주민등록번호\]/);
});

test("types 필터", () => {
  const found = detectPII(SAMPLE, { types: ["email"] });
  assert.equal(found.length, 1);
  assert.equal(found[0].type, "email");
});

test("PII 없으면 원본 그대로", () => {
  const txt = "주문번호 ORD-2024-001 처리완료";
  assert.equal(redactPII(txt), txt);
});
