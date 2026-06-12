# @hm-soft/pii-detect

텍스트·로그에서 **개인정보(PII)를 탐지하고 가립니다**. 주민번호·카드·전화·이메일.
로그 유출 방지, 사용자 입력 정제에. 의존성 0. [`@hm-soft/mask`](https://www.npmjs.com/package/@hm-soft/mask)·[`@hm-soft/korean-validators`](https://www.npmjs.com/package/@hm-soft/korean-validators)와 보안 라인업.

## 설치

```bash
npm install @hm-soft/pii-detect
```

## 사용

```ts
import { detectPII, redactPII, hasPII } from "@hm-soft/pii-detect";

const text = "연락처 010-1234-5678, 메일 a@b.com, 주민 901010-1234567";

detectPII(text);
// [ { type:"phone", value:"010-1234-5678", index:4, length:13 },
//   { type:"email", value:"a@b.com", ... },
//   { type:"rrn",   value:"901010-1234567", ... } ]

hasPII(text);                      // true

// 마스킹 (기본)
redactPII(text);
// "연락처 010-****-5678, 메일 a*@b.com, 주민 901010-1******"

// 라벨로 치환
redactPII(text, { mode: "label" });
// "연락처 [전화번호], 메일 [이메일], 주민 [주민등록번호]"

// 특정 종류만
detectPII(text, { types: ["email"] });
```

## API

| 함수 | 설명 |
|------|------|
| `detectPII(text, { types? })` | PII 위치 목록 `{ type, value, index, length }` |
| `hasPII(text, { types? })` | PII 존재 여부 |
| `redactPII(text, { mode?, types?, maskChar?, labels? })` | 마스킹/라벨 치환 |

- 탐지 종류: `rrn`(주민번호), `card`(카드), `phone`(전화/휴대폰), `email`
- `mode`: `"mask"`(부분 가림, 기본) / `"label"`(`[주민등록번호]` 등)
- 겹치는 매치는 우선순위로 자동 정리

> 정규식 기반이라 100% 정밀하지는 않습니다(특히 변형 표기). 1차 방어선으로 사용하고, 저장 단계 암호화/해싱과 병행하세요.

## License

Apache-2.0
