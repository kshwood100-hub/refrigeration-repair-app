# R-Pro 앱 브리핑 (AI용)

## 한 줄 소개
냉동기 수리 기사가 **현장에서 바로 참조**하는 실무 가이드 PWA. (훈련용 아님)

## 대상 사용자
- 냉동·공조 현장 수리 기사 (한국 + 해외)
- 사용 기기: 스마트폰·태블릿 (모바일 우선)

## 핵심 기능
1. **진단 검색** — 증상 키워드 → 원인·점검·조치 (`/diagnosis`)
2. **고장 케이스 DB** — 361건 v3 스키마 (cases.v3.json)
3. **점검 체크리스트** — 완료 체크 + 저장
4. **냉매 정보** — 종류별 압력·용도
5. **수리 이력 저장** — IndexedDB (오프라인)
6. **QR 코드 자산 관리**
7. **다국어 지원** — 10개 언어 (ko/en/zh/ja/es/hi/vi/th/id/ar)

## 오프라인 필수
현장에 인터넷이 없는 경우가 많음 → PWA + Service Worker + IndexedDB(Dexie) 로 전부 오프라인 동작.

## 자동 업데이트
- `vite.config.js` 의 `dataHashPlugin` 이 빌드 시 데이터 해시 자동 생성
- 앱 시작 시 해시 비교 → 다르면 IndexedDB 자동 갱신
- **DATA_VERSION 수동 관리 불필요**

## 기술 스택
- **Frontend**: React + Vite
- **UI**: Tailwind CSS
- **오프라인 DB**: Dexie.js (IndexedDB)
- **PWA**: Service Worker
- **배포**: Firebase Hosting
- **인증**: Firebase Auth (Google 로그인)
- **에러 추적**: Sentry (PROD 자동 초기화)

## 배포
- 앱 본체: https://www.r-pro.app (Firebase 프로젝트: `r-pro-6cb33`)
- 마케팅 홈: 별도 Firebase 프로젝트 `rpro-website`

## 접근 제어 구조
`src/hooks/useAuth.jsx` 에서:
1. 1차: Firestore `allowed_users` 컬렉션 조회 (재배포 없이 추가/삭제 가능)
2. 2차 폴백: 하드코딩된 4개 이메일 (지인 테스트용)
- 허용 외 로그인 → 자동 로그아웃 + Access denied

## 판매·비즈니스
- **베타 없이 바로 상용 판매 예정**
- 대상: 전 세계 현장 기사
- 결제: **Paddle 심사 대기 중** (Lemon Squeezy는 거부됨)
- Play Store 배포 예정 (TWA 래퍼 + Digital Asset Links 필요)

## 현재 진행 상황 (2026-04-24 기준)
### 완료
- 전체 26개 페이지 i18n (10개 언어)
- Sentry 연결
- 진단 검색 v3 통합 (`/diagnosis` 단일 검색창)
- 고장 케이스 361건 수집·병합
- 자동 업데이트 아키텍처
- 글자 크기 설정 (보통/크게/아주 크게)

### 진행 중
- 데이터 번역 (searchDatabase.json vi/th/id/ar 완료, cases.v3.json 번역 미착수 — 약 44,000건 필요)

### 남은 작업 (우선순위 순)
1. Paddle 결제 webhook → Firestore `allowed_users` 자동 등록/삭제
2. 결제 연동 (Paddle 승인 대기)
3. 자동 백업 기능 (IndexedDB 데이터 보호)
4. 현장 기사 실기기 테스트
5. SEO 태그 (출시 직전)
6. 법적 페이지 (Refund/Terms/Privacy/Contact — 결제 심사 위해 필요)
7. 테스트 데이터 버튼·유틸 제거

## 제품 방향 (장기)
- **Real Pro**: 냉동 → 전 업종(전기·배관·엘리베이터 등) 확장 계획
- 업종별 전용 모듈 (옵션 A) — 냉동 먼저 출시 후 확장
- v1.1: RAG 기반 AI 진단 (로컬 검색 + Claude Haiku 요약)
- v1.2: 데이터 수집 + 커뮤니티 평가 시스템 (👍/👎/✏️ + 티어 가중치)

## 사용자 프로필
- **코딩 초보** (코딩 첫 경험). 전문 용어 옆에 풀이 필요. 반말로 대화.
- 선호 AI 모델: `claude-opus-4-7`
- 규칙: 짧고 직접적, 장황한 설명 금지, 가장 짧은 수정 경로 우선

## 핵심 파일
- `CLAUDE.md` — 프로젝트 지시사항 (필독)
- `src/data/symptoms.json` — 증상 DB
- `src/data/cases.v3.json` — 고장 케이스 361건
- `src/data/searchDatabase.json` — 진단 검색 DB 286건
- `src/data/flowchart.json` — 진단 플로우차트
- `src/locales/{ko,en,zh,ja,es,hi,vi,th,id,ar}.json` — UI 번역
- `src/hooks/useAuth.jsx` — 로그인/접근 제어
- `vite.config.js` — dataHashPlugin
- `src/main.jsx` — Sentry 초기화

## 알려진 이슈
- searchDatabase.json 의 9개 엔트리(277~285)에서 ko/en 필드 주제 불일치 (ko 기준으로 번역 완료, en 재정리 필요)
- cases.v3.json 은 ko/en/zh/ja/es/hi 만 있음. vi/th/id/ar 미번역.

## 사업자 정보
- 상호: 마켓프리(market free)
- 사업자번호: 208-22-97324
- 간이과세, 김포세무서
