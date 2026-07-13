import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const requiredKeys = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]

const config = Object.fromEntries(requiredKeys.map((k) => [k, import.meta.env[k]]))
const hasAllKeys = requiredKeys.every((k) => config[k])

export const firebaseEnabled = hasAllKeys

let app = null
export let db = null

if (firebaseEnabled) {
  app = initializeApp({
    apiKey: config.VITE_FIREBASE_API_KEY,
    authDomain: config.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: config.VITE_FIREBASE_PROJECT_ID,
    storageBucket: config.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: config.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: config.VITE_FIREBASE_APP_ID,
  })
  db = getFirestore(app)
}
