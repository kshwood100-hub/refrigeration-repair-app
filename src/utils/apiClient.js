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
    throw new Error(err?.error ?? i18n.t('error.apiError', { status: res.status }))
  }
  return res.json()
}
