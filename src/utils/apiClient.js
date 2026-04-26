import { auth } from '../firebase'

// 모든 /api/* 호출은 Firebase ID 토큰을 Authorization 헤더에 첨부.
// Functions 쪽에서 verifyIdToken + allowed_users 화이트리스트 재확인.
export async function apiFetch(path, body) {
  const user = auth.currentUser
  if (!user) throw new Error('로그인이 필요합니다.')
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
    throw new Error(err?.error ?? `API 오류 ${res.status}`)
  }
  return res.json()
}
