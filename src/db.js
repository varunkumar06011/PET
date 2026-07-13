import {
  collection,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore'
import { db, firebaseEnabled } from './firebase.js'

const ENTRIES_DOC = 'sync/expenses'
const SECTORS_DOC = 'sync/sectors'

const STORAGE_KEYS = {
  entries: 'pet_entries_v1',
  sectors: 'pet_sectors_v1',
}

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {}
}

// If Firebase is enabled, listen for remote changes and sync to localStorage as cache.
export function subscribe(callback) {
  if (!firebaseEnabled || !db) {
    const data = {
      entries: loadLocal(STORAGE_KEYS.entries, []),
      sectors: loadLocal(STORAGE_KEYS.sectors, null),
    }
    callback(data)
    return () => {}
  }

  const entriesRef = doc(db, ENTRIES_DOC)
  const sectorsRef = doc(db, SECTORS_DOC)

  let latest = {
    entries: loadLocal(STORAGE_KEYS.entries, []),
    sectors: loadLocal(STORAGE_KEYS.sectors, null),
  }

  const notify = () => callback({ ...latest })

  const unsubEntries = onSnapshot(entriesRef, (snap) => {
    const data = snap.exists() ? snap.data().entries : []
    latest.entries = Array.isArray(data) ? data : []
    saveLocal(STORAGE_KEYS.entries, latest.entries)
    notify()
  })

  const unsubSectors = onSnapshot(sectorsRef, (snap) => {
    const data = snap.exists() ? snap.data().list : null
    latest.sectors = Array.isArray(data) ? data : null
    if (latest.sectors) saveLocal(STORAGE_KEYS.sectors, latest.sectors)
    notify()
  })

  return () => {
    unsubEntries()
    unsubSectors()
  }
}

export async function saveEntries(entries) {
  saveLocal(STORAGE_KEYS.entries, entries)
  if (!firebaseEnabled || !db) return
  await setDoc(doc(db, ENTRIES_DOC), { entries })
}

export async function saveSectors(sectors) {
  saveLocal(STORAGE_KEYS.sectors, sectors)
  if (!firebaseEnabled || !db) return
  await setDoc(doc(db, SECTORS_DOC), { list: sectors })
}

// One-time migration helper: seed Firestore from existing localStorage if Firestore is empty.
export async function seedFromLocalStorage(defaultSectors) {
  if (!firebaseEnabled || !db) return
  const entriesRef = doc(db, ENTRIES_DOC)
  const sectorsRef = doc(db, SECTORS_DOC)
  const [entriesSnap, sectorsSnap] = await Promise.all([getDoc(entriesRef), getDoc(sectorsRef)])
  if (!entriesSnap.exists()) {
    const localEntries = loadLocal(STORAGE_KEYS.entries, [])
    if (localEntries.length > 0) await setDoc(entriesRef, { entries: localEntries })
  }
  if (!sectorsSnap.exists()) {
    const localSectors = loadLocal(STORAGE_KEYS.sectors, defaultSectors)
    await setDoc(sectorsRef, { list: localSectors })
  }
}
