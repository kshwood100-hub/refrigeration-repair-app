import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithRedirect, getRedirectResult, signOut } from 'firebase/auth'
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore'
import { auth, googleProvider, firestore } from '../firebase'
import { clearTrialCache } from '../utils/trial'
import { startAutoSync, stopAutoSync, syncAll } from '../utils/cloudSync'
import i18n from '../i18n'
import { toLocalISO } from '../utils/date'

const AuthContext = createContext(null)

// Firestore 장애·미활성 시 긴급 접근용 (기존 테스트 이메일 유지)
const FALLBACK_ALLOWED_EMAILS = [
  'kshwood100@gmail.com',
  'gshwood11@gmail.com',
  'kkswood@gmail.com',
  'kkswood386@gmail.com',
]

const SESSION_TOKEN_KEY = 'rfg_session_token'

function genToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

// 반환:
//   { allowed: true } — 정상 접근
//   { allowed: false, reason: 'denied' } — 접근 거부 (allowed_users 없음)
//   { allowed: false, reason: 'cancelled', purgeAt } — 구독 취소 (15일 유예 중, 재가입 시 복구)
async function checkEmailAccess(email, retried = false) {
  if (!email) return { allowed: false, reason: 'denied' }
  try {
    const snap = await getDoc(doc(firestore, 'allowed_users', email))
    if (!snap.exists()) {
      // 결제 직후 FastSpring webhook 도착 전 race 대비 — denied면 3초 후 1회만 재시도
      if (!retried) {
        await new Promise((r) => setTimeout(r, 3000))
        return checkEmailAccess(email, true)
      }
      // Firestore 정상 응답, 해당 이메일 없음 → 폴백 체크 후 거부
      return { allowed: FALLBACK_ALLOWED_EMAILS.includes(email), reason: 'denied' }
    }
    const data = snap.data()
    // 15일 유예 중 — 재가입 안 하면 데이터 삭제 예정. 로그인 차단.
    if (data?.cancelledAt) {
      return { allowed: false, reason: 'cancelled', purgeAt: data.purgeAt }
    }
    return { allowed: true }
  } catch (e) {
    // Firestore 미활성·네트워크 장애 → 하드코딩 목록으로 폴백
    console.warn('Firestore allowlist unreachable, using fallback:', e?.message)
    return { allowed: FALLBACK_ALLOWED_EMAILS.includes(email), reason: 'denied' }
  }
}

async function claimSession(email) {
  const token = genToken()
  localStorage.setItem(SESSION_TOKEN_KEY, token)
  try {
    await setDoc(doc(firestore, 'user_sessions', email), {
      activeToken: token,
      updatedAt: serverTimestamp(),
      ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 200) : '',
    })
  } catch (e) {
    console.warn('Session claim failed (allowing):', e?.message)
  }
  return token
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = 로딩중
  const [loginError, setLoginError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return unsubscribe
  }, [])

  // signInWithRedirect 흐름: Google 페이지에서 복귀 시 1회 결과 처리
  // popup 흐름 (signInWithPopup) = COOP 정책으로 cross-origin window.opener 차단 → 두 번 로그인 결함
  // redirect 흐름 = 같은 origin으로 복귀 → COOP 무관. 단 복귀 시점에 getRedirectResult로 결과 받음
  useEffect(() => {
    let canceled = false
    ;(async () => {
      try {
        const result = await getRedirectResult(auth)
        if (canceled) return
        if (!result?.user?.email) return
        const access = await checkEmailAccess(result.user.email)
        if (!access.allowed) {
          try { await signOut(auth) } catch (e) { console.warn('Reject signOut failed:', e?.message) }
          if (access.reason === 'cancelled') {
            const dateStr = access.purgeAt
              ? toLocalISO(new Date(access.purgeAt))
              : ''
            setLoginError(i18n.t('error.subscriptionCancelled', { date: dateStr }))
          } else {
            setLoginError(i18n.t('error.accessDenied'))
          }
          return
        }
        await claimSession(result.user.email)
      } catch (e) {
        if (canceled) return
        console.warn('Redirect result handling failed:', e?.message)
        setLoginError(e?.message || 'Login failed')
      }
    })()
    return () => { canceled = true }
  }, [])

  // 자동 복원된 세션도 claim — Firebase auth 세션은 살아있는데 로컬 토큰 없으면
  // 이 기기가 활성 세션이라고 등록 (다른 기기는 onSnapshot으로 mismatch 감지 → 자동 로그아웃)
  // 주의: cancelled(15일 유예) 차단은 loginWithGoogle 시점에만. 자동 복원에서 차단하면
  // race로 자기 자신을 강제 로그아웃하는 버그 발생함 (실제 환불 사용자는 다음 로그인 시점에 차단됨).
  useEffect(() => {
    if (!user?.email) return
    if (!localStorage.getItem(SESSION_TOKEN_KEY)) {
      claimSession(user.email)
    }
  }, [user?.email])

  // 로그인 후 클라우드 자동 동기화 시작 / 로그아웃 시 정지
  useEffect(() => {
    if (user?.email) {
      startAutoSync()
    } else {
      stopAutoSync()
    }
  }, [user?.email])

  // 사용자별 활성 세션 감시 — 다른 기기에서 로그인하면 토큰이 바뀌고 여기서 강제 로그아웃
  useEffect(() => {
    if (!user?.email) return
    const unsub = onSnapshot(
      doc(firestore, 'user_sessions', user.email),
      (snap) => {
        if (!snap.exists()) return
        const remote = snap.data().activeToken
        const local = localStorage.getItem(SESSION_TOKEN_KEY)
        // 원격 토큰이 있고, 로컬과 다르면 → 다른 기기가 차지함 → 로그아웃
        // 로그아웃 직전 push 1회 강제 — 로컬 미동기화 변경분 손실 방지
        if (remote && remote !== local) {
          ;(async () => {
            try { await syncAll() } catch (e) { console.warn('Pre-logout sync failed:', e?.message) }
            localStorage.removeItem(SESSION_TOKEN_KEY)
            try { await signOut(auth) } catch (e) { console.warn('Forced signOut failed:', e?.message) }
          })()
        }
      },
      (err) => console.warn('Session watch failed:', err?.message)
    )
    return unsub
  }, [user?.email])

  const loginWithGoogle = async () => {
    setLoginError(null)
    // signInWithRedirect = 페이지 전환됨. 즉시 반환 X. 결과 처리는 위 useEffect의 getRedirectResult에서
    await signInWithRedirect(auth, googleProvider)
  }
  const logout = async () => {
    localStorage.removeItem(SESSION_TOKEN_KEY)
    clearTrialCache()
    try { await signOut(auth) } catch (e) { console.warn('Logout signOut failed:', e?.message) }
  }

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout, loginError, clearLoginError: () => setLoginError(null) }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
