# 냉동기수리실무 프로젝트

## 🚨 보안 필수 준수 (모든 작업 전 확인)

이 항목들은 절대 우회·삭제하지 말 것. 위반 시 비용 공격·정보 유출로 직결.

### 코드 작성 규칙
1. **Cloud Functions 새 엔드포인트** — 반드시 `functions/index.js`의 `verifyAuth(req, res)` 호출. `cors: true` 금지(대신 `applyCors`). OpenAI 등 외부 API 호출 시 `max_tokens` 명시. base64/대용량 입력은 `checkBase64`/`checkText`로 크기 검증.
2. **클라이언트에서 `/api/*` 호출** — 반드시 `src/utils/apiClient.js`의 `apiFetch()` 사용. 직접 `fetch('/api/...')` 금지(인증 헤더 누락됨).
3. **DOM 조작** — `innerHTML`, `dangerouslySetInnerHTML`, `eval`, `new Function` 절대 금지. `textContent` + `createElement` 사용.
4. **외부 링크** — `target="_blank"`에 `rel="noopener noreferrer"` 항상 함께.
5. **Firestore 컬렉션 추가** — `firestore.rules` 동시 수정. `firebase deploy --only firestore:rules` 잊지 말 것.
6. **보안 헤더** — `firebase.json` 의 CSP, X-Frame-Options, Referrer-Policy, X-Content-Type-Options 제거 금지.
7. **민감 데이터** — localStorage에 토큰·비밀키 저장 금지. 백업 JSON에 비밀번호 옵션 향후 검토.

### 사용자 측 콘솔 작업 (TODO — 사용자 본인이 처리)
- [ ] Firebase Console → Firestore Rules 배포 (`firebase deploy --only firestore:rules`)
- [ ] GCP Console → Web API 키에 HTTP referrer 제한 (`https://www.r-pro.app/*`, `https://r-pro-6cb33.web.app/*`)
- [ ] Sentry → Allowed Domains를 `r-pro.app`만 허용
- [ ] Paddle webhook 붙일 때 시그니처 검증 + allowed_users 등록은 서버에서만

상세 내역: `~/.claude/projects/c--rpro/memory/security_rules.md`

## 프로젝트 개요
- 냉동기 현장 점검 및 수리 실무 앱
- 훈련용이 아닌 실제 현장 기사용
- 현장에서 바로 참조하며 사용하는 실무집

## 대상 사용자
- 현장 냉동기 수리 기사

## 사용 기기
- 스마트폰 / 태블릿 (모바일 우선)

## 주요 기능
1. 고장 증상 → 원인 → 수리 절차 가이드
2. 점검 체크리스트 (완료 체크 + 저장)
3. 냉매 종류별 정보
4. 부품 교체 절차
5. 점검/수리 이력 저장

## 요구사항
- 오프라인 작동 필수 (현장 인터넷 없는 환경)
- 데이터 저장 필요 (점검 기록, 수리 이력)

## 기술 스택 (확정)
- React + Vite
- Tailwind CSS (모바일 UI)
- Dexie.js (오프라인 데이터 저장 - IndexedDB)
- PWA (Service Worker) - 앱스토어 없이 설치 가능

## 배포
- Firebase Hosting
- 주소: https://www.r-pro.app

## 판매 계획
- 베타 없이 바로 상용 판매 예정
- 판매 대상: 현장 냉동기 수리 기사
- 마케팅 채널: 해외 블로거/커뮤니티 검토 중
- 결제: Paddle 심사 대기 중 (Lemon Squeezy는 거부됨)

## 로그인/접근 제어 현황
- Firebase Auth (Google 로그인) 구현 완료
- 허용된 이메일 외 로그인 시 자동 로그아웃 + Access denied
- **허용 이메일 체크 구조** (src/hooks/useAuth.jsx):
  1. 1차: Firestore `allowed_users` 컬렉션 조회 → 재배포 없이 추가/삭제 가능
  2. 2차 폴백: 하드코딩된 FALLBACK_ALLOWED_EMAILS 4개 (지인 테스트용, 유지)
- **상용 전환 시 남은 작업:**
  - Paddle 결제 webhook → Firestore `allowed_users` 자동 등록
  - 환불 webhook → Firestore `allowed_users` 자동 삭제

## 현재 완료된 작업
- 전체 26개 페이지 i18n 완료 (ko, en, zh, ja, es, hi 6개 언어)
- 모든 locale 파일 완성: src/locales/{ko,en,zh,ja,es,hi}.json

## 출시 전 체크리스트
- [ ] 결제 연동 (Paddle 심사 대기 — Lemon Squeezy 거부됨)
- [ ] 구매 링크 앱에 연결
- [ ] Paddle 결제 webhook → Firestore `allowed_users` 자동 등록/삭제
- [x] Sentry 에러 트래킹 도입 (@sentry/react) — main.jsx PROD 자동 활성, Allowed Domains 4개 화이트리스트 적용
- [x] 자동 백업 기능 (IndexedDB 데이터 보호) — 폰 내부 24h 자동 백업(롤링 3개) + navigator.share 외부 공유 완료
- [ ] 현장 기사 실기기 테스트
- [ ] SEO 태그 추가 (출시 직전, 사용자와 내용 협의 후) — title/description/og태그 — index.html에 추가
- [ ] 앱 소개 + 스크린샷 준비
- [ ] 테스트 데이터 버튼·유틸 제거 (src/utils/testData.js, SettingsPage)

## 데이터 자동 갱신
- 데이터 파일(symptoms.json, flowchart.json, checklist.json) 수정 후 배포만 하면 됨
- 빌드 시 vite.config.js가 데이터 해시를 자동 생성 → 앱이 열릴 때 해시 비교 → 변경 시 자동 갱신
- DATA_VERSION 수동 관리 불필요
- 번역 검증 시 "필드 유무"가 아니라 "내용 품질"까지 검사할 것
- flowchart.json result 노드 필드: title, conclusion, causes, steps, warning (5종 × 6개 언어)

## 다음 할 일 (우선순위 순)
1. Paddle 결제 webhook → Firestore allowed_users 자동 등록/삭제
2. 결제 연동 (Paddle 승인 대기 중)
3. Sentry 에러 트래킹
4. 자동 백업 기능
5. 현장 기사 실기기 테스트
6. SEO 태그 (출시 직전)
7. 마케팅 계획 수립