# R-Pro 역설계 플랜 (작성 중)

> 목적: 너랑 나의 공통 지도 + 운영 룰 + 결함 등록부.
> 매 영역마다 4섹션: 흐름 / 위협 / ⚠️결함 / 운영룰.
> 새 세션 시작 시 이 문서 의무 통과 후 작업.

작성: 2026-05-01
상태: 🔄 진행 중 (15개 영역 중 2개 완료)

---

## 영역 목차

- [x] 1. 앱 개요 + 사용자 정의
- [x] 2. 부팅 흐름 (main.jsx / App.jsx / sw.js / vite.config)
- [x] 3. 인증 + 권한 (useAuth / firestore.rules / allowed_users)
- [x] 4. 데이터 모델 (db.js v23 / FK_MAP / 외래 키 정책)
- [x] 5. 클라우드 동기화 (cloudSync.js)
- [x] 6. 결제 + 트라이얼 (FastSpring webhook / 15일 유예)
- [x] 7. AI 호출 (apiClient / scan* / voiceQueue / classify)
- [x] 8. 보안 (CSP / COOP / verifyAuth / 한도)
- [x] 9. 다국어 (i18n / 10개 언어 / ALL_LANGS 검색)
- [x] 10. 정적 데이터 (symptoms / flowchart / cases.v3 / searchDB)
- [x] 11. PWA + 자동 갱신 (sw.js / dataHashPlugin)
- [x] 12. 백업 + QR
- [x] 13. 음성 + 알람
- [x] 14. UI 패턴
- [x] 15. 페이지 흐름 (전체 라우팅)

---

# 영역 1. 앱 개요 + 사용자 정의

## 흐름 (What it is)

R-Pro = **냉동기/HVAC 현장 수리 기사를 위한 모바일 우선 PWA 실무 가이드**.
훈련용 아니고 실제 현장 기사가 호주머니에서 검색·기록·결제·동기화하는 도구.

### 핵심 가치 제안
1. **오프라인 우선** — 인터넷 없는 현장에서 완전 작동 (Dexie/IndexedDB)
2. **다국어 글로벌** — 10개 언어 (ko/en/zh/ja/es/hi/vi/th/id/ar)
3. **AI 보조** — 음성→자동분류, 명함→OCR, 장비 사진→스펙 추출, 거래명세서→자동입력
4. **회계 통합** — 매출(AS) + 매입(공급처) + 미결제 추적 + 데이터 백업

### 사용자 페르소나
- 코딩 경험 0, 현장 경험 풍부
- 글자 크기 설정 필요 (시력 약함)
- 한 손 + 모바일 우선 (max-w-lg = 512px 중앙 정렬)
- 인터넷 안정성 낮은 환경

### 비즈니스 모델
- $9.99/월 구독 (FastSpring MoR)
- 7일 무료 트라이얼 (카드 등록 필수, 카테고리별 5회 cap)
- 데이터 공유 동의 시 10% 할인 (SHARE10 쿠폰)
- 출시 채널: PWA 우선, Play Store TWA 후속

### 기술 스택
| 영역 | 선택 | 이유 |
|---|---|---|
| Frontend | React 18 + Vite 5 | 빠른 DX, PWA 친화 |
| UI | Tailwind 3 | 모바일 우선 + 테마 변수 오버라이드 |
| 로컬 DB | Dexie 4 (IndexedDB) | 오프라인 + Hooks |
| 클라우드 | Firebase (Auth/Firestore/Storage/Functions/Hosting) | 통합 운영 |
| i18n | i18next + LanguageDetector | localStorage 자동 감지 |
| Sentry | @sentry/react | PROD 자동 활성 |
| 음성 | Web Speech API + OpenAI Whisper (서버) | 다국어 fallback |
| OCR/Vision | OpenAI gpt-4o-mini | 명함/장비/세금계산서 |
| 결제 | FastSpring (MoR) + webhook | 글로벌 세금/환불 위임 |
| 모바일 wrapper | Capacitor 6 (Android) | TWA 또는 native shell 옵션 |

### 배포 환경
- **앱 본체**: r-pro-6cb33 프로젝트 → https://r-pro-6cb33.web.app
- **마케팅 홈**: rpro-website 프로젝트 → https://www.r-pro.app, /welcome (FastSpring redirect)
- 도메인 분리 이유: 마케팅 SEO와 앱 무관, 결제 후 redirect 시 도메인 분리해야 SaaS 보안 깔끔

## 위협

| 카테고리 | 위협 |
|---|---|
| 평판 | 첫 번째 사용자의 데이터 손실 → SNS 폭발 가능 |
| 비용 | 무료 한도 초과 시 운영 비용 사용자 ↑ |
| 법적 | "현장 안전" 책임 → 약관 §8 면책 필수 |
| 경쟁 | MeasureQuick 등 $39~49/월 표준 대비 1/5 가격 → 침투가 |

## ⚠️ 결함

(영역 1엔 없음 — 비즈니스/제품 정의 영역)

## 운영룰

- 새 기능 추가 시 "오프라인에서도 작동하나?" 먼저 검증
- 다국어 10개 언어 동시 추가 (영역 9 참조)
- 글자 크기 / 모바일 우선 / 한 손 조작 룰 유지
- 글로벌 출시 = 한국어 전용 표현 금지 (영역 9의 localization 룰)

---

# 영역 2. 부팅 흐름

## 흐름 (How it boots)

```
사용자가 https://r-pro-6cb33.web.app 진입
  ↓
sw.js (서비스 워커) — fetch handler가 navigation은 항상 server (no-store)
  ↓
index.html 로드 → /assets/index-XXX.js (vite 빌드 단일 번들)
  ↓
main.jsx 진입
  ├─ i18n init (저장된 언어 자동 감지)
  ├─ applyLang(i18n.language) — html dir/lang 설정 (ar = rtl)
  ├─ if (PROD) Sentry.init (DSN, sampling 10%, sendDefaultPii false)
  ├─ 즉시 IIFE: localStorage 'rfg_settings'에서 theme/fontSize 읽어서 documentElement.className 적용 (깜빡임 방지)
  ├─ navigator.serviceWorker.register('/sw.js', { updateViaCache: 'none' })
  │   ├─ reg.update() 즉시 호출
  │   ├─ visibilitychange 시 reg.update()
  │   ├─ setInterval 30분마다 reg.update()
  │   ├─ 대기중 SW 발견 시 SKIP_WAITING postMessage
  │   ├─ updatefound → installed 시 즉시 SKIP_WAITING
  │   └─ controllerchange → 자동 reload (구매자가 아무것도 안 해도 최신 버전)
  └─ ReactDOM.createRoot.render(
      <StrictMode>
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </StrictMode>)
  ↓
App.jsx
  ├─ ErrorBoundary (componentDidCatch 후 reload 버튼)
  ├─ useEffect: seedIfEmpty() (db 시드) + autoBackupIfDue (24시간 자동 백업)
  ├─ if (user === undefined) return null  ← 로딩 상태
  ├─ Routes:
  │   /            → LandingPage
  │   /login       → user면 /home redirect, 아니면 LoginPage
  │   /*           → user면 AppLayout, 아니면 /login
  └─ AppLayout (인증 후만 진입)
      ├─ useBackExit() — 빠른 두 번 뒤로가기로만 종료 (실수 방지)
      ├─ useAutoResetToHome() — 5분 이상 hidden 후 visible 시 폼 외에선 /home 강제 이동
      ├─ initAlarms() — 사용자 알람 등록 + 권한 체크
      ├─ <BottomNav /> + 26개 라우트
      ├─ <DisclaimerModal /> — 첫 로그인 1회 (rfg_disclaimer_acknowledged_v1)
      └─ <ShareConsentModal /> — 결제 직후 1회 (allowed_users.shareModalShown)
```

### 빌드 (vite.config.js)
- `swVersionPlugin`: 빌드 시 sw.js의 `__SW_VERSION__` → `Date.now().toString(36)` 치환 → SW 강제 갱신
- `dataHashPlugin`: symptoms.json + checklist.json + flowchart.json 해시 12자 → `__DATA_HASH__` 전역 상수 → seedIfEmpty이 비교해서 데이터 변경 시 자동 갱신
- React + 기본 vite plugin

### Service Worker (sw.js)
- skipWaiting 자동 X (사용자 승인 = postMessage 후만)
- activate 시 모든 캐시 삭제 + clients.claim
- navigation 요청은 항상 fetch (cache: no-store) — index.html 캐시 안 함
- notificationclick → /alarms로 deep link

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 캐시 | SW가 옛 번들 잡고 있어 새 코드 미적용 (오늘 8시간 디버깅의 원인) | updateViaCache:'none' + 30분 polling + visibility trigger + auto reload. 그래도 InPrivate 권장 가능 |
| 부팅 race | i18n init 전에 UI 렌더 → 키 바뀌어 깜빡임 | initImmediate:false + useSuspense:false로 동기 init |
| 테마 깜빡임 | React 마운트 후 theme 적용하면 흰 화면 → 어두운 화면 깜빡임 | main.jsx 즉시 IIFE로 React 전에 className 적용 |
| 권한 race | onAuthStateChanged 도달 전에 라우팅 결정 | user === undefined 체크 → null 반환 (로딩) |
| 알림 deep link | notificationclick 후 앱 안 열려있으면 새 창 | self.clients.openWindow fallback |

## ⚠️ 결함

- ⚠️ **dist 번들 크기 6MB+** (gzip 2.7MB) — 모바일 첫 로드 느림. manualChunks 미설정. (출시 후 v1.1 처리 가능, 차단 X)
- ⚠️ **SW 갱신 의존** — 사용자가 PWA 오래 켜둔 채로 있다가 새 코드 못 받는 경우 발생 (오늘 디버깅 중 실제로 InPrivate 안내한 사례)
- ⚠️ **dist에 옛 cases.v3.json.bak / failureCases.js 등 백업 파일 잔존** (영역 10 참조 — 빌드에 영향 X 단 dist 디렉토리만 비대)

## 운영룰

- 빌드 시 sw.js 버전 자동 변경됨 — 수동 SW 캐시 클리어 안내 ❌ (`feedback_no_cache_clear_instructions.md`)
- 새 SW 배포 후 사용자에게 "강제 새로고침"보다 "잠시 후 자동 적용" 안내. 즉시 검증 필요하면 InPrivate 창
- main.jsx에 새 부팅 로직 추가 시 "PROD에서만" 가드 명시 (Sentry 같이)
- ErrorBoundary fallback에 dev/prod 분기 유지 (dev엔 stack, prod엔 reload 버튼만)

---

# 영역 3. 인증 + 권한

## 흐름 (How auth works)

### 클라이언트 (useAuth.jsx)
```
AuthProvider 마운트
  ├─ onAuthStateChanged 등록 → user state 업데이트 (undefined→null/User)
  ├─ user.email 있으면:
  │   ├─ [세션 claim]: localStorage 토큰 없으면 claimSession(email)
  │   │   → 새 token 발행 → setDoc user_sessions/{email}.activeToken
  │   ├─ [cloud sync 시작]: startAutoSync()
  │   └─ [세션 watcher]: onSnapshot user_sessions/{email}
  │       → remote.activeToken !== local 이면 signOut (다른 기기 로그인 감지)
  └─ user.email 없으면: stopAutoSync(), 라우팅 /login

loginWithGoogle:
  1) signInWithPopup(googleProvider)
  2) checkEmailAccess(email) → { allowed, reason, purgeAt }
       - allowed_users doc 없음 → FALLBACK 4개 이메일 체크
       - cancelledAt 있음 → reason='cancelled'
  3) 거부면 signOut + throw
  4) 통과면 claimSession + return result

logout:
  - localStorage 토큰 제거 + clearTrialCache + signOut
```

### 서버 (firestore.rules)
- `allowed_users/{email}`:
  - read: 본인 + email_verified
  - update: 본인 + 'shareConsent', 'shareModalShown' 두 키만
  - create/delete: false (webhook만 가능)
- `usage/{email}/**`: client false (admin SDK만)
- `user_sessions/{email}`: 본인만 read/write (단일 세션 강제용)
- `users/{email}/{collection}/{doc}`: 본인 + allowed_users 존재 시 read/write
- 그 외: false

### 서버 (functions verifyAuth)
```
Authorization: Bearer <ID Token>
  ↓
admin.auth().verifyIdToken(token)
  ├─ email_verified === true 검증
  ├─ email lowercase + trim
  └─ allowed_users/{email} doc 존재 확인 → 없으면 403
  ↓
decoded._trial = (trial_until > Date.now())
  ↓
하위 핸들러 진행
```

### FALLBACK 이메일
4개 (지인) — Firestore 장애 또는 doc 없을 때 클라이언트 폴백 통과 위함.
서버 verifyAuth는 폴백 없이 항상 doc 존재 요구 (보안 핵심).
사용자 결정: 가족이라 그대로 유지 (출시 전 정리 안 함).

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 토큰 위조 | 클라이언트가 가짜 토큰 보냄 | admin.auth().verifyIdToken 서버 검증 |
| 미검증 이메일 | email_verified=false도 통과 | rules + verifyAuth 양쪽 막음 |
| 권한 우회 | 다른 사용자 doc 접근 | rules의 token.email == email 매칭 |
| 폴백 우회 | FALLBACK 이메일 사칭 | 클라이언트 폴백만, 서버는 doc 강제 |
| 세션 탈취 | 다른 기기에서 토큰 탈취 후 로그인 | 단일 세션 강제 (token mismatch → signOut) |
| popup 깨짐 | COOP가 popup close 차단 | firebase.json `Cross-Origin-Opener-Policy: same-origin-allow-popups` |
| race | 자동 복원이 자기 자신 차단 | useEffect에 cancelled 차단 X (loginWithGoogle만) |
| Firestore 장애 | doc 못 읽으면 모든 사용자 차단 | catch에서 폴백 (정상 응답 + doc 없음 = 거부, 장애 = 폴백 4개만 통과) |

## ⚠️ 결함

- ⚠️ **FALLBACK 4개 이메일이 클라이언트 번들에 그대로 노출** (사용자 결정으로 그대로 유지)
- ⚠️ **세션 단일 강제 race**: setDoc 도중 onSnapshot이 옛 토큰 보고 mismatch로 signOut 가능 (이론상). 자동 복원 useEffect에 cancelled 체크 추가했다가 race 폭발 → 제거 후 안정화. 메모리 [project_db_hook_async_promise_bug.md](memory/...) 같은 패턴 위험
- ⚠️ **firestore.rules에 cancelled 차단 없음**: 사용자가 cancelled 상태에서 어떤 식으로든 토큰 받으면 데이터 접근 가능. 클라이언트 차단만으로 의존. 출시 후 강화 필요
- ⚠️ **users/{email} 메타 doc은 어디서도 사용 안 함** (rules에 있지만 코드에서 안 씀 — dead rule)

## 운영룰

- **새 functions endpoint 추가 시** 반드시 `verifyAuth(req, res)` 호출. `cors:true` 금지
- **rules 변경 시** 반드시 `firebase deploy --only firestore:rules` (CLAUDE.md 보안 규칙)
- 새 컬렉션 추가 시 rules에 명시적으로 read/write 정의
- **사용자 이메일은 항상 lowercase + trim** (webhook이 lowercase 저장 → 클라이언트도 동일하게 비교 필요)
- **자동 복원 useEffect에 새 차단 로직 추가 금지** (race 위험)

---

# 영역 4. 데이터 모델 (DB v23)

## 흐름 (Schema architecture)

### 17개 테이블 분류

#### A. 시스템 데이터 (cloud sync 안 함)
| 테이블 | 목적 |
|---|---|
| symptoms | 증상 사전 (자동 갱신) |
| checklist_templates | 체크리스트 양식 (자동 갱신) |
| flow_categories / flow_nodes | 진단 플로우차트 (BFS 시드) |

#### B. 사용자 데이터 (cloud sync 함, 13개)
| 테이블 | 외래 키 |
|---|---|
| customers | (없음 — 루트) |
| service_jobs | customerId / customerCloudId |
| job_photos | jobId / jobCloudId |
| knowhow | customerId / customerCloudId |
| business_cards | customerId / customerCloudId |
| expenses | jobId, customerId / +CloudId |
| checklist_results | (없음) |
| equipment_maintenance | customerId / customerCloudId |
| user_alarms | customerId, jobId, equipmentId / +CloudId |
| voice_recordings | (없음, blob 별도) |
| suppliers | (없음 — 루트) |
| supplier_transactions | supplierId / supplierCloudId |
| repair_logs | (없음) |

#### C. 운영용 (sync 안 함)
| 테이블 | 목적 |
|---|---|
| backups | 폰 내부 자동 백업 (24h, 롤링 3개) |
| share_queue | v2용 익명 공유 스캐폴드 (현재 미사용) |
| sync_state | lastPull/lastPush/lastPurgeAt 타임스탬프 |

### 핵심 정책
- **integer auto-increment id**: 로컬 빠른 query, 페이지 코드가 사용
- **&cloudId (UUID v4)**: 클라우드 doc 매칭 키 (모든 기기 동일)
- **updatedAt (ISO string)**: last-write-wins 비교
- **deletedAt (ISO string)**: tombstone, 90일 후 영구 삭제
- **integer 외래 키 + cloudId 외래 키 병기**: page는 integer로 query, sync는 cloudId로 매칭
- **FK_MAP**: 외래 키 매핑 테이블 (cloudSync에서도 사용)

### 마이그레이션 v22 → v23 (가장 큰 변경)
1. 모든 sync row에 cloudId, updatedAt 채움 (v22)
2. 외래 키 cloudId 인덱스 추가 (v23)
3. 기존 integer 외래 키 → 매핑 빌드 → cloudId 외래 키 채움 (v23 upgrade)

### Dexie hooks (현재 단순화 상태)
- `creating`: cloudId / updatedAt 자동 부여 (동기만)
- `updating`: updatedAt 명시 안 했으면 자동 갱신
- ⚠️ 외래 키 cloudId 자동 채움은 **제거됨** (비동기 promise → DataCloneError 폭발)

### versionchange 핸들러
- 다른 탭이 DB 열고 있으면 자동 reload (v22+ 마이그레이션 충돌 방지)

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 외래 키 충돌 | 기기마다 integer id 다름 | cloudId 외래 키로 매칭 (단 자동 채움 누락 — ⚠️ 결함) |
| 마이그레이션 깨짐 | v22→v23 도중 throw | tx 자동 롤백, 단 부분 실행은 위험 |
| 인덱스 비대 | 모든 외래 키 + cloudId 인덱스 → IndexedDB 크기 ↑ | 출시 후 모니터링 |
| Dexie hook 비동기 | promise 반환 → DataCloneError | 동기만 유지 (메모리 룰) |
| 다중 탭 race | 두 탭 동시 마이그레이션 | versionchange + reload |
| testData 잔존 | v21 마이그레이션 후 v22+ 사용자에겐 영향 없음 | 출시 D-day 본인 정리 + 임시 reset 버튼 |

## ⚠️ 결함

- 🚨 **외래 키 cloudId 자동 채움 미완** — 새 row 생성 시 customerCloudId 등이 빈 채로 저장됨. 1기기 정상, 다중 기기 매칭 결함. ([project_foreign_key_cloudid_unfinished.md](memory/...) 참조)
- ⚠️ **db.js 너무 김** (v1~v22 마이그레이션 누적, 553줄). 첫 설치는 v23로 바로 가지만 빌드 사이즈 누적
- ⚠️ **share_queue 사용 안 함** — v2 스캐폴드만. 출시 후 가동 시 코드 추가 필요
- ⚠️ **voice_recordings.blob이 IndexedDB에 평문**: 도난 시 노출. 아직 암호화 없음 (v1.1 검토)
- ⚠️ **business_cards.dataUrl 평문**: 명함 사진 IndexedDB에 평문 저장
- ⚠️ **customers 정보 평문**: 전화/주소/이메일 모두 평문

## 운영룰

- **새 컬렉션 추가 시 5개 동시 작업**:
  1. db.js에 새 version 추가 + 인덱스 + 마이그레이션
  2. cloudSync.js의 SYNC_COLLECTIONS에 추가
  3. firestore.rules에 명시 (`users/{email}/<colName>/{doc}`)
  4. FK_MAP에 외래 키 매핑 (있으면)
  5. SYNC_HOOKS_TABLES에 추가 (cloudId 자동 부여)
- **새 외래 키 추가 시**: integer 키 + cloudId 키 병기 + FK_MAP에 명시 + 마이그레이션에 매핑 코드
- **Dexie hook은 동기만** — 비동기 작업 필요하면 페이지 코드 또는 cloudSync에서 처리 ([memory/project_db_hook_async_promise_bug.md](...))
- **기존 마이그레이션 코드 절대 수정 X** — 사용자 기기마다 어느 버전인지 모름. 새 version 추가만

---

# 영역 5. 클라우드 동기화 (cloudSync.js)

## 흐름 (How sync works)

### 정책
- **오프라인 우선**: Dexie/IndexedDB가 1차 저장소이자 캐시
- **양방향 sync**: 로컬 변경 → push, 클라우드 변경 → pull
- **last-write-wins**: updatedAt 비교
- **tombstone (90일 보관)**: deletedAt 마크 → push로 전파 → 90일 후 영구 삭제
- **자동 트리거**:
  1. 로그인 직후 즉시 1회
  2. visibilitychange visible 시
  3. 5분 인터벌 (이전 30초)
- **safeSyncAll**: syncInFlight 가드로 중복 실행 방지

### push (pushCollection)
```
1. lastPushAt 이후 변경된 row 추출 (updatedAt > lastPushAt)
2. 미디어 컬렉션이면 externalizeMedia (Storage 업로드)
   - job_photos.dataUrl → users/{email}/photos/{cloudId}.jpg
   - business_cards.dataUrl → users/{email}/cards/{cloudId}.jpg
   - voice_recordings.blob → users/{email}/voice/{cloudId}.{webm|mp4|ogg}
   - 로컬엔 storagePath 저장 (다음 sync부터 안 올림)
3. 200개 청크 단위로 writeBatch
4. integer id, integer 외래 키 제거 → cloudId만 남김
5. _serverUpdatedAt: serverTimestamp() 추가
6. lastPushAt 갱신
```

### pull (pullCollection)
```
1. lastPullAt 이후 변경된 doc 쿼리 (updatedAt > sinceIso)
2. 각 doc:
   - 로컬에 cloudId 매칭되는 row 있는지 확인
   - remoteUpdatedMs > localUpdatedMs면 적용
   - 외래 키 cloudId → 로컬 integer로 변환 (resolveLocalForeignKeys)
   - 로컬에 있으면 update(local.id), 없으면 add(clean)
3. lastPullAt 갱신
```

### softDelete + cascade
- `softDelete(table, id)`: deletedAt + updatedAt 마크
- `softDeleteWhere(table, whereFn)`: 다수 row 마크
- `softDeleteCustomerCascade(cid)`:
  - jobs → 그 jobs의 photos/expenses/alarms 마크
  - customers의 expenses (직접 의존)
  - service_jobs / business_cards / equipment_maintenance / customers 마크
- `softDeleteJobCascade(jid)`: photos/expenses/alarms + service_jobs
- `softDeleteSupplierCascade(sid)`: supplier_transactions + suppliers

### purgeTombstones (90일 후 진짜 삭제)
1. 로컬 deletedAt < cutoff인 row 추출
2. Storage 미디어 파일 deleteObject (있으면)
3. Firestore deleteDoc (있으면)
4. 로컬 db.delete()

### purgeAllUserData (관리자/리셋 버튼용)
- 모든 SYNC_COLLECTIONS의 row 클라우드+로컬 일괄 삭제
- 임시 reset 버튼이 호출

### Storage media URL 캐시
- `getMediaUrl(storagePath)`: getDownloadURL 결과 메모리 캐시 (브라우저가 추가 캐시)
- MediaImage 컴포넌트가 dataUrl 또는 storagePath fallback

### relinkOrphanForeignKeys
- pull 도중 부모 ref가 늦게 도착해서 외래 키가 null인 row 재연결
- syncAll 끝에 호출

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 외래 키 매칭 | 기기마다 integer 다름 | cloudId 외래 키 사용 (단 자동 채움 ⚠️ 미완) |
| pull race | 같은 cloudId가 동시에 add | safeSyncAll의 syncInFlight 가드 |
| 충돌 | 두 기기 동시 수정 | last-write-wins (한쪽 손실, 정책상 수용) |
| 비용 | 5분 폴링 × 13컬렉션 | 빈 쿼리 ~37 read/사이클, 활성 8h 기준 ~12K read/일/사용자. 무료 한도 50K로 4명까지 OK |
| Storage 누적 | tombstone 90일 후 삭제 안 되면 영구 | purgeTombstones로 처리 (단 호출 1일 1회) |
| 미디어 업로드 실패 | 네트워크 끊김 | 다음 sync에서 재시도 (storagePath 비어있으면) |
| 외래 키 깨짐 | parent ref 늦게 도착 | relinkOrphanForeignKeys로 재연결 |
| Storage 권한 | rule이 storage 막음 | storage.rules에 allowed_users 등록 + 본인만 |

## ⚠️ 결함

- 🚨 **외래 키 cloudId 자동 채움 미완** (페이지 코드가 customerCloudId 안 채움 → push 시 외래 키 cloudId 비어있음)
- ⚠️ **batch.set merge: false** — 두 기기가 동시에 다른 필드 수정 시 한쪽 변경분 손실 가능 (last-write-wins 정책 의도)
- ⚠️ **Storage 첫 로딩 늦음** — getMediaUrl이 매번 getDownloadURL 호출 (메모리 캐시는 페이지 새로고침 시 초기화)
- ⚠️ **두 기기 실테스트 미진행** — 메모리에 우선순위 미뤄둔 채 출시 직전. 외래 키 결함도 이 검증으로 잡았어야 함
- ⚠️ **첫 로그인 마이그레이션 미구현** — 본인 폰의 IndexedDB 데이터를 새 기기에서 자동 복원하는 흐름 없음 (사용자 결정 필요)

## 운영룰

- **softDelete 외 직접 db.X.delete() 금지** — sync 전파 안 됨 ([project_session_20260430_full.md](memory/...))
- **새 cascade 헬퍼 추가 시** 반드시 deletedAt + updatedAt 둘 다 set (둘 다 있어야 sync 전파)
- **getMediaUrl 사용 시 fallback** — null 반환 가능 (network 실패)
- **새 미디어 컬렉션 추가 시** externalizeMedia에 분기 추가 + storage path 패턴 통일
- **cloudSync 코드 변경 후** 반드시 두 기기 실테스트 (PC+폰) — playwright + 본인 폰 PWA
- **외래 키 자동 채움 복원할 때** Dexie hook 비동기 패턴 절대 금지 → cloudSync.pushCollection 안에서 동적 lookup 권장

---

# 영역 6. 결제 + 트라이얼 (FastSpring)

## 흐름 (How payment works)

### 정책 요약
- $9.99/월 (FastSpring MoR — Merchant of Record, 글로벌 세금/환불 위임)
- 7일 무료 트라이얼 (카드 등록 필수)
- 카테고리별 5회 cap (ai/jobs/customers/finance/logs) — 어뷰즈 방지
- 데이터 공유 동의 시 SHARE10 쿠폰 → 10% 할인
- 환불/탈퇴 → **15일 유예** → 그 안 재가입 시 데이터 복구
- 14일 무조건 환불 정책

### 결제 흐름
```
사용자 → Settings → 구독하기
  ↓
getCheckoutUrl() → https://realpro.onfastspring.com/r-pro-field-monthly?contact_email=xxx
  ↓
FastSpring 외부 결제 → 카드 등록 → 7일 트라이얼 시작
  ↓
FastSpring webhook → /api/fastspring-webhook
  ├─ HMAC SHA256 서명 검증 (X-FS-Signature)
  ├─ timingSafeEqual로 타이밍 공격 방지
  └─ events 배열 처리:
      - subscription.activated / order.completed → allowed_users 등록
        (email lowercase, trial_until = now+7d, shareModalShown:false)
      - subscription.charge.completed → trial_until 제거 (정식 전환)
      - subscription.canceled / deactivated / order.refunded → cancelledAt + purgeAt(now+15d)
      - subscription.updated → manageUrl 갱신
      - charge.failed / payment.overdue → log only (FastSpring dunning)
  ↓
사용자 redirect → /welcome?first=Name (rpro-website)
  ↓
사용자가 "Open R-Pro" 클릭 → 앱 본체 로그인
  ↓
useAuth.checkEmailAccess → allowed_users doc 발견 → 통과
  ↓
ShareConsentModal 1회 표시 (shareModalShown:true 마크 후 닫힘)
```

### Trial 한도 체크
```
페이지에서 add 직전:
  consumeTrial('jobs'/'customers'/'finance'/'logs')
    ↓
  apiFetch('/api/trial-check', {category})
    ↓
  서버: verifyAuth → checkTrialQuota
    ├─ _trial 아니면 통과
    ├─ usage/{email}/trial/total 에서 카운터 읽기
    ├─ limit (5) 도달 시 429 + 'Trial limit reached'
    └─ 통과 시 카운터 +1 (FieldValue.increment)
```

### AI 한도 체크
```
사용자가 음성 변환/명함 스캔/장비 스캔/세금계산서 스캔/노하우 추출 등 시도:
  apiFetch('/api/scan-card' 등, {base64,...})
    ↓
  서버: verifyAuth → checkQuota
    ├─ AI_ENDPOINTS이고 _trial이면 → checkTrialQuota('ai') 합산 5회
    ├─ DAILY_LIMITS 체크 (scan류 100/일, classify류 200/일)
    └─ usage/{email}/days/{YYYY-MM-DD} 카운터 +1
```

### 15일 유예 + 자동 삭제 (옵션 B)
```
환불/탈퇴 → cancelledAt + purgeAt = now+15d 마크 (allowed_users 그대로)
  ↓
useAuth.checkEmailAccess → cancelled 감지 → 로그인 차단 + 안내 메시지
  ("재가입 가능 마지막 날: YYYY-MM-DD")
  ↓
[15일 안 재가입] → webhook activate → cancelledAt/purgeAt 삭제 → 데이터 복구
[15일 경과] → purgeExpiredUsers (매일 cron 1회):
   1) users/{email}/{collection}/* 모두 삭제 (500개 배치)
   2) Storage users/{email}/* 폴더 통째 삭제
   3) usage/{email}/{days,trial} 삭제
   4) user_sessions/{email} 삭제
   5) allowed_users/{email} 삭제 (로그인 차단)
```

### Sentry, Secrets
- `OPENAI_API_KEY` (Cloud Functions secret)
- `FASTSPRING_WEBHOOK_SECRET` (Cloud Functions secret)
- 둘 다 `defineSecret` + `fnOpts({secrets:[...]})` 사용

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| webhook 위조 | 가짜 webhook 호출로 가입 시도 | HMAC SHA256 + timingSafeEqual 검증 |
| 트라이얼 무한 연장 | webhook 중복 호출로 trial 연장 | activatedAt 있으면 trial 갱신 안 함 (멱등) |
| critical 이벤트 누락 | activate 실패해도 200 응답이면 사용자 등록 안 됨 | CRITICAL_EVENTS 실패 시 500 → FastSpring 재시도 |
| 카드 다중 가입 | 같은 이메일로 트라이얼 반복 | 멱등성 + email lowercase 일관 |
| API 비용 폭발 | 한 사용자가 무한 호출 | DAILY_LIMITS + max_tokens + base64 size limit |
| 환불 후 데이터 영구 보관 | 약관 "철회권" 위반 | 15일 후 purgeExpiredUsers 자동 삭제 |
| 결제 직후 로그인 race | webhook 도착 전 앱 진입 | (출시 후 작업 — welcome 페이지 5초 대기) |
| 대량 events | 한 webhook이 100개 events | 순차 처리, 한 이벤트 실패 격리 (CRITICAL은 500) |
| usage 카운터 우회 | 클라이언트가 직접 Firestore 카운터 조작 | rules에서 usage 컬렉션 client false |
| 카운터 race | 동시 두 호출 | FieldValue.increment(1) 원자적 |

## ⚠️ 결함

- ⚠️ **결제 직후 race condition** — webhook 도착 전 앱 진입 시 "Access denied". (메모리 #7, 출시 후 처리 가능)
- ⚠️ **Critical webhook 실패 시 알림 없음** — 500 반환하면 FastSpring 재시도하지만 운영자에게 즉시 알림 X (Sentry로 잡힘)
- ⚠️ **AI 호출 카운터는 호출 통과 후 증가** — 호출 실패 시에도 카운터 증가. OpenAI 측 비용 발생 안 했어도 카운트 (사소함)
- ⚠️ **DisclaimerModal + ShareConsentModal 동시 표시** z-index 충돌 가능 (메모리 #8)
- ⚠️ **i18n 누락 키 검증 안 함** — `trial.cat.*` 누락 시 코드 그대로 표시 (메모리 #10)
- ⚠️ **manageUrl null fallback** — 사용자가 webhook 후 첫 webhook이 manageUrl 없을 때 구독관리 버튼 안 보임. trialStatus가 null 반환

## 운영룰

- **새 webhook 이벤트 추가 시** CRITICAL_EVENTS 분류 명시 (재시도 보장 여부)
- **새 trial 카테고리 추가 시** TRIAL_LIMITS + AI_ENDPOINTS + 페이지 코드 4곳 동시 수정
- **새 AI 엔드포인트 추가 시** DAILY_LIMITS에 명시 + verifyAuth + checkQuota + checkBase64/Text + max_tokens
- **email 비교는 항상 lowercase + trim** (webhook과 클라이언트 일관)
- **FastSpring 설정 변경 시** 메모리 [project_fastspring_progress_20260429.md](memory/...) 업데이트
- **Critical webhook 실패 모니터링** — Sentry alert 설정 (출시 후)
- **trial_until 갱신 시 always merge:true** (다른 필드 보존)

---

# 영역 7. AI 호출 (서버 + 클라이언트)

## 흐름 (How AI calls work)

### 7개 AI 엔드포인트
| 엔드포인트 | 용도 | 모델 | max_tokens | 페이로드 |
|---|---|---|---|---|
| /api/scan-card | 명함 OCR | gpt-4o-mini | 500 | base64 image |
| /api/scan-equipment | 장비 사진 → 사양 추출 | gpt-4o-mini | 600 | base64 + lang |
| /api/scan-invoice | 거래명세서 OCR | gpt-4o-mini | 2000 | base64 image |
| /api/whisper | 음성 → 텍스트 | whisper-1 | (Whisper) | base64 audio |
| /api/classify | 음성 텍스트 → AS 항목 분류 | gpt-4o-mini | 800 | transcript |
| /api/classify-knowhow | 노하우 분류 | gpt-4o-mini | 800 | transcript |
| /api/extract-knowhow | 작업 → 노하우 추출 | gpt-4o-mini | 800 | job 객체 |

### 클라이언트 → 서버 흐름
```
페이지 → utils/scan*.js (1줄 wrapper) → apiClient.apiFetch
  ↓
apiClient: user.getIdToken() → fetch /api/* (Authorization: Bearer)
  ↓
firebase rewrite → onRequest function
  ↓
applyCors → verifyAuth → checkQuota → checkBase64/Text → OpenAI API
  ↓
OpenAI → JSON response_format → response.json()
  ↓
사용자에게 표시
```

### CORS 정책
```js
ALLOWED_ORIGINS = {
  'https://www.r-pro.app', 'https://r-pro.app',
  'https://r-pro-6cb33.web.app', 'https://r-pro-6cb33.firebaseapp.com',
  'http://localhost:5173', 'http://localhost:4173',
}
```
명시적 화이트리스트, `cors:true` 와일드카드 X.

### 페이로드 안전망
- `MAX_BASE64_BYTES = 10MB` (이미지/음성 base64)
- `MAX_TEXT_LEN = 20000` (transcript/job text)
- 모든 OpenAI 호출에 `max_tokens` 명시

### 음성 처리 흐름 (voiceQueue.js + voiceRecorder.js)
- VoiceMemoPage에서 녹음 → IndexedDB voice_recordings 저장 (status: 'pending')
- 사용자 "전체 변환" 버튼 → voiceQueue가 순차 처리
- 각 녹음을 base64로 변환 → /api/whisper 호출
- 결과 텍스트를 voice_recordings.text 필드 저장
- 큰 파일(>10MB)은 extractAudioFromVideo로 추출 시도

### 자동 분류
- AS 폼에서 "전체 변환" 후 → /api/classify → 증상/진단/자재/완료내용/기타 자동 분류
- 노하우 폼에서 → /api/classify-knowhow → title/category/location/symptoms/cause/checkSteps/solution/parts/notes
- 작업 상세에서 "노하우 추출" → /api/extract-knowhow → 작업 → 노하우 자동 생성

### 명함 스캔
- BusinessCardPage에서 사진 → compressImage(1200px max, JPEG 75%) → /api/scan-card
- 결과 → 폼 자동 채움 → 사용자 확인 → IDB business_cards.add + customers.add (자동)

### 장비 스캔
- KnowhowFormBody에서 카메라 → 이미지 분석 → kind/brand/model/serial/capacity/tempClass/stage/refrigerant/notes 추출 → equipPhotos에 저장 + 결과 표시

### 거래명세서 스캔
- ExpenseFormPage에서 카메라 → /api/scan-invoice → vendor/date/items/subtotal/tax/total 추출 → 경비 자동 입력

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| API 비용 폭발 | 무한 호출 | DAILY_LIMITS + 트라이얼 5회 cap + max_tokens |
| base64 폭탄 | 100MB 이미지 → OpenAI 거부 + 비용 | MAX_BASE64_BYTES 10MB |
| transcript 폭탄 | 20K 초과 텍스트 | MAX_TEXT_LEN 검증 |
| OpenAI 키 유출 | 클라이언트에 키 박힘 | 모든 AI 호출은 서버 (functions secret) |
| CORS 우회 | 다른 사이트에서 호출 | ALLOWED_ORIGINS 화이트리스트 |
| 인증 우회 | 토큰 없이 호출 | 모든 endpoint verifyAuth |
| 부적절 컨텐츠 | 사용자 입력 → OpenAI | 한도로 양 제한, 컨텐츠 필터 OpenAI 자체 |
| 응답 구조 깨짐 | OpenAI가 잘못된 JSON | response_format: 'json_object' 강제 |
| 서버 에러 | OpenAI 5xx | passthrough (status code 그대로) |
| 클라이언트 직접 호출 | apiClient 우회 | CLAUDE.md 보안 규칙으로 강제 |

## ⚠️ 결함

- ⚠️ **scanInvoice 프롬프트 한국어 고정** — 다국어 앱인데 거래명세서 추출은 한국어로만 묻고 있음 (영어/일본어 명세서 인식률 ↓)
- ⚠️ **Whisper 응답에 language 파라미터 없으면 자동 감지** — 사용자 언어와 다를 수 있음
- ⚠️ **AI 호출 실패 시에도 카운터 +1** — 사용자 손해 약간 (큰 문제 아님)
- ⚠️ **OpenAI 응답 timeout** — scanCard 120s, whisper 300s 등. 큰 파일 처리 중 끊김 가능
- ⚠️ **음성 변환 시 "전체 변환" 큐 처리 중 새로고침** → status 'pending' 그대로 남음 (다음 진입 시 재시도 안내 필요?)

## 운영룰

- **새 AI 엔드포인트 추가 시 7개 안전망 모두 적용**:
  1. fnOpts({secrets:[openaiApiKey]}) 사용
  2. applyCors 호출
  3. verifyAuth 호출
  4. checkQuota 호출
  5. checkBase64 또는 checkText 호출
  6. max_tokens 명시
  7. response_format JSON 객체로 강제 (가능한 경우)
- **OpenAI 비용 모니터링** OpenAI 대시보드 + Firestore usage 컬렉션 일일 평균 비교
- **OpenAI API 키 절대 클라이언트 노출 금지**
- **새 origin 추가 시** ALLOWED_ORIGINS에 명시 (와일드카드 금지)
- **timeout 조정 시** Cloud Run의 maxInstances:10 + timeout 비용 고려

---

# 영역 8. 보안

## 흐름 (Security architecture)

### 다중 방어 레이어
```
브라우저
  ├─ HTTPS (TLS 자동, Firebase Hosting)
  ├─ HSTS: max-age=31536000; includeSubDomains
  ├─ CSP: 화이트리스트 도메인만 (script/style/img/connect/frame/media/font/form-action/base-uri/object-src)
  ├─ X-Frame-Options: DENY (clickjacking 방지)
  ├─ X-Content-Type-Options: nosniff
  ├─ Referrer-Policy: strict-origin-when-cross-origin
  ├─ Cross-Origin-Opener-Policy: same-origin-allow-popups (Google OAuth popup 호환)
  └─ Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=(self)

클라이언트 코드
  ├─ React + Vite (XSS 자동 escape, dangerouslySetInnerHTML 금지)
  ├─ apiClient.apiFetch — 모든 /api/* 호출 시 ID 토큰 자동 첨부
  ├─ 입력 검증 (form-level)
  └─ Sentry (도메인 화이트리스트, sendDefaultPii false)

서버 (Cloud Functions)
  ├─ verifyAuth — 토큰 + email_verified + allowed_users 존재 강제
  ├─ checkQuota / checkTrialQuota — 호출 한도
  ├─ checkBase64 / checkText — payload 크기
  ├─ applyCors — origin 화이트리스트
  ├─ HMAC SHA256 webhook 검증 + timingSafeEqual
  └─ Secrets (OPENAI_API_KEY, FASTSPRING_WEBHOOK_SECRET)

Firestore
  ├─ rules — 본인 + email_verified + allowed_users 존재
  ├─ usage 컬렉션 client 차단
  ├─ allowed_users update는 shareConsent / shareModalShown만
  └─ 그 외 컬렉션 default false

Storage
  ├─ rules — 본인 + email_verified + allowed_users + 20MB 제한
  └─ 그 외 차단

GCP
  ├─ Web API key referrer 제한 (사용자 콘솔 작업)
  └─ Cloud Functions max instances 10 (DDoS 비용 안전망)
```

### 발견·조치 14건 ([security_rules.md](memory/...))
1. firestore.rules 부재 → 추가 + 배포 ✓
2. Functions 인증 없음 → verifyAuth ✓
3. OpenAI max_tokens 누락 3건 → 명시 ✓
4. base64 크기 검증 없음 → 10MB 상한 ✓
5. innerHTML XSS → textContent 교체 ✓
6. CSP/보안 헤더 부재 → firebase.json ✓
7. Firebase API 키 도메인 제한 → 사용자 GCP Console (TODO)
8. 화이트리스트 폴백 우회 → 폴백 유지(긴급 접근), Firestore rules로 서버 차단 ✓
9. Sentry 도메인 제한 → 사용자 콘솔 (TODO)
10. rel="noopener" 누락 → 수정 ✓
11. 백업 평문 → 추후 비밀번호 옵션
12. (생략)
13. Whisper 크기 제한 → #4와 함께 ✓
14. CORS 와일드카드 → origin 화이트리스트 ✓

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| XSS | 사용자 입력 → script 실행 | React auto escape + dangerouslySetInnerHTML 금지 + CSP unsafe-inline 제거 |
| Clickjacking | iframe에 앱 임베드 | X-Frame-Options: DENY |
| CSRF | 다른 origin이 API 호출 | CORS + ID 토큰 검증 |
| 토큰 탈취 | localStorage XSS | CSP + httpOnly 옵션 없음 (Firebase Auth는 IndexedDB 사용) |
| API 비용 공격 | 한도 우회 | Quota + max_tokens + payload size + 인증 |
| 봇 가입 | trial 무한 가입 | 카드 등록 필수 (FastSpring) + email_verified |
| 데이터 유출 | 다른 사용자 데이터 접근 | rules의 token.email == path email |
| 키 유출 | API 키 클라이언트 노출 | secrets로 서버만 |
| MitM | 네트워크 도청 | HTTPS + HSTS |
| 의존성 취약점 | npm 패키지 CVE | 정기 audit (출시 후 자동화) |
| Firebase Web 키 노출 | 공개 설계지만 referrer 제한 안 하면 abuse | GCP Console에서 referrer 제한 (TODO) |
| Sentry abuse | DSN 노출 → 가짜 에러 | Sentry Allowed Domains 제한 (TODO) |

## ⚠️ 결함

- ⚠️ **Firebase Web API key referrer 제한 미설정** (사용자 콘솔 작업 — TODO)
- ⚠️ **Sentry Allowed Domains 미설정** (사용자 콘솔 작업 — TODO)
- ⚠️ **백업 JSON 평문** — 사용자 데이터 통째 노출 가능. v1.1 비밀번호 옵션 검토
- ⚠️ **firestore.rules의 cancelled 차단 부재** — 클라이언트 차단만 의존
- ⚠️ **IndexedDB 평문 저장** — 폰 분실 시 customer/blob/dataUrl 노출
- ⚠️ **FALLBACK 4개 이메일 클라이언트 번들 노출** (사용자 결정으로 유지)
- ⚠️ **CSP unsafe-inline (style-src만 유지)** — Tailwind 동적 스타일 위해 필요. 향후 nonce 도입 검토 가능
- ⚠️ **dependency CVE 자동 모니터링 없음** — npm audit 수동 (출시 후 GitHub Dependabot 검토)

## 운영룰

- **새 코드 작성 시 보안 자동 차단 룰** ([CLAUDE.md](CLAUDE.md) 7가지) 필수 적용:
  1. Cloud Functions 새 endpoint → verifyAuth 호출
  2. /api/* 호출 → apiFetch 사용 (ID 토큰 자동)
  3. innerHTML/dangerouslySetInnerHTML/eval/new Function 금지
  4. target="_blank"에 rel="noopener noreferrer"
  5. 새 Firestore 컬렉션 → rules 동시 수정 + 배포
  6. 보안 헤더 제거 금지
  7. localStorage에 토큰/비밀키 금지
- **모든 사용자 입력은 server-side 검증** (클라이언트 검증은 UX용)
- **CSP 변경 시** 빌드 산출물에서 inline script 0개 확인 후 적용
- **새 GCP API 키 발급 시** referrer 제한 즉시 설정
- **민감 데이터 IDB 저장 시 향후 암호화 옵션 검토** (백업 비밀번호 + IDB encryption)

---

# 영역 9. 다국어 (i18n)

## 흐름 (How i18n works)

### 지원 언어 10개
`ko (기본) / en / zh / ja / es / hi / vi / th / id / ar`
- ar (Arabic) → RTL (`dir="rtl"`, main.jsx에서 자동 설정)
- 나머지 LTR

### 초기화 (i18n.js)
```
i18next + LanguageDetector
  ├─ resources: { ko, en, zh, ja, es, hi, vi, th, id, ar } 10개 JSON
  ├─ lng: localStorage('i18nextLng' or 'rfg_lang')
  ├─ fallbackLng: 'ko'
  ├─ supportedLngs: 10개
  ├─ detection.order: ['localStorage', 'navigator']
  ├─ caches: ['localStorage']
  ├─ initImmediate: false (동기 init)
  └─ react.useSuspense: false (suspense 없이 즉시 렌더)
```

### 언어 적용 (main.jsx)
- applyLang(lng) → `documentElement.dir = ar?'rtl':'ltr'`, `documentElement.lang = lng||'ko'`
- i18n.on('languageChanged', applyLang) → 사용자 언어 변경 시 자동 적용

### 키 구조 (locales/{lng}.json)
- `error.*`: 에러 메시지 (loginRequired, apiError, accessDenied, subscriptionCancelled)
- `common.*`: 공통 (saving, close, loading, today, clear, selectDate, pressAgainToExit)
- `login.*`: 로그인 화면
- `home.*`: 홈
- `service.*`, `job.*`: AS 관리
- `customer.*`, `customerForm.*`: 거래처
- `expense.*`, `finance.*`: 회계
- `knowhow.*`, `bc.*`: 노하우 + 명함
- `diagSearch.*`: 진단 검색
- `checklist.*`, `repair.*`: 체크리스트, 수리
- `settings.*`, `subscription.*`: 설정 + 결제
- `trial.*`: 트라이얼 (limitTitle, limitBody, subscribeHint, subscribeCta, remaining, cat.{ai|jobs|customers|finance|logs})
- `userAlarm.*`, `voice.*`, `scan.*`: 알람, 음성, 스캔
- `shareModal.*`: 데이터 공유 동의
- 키 개수 ~1084개 (10개 언어 동일)

### 데이터 다국어 패턴
**A. 단일 객체 안에 언어 키:**
```json
"title": { "ko": "...", "en": "...", "zh": "...", ..., "ar": "..." }
```
사용: `pickLang(field, lang)` — 현재 언어 → en → ko 순 fallback
적용: cases.v3.json (361건), flowchart.json result 노드

**B. 옆에 언어 접미사:**
```json
{ "symptom": "...", "symptom_en": "...", "symptom_zh": "...", ... }
```
사용: `useLocalField()` hook → `lf(item, 'symptom')`
적용: searchDatabase.json (286건), symptoms.json (10건)

### 다국어 검색 (DiagnosisSearchPage)
- ALL_LANGS 10개 언어 필드를 join → 모든 언어에서 동시 매칭
- 영어 UI에서 한국어 키워드 검색해도 결과 일관
- 결과 표시는 현재 lang으로 (pickLang fallback)

### 진단 검색 그룹핑
4개 그룹: `title / cause / action / other`
- title: 제목에 모든 단어 포함
- cause: 원인 이름에 포함
- action: 점검·조치에 포함
- other: 팁·키워드에 포함
- 우선순위 위에서 아래로 (title 먼저)

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 키 누락 | 새 키 추가 시 일부 언어만 추가 | 작업 룰 ([feedback_i18n_always.md](memory/...)) |
| 자연스럽지 않은 번역 | 자동 번역 그대로 | [feedback_localization_terminology.md](memory/...) — 약어 그대로 번역 X |
| RTL 깨짐 | ar 화면에서 layout 어색 | dir=rtl 자동, Tailwind RTL 클래스는 부분 적용 |
| 데이터 다국어 누락 | cases.v3엔 있는데 searchDB엔 없는 언어 | 검수 사이클 (translation_audit) |
| ko/en 주제 불일치 | 데이터 조립 시 언어별 다른 주제 | 2026-04-30 9건 정리됨, hi 3건 v1.1 |
| LanguageDetector 우선순위 잘못 | navigator 먼저 → 사용자 설정 무시 | order에 localStorage 먼저 |

## ⚠️ 결함

- ⚠️ **searchDB v1.1 잔존 3건** (OIL-005 keywords_en, MAINT-004 causes_hi, hi 전반 영어 차용 비중) — 비차단
- ⚠️ **flowchart.json result 노드 일부 다국어 누락 가능성** — 검수 안 한 영역
- ⚠️ **번역 키 동기화 검증 자동화 없음** — 수동 grep 또는 검수 에이전트

## 운영룰

- **새 UI 키 추가 시 10개 언어 동시 추가** (ko/en/zh/ja/es/hi/vi/th/id/ar)
- **새 데이터 추가 시** 패턴 A 또는 B 일관 (한 파일 안에서)
- **번역 검증 시** 수정 에이전트와 검수 에이전트 분리 ([project_translation_audit_20260430.md](memory/...))
- **약어 번역 금지** — ko의 "AS"는 ja/zh에선 풀어쓰기
- **ko가 원본 언어** — 번역 작업 시 항상 ko 기준
- **마케팅 자료는 영어 기본** ([feedback_global_english_default.md](memory/...))

---

# 영역 10. 정적 데이터

## 흐름 (Data assets)

### 데이터 파일 (src/data/)
| 파일 | 크기 | 항목 수 | 용도 |
|---|---|---|---|
| cases.v3.json | 7.1MB | 361 케이스 | 진단 검색 v3 (DiagnosisSearchPage) |
| searchDatabase.json | 2.9MB | 286 entries | 옛 검색 DB (현재는 cases.v3로 대체, 일부 페이지가 fallback?) |
| flowchart.json | 1.1MB | 18 cats / 172 nodes | 진단 플로우차트 (사용 위치 ?) |
| symptoms.json | 97KB | 10 | 증상 사전 (Dexie symptoms 테이블) |
| checklist.json | 165KB | 25 | 체크리스트 양식 |
| failureCases.js | 3.2MB | (옛 v2) | cases.v3로 대체된 옛 데이터 — 빌드 영향 X |
| refrigerantsData.js | 27KB | 냉매 사전 | RefrigerantSliderPage |
| refrigerationTypes.js | 197KB | 냉동 분류 사전 | KnowhowFormBody (CATEGORY/EQUIP 매핑) |
| cases.v3.json.bak | 4.1MB | 백업 | dist 영향 X |
| failureCases.js.bak | 183KB | 백업 | dist 영향 X |
| searchDatabase_original.json | 243KB | 옛 원본 | dist 영향 X |

### 시드 흐름 (db.seedIfEmpty)
```
빌드 시 vite.config.dataHashPlugin이 symptoms+checklist+flowchart 해시 12자 → __DATA_HASH__
  ↓
앱 진입 → seedIfEmpty()
  ├─ localStorage 'rfg_data_hash' === __DATA_HASH__ → skip
  ├─ symptoms.json → db.symptoms.bulkPut
  ├─ checklist.json → db.checklist_templates.bulkPut
  ├─ flowchart.json → db.flow_categories.bulkPut + BFS로 flow_nodes 빌드
  └─ localStorage에 새 해시 저장
```

### cases.v3 스키마
```json
{
  "id": "ac-core-001",
  "title": { "ko","en","zh","ja","es","hi","vi","th","id","ar" },
  "tags": { "equipment", "system", "symptomType" },
  "causes": [
    {
      "name": { 10개 언어 },
      "check": { 10개 언어 },
      "fix": { 10개 언어 }
    }
  ],
  "tip": { 10개 언어 },
  "keywords": [한국어 단어 3~7개]
}
```

### searchDB 스키마 (옛 패턴 B)
- 필드명_lang 접미사 (id 무관)
- 286건 × 8 핵심필드 × 10 언어 ≈ 23,000개 번역 항목

### refrigerationTypes (KnowhowFormBody에서 import)
- KNOWHOW_CATEGORIES: 압축기/냉매계통/전기/팬/착상/결로/소음/냉각/오일/기타
- COMPRESSOR_TYPES, COMPRESSOR_STRUCTURES, COOLING_METHODS, TEMP_RANGES, REFRIGERANT_TYPES, SYSTEM_TYPES (그룹별)
- KnowhowFormBody의 CATEGORY_KEY/EQUIP_KEY 매핑으로 한국어 DB값 → i18n 키 변환

### refrigerantsData (RefrigerantSliderPage)
- 냉매별 P-T 차트 데이터 (NIST WebBook 기반)
- bar/MPa/kPa/PSI 단위 변환
- 게이지압/절대압 전환

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 데이터 손상 | 빌드 시 JSON 깨짐 | vite가 throw, 빌드 실패 |
| 시드 충돌 | 사용자 수정한 row가 자동 갱신으로 덮어쓰기 | symptoms/checklist/flowchart는 시스템 데이터로 사용자 수정 X |
| 번들 크기 | cases.v3 7MB → 첫 로드 느림 | code split 미적용 (출시 후 v1.1) |
| 옛 백업 잔존 | dist에 .bak 파일 포함 안 되지만 src 디렉토리 비대 | 정리 필요 (v1.1) |
| 데이터 해시 충돌 | symptoms 변경 → 모든 사용자 재시드 | bulkPut으로 안전 (id 기반 upsert) |

## ⚠️ 결함

- ⚠️ **번들 크기 6MB+ (gzip 2.7MB)** — cases.v3 + flowchart + searchDB가 main bundle에 포함. 모바일 첫 로드 느림
- ⚠️ **dataHashPlugin이 cases.v3.json 해시 안 봄** — 그게 변경되면 자동 갱신 안 됨? (확인 필요. cases.v3는 import 직접)
- ⚠️ **failureCases.js / .bak 파일들** — src 디렉토리에 잔존 (빌드엔 영향 없으나 정리 필요)
- ⚠️ **searchDatabase.json 사용 위치 미확인** — DiagnosisSearchPage는 cases.v3 사용. searchDB는 어디서?
- ⚠️ **flowchart.json 사용 위치 미확인** — db.flow_nodes에 시드되지만 어떤 페이지가 query하는지

## 운영룰

- **데이터 파일 수정 후 배포만 하면 자동 갱신** (DATA_VERSION 수동 X)
- **새 데이터 파일 추가 시** dataHashPlugin의 files 배열에 추가
- **데이터 다국어 추가 시** 검수 에이전트 별도로 (수정 ≠ 검수)
- **cases.v3는 import 직접 (Dexie 시드 X)** — 큰 파일이라 빌드 번들에 포함됨, 변경 즉시 반영
- **백업/옛 파일 정리** v1.1 작업으로 미루기

---

# 영역 11. PWA + 자동 갱신

## 흐름 (How updates flow)

### Service Worker (sw.js)
- skipWaiting 자동 X (사용자 데이터 보호)
- activate 시 caches.delete 모두 → 옛 캐시 잔존 방지
- fetch handler: navigation 요청 (HTML)은 항상 server (cache: no-store)
- notificationclick → /alarms로 deep link

### 빌드 시
- vite.config.swVersionPlugin → sw.js의 `__SW_VERSION__` → `Date.now().toString(36)` 치환
- 매 빌드마다 다른 SW 버전 → 자동 갱신 트리거

### 클라이언트 (main.jsx)
```
navigator.serviceWorker.register('/sw.js', { updateViaCache:'none' })
  ├─ reg.update() 즉시 호출
  ├─ visibilitychange visible → reg.update()
  ├─ setInterval 30분마다 reg.update()
  ├─ reg.waiting 있으면 SKIP_WAITING postMessage
  ├─ reg.updatefound:
  │   newWorker.statechange installed && controller 있음 → SKIP_WAITING
  └─ controllerchange (한 번만) → window.location.reload()
```

### 자동 데이터 갱신 (vite.config.dataHashPlugin)
- 빌드 시 symptoms+checklist+flowchart 해시 → __DATA_HASH__
- seedIfEmpty가 storedHash !== __DATA_HASH__ → 시드 재실행
- 사용자가 따로 조작 안 해도 데이터 변경 자동 반영

### PWA 설치 (manifest.json)
- name: R-Pro
- start_url: /
- display: standalone
- orientation: portrait
- background_color: #E2E8F0 (라이트)
- theme_color: #0F172A (다크)
- icons: 192, 512, 1024 (any maskable)

### 알림 등록 (alarmManager)
- 사용자 알람 등록 시 Notification API 권한 요청
- user_alarms 테이블에 date/time/title/note 저장
- initAlarms()이 시작 시 미발화 알람 다 setTimeout 등록

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 옛 캐시 | 사용자 폰 PWA가 옛 SW 보유 | 30분 polling + visibility + skip-waiting + auto reload |
| 폼 작성 중 갱신 | 사용자 입력 도중 reload → 데이터 손실 | controllerchange는 한 번만, visibilityhidden 시점 권장 (현재는 즉시) |
| 새 SW 못 받음 | 사용자가 PWA 며칠 안 켜고 그 후 진입 | 즉시 reg.update() 호출 |
| 옛 dist asset | hash가 dist에 다를 때 | vite의 자동 hash + cache no-store |
| 알림 권한 거부 | 사용자가 거부하면 알람 작동 X | userAlarm.permissionDenied 메시지 |

## ⚠️ 결함

- ⚠️ **controllerchange 즉시 reload** — 폼 작성 중 reload 가능. 세션 데이터 손실 위험. (현재 소수 사례. 출시 후 모니터링)
- ⚠️ **PWA 캐시 강제 우회 어려움** — 오늘 디버깅 중 사용자 InPrivate 안내해야 했음. 메모리에 "캐시 안내 금지" 룰 있어 조심해야 ([feedback_no_cache_clear_instructions.md](memory/...))
- ⚠️ **알림 deep link 일부 브라우저** — Edge/Chrome 외에서 self.clients.openWindow 동작 불확실
- ⚠️ **dataHashPlugin이 cases.v3 미포함** — cases.v3는 import이라 빌드 시 hash 자동 변경되긴 하나 dataHashPlugin에 명시 안 됨

## 운영룰

- **새 데이터 파일 추가 시** vite.config의 dataHashPlugin files 배열에 추가
- **SW 변경 후** 사용자에게 캐시 클리어 요청 금지 ([feedback_no_cache_clear_instructions.md](memory/...))
- **컨트롤러 체인지 reload 시점** 폼 페이지에서는 안 일어나야 → 향후 visibility hidden 시점 reload 권장
- **PWA 매니페스트 변경 시** 모든 기기 재설치 필요 — 출시 후 변경 자제

---

# 영역 12. 백업 + QR

## 흐름 (Backup architecture)

### 자동 백업 (autoBackupIfDue)
- 앱 시작 시 호출 (App.jsx useEffect)
- 마지막 백업 < 24시간이면 skip, 아니면 createBackup
- 폰 내부 IndexedDB에 저장 (롤링 3개 유지)

### createBackup
1. 사용자 테이블 모두 (시스템 X) → toArray
2. JSON.stringify + GZIP 압축 (CompressionStream)
3. db.backups.add({ createdAt, size, blob })
4. 3개 초과 시 오래된 것 삭제

### restoreBackup
1. blob → DecompressionStream → JSON.parse
2. transaction으로 모든 테이블 clear → bulkAdd
3. **legacy key alias** 지원 (`jobs` → `service_jobs`, `photos` → `job_photos`)

### exportAllData (외부 공유)
1. 사용자 테이블 → JSON pretty
2. navigator.share 시도 (모바일 공유창)
3. 실패 시 a.download 폴백

### QR 백업 (사진 제외)
- exportQRChunks: GZIP + base64 → 2500자 청크 분할 → JSON 라인
- QRExportModal이 청크 순회 표시
- importQRChunks: scan으로 모은 청크 → 합치기 → 복원

### 시스템 테이블 (백업 X)
- symptoms, checklist_templates, flow_categories, flow_nodes, backups
- 자동 시드되니까 백업 불필요

### QR 제외 테이블
- job_photos (용량 큼)

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 백업 평문 | JSON 그대로 노출 | (출시 후 비밀번호 옵션) |
| 복원 시 데이터 덮어쓰기 | 사용자 입력 손실 | confirm modal 통과 후 |
| 백업 크기 폭발 | 사진 많으면 수십 MB | QR은 사진 제외, JSON은 모두 포함 (사용자 책임) |
| 자동 백업 IDB 가득 | 폰 저장공간 부족 | 3개 롤링으로 제한 |
| navigator.share 미지원 | 데스크톱 등에서 fail | a.download 폴백 |

## ⚠️ 결함

- ⚠️ **백업 JSON에 비밀번호 없음** — 폰 분실/탈취 시 모든 사용자 데이터 노출
- ⚠️ **autoBackup이 PROD/DEV 무관 작동** — dev 모드에서도 IDB 사용
- ⚠️ **백업 복원 시 cloudId 그대로** — 다른 기기 백업 복원하면 클라우드 충돌 가능

## 운영룰

- **새 사용자 테이블 추가 시 SYSTEM_TABLES 또는 QR_EXCLUDED_TABLES 결정**
- **legacy key alias** 유지 (옛 백업 복원 호환)
- **복원 전 항상 ConfirmModal**
- **암호화 옵션** v1.1 작업 — `crypto.subtle.encrypt`로 AES-GCM 사용 권장

---

# 영역 13. 음성 + 알람

## 흐름 (Voice + Alarm)

### 음성 녹음 (voiceRecorder.js)
1. navigator.mediaDevices.getUserMedia({ audio: true })
2. MediaRecorder (mime fallback: webm/opus → webm → mp4 → ogg/opus)
3. start(1000) — 1초마다 chunk 저장 (앱 죽어도 부분 보존)
4. stop → Blob + mimeType + durationSec 반환

### 음성 큐 처리 (voiceQueue.js)
```
saveRecording → db.voice_recordings (status: pending)
  ↓
[사용자 "전체 변환" 버튼]
processPendingAll → status=='pending' 모두
  ├─ transcribeRecording: blob → base64 → /api/whisper → text → status=transcribed
  └─ (자동 분류 X — 사용자 직접 버튼)
  ↓
[사용자 "AI 분류" 버튼]
classifyRecording → /api/classify-knowhow → JSON 추출 → db.knowhow.add → status=done
```

상태 머신: `pending → transcribing → transcribed → classifying → done`
실패 시: `failed (errorMsg 보관)`

### 알람 (alarmManager.js)
- 3가지 알람:
  1. **AS 방문 알람**: 오늘 visitDate인 미완료 작업 → 9시 + 10시
  2. **정기점검 알람**: 오늘 nextDueDate인 장비 → 9:30
  3. **사용자 알람**: user_alarms에 직접 등록한 것 → 지정 시각

- initAlarms (앱 시작 시):
  - requestNotificationPermission
  - scheduleJobAlarms / scheduleMaintenanceAlarms / scheduleUserAlarms
  - scheduleOnce(key, ms, fn) — 같은 key는 setTimeout 1회만

- showNotification:
  - SW reg.showNotification 우선 (모바일 필수)
  - 폴백: new Notification (데스크톱)
  - tag로 중복 방지

### 사용 위치
- VoiceMemoPage: 녹음 + 변환 + 분류 흐름
- KnowhowFormBody: Web Speech API (브라우저 네이티브, 한국어/영어/일본어/중국어/스페인어/힌디어)
- JobFormPage / JobDetailPage: 알람 생성 (visitDate 기반)
- CustomerDetailPage: 장비별 정기점검 알람

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 마이크 권한 거부 | 사용자가 거부 | getUserMedia throw → showToast |
| 녹음 중 앱 죽음 | 모든 데이터 손실 | start(1000) chunk 저장 |
| 알림 권한 거부 | 알람 작동 X | initAlarms에서 granted 체크, 사용자 안내 |
| 시간대 충돌 | UTC vs local | local 사용 (Date.toISOString().slice(0,10)) — UTC slice라 자정 근처 깨짐 가능 |
| 중복 setTimeout | 페이지 재진입 시 같은 알람 다시 등록 | scheduledTimers Set으로 key 중복 방지 |
| Whisper 비용 | 무한 변환 시도 | 한도 + 사용자 직접 트리거 |
| Mime 미지원 | 브라우저별 다름 | candidates fallback |
| 알람 누락 | 앱 백그라운드 시 setTimeout fire X | 모바일 SW background sync 미구현 (한계) |

## ⚠️ 결함

- ⚠️ **알람 setTimeout이 백그라운드에선 정확하지 않음** — 모바일 chrome이 timer throttle
- ⚠️ **Web Speech API 한국어 외 언어 지원 불안정** — 일부 모바일에서 작동 X (Whisper API로 우회)
- ⚠️ **음성 큐 status 'transcribing'/'classifying' 이 영구 잠긴 케이스** — 도중에 페이지 떠나면 다음 진입 시 stuck
- ⚠️ **scheduleOnce key 충돌** — 사용자 알람 id 1과 'job-alarm-9' 같은 hard-coded key 충돌 안 하지만 향후 주의
- ⚠️ **today() 함수가 ISO UTC slice** — 한국 시간 자정 직후 사용자 시점에선 어제로 보일 수 있음

## 운영룰

- **새 알람 종류 추가 시 scheduleOnce key 명명 규칙**: `<type>-<id>` 형식
- **알람 로직 변경 시** initAlarms 재실행 메커니즘 필요
- **녹음 mime 추가 시 candidates에 추가**
- **Whisper 호출 전 base64 size 확인** — 10MB 상한
- **알람 시간 비교는 Date.now() 기준** — 사용자 timezone 영향 X

---

# 영역 14. UI 패턴

## 흐름 (UI conventions)

### 모바일 우선 + 한 손 조작
- max-w-lg (512px) + mx-auto 중앙 정렬
- 하단 BottomNav 고정 (홈/진단/AS/회계/설비기록/설정 6개)
- pb-20 (BottomNav 높이만큼 여백)

### 테마 시스템
- 3종: dark / gray / light
- CSS 변수 + html 클래스 오버라이드 (Tailwind dark: 미사용)
- 글자 크기: medium / large(19px) / xlarge(22px)
- main.jsx 즉시 IIFE로 react 전 적용 (깜빡임 방지)

### 버튼 색상 룰 (vivid 단색)
([feedback_button_styling_theme_safe.md](memory/...))
- 강조 액션: `bg-X-600` 단색 + 흰 글씨 + shadow-md
- 미결제: amber-500
- 결제완료: emerald-600
- 위험: red-600
- 액션: blue-600
- 강조: violet-600
- 매입: amber-600
- **금지**: light tint (bg-X-100), 테두리 강조, border-only

### 폼 패턴
- 모든 form에 `saving` state + `if (saving) return` 가드 (중복 클릭 방지)
- 버튼 disabled + 회색 + "저장 중..."
- ConfirmModal로 위험한 작업 (삭제, 복원)

### 입력 컴포넌트
- DateInput 커스텀 (네이티브 `<input type="date">` 금지 — [feedback_no_native_html_controls.md](memory/...))
- 커스텀 드롭다운 (select 대신)
- `e.target.value` 명시적 추출 (함수 prop 박힘 방지)

### MediaImage 컴포넌트
- dataUrl + storagePath fallback (cloudSync에서 onLine fallback)
- getMediaUrl 호출 + 메모리 캐시

### CameraHub
- 명함/장비/세금계산서 등 카메라 통합 진입점

### 모달 패턴
- z-index: 일반 50, 강조 60, 트라이얼/공유 70
- 외부 클릭 시 닫힘 (overlay onClick stopPropagation)

### 뒤로가기 종료 UX
- 단일 = 정상 이전
- 빠른 2번 = 종료 (`QUICK_DOUBLE_BACK_MS = 600`)
- 천천히 두 번 = 안 튕김 (sentinel state로 보호)
- ([feedback_back_exit_pattern.md](memory/...))

### 자동 홈 리셋
- 5분 이상 hidden → visible 시 폼이 아니면 /home 강제 이동
- 폼 경로: /new, /edit, /billing, /receipt, /transactions/new, /payments/new, /flow-edit

### 토스트 시스템
- `showToast(message)` 단일 함수
- `#app-toast` 단일 요소 재사용 (innerHTML 안 씀, textContent만)
- 자동 페이드 아웃

### 다크 + 다국어 RTL
- ar 언어: dir=rtl, 일부 컴포넌트 layout 자동 미러링 안 됨 (Tailwind RTL 부분만)

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 가독성 | 다크 테마에서 light tint 안 보임 | vivid 단색 룰 강제 |
| 시력 약함 | 글자 작아서 안 보임 | fontSize 3단계 |
| RTL 깨짐 | ar에서 layout 어색 | dir=rtl 자동, 수동 검수 부분만 |
| 폼 중복 클릭 | 빠른 두 번 클릭 | saving 가드 모든 폼 |
| 뒤로가기 실수 | 빠른 두 번에 종료 | 천천히 누르면 안 튕김 |
| 모달 z-index 충돌 | 두 모달 동시 표시 | DisclaimerModal(60) + ShareConsentModal(70) 분리 (검증 필요) |
| innerHTML XSS | i18n.t() 결과 HTML 삽입 | textContent만 사용 룰 |

## ⚠️ 결함

- ⚠️ **DisclaimerModal vs ShareConsentModal z-index 충돌 가능성** ([project_payment_remaining_bugs_20260429.md](memory/...) #8)
- ⚠️ **RTL ar 언어 layout 일부 깨질 수 있음** — 수동 검수 미완
- ⚠️ **테마 변경 시 일부 페이지 light tint 잔존 여부 미확인** — 출시 직전 사용자 직접 점검 필요
- ⚠️ **DateInput가 일부 페이지에서 적용 안 됐을 가능성** — 8개 페이지에 적용된다고 메모리에 적혔지만 검증 안 됨
- ⚠️ **showToast가 동시 다발 호출 시 마지막만 표시** — 빠른 연속 토스트는 일부 표시 안 됨

## 운영룰

- **새 버튼 색상 결정 시** vivid 단색 + bg-X-600 단색 룰 적용
- **새 입력 컴포넌트 추가 시** 네이티브 HTML 컨트롤 금지 — DateInput / 커스텀 드롭다운 패턴 따름
- **새 폼 추가 시 saving 가드 + disabled 버튼 + 회색**
- **새 모달 추가 시 z-index 고정** (50/60/70 중)
- **새 페이지에 fontSize 영향** — html className으로 font-large/font-xlarge 자동 적용
- **innerHTML / dangerouslySetInnerHTML 절대 금지**
- **target="_blank"에 rel="noopener noreferrer"**

---

# 영역 15. 페이지 흐름 (전체 라우팅)

## 흐름 (Routes + page roles)

### 라우트 구조 (총 35개 path, 26개 unique 페이지)

#### 공개 (인증 X)
| path | 페이지 | 역할 |
|---|---|---|
| `/` | LandingPage | 마케팅, 시작/로그인 유도 |
| `/login` | LoginPage | Google OAuth, in-app browser 감지 |

#### 인증 후 (AppLayout)
| path | 페이지 | 역할 |
|---|---|---|
| `/home` | HomePage | 오늘 방문/내일 배너/미완료 10건/현장도구 4개 |
| `/diagnosis` | DiagnosisSearchPage | cases.v3 다국어 검색 (361 케이스) |
| `/checklist` | ChecklistPage | 점검 템플릿 + 결과 저장 |
| `/logs` | RepairLogPage | 수리 일지 |
| `/refrigerant` | RefrigerantSliderPage | 냉매 P-T 차트 |
| `/basics` | RefrigerationBasicsPage | 냉동 기초 |
| `/business-cards` | BusinessCardPage | 명함 스캔/등록 (customer 자동 생성) |
| `/scan/equipment` | EquipmentScanPage | 장비 사진 → 사양 추출 |
| `/voice-memo` | VoiceMemoPage | 녹음 + Whisper + AI 분류 |
| `/alarms` | AlarmPage | 알람 관리 |
| `/settings` | SettingsPage | 언어/테마/글자크기/단위/구독/백업/QR/임시 reset |
| `/service` | ServicePage | AS 관리 (고객현황/스케줄/완료 탭) |
| `/service/new` | JobFormPage | AS 신규 |
| `/service/:id` | JobDetailPage | AS 상세 (paid 토글 + 사진 + 알람) |
| `/service/:id/edit` | JobFormPage | AS 편집 |
| `/service/:id/billing` | BillingPage | 청구서 |
| `/service/:id/receipt` | ReceiptPage | 영수증 (이미지 생성 + 공유/저장) |
| `/customers/new` | CustomerFormPage | 거래처 신규 |
| `/customers/:id` | CustomerDetailPage | 거래처 상세 (5개 섹션: 정보/AS이력/점검일/미결제/알람) |
| `/customers/:id/edit` | CustomerFormPage | 거래처 편집 |
| `/finance` | FinancePage | 매출/매입 탭 |
| `/expenses` | ExpensePage | 매출/경비/합계 3탭 |
| `/expenses/new` | ExpenseFormPage | 경비 신규 (세금계산서 스캔) |
| `/expenses/:id` | ExpenseDetailPage | 경비 상세 |
| `/expenses/:id/edit` | ExpenseFormPage | 경비 편집 |
| `/suppliers/new` | SupplierFormPage | 매입처 신규 |
| `/suppliers/:id` | SupplierDetailPage | 매입처 상세 |
| `/suppliers/:id/edit` | SupplierFormPage | 매입처 편집 |
| `/suppliers/:id/transactions/new` | SupplierTransactionFormPage | 매입 신규 |
| `/suppliers/:id/payments/new` | SupplierPaymentFormPage | 결제 신규 |
| `/supplier-transactions/:id` | SupplierTransactionDetailPage | 매입 상세 |
| `/knowhow` | KnowhowPage | 노하우 목록 |
| `/knowhow/new` | KnowhowFormPage | 노하우 신규 |
| `/knowhow/:id` | KnowhowDetailPage | 노하우 상세 |
| `/knowhow/:id/edit` | KnowhowFormPage | 노하우 편집 |
| `*` | (Navigate /home) | 404 → 홈 |

### BottomNav (6개 탭)
- 홈 / 진단 / AS관리 / 회계 / 설비기록 / 설정

### 핵심 사용자 흐름

#### A. 신규 거래처 + AS 등록
```
홈 → AS관리 → 고객현황 탭 → "+고객등록"
  ↓ /customers/new
CustomerFormPage (이름/전화/이메일/주소 + 명함 스캔 옵션)
  ↓ 저장 → consumeTrial('customers') → db.customers.add → /customers/:id
CustomerDetailPage (기본정보 + AS이력 + 점검일 + 미결제 + 알람)
```

#### B. AS 접수 → 진행 → 완료 → 영수증
```
홈 → +AS 추가 → /service/new
JobFormPage (거래처 선택 필수 + KnowhowFormBody의 분류 + 사진 + 알람)
  ↓ 저장 → consumeTrial('jobs') → service_jobs.add (status: received)
ServicePage (스케줄 탭에 표시)
  ↓ 진행/완료 상태 변경 → /service/:id/edit (status: inprogress/completed)
JobDetailPage (paid 토글, 사진 추가, AI 노하우 추출)
  ↓ /service/:id/billing → BillingPage (청구 정보)
  ↓ /service/:id/receipt → ReceiptPage (영수증 이미지 + 공유/저장)
```

#### C. 음성 메모 → 노하우
```
홈 → 설비기록 → "음성 녹음" → /voice-memo
VoiceMemoPage (녹음 → IDB)
  ↓ "전체 변환" → /api/whisper → status: transcribed
  ↓ "AI 분류" 개별 → /api/classify-knowhow → db.knowhow.add → status: done
KnowhowPage (목록에 표시)
```

#### D. 매입처 + 거래
```
회계 → 매입 탭 → "매입처 추가" → /suppliers/new
SupplierFormPage
  ↓ /suppliers/:id → SupplierDetailPage
  ↓ "+매입" → /suppliers/:id/transactions/new
  ↓ "+결제" → /suppliers/:id/payments/new
```

#### E. 진단 검색
```
홈 → 진단 → /diagnosis
DiagnosisSearchPage (cases.v3 다국어 검색)
  ↓ 결과 그룹 (title/cause/action/other)
  ↓ CaseCard 펼치기 → causes + tip 표시
```

#### F. 회계 흐름
```
회계 → /finance (매출/매입 2탭)
  ├─ 매출 → /expenses (매출내역/경비내역/내역합계 3탭)
  └─ 매입 → SuppliersPage
```

#### G. 결제 흐름
```
설정 → 구독하기 → getCheckoutUrl → FastSpring 외부
  ↓ 결제 → webhook → allowed_users.trial_until 설정
  ↓ /welcome 페이지 redirect (rpro-website)
  ↓ "Open R-Pro" → 앱 본체 진입 → ShareConsentModal 1회 표시
```

#### H. 백업/복원
```
설정 → 백업 관리 → 새 백업 / 다운로드 / 복원
  또는 설정 → QR 내보내기/가져오기
  또는 자동 백업 (24h 주기)
```

#### I. 첫 로그인 안내
```
로그인 → DisclaimerModal (1회) → 책임 면책 동의
  → localStorage rfg_disclaimer_acknowledged_v1
```

## 위협

| 카테고리 | 위협 | 현재 대응 |
|---|---|---|
| 거래처 미선택 | AS 등록 시 customerId null | JobFormPage에서 필수 검증 + showToast |
| stale customer | 거래처 삭제 후 그 작업 보면 깨짐 | 빨간 경고 카드 + "거래처 변경" 버튼 |
| 외래 키 충돌 | 다른 기기 customer가 같은 integer | cloudId 매칭 (단 자동 채움 ⚠️ 미완) |
| 폼 중복 클릭 | 빠른 두 번 저장 | saving 가드 |
| 백그라운드 5분 후 폼 리셋 | 사용자 입력 손실 | useAutoResetToHome이 폼 경로 제외 |
| 뒤로가기 종료 실수 | 한 번 누르고 종료 | useBackExit 600ms 가드 |
| 미결제 추적 누락 | paid 토글 안 누름 | (cost > 0 && !paid) → 미결제로 분류 |
| 진단 다국어 검색 누락 | 한국어로 입력했지만 영어 데이터만 | ALL_LANGS 10개 동시 매칭 |
| 음성 큐 stuck | transcribing 도중 새로고침 | (현재 자동 재시도 X — 결함) |

## ⚠️ 결함

- ⚠️ **CustomerDetailPage 5개 섹션** 모든 cloudId 외래 키 미사용 (integer만) — 클라우드 다중 기기 매칭 실패 시 빈 화면 가능
- ⚠️ **HomePage `userTier`/`DEV_EMAILS`** — 출시 전 정리 필요. paid/free 등급 체계는 미구현 (R 색상만 영향)
- ⚠️ **stale customer 처리** — JobFormPage 편집 모드만 처리, 다른 페이지(JobDetailPage, ExpenseDetailPage 등) 미처리
- ⚠️ **/customers/new 진입 후 returnTo 흐름** — 일부 페이지에서 returnTo 없이 호출 시 customerId 받아도 어디로 가야할지 모호
- ⚠️ **중첩 라우팅 깊이 2단계 이상** (suppliers/:id/transactions/new) — 뒤로가기 시 navigate(-1) 사용. 여러 단계 한꺼번에 못 돌아감
- ⚠️ **404 → /home redirect** — 잘못된 deep link 시 사용자 혼란

## 운영룰

- **새 라우트 추가 시 5단계 검증**:
  1. App.jsx Route 등록
  2. BottomNav 영향 확인 (top level이면)
  3. 폼이면 saving 가드 + DateInput 사용
  4. cloudSync 영향 (외래 키 추가 시 FK_MAP)
  5. 다국어 키 10개 추가
- **외래 키 사용 시** customer.cloudId 같이 채움 (현재 미완)
- **새 폼 진입 시** /home reset 영향 위해 isFormPath regex 확인
- **navigate 시** state 전달 필요하면 `replace:true`로 history 정리
- **deep link 추가 시** notificationclick handler에 path 일관

---

# 🔒 새 세션 시작 시 의무 통과 룰

새 세션이 R-Pro 작업 시 다음 순서:

1. **MEMORY.md 읽기** (인덱스 + 최근 세션 메모리)
2. **이 PLAN.md 읽기** (15개 영역의 흐름 + 위협 + 결함 + 운영룰)
3. **변경 영역 식별** — 작업이 어느 영역에 영향?
4. **그 영역의 운영룰 따름**
5. **그 영역의 ⚠️ 결함 인지 후 작업** — 같은 결함 또 만들지 않음
6. **다중 영역 영향 작업 시** 각 영역의 위협 표 모두 검토
7. **작업 후 PLAN.md 업데이트** (새 결함 발견 시 ⚠️ 추가, 해결 시 제거)

## 영역 간 의존성 매트릭스

작업 영역 → 영향 받는 영역 (변경 시 같이 봐야 할 곳)

| 작업 | 같이 봐야 할 영역 |
|---|---|
| db.js 스키마 변경 | 4. DB / 5. cloudSync / 12. 백업 (legacy alias) |
| Functions endpoint 추가 | 7. AI / 8. 보안 (verifyAuth/checkQuota) / 6. 결제 (consumeTrial) |
| firestore.rules 변경 | 3. 인증 / 5. cloudSync / 6. 결제 (allowed_users) |
| 새 페이지 추가 | 15. 페이지 / 9. 다국어 / 14. UI / 4. DB (외래 키) |
| 새 데이터 파일 | 10. 정적 데이터 / 11. PWA (dataHashPlugin) |
| Dexie hook 변경 | 4. DB / 5. cloudSync ⚠️ 비동기 promise 금지 |
| CSP 변경 | 2. 부팅 / 8. 보안 / 11. PWA |
| 새 외래 키 | 4. DB (FK_MAP) / 5. cloudSync (push/pull) / 15. 페이지 (query) |

## 출시 전 체크리스트 (현재 상태)

- [x] #1 CustomerFormPage trial cap
- [x] #2 Firestore 진짜 삭제 (purgeTombstones)
- [x] #3 CSP unsafe-inline 제거
- [x] #5 메모리 #6 위치 정정
- [x] #6 폴링 5분
- [x] 옵션 B 15일 유예 + scheduled function
- [x] COOP 헤더 (Google OAuth popup 호환)
- [x] CustomerDetailPage hook 위반 수정
- [x] 외래 키 cloudId 인덱스 (db v23) + 마이그레이션
- [x] AS 추가 DataCloneError → hook 비동기 원인 식별 + 단순화
- [x] 외래 키 cloudId 자동 채움 — cloudSync.pushCollection 동적 lookup 라이브 검증 통과
- [x] 단일 세션 강제 vs 변경 손실 위험 — useAuth syncAll 보강 라이브 검증 통과 (2026-05-01 세션 2)
- [x] lastPushAt 영구 누락 결함 — db v24 + `_synced` 플래그 도입 라이브 검증 통과 (2026-05-01 세션 2)
- [x] BillingPage cost 합계 누락 + JobDetailPage completedAt 미저장 (2026-05-01 세션 3)
- [x] Storage 권한 결함 (read에 size 검증 + firestore.exists cross-service) — 수정 + 사진 13장 라이브 통과
- [x] 매입 거래 subtotal 누락 + 경비 amount/total 누락 — items 자동 합계 박힘 (세션 3)
- [x] 장비 분석 5개 카드 (사진 + 분석 결과 통합 + 라이트박스) — KnowhowFormBody/JobDetailPage/KnowhowDetailPage 3곳
- [x] 거래명세서 다음 장 누적 (7~8장 1건 거래) — SupplierTransactionFormPage
- [x] 거래처 카드 풍부화 — traits + sitePhotos + 분석 장비 통합 (세션 3)
- [x] cascade 강화 — knowhow + user_alarms.customerId 직접 / 삭제 모달 영향 데이터 개수 + 구체 안내 (세션 3)
- [x] 수리 로그(RepairLogPage) 폐기 — knowhow 상위 호환, 메뉴 진입 0개라 정리 (세션 3)
- [x] 다국어 10개 언어 × 5페이지 라이브 검증 (세션 3)
- [x] 명함 진입 경로 추가 (ServicePage "명함조회" 버튼)
- [x] 글자 크기 "아주 크게" 옵션 제거 (사용자 요청)
- [ ] 임시 reset 버튼 제거 + 재배포
- [ ] 출시 D-day 본인 더미 데이터 정리
- [ ] 두 기기 실테스트
- [ ] FastSpring webhook URL 등록 + Secret 교체
- [ ] FastSpring Store Activation 통과
- [ ] GCP Console: Web API key referrer 제한
- [ ] Sentry: Allowed Domains 설정
- [ ] SEO 메타태그 활성화 (결제 라이브 후)
- [ ] 마케팅 GIF
- [ ] Play Store TWA (출시 후)

## 출시 후 v1.1+ 항목

- 백업 비밀번호 옵션
- IDB 평문 데이터 암호화 검토
- 사진/음성 첫 로그인 마이그레이션 진행률 UI
- searchDB hi 다듬기 3건
- 번들 code split (cases.v3 등)
- 옛 백업 파일(.bak) 정리
- 가상 스크롤 (거래처 1000명+)
- 데이터 공유 v2 가동 (share_queue)
- RAG 기반 AI 진단 (/diagnosis)
- 태블릿 디자인 분리
- Play Store TWA 래핑

---

상태: ⚠️ 부분 완료 (2026-05-01) — 토큰 95% 시점 중지

## 보강 작업 진행 현황

### 정독 완료
- ✅ 유틸 11개 (apiClient/trial/checkout/cloudSync/backup/voiceQueue/voiceRecorder/alarmManager/anonymize/shareQueue/extractAudioFromVideo + scan*+aiClassify+aiKnowhow+toast+settings+relativeTime)
- ✅ 컴포넌트 9개 (DateInput/ConfirmModal/CameraHub/MediaImage/QRExportModal/QRImportModal/ShareConsentModal/DisclaimerModal/CustomerPickerModal)
- ✅ 페이지 11/26: LandingPage, RefrigerationBasicsPage, RepairLogPage, KnowhowFormPage, KnowhowDetailPage, SupplierPaymentFormPage, SupplierTransactionDetailPage, ExpenseDetailPage, ServicePage, AlarmPage, BillingPage
- ✅ 데이터 파일 구조 확인 (cases.v3=361, symptoms=10, searchDB=286, checklist=25, flowchart=18cats/172nodes)

### 정독 완료 (2차 보강 — 2026-05-01 후속)
- ✅ SuppliersPage / EquipmentScanPage / SupplierFormPage / ReceiptPage / KnowhowPage
- ✅ SupplierTransactionFormPage / ChecklistPage / ExpenseFormPage / SupplierDetailPage / ExpensePage
- ✅ JobDetailPage 전체 / VoiceMemoPage 전체 / SettingsPage 전체 / CustomerDetailPage 전체 / RefrigerantSliderPage 전체

### 3차 정독 발견 (2026-05-01 후속)

#### 🚨 확정 결함 (코드로 명확)
- **JobDetailPage.jsx:171** — early return 아래 `useState(savingAlarm)` (CustomerDetailPage 동일 패턴 미수정)
- **JobDetailPage.jsx:52-71** — `if (job && !knowhowReady) { setKnowhowState(...); setKnowhowReady(true) }` 렌더링 중 setState (KnowhowFormPage와 동일 안티패턴)
- **CustomerDetailPage.jsx:442 / 631** — `equip.photoUrl` 직접 img src 사용 (MediaImage 없음 → 다른 기기에서 storage path 매칭 안 됨)

#### ⚠️ 추정 결함 (영향 검토 필요)
- **CustomerDetailPage equipment_maintenance.photoUrl** — dataUrl 그대로 cloudSync push 가능성
  - cloudSync.js의 `externalizeMedia` 미디어 컬렉션 명단(`['job_photos', 'business_cards', 'voice_recordings']`)에 `equipment_maintenance` 없음
  - 즉 photoUrl(dataUrl)을 통째로 Firestore에 push → **Firestore 1MB doc limit 위험**
  - 등급: 사진 작은 압축이면 OK, 큰 사진은 push 실패
- **JobDetailPage:354/365** — 방문 시간 선택에 `<select>` HOURS/MINS 네이티브 컨트롤 사용
  - [feedback_no_native_html_controls.md](memory/...) 룰 위반 가능
  - 단 시간 선택은 모바일 OS에서 자연스러움이라 의도된 예외일 수 있음
- **AlarmPage line 174 / JobDetailPage line 532 / CustomerDetailPage line 789** — `<input type="time">` 네이티브 컨트롤
  - 룰 위반 가능 (시간 선택은 OS 의존 → 이론상 룰 위반)
- **VoiceMemoPage handleTranscribeAll line 203-218** — 이미 done인 녹음도 합쳐서 KnowhowFormPage prefilled로 전송
  - 의도: "전체 녹음으로 합쳐 노하우 1건 추출" 흐름
  - 부작용: done 녹음이 이미 별도 노하우로 추출됐는데 다시 합산 → 중복 가능
- **SettingsPage line 138-141** — 테마 옵션 `dark` + `gray` 두 개만. light 옵션 누락
  - DEFAULTS는 `theme: 'dark'`라 light는 폐기됐을 가능성 (lavender → dark 마이그레이션 로직 있음)
  - 영역 14 PLAN의 "테마 3종"은 부정확 — 실제 2종
- **SettingsPage line 374-394** — 앱 업데이트 버튼이 사용자에게 SW unregister + 캐시 삭제 안내
  - [feedback_no_cache_clear_instructions.md](memory/...) 룰 위반 가능
  - 단 사용자 직접 트리거라 자동 안내 아님 → 룰 해석 따라 OK

#### 영역 14 (UI 패턴) PLAN 정정
- 테마: 3종(dark/gray/light) → **실제 2종(dark/gray)** (light 폐기)
- DateInput vs `<input type="time">` 일관성 부족 (날짜는 커스텀, 시간은 네이티브)

#### 영역 5 (cloudSync) PLAN 정정
- 미디어 컬렉션 명단: `['job_photos', 'business_cards', 'voice_recordings']`만
- **equipment_maintenance는 미디어 분류 X** → photoUrl(dataUrl)이 Firestore doc에 통째로 들어감
- 큰 photo는 1MB doc limit 초과 가능성 (출시 후 모니터링 필요)

#### 영역 13 (음성+알람) PLAN 정정
- VoiceMemoPage 7일 자동 삭제 (status='done' & doneAt < cutoff) 동작 확인
- MAX_DURATION_SEC = 5분 (Whisper 한도/비용 보호)
- handleTranscribeAll: 'transcribed' + 'done' 모두 합쳐서 knowhow form으로 → 의도된 흐름이지만 중복 위험

#### 영역 15 (페이지 흐름) 추가 정보
- AlarmPage: `db.user_alarms.add({ title, date, time, note, fired, createdAt })` — customerId/jobId 없음. 단독 알람도 가능
- AlarmPage line 174 — `<input type="time">` 사용
- ChecklistPage: 'list' / 'check' / 'result' 3개 view state. localItems()로 다국어 분기. 정상
- BillingPage: `document.querySelectorAll('[data-billing-field]')` 사용 (DOM 직접 접근, React 룰)
- ReceiptPage: html2canvas로 영수증 이미지 → navigator.share / a.download 폴백

## 보강 중 발견된 추가 ⚠️ (2026-05-01 검토분)

### 확정 결함 (코드로 명확)
- 🚨 **JobDetailPage.jsx:171** — early return(line 50 `if (!job) return ...`) 아래에 `useState(savingAlarm)` 호출
  - **CustomerDetailPage에서 수정한 동일 패턴 — JobDetailPage는 그대로 남음**
  - 영향: 새 AS detail 진입 시 useLiveQuery 비동기 → 첫 렌더 hook N개 → 두 번째 렌더 hook N+1개 → invariant=310 → ErrorBoundary
  - 등급: 출시 차단 가능성 (사용자가 신규 AS 진입 즉시 깨질 수 있음)
  - 수정: useState 두 개를 다른 useState 모음 옆으로 이동
- **KnowhowFormPage.jsx:39** — 렌더링 중 `setForm` + `setInitialized` 호출 (React 안티패턴)
  - 영향: 1회 set이라 무한 루프는 아니나 React 18 strict mode에서 warning
  - 수정: useEffect로 옮기기
- **KnowhowFormPage.jsx:64** — `if (!isNew && existing && !initialized) { setForm(...); setInitialized(true) }` 같은 위치, 같은 안티패턴 (line 39와 별개)

### PLAN 정정 (잘못 표시했던 결함)
- ❌ **"DisclaimerModal/ShareConsentModal z-index 충돌"** — PLAN의 영역 14 결함 항목
  - 실제 코드 확인: DisclaimerModal z-80, ShareConsentModal z-60. **이미 분리됨.**
  - 정정: 충돌 없음. (메모리 [project_payment_remaining_bugs_20260429.md](memory/...) #8도 정정 필요)

### 추정 결함 (검증 필요, 단정 X)
- KnowhowDetailPage / ExpenseDetailPage / SupplierTransactionDetailPage / ReceiptPage — `deletedAt` 필터 누락 (단순 `db.X.get()`)
  - 영향: 정상 흐름은 목록에서 진입이라 무관. deep link 또는 cascade 삭제된 row deep link 시 표시
  - 등급 낮음
- AlarmPage line 65 — useLiveQuery 안에서 `.catch()` 체이닝 어색하지만 동작
- BillingPage — `document.querySelectorAll('[data-billing-field]')` React 룰 위반. 동작은 함
- ReceiptPage LOCALE_MAP — ko/en/zh/ja/es/hi 6개만. **vi/th/id/ar 4개 폴백 누락 → KRW로 표시됨**
- SupplierFormPage / SupplierTransactionFormPage / SupplierPaymentFormPage — trial cap 없음 (의도? supplier 카테고리 없음)
- EquipmentScanPage — 결과를 IDB에 저장 안 함. 화면 표시만 (의도? knowhow에 자동 저장 안 됨)
- KnowhowPage `CATEGORIES` 한국어 박힘 (다국어 매핑은 CAT_KEYS로 이루어지지만 selected state는 한국어 키)
- SettingsPage line 479 — `window.confirm` 사용 ([feedback_no_native_html_controls.md](memory/...) 룰 위반)
  - 단 임시 reset 버튼이라 출시 후 제거됨
- 모든 페이지의 add 호출에서 외래 키 cloudId(customerCloudId 등) 명시 X
  - 이미 알려진 결함 ([project_foreign_key_cloudid_unfinished.md](memory/...))
- KnowhowFormPage — knowhow.add 시 customerCloudId 등 미명시 (외래 키 결함과 동일)
- KnowhowDetailPage `equipPhotos` direct img src — Storage path fallback 안 함 (다른 기기 sync 시 깨짐)

### 영역별 보강 (검증된 코드)

#### 영역 7 (AI 호출) — 확정
- scan*.js 모두 `dataUrl.split(',')` 패턴으로 base64 + mediaType 분리
- scanEquipment만 lang 파라미터 보냄, scanInvoice는 lang 없음 (메모리 결함 그대로)

#### 영역 8 (보안) — 확정
- toast.js: `textContent` 사용 (innerHTML X) ✓
- DisclaimerModal: localStorage 키에 email prefix → 사용자별 분리 ✓ (`rfg_disclaimer_acknowledged_v1:{email}`)
- anonymize.js: PHONE/EMAIL regex로 stripPII (v2 가동 시)

#### 영역 11 (PWA) — 확정
- DateInput: Intl.DateTimeFormat 10개 언어 자동 처리 ✓
- CameraHub: 5개 top-level 페이지에서만 노출

#### 영역 13 (음성+알람) — 확정
- voiceQueue: pending → transcribing → transcribed → classifying → done 상태머신
- voiceQueue: AI 분류는 사용자 직접 트리거 (자동 X)
- alarmManager.scheduleOnce: scheduledTimers Set으로 중복 방지

## 🔒 다음 세션 시작 지점

1. **MEMORY.md + PLAN.md 의무 통과**
2. **외래 키 cloudId 자동 채움 작업** (cloudSync.pushCollection 안에서 동적 lookup) — `project_foreign_key_cloudid_unfinished.md`
3. **임시 reset 버튼 제거 + 재배포**
4. **안 본 15개 페이지 정독** (KnowhowFormPage 패턴 같은 hook 위반 추가 점검)
5. **두 기기 실테스트** (PC chrome + 폰 PWA 동시 로그인 → 외래 키 매칭 검증)
6. **출시 D-day 본인 더미 정리**

다음 갱신: 새 영역 추가, 결함 해결, 또는 안 본 15개 페이지 정독 시

