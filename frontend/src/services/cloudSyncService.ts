import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/src/firebase";

const KEYS = {
  QURAN_BOOKMARKS: "hikmah:quran-bookmarks:v1",
  QURAN_LAST_READ: "hikmah:quran-last-read:v1",
  HADITH_BOOKMARKS: "hikmah:hadith-bookmarks:v1",
  SEERAH_BOOKMARKS: "hikmah:seerah-bookmarks:v1",
  DHIKR_BOOKMARKS: "hikmah:dhikr-bookmarks:v1",
  FAVOURITES: "hikmah:favourites:v1",
  QADHA: "hikmah:qadha:v1",
};

/**
 * Pushes a single item/key to Firestore under users/{uid}/userData/{dataKey}
 * Non-blocking fire-and-forget for background persistence.
 */
export async function pushKeyToCloud(key: string, data: any): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (!uid) return;
  try {
    const docRef = doc(db, "users", uid, "userData", key);
    await setDoc(docRef, { data, updatedAt: Date.now() }, { merge: true });
  } catch (err) {
    if (__DEV__) console.warn(`[CloudSync] Failed to push key ${key} to cloud:`, err);
  }
}

/**
 * Full bidirectional sync on login or app start for authenticated users.
 * Merges local AsyncStorage data with Cloud Firestore data gracefully.
 */
export async function performFullCloudSync(uid: string): Promise<void> {
  if (!uid) return;
  try {
    await Promise.all([
      syncQuranLastRead(uid),
      syncQuranBookmarks(uid),
      syncHadithBookmarks(uid),
      syncSeerahBookmarks(uid),
      syncDhikrBookmarks(uid),
      syncFavourites(uid),
      syncQadhaCounts(uid),
    ]);
    if (__DEV__) console.log("[CloudSync] Full sync completed successfully for user:", uid);
  } catch (err) {
    if (__DEV__) console.warn("[CloudSync] Sync failed:", err);
  }
}

// ─── Individual Sync Helpers ──────────────────────────────────────────────────

async function syncQuranLastRead(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "quran_last_read");
  const snap = await getDoc(docRef);
  const cloudData = snap.exists() ? snap.data()?.data : null;

  const localRaw = await AsyncStorage.getItem(KEYS.QURAN_LAST_READ);
  const localData = localRaw ? JSON.parse(localRaw) : null;

  if (!cloudData && !localData) return;

  let winner = localData;
  if (cloudData && localData) {
    winner = (cloudData.readAt || 0) > (localData.readAt || 0) ? cloudData : localData;
  } else if (cloudData) {
    winner = cloudData;
  }

  await AsyncStorage.setItem(KEYS.QURAN_LAST_READ, JSON.stringify(winner));
  await setDoc(docRef, { data: winner, updatedAt: Date.now() }, { merge: true });
}

async function syncQuranBookmarks(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "quran_bookmarks");
  const snap = await getDoc(docRef);
  const cloudList: any[] = snap.exists() ? (snap.data()?.data || []) : [];

  const localRaw = await AsyncStorage.getItem(KEYS.QURAN_BOOKMARKS);
  const localList: any[] = localRaw ? JSON.parse(localRaw) : [];

  const mergedMap = new Map<string, any>();
  for (const item of [...cloudList, ...localList]) {
    const key = `${item.surahNumber}:${item.ayahNumber}`;
    const existing = mergedMap.get(key);
    if (!existing || (item.savedAt || 0) > (existing.savedAt || 0)) {
      mergedMap.set(key, item);
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => (b.savedAt || 0) - (a.savedAt || 0));
  await AsyncStorage.setItem(KEYS.QURAN_BOOKMARKS, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}

async function syncHadithBookmarks(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "hadith_bookmarks");
  const snap = await getDoc(docRef);
  const cloudList: any[] = snap.exists() ? (snap.data()?.data || []) : [];

  const localRaw = await AsyncStorage.getItem(KEYS.HADITH_BOOKMARKS);
  const localList: any[] = localRaw ? JSON.parse(localRaw) : [];

  const mergedMap = new Map<string, any>();
  for (const item of [...cloudList, ...localList]) {
    const key = item.id || item.hadithnumber;
    if (key) {
      const existing = mergedMap.get(String(key));
      if (!existing || (item.savedAt || item.timestamp || 0) > (existing.savedAt || existing.timestamp || 0)) {
        mergedMap.set(String(key), item);
      }
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => (b.savedAt || b.timestamp || 0) - (a.savedAt || a.timestamp || 0));
  await AsyncStorage.setItem(KEYS.HADITH_BOOKMARKS, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}

async function syncSeerahBookmarks(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "seerah_bookmarks");
  const snap = await getDoc(docRef);
  const cloudList: any[] = snap.exists() ? (snap.data()?.data || []) : [];

  const localRaw = await AsyncStorage.getItem(KEYS.SEERAH_BOOKMARKS);
  const localList: any[] = localRaw ? JSON.parse(localRaw) : [];

  const mergedMap = new Map<string, any>();
  for (const item of [...cloudList, ...localList]) {
    const key = item.id || item.chapterId;
    if (key) {
      const existing = mergedMap.get(String(key));
      if (!existing || (item.savedAt || item.timestamp || 0) > (existing.savedAt || existing.timestamp || 0)) {
        mergedMap.set(String(key), item);
      }
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => (b.savedAt || b.timestamp || 0) - (a.savedAt || a.timestamp || 0));
  await AsyncStorage.setItem(KEYS.SEERAH_BOOKMARKS, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}

async function syncDhikrBookmarks(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "dhikr_bookmarks");
  const snap = await getDoc(docRef);
  const cloudList: any[] = snap.exists() ? (snap.data()?.data || []) : [];

  const localRaw = await AsyncStorage.getItem(KEYS.DHIKR_BOOKMARKS);
  const localList: any[] = localRaw ? JSON.parse(localRaw) : [];

  const mergedMap = new Map<string, any>();
  for (const item of [...cloudList, ...localList]) {
    const key = item.id || item.dhikrId;
    if (key) {
      const existing = mergedMap.get(String(key));
      if (!existing || (item.savedAt || item.timestamp || 0) > (existing.savedAt || existing.timestamp || 0)) {
        mergedMap.set(String(key), item);
      }
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => (b.savedAt || b.timestamp || 0) - (a.savedAt || a.timestamp || 0));
  await AsyncStorage.setItem(KEYS.DHIKR_BOOKMARKS, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}

async function syncFavourites(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "favourites");
  const snap = await getDoc(docRef);
  const cloudList: any[] = snap.exists() ? (snap.data()?.data || []) : [];

  const localRaw = await AsyncStorage.getItem(KEYS.FAVOURITES);
  const localList: any[] = localRaw ? JSON.parse(localRaw) : [];

  const mergedMap = new Map<string, any>();
  for (const item of [...cloudList, ...localList]) {
    const key = item.id || item.itemKey;
    if (key) {
      const existing = mergedMap.get(String(key));
      if (!existing || (item.savedAt || item.timestamp || 0) > (existing.savedAt || existing.timestamp || 0)) {
        mergedMap.set(String(key), item);
      }
    }
  }

  const merged = Array.from(mergedMap.values()).sort((a, b) => (b.savedAt || b.timestamp || 0) - (a.savedAt || a.timestamp || 0));
  await AsyncStorage.setItem(KEYS.FAVOURITES, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}

async function syncQadhaCounts(uid: string) {
  const docRef = doc(db, "users", uid, "userData", "qadha_counts");
  const snap = await getDoc(docRef);
  const cloudObj = snap.exists() ? (snap.data()?.data || {}) : {};

  const localRaw = await AsyncStorage.getItem(KEYS.QADHA);
  const localObj = localRaw ? JSON.parse(localRaw) : {};

  const keys = new Set([...Object.keys(cloudObj), ...Object.keys(localObj)]);
  const merged: Record<string, number> = {};
  for (const k of keys) {
    merged[k] = Math.max(cloudObj[k] || 0, localObj[k] || 0);
  }

  await AsyncStorage.setItem(KEYS.QADHA, JSON.stringify(merged));
  await setDoc(docRef, { data: merged, updatedAt: Date.now() }, { merge: true });
}
