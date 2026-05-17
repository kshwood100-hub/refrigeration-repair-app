#!/usr/bin/env node
/**
 * cases.v3.json lint — pre-build 강제 검증
 *
 * 잡는 패턴:
 * 1. "박[음힘힌혀혔히았었는다아어을은이]" — 형 룰 위반 표현
 * 2. 다국어 필드(en/zh/ja/es/hi/vi/th/id/ar)에 한국어 글자 잔존
 * 3. 필드 빈 값 또는 placeholder
 * 4. ja 외 필드에 일본어 히라가나·가타카나 잔존
 * 5. hi/th/ar 필드 = 해당 문자체 (Devanagari/Thai/Arabic) 박혀있어야 함
 *
 * 1건이라도 잡히면 process.exit(1) → npm build 실패 → 배포 불가
 */

const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, '..', 'src', 'data', 'cases.v3.json');
const raw = fs.readFileSync(file, 'utf8');
const data = JSON.parse(raw);
const cases = Array.isArray(data) ? data : data.cases;
const langs = ['ko', 'en', 'zh', 'ja', 'es', 'hi', 'vi', 'th', 'id', 'ar'];
const nonKoLangs = langs.filter(l => l !== 'ko');

const errors = [];

// 1) "박" 패턴 grep (한국어 필드 + 전체)
const parkRe = /박[음힘힌혀혔히았었는다아어을은이]/g;
const parkMatches = raw.match(parkRe);
if (parkMatches && parkMatches.length > 0) {
  const counts = {};
  parkMatches.forEach(p => counts[p] = (counts[p] || 0) + 1);
  errors.push({
    type: 'PARK_EXPRESSION',
    severity: 'BLOCKER',
    count: parkMatches.length,
    detail: Object.entries(counts).map(([p, c]) => `${p}=${c}`).join(', '),
    rule: 'feedback_no_park_word.md — "박" 표현 금지 (형 명시 2026-05-10, 수십회 재강조)',
  });
}

// 2) 다국어 필드에 한국어 잔존
const koCharRe = /[ㄱ-ㆎ가-힣]/;
const koLeaks = [];
cases.forEach(c => {
  const fields = [['title', c.title], ['tip', c.tip]];
  (c.causes || []).forEach((cs, i) => {
    fields.push([`causes[${i}].name`, cs.name]);
    fields.push([`causes[${i}].check`, cs.check]);
    fields.push([`causes[${i}].fix`, cs.fix]);
  });
  fields.forEach(([path, obj]) => {
    if (!obj) return;
    nonKoLangs.forEach(L => {
      const v = obj[L];
      if (v && koCharRe.test(v)) {
        const ko = (v.match(/[ㄱ-ㆎ가-힣]+/g) || []).join('|');
        koLeaks.push(`${c.id} ${path}.${L}: [${ko}]`);
      }
    });
  });
});
if (koLeaks.length > 0) {
  errors.push({
    type: 'KOREAN_LEAK_IN_NON_KO_FIELD',
    severity: 'BLOCKER',
    count: koLeaks.length,
    detail: koLeaks.slice(0, 10).join(' | '),
    rule: '다국어 일관성 — en/zh/ja/es/hi/vi/th/id/ar 필드에 한국어 글자 잔존 금지',
  });
}

// 3) 빈 값/placeholder
const placeholderRe = /^(undefined|null|TODO|FIXME|XXX|<<<|>>>|placeholder|TBD)$/i;
const emptyFields = [];
cases.forEach(c => {
  const fields = [['title', c.title], ['tip', c.tip]];
  (c.causes || []).forEach((cs, i) => {
    fields.push([`causes[${i}].name`, cs.name]);
    fields.push([`causes[${i}].check`, cs.check]);
    fields.push([`causes[${i}].fix`, cs.fix]);
  });
  fields.forEach(([p, obj]) => {
    if (!obj) return;
    langs.forEach(L => {
      const v = obj[L];
      if (!v) { emptyFields.push(`${c.id} ${p}.${L}: MISSING`); return; }
      if (placeholderRe.test(v.trim())) emptyFields.push(`${c.id} ${p}.${L}: [${v.trim()}]`);
    });
  });
});
if (emptyFields.length > 0) {
  errors.push({
    type: 'EMPTY_OR_PLACEHOLDER',
    severity: 'BLOCKER',
    count: emptyFields.length,
    detail: emptyFields.slice(0, 10).join(' | '),
    rule: '10개국 언어 완전성 — 모든 필드 (title·causes name/check/fix·tip × 10langs) 채워야 함',
  });
}

// 4) 일본어 가나 잔존 (ja 외 필드)
const jaKanaRe = /[぀-ゟ゠-ヿ]/;
const jaLeaks = [];
cases.forEach(c => {
  const fields = [['title', c.title], ['tip', c.tip]];
  (c.causes || []).forEach((cs, i) => {
    fields.push([`causes[${i}].name`, cs.name]);
    fields.push([`causes[${i}].check`, cs.check]);
    fields.push([`causes[${i}].fix`, cs.fix]);
  });
  fields.forEach(([p, obj]) => {
    if (!obj) return;
    langs.filter(l => l !== 'ja').forEach(L => {
      const v = obj[L];
      if (v && jaKanaRe.test(v)) jaLeaks.push(`${c.id} ${p}.${L}`);
    });
  });
});
if (jaLeaks.length > 0) {
  errors.push({
    type: 'JAPANESE_KANA_LEAK',
    severity: 'BLOCKER',
    count: jaLeaks.length,
    detail: jaLeaks.slice(0, 10).join(' | '),
    rule: '다국어 일관성 — ja 외 필드에 일본어 히라가나·가타카나 잔존 금지',
  });
}

// 5) 각 언어 필수 문자체 검증 (hi=Devanagari, th=Thai, ar=Arabic) — 본문 길이 50+ 필드만
const scriptChecks = [
  { lang: 'hi', re: /[ऀ-ॿ]/, name: 'Devanagari' },
  { lang: 'th', re: /[฀-๿]/, name: 'Thai' },
  { lang: 'ar', re: /[؀-ۿ]/, name: 'Arabic' },
];
const scriptLeaks = [];
cases.forEach(c => {
  const fields = [['title', c.title], ['tip', c.tip]];
  (c.causes || []).forEach((cs, i) => {
    fields.push([`causes[${i}].name`, cs.name]);
    fields.push([`causes[${i}].check`, cs.check]);
    fields.push([`causes[${i}].fix`, cs.fix]);
  });
  fields.forEach(([p, obj]) => {
    if (!obj) return;
    scriptChecks.forEach(({ lang, re, name }) => {
      const v = obj[lang];
      if (v && v.length > 50 && !re.test(v)) {
        scriptLeaks.push(`${c.id} ${p}.${lang}: missing ${name} script`);
      }
    });
  });
});
if (scriptLeaks.length > 0) {
  errors.push({
    type: 'WRONG_SCRIPT',
    severity: 'BLOCKER',
    count: scriptLeaks.length,
    detail: scriptLeaks.slice(0, 10).join(' | '),
    rule: 'hi/th/ar 필드 = 해당 문자체 (Devanagari/Thai/Arabic) 박혀있어야 함',
  });
}

// 결과 출력
if (errors.length === 0) {
  console.log(`✅ lint-cases PASS: ${cases.length} cases, ${cases.length * 10} ko-fields × 10langs`);
  process.exit(0);
} else {
  console.error('');
  console.error('❌ lint-cases FAIL — 빌드 차단 (메모리 룰 강제 lint)');
  console.error('═══════════════════════════════════════════════════════════');
  errors.forEach(e => {
    console.error('');
    console.error(`[${e.severity}] ${e.type} (${e.count}건)`);
    console.error(`  룰: ${e.rule}`);
    console.error(`  사례: ${e.detail}`);
  });
  console.error('');
  console.error('═══════════════════════════════════════════════════════════');
  console.error('정정 후 다시 build 시도. lint 통과 전에는 배포 불가.');
  console.error('');
  process.exit(1);
}
