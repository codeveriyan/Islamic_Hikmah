// src/hooks/useLocalBusinessFinder.ts

import { useState, useCallback, useEffect } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  searchMasjids,
  searchHalalFood,
  searchHalalButchers,
  getPlaceDetails,
} from '@/src/services/googlePlacesService';

import {
  filterMasjids,
  filterHalalFood,
  filterHalalButchers,
  Masjid,
  HalalRestaurant,
  HalalButcher,
  LocalBusiness,
} from '@/src/services/businessVerification';

const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  data: LocalBusiness[];
  timestamp: number;
}

export const useLocalBusinessFinder = () => {
  // State
  const [masjids, setMasjids] = useState<Masjid[]>([]);
  const [halalFood, setHalalFood] = useState<HalalRestaurant[]>([]);
  const [butchers, setButchers] = useState<HalalButcher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // ─── Get User Location ───
  const getUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const coords = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setUserLocation(coords);
      return coords;
    } catch (err: any) {
      setError(`Location error: ${err?.message || String(err)}`);
      return null;
    }
  }, []);

  // ─── Cache Management ───
  const getCachedData = useCallback(
    async (cacheKey: string): Promise<LocalBusiness[] | null> => {
      try {
        const cached = await AsyncStorage.getItem(cacheKey);
        if (cached) {
          const { data, timestamp } = JSON.parse(cached) as CachedData;

          // Check if cache is fresh (less than 24 hours old)
          if (Date.now() - timestamp < CACHE_DURATION) {
            console.log(`✓ Using cached ${cacheKey}`);
            return data;
          }
        }
      } catch (err) {
        console.error(`Cache read error for ${cacheKey}:`, err);
      }
      return null;
    },
    []
  );

  const saveCachedData = useCallback(
    async (cacheKey: string, data: LocalBusiness[]): Promise<void> => {
      try {
        const cacheData: CachedData = {
          data,
          timestamp: Date.now(),
        };
        await AsyncStorage.setItem(cacheKey, JSON.stringify(cacheData));
        console.log(`✓ Cached ${cacheKey}`);
      } catch (err) {
        console.error(`Cache write error for ${cacheKey}:`, err);
      }
    },
    []
  );

  // ─── Search Masjids ───
  const searchNearbyMasjids = useCallback(
    async (radiusKm: number = 5) => {
      try {
        setLoading(true);
        setError(null);

        // Get location if not already fetched
        let location = userLocation;
        if (!location) {
          location = await getUserLocation();
          if (!location) throw new Error('Unable to get location');
        }

        // Check cache
        const cacheKey = `hikmah:masjids:${location.latitude}:${location.longitude}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setMasjids(cached as Masjid[]);
          setLoading(false);
          return;
        }

        // Search from API
        console.log('🔍 Searching for masjids...');
        const rawResults = await searchMasjids(
          location.latitude,
          location.longitude,
          radiusKm
        );

        // Filter & verify
        const verified = filterMasjids(rawResults);

        // Sort by verification score
        verified.sort((a, b) => b.verificationScore - a.verificationScore);

        // Cache & update state
        await saveCachedData(cacheKey, verified);
        setMasjids(verified);

        console.log(`✓ Found ${verified.length} verified masjids`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Masjid search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userLocation, getUserLocation, getCachedData, saveCachedData]
  );

  // ─── Search Halal Food ───
  const searchNearbyHalalFood = useCallback(
    async (radiusKm: number = 3) => {
      try {
        setLoading(true);
        setError(null);

        let location = userLocation;
        if (!location) {
          location = await getUserLocation();
          if (!location) throw new Error('Unable to get location');
        }

        // Check cache
        const cacheKey = `hikmah:halal_food:${location.latitude}:${location.longitude}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setHalalFood(cached as HalalRestaurant[]);
          setLoading(false);
          return;
        }

        // Search from API
        console.log('🔍 Searching for halal food...');
        const rawResults = await searchHalalFood(
          location.latitude,
          location.longitude,
          radiusKm
        );

        // Filter & verify
        const verified = filterHalalFood(rawResults);

        // Sort by verification score
        verified.sort((a, b) => b.verificationScore - a.verificationScore);

        // Cache & update state
        await saveCachedData(cacheKey, verified);
        setHalalFood(verified);

        console.log(`✓ Found ${verified.length} verified halal restaurants`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Halal food search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userLocation, getUserLocation, getCachedData, saveCachedData]
  );

  // ─── Search Halal Butchers ───
  const searchNearbyButchers = useCallback(
    async (radiusKm: number = 3) => {
      try {
        setLoading(true);
        setError(null);

        let location = userLocation;
        if (!location) {
          location = await getUserLocation();
          if (!location) throw new Error('Unable to get location');
        }

        // Check cache
        const cacheKey = `hikmah:butchers:${location.latitude}:${location.longitude}`;
        const cached = await getCachedData(cacheKey);
        if (cached) {
          setButchers(cached as HalalButcher[]);
          setLoading(false);
          return;
        }

        // Search from API
        console.log('🔍 Searching for halal butchers...');
        const rawResults = await searchHalalButchers(
          location.latitude,
          location.longitude,
          radiusKm
        );

        // Filter & verify
        const verified = filterHalalButchers(rawResults);

        // Sort by verification score
        verified.sort((a, b) => b.verificationScore - a.verificationScore);

        // Cache & update state
        await saveCachedData(cacheKey, verified);
        setButchers(verified);

        console.log(`✓ Found ${verified.length} verified halal butchers`);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMsg);
        console.error('Butcher search error:', err);
      } finally {
        setLoading(false);
      }
    },
    [userLocation, getUserLocation, getCachedData, saveCachedData]
  );

  // ─── Search All ───
  const searchAll = useCallback(async () => {
    await Promise.all([
      searchNearbyMasjids(),
      searchNearbyHalalFood(),
      searchNearbyButchers(),
    ]);
  }, [searchNearbyMasjids, searchNearbyHalalFood, searchNearbyButchers]);

  // ─── Clear Cache ───
  const clearCache = useCallback(async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key =>
        key.startsWith('hikmah:masjids:') ||
        key.startsWith('hikmah:halal_food:') ||
        key.startsWith('hikmah:butchers:')
      );

      await AsyncStorage.multiRemove(cacheKeys);
      console.log('✓ Cache cleared');
    } catch (err) {
      console.error('Cache clear error:', err);
    }
  }, []);

  // ─── Get Place Details ───
  const getBusinessDetails = useCallback(async (placeId: string) => {
    try {
      const details = await getPlaceDetails(placeId);
      return details;
    } catch (err) {
      console.error('Error getting business details:', err);
      return null;
    }
  }, []);

  // ─── Initialize location on mount ───
  useEffect(() => {
    getUserLocation();
  }, [getUserLocation]);

  return {
    // State
    masjids,
    halalFood,
    butchers,
    loading,
    error,
    userLocation,

    // Methods
    searchNearbyMasjids,
    searchNearbyHalalFood,
    searchNearbyButchers,
    searchAll,
    clearCache,
    getBusinessDetails,
    getUserLocation,

    // Computed
    totalMasjids: masjids.length,
    totalFood: halalFood.length,
    totalButchers: butchers.length,
    hasError: error !== null,
  };
};
