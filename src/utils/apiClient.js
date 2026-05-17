import i18n from '../i18n'
import { auth } from '../firebase'

// 모든 /api/* 호출은 Firebase ID 토큰을 Authorization 헤더에 첨부.
// Functions 쪽에서 verifyIdToken + allowed_users 화이트리스트 재확인.
export async function apiFetch(path, body) {
  const user = auth.currentUser
  if (!user) throw new Error(i18n.t('error.loginRequired'))
  const token = await user.getIdToken()

  const res = await fetch(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    // 429: 트라이얼 한도(Trial limit reached)는 기존 'Trial limit' 문자열 보존
    //      그 외(Daily limit reached 등)는 i18n 메시지로 친절하게 안내
    if (res.status === 429) {
      const e = err?.error || ''
      if (e === 'Trial limit reached') {
        throw new Error(e)  // 호출자가 includes('Trial limit')로 식별하는 흐름 보존
      }
      throw new Error(i18n.t('error.dailyLimitReached'))
    }
    throw new Error(err?.error ?? i18n.t('error.apiError', { status: res.status }))
  }
  return res.json()
}
