import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  projectId: "r-pro-6cb33",
  appId: "1:475957303360:web:46c200c5c2f91cbca3a7a5",
  storageBucket: "r-pro-6cb33.firebasestorage.app",
  apiKey: "AIzaSyCMamDw01N5Hqg-VH8Vy97yg3PgaO8Xi18",
  authDomain: "r-pro-6cb33.firebaseapp.com",
  messagingSenderId: "475957303360",
  measurementId: "G-0YZXT4P17T",
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const firestore = getFirestore(app)
export const storage = getStorage(app)
