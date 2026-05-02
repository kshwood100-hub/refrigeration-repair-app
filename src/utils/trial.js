import { apiFetch } from './apiClient'
import { auth } from '../firebase'

let cachedStatus = null
let cachedAt = 0
let cachedFor = null // 어느 사용자 기준 캐시인지
const CACHE_TTL = 60 * 1000 // 1분

function currentEmail() {
  return auth.currentUser?.email || null
}

// 트라이얼 상태 조회 (1분 캐시 + 사용자 변경 시 자동 무효화)
// force=true면 캐시 무시
export async function getTrialStatus(force = false) {
  const email = currentEmail()
  if (!email) return { trial: false }
  // 다른 사용자로 바뀌었거나 force면 캐시 무시
  if (!force && cachedStatus && cachedFor === email && Date.now() - cachedAt < CACHE_TTL) {
    return cachedStatus
  }
  try {
    const data = await apiFetch('/api/trial-status', {})
    cachedStatus = data
    cachedAt = Date.now()
    cachedFor = email
    return data
  } catch (e) {
    console.warn('Trial status failed (treating as non-trial):', e?.message)
    return { trial: false }
  }
}

// 카테고리별 trial 카운터 증가 + 한도 체크
// 정식 가입자는 항상 통과. 트라이얼이면 5회 cap.
// 한도 초과 시 throw — 호출 전에 try/catch로 감싸기.
export async function consumeTrial(category) {
  const data = await apiFetch('/api/trial-check', { category })
  // 캐시 무효화 — 다음 status 조회 시 fresh
  cachedStatus = null
  cachedFor = null
  return data // { ok, trial, remaining }
}

export function clearTrialCache() {
  cachedStatus = null
  cachedAt = 0
  cachedFor = null
}
