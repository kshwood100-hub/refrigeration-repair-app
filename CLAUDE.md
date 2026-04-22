# 냉동기수리실무 프로젝트

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
- 결제: Paddle 검토 중 (기존 Lemon Squeezy에서 변경)

## 로그인/접근 제어 현황
- Firebase Auth (Google 로그인) 구현 완료
- src/hooks/useAuth.jsx에 ALLOWED_EMAILS 화이트리스트 존재
- 허용된 이메일 외 로그인 시 자동 로그아웃 + Access denied
- 현재는 지인 테스트용 수동 관리 (코드에 이메일 하드코딩)
- **상용 전환 시 필요한 개선:**
  - ALLOWED_EMAILS를 Firestore로 이동 → 재배포 없이 추가/삭제
  - Paddle 결제 webhook → Firestore 자동 등록
  - 환불 webhook → Firestore 자동 삭제

## 현재 완료된 작업
- 전체 26개 페이지 i18n 완료 (ko, en, zh, ja, es, hi 6개 언어)
- 모든 locale 파일 완성: src/locales/{ko,en,zh,ja,es,hi}.json

## 출시 전 체크리스트
- [ ] Paddle 결제 연동 (심사 대기 중)
- [ ] 구매 링크 앱에 연결
- [ ] ALLOWED_EMAILS → Firestore 이전 + Paddle webhook 자동화
- [ ] Sentry 에러 트래킹 도입 (@sentry/react)
- [ ] 자동 백업 기능 (IndexedDB 데이터 보호)
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
1. ALLOWED_EMAILS 자동화 (Firestore + Paddle webhook)
2. Paddle 결제 연동
3. Sentry 에러 트래킹
4. 자동 백업 기능
5. 현장 기사 실기기 테스트
6. SEO 태그 (출시 직전)
7. 마케팅 계획 수립