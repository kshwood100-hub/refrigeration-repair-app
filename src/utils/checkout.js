import { auth } from '../firebase'

// FastSpring 체크아웃 URL — Test Mode 동안 popup-realpro 사용, Live 활성화 후 web default 가능
const STORE_PATH = 'realpro' // FastSpring subdomain (.onfastspring.com)
const PRODUCT_PATH = 'r-pro-field-monthly'

export const CHECKOUT_URL = `https://${STORE_PATH}.onfastspring.com/${PRODUCT_PATH}`

// 사용자 이메일 prefill 포함한 체크아웃 URL 생성
// FastSpring은 ?contact_email= 파라미터로 자동 입력 받음
export function getCheckoutUrl() {
  const email = auth.currentUser?.email || ''
  if (!email) return CHECKOUT_URL
  const u = new URL(CHECKOUT_URL)
  u.searchParams.set('contact_email', email)
  return u.toString()
}
