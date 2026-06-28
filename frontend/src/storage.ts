import AsyncStorage from '@react-native-async-storage/async-storage';

const FAV_KEY = 'ruhani:favourites:v1';
const DHIKR_KEY = 'ruhani:dhikr-counts:v1';
const REMIND_KEY = 'ruhani:reminders:v1';
const PRAY_LOC = 'ruhani:prayer-location:v1';

export type Favourite = {
  id: string;
  type: 'dua' | 'ayah';
  title: string;
  subtitle?: string;
  arabic?: string;
  translation?: string;
  addedAt: number;
};

export async function getFavourites(): Promise<Favourite[]> {
  const raw = await AsyncStorage.getItem(FAV_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function toggleFavourite(fav: Favourite): Promise<boolean> {
  const list = await getFavourites();
  const idx = list.findIndex((f) => f.id === fav.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list));
    return false;
  }
  list.unshift({ ...fav, addedAt: Date.now() });
  await AsyncStorage.setItem(FAV_KEY, JSON.stringify(list));
  return true;
}

export async function isFavourite(id: string): Promise<boolean> {
  const list = await getFavourites();
  return list.some((f) => f.id === id);
}

export async function getDhikrCounts(): Promise<Record<string, number>> {
  const raw = await AsyncStorage.getItem(DHIKR_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function setDhikrCount(id: string, count: number) {
  const all = await getDhikrCounts();
  all[id] = count;
  await AsyncStorage.setItem(DHIKR_KEY, JSON.stringify(all));
}

export type Reminder = {
  id: string;
  title: string;
  hour: number;
  minute: number;
  enabled: boolean;
};

export async function getReminders(): Promise<Reminder[]> {
  const raw = await AsyncStorage.getItem(REMIND_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function saveReminders(items: Reminder[]) {
  await AsyncStorage.setItem(REMIND_KEY, JSON.stringify(items));
}

export async function getSavedLocation(): Promise<{ lat: number; lon: number; city?: string } | null> {
  const raw = await AsyncStorage.getItem(PRAY_LOC);
  return raw ? JSON.parse(raw) : null;
}

export async function setSavedLocation(loc: { lat: number; lon: number; city?: string }) {
  await AsyncStorage.setItem(PRAY_LOC, JSON.stringify(loc));
}
