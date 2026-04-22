import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, googleProvider, firestore } from '../firebase'

const AuthContext = createContext(null)

// Firestore 장애·미활성 시 긴급 접근용 (기존 테스트 이메일 유지)
const FALLBACK_ALLOWED_EMAILS = [
  'kshwood100@gmail.com',
  'gshwood11@gmail.com',
  'kkswood@gmail.com',
  'kkswood386@gmail.com',
]

async function isEmailAllowed(email) {
  if (!email) return false
  try {
    const snap = await getDoc(doc(firestore, 'allowed_users', email))
    if (snap.exists()) return true
    // Firestore는 정상 응답, 해당 이메일 없음 → 거부
    return FALLBACK_ALLOWED_EMAILS.includes(email)
  } catch (e) {
    // Firestore 미활성·네트워크 장애 → 하드코딩 목록으로 폴백
    console.warn('Firestore allowlist unreachable, using fallback:', e?.message)
    return FALLBACK_ALLOWED_EMAILS.includes(email)
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined) // undefined = 로딩중

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser)
    return unsubscribe
  }, [])

  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider)
    const allowed = await isEmailAllowed(result.user.email)
    if (!allowed) {
      await signOut(auth)
      throw new Error('Access denied.')
    }
    return result
  }
  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
