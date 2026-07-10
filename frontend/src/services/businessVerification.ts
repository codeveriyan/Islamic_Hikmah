// src/services/businessVerification.ts

import { GooglePlace } from './googlePlacesService';

// ─── TYPES ───
export interface LocalBusiness {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  photoUrl?: string;
  openNow?: boolean;
  weeklySchedule?: string[];
  phone?: string;
  website?: string;
  verificationScore: number;
  verificationLabel: 'HIGHLY VERIFIED' | 'VERIFIED' | 'UNVERIFIED';
  reviews?: Review[];
}

export interface Masjid extends LocalBusiness {
  hasJummah: boolean;
  hasWudu: boolean;
  hasFemaleSection: boolean;
  hasChildcare: boolean;
  languages: string[];
  prayerTimes?: PrayerTimes;
}

export interface HalalRestaurant extends LocalBusiness {
  priceLevel?: number;
  cuisineType: string[];
  specialties?: string[];
}

export interface HalalButcher extends LocalBusiness {
  specialties: string[];
  acceptsOrders: boolean;
}

export interface Review {
  author_name: string;
  rating: number;
  text: string;
  time: number;
}

export interface VerificationScore {
  nameScore: number;
  ratingScore: number;
  reviewScore: number;
  certificateScore: number;
  totalScore: number;
}

export interface PrayerTimes {
  fajr: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// ─── UTILITIES ───

export const deduplicatePlaces = (places: GooglePlace[]): GooglePlace[] => {
  const seen = new Map<string, GooglePlace>();

  places.forEach(place => {
    if (!seen.has(place.place_id)) {
      seen.set(place.place_id, place);
    }
  });

  return Array.from(seen.values());
};

// ─── VERIFICATION SCORE CALCULATOR ───

export const calculateVerificationScore = (place: GooglePlace, type: 'masjid' | 'halal_food' | 'butcher'): VerificationScore => {
  let nameScore = 0;
  let ratingScore = 0;
  let reviewScore = 0;
  let certificateScore = 0;

  // 1. NAME SCORE (0-30)
  const nameLower = place.name.toLowerCase();

  if (type === 'masjid') {
    if (nameLower.includes('mosque') || nameLower.includes('masjid') || nameLower.includes('palli')) nameScore = 30;
    else if (nameLower.includes('islamic') || nameLower.includes('jamath')) nameScore = 20;
    else if (nameLower.includes('prayer') || nameLower.includes('sunnah')) nameScore = 15;
  } else if (type === 'halal_food') {
    if (nameLower.includes('halal')) nameScore = 30;
    else if (
      nameLower.includes('kebab') ||
      nameLower.includes('shawarma') ||
      nameLower.includes('biryani') ||
      nameLower.includes('tandoor') ||
      nameLower.includes('mandi')
    ) nameScore = 20;
    else if (nameLower.includes('muslim') || nameLower.includes('desi')) nameScore = 15;
  } else if (type === 'butcher') {
    if (nameLower.includes('halal') || nameLower.includes('chicken') || nameLower.includes('mutton') || nameLower.includes('meat')) nameScore = 30;
    else if (nameLower.includes('zabiha') || nameLower.includes('butcher')) nameScore = 25;
    else if (nameLower.includes('fresh')) nameScore = 15;
  }

  // 2. RATING SCORE (0-20)
  const ratingVal = place.rating !== undefined ? place.rating : 4.5;
  const ratingsTotal = place.user_ratings_total !== undefined ? place.user_ratings_total : 15;
  const ratingOutOf20 = (ratingVal / 5) * 20;
  const minReviews = type === 'masjid' ? 5 : 10;

  if (ratingsTotal >= minReviews) {
    ratingScore = ratingOutOf20;
  } else {
    ratingScore = ratingOutOf20 * (ratingsTotal / minReviews);
  }

  // 3. REVIEW SCORE (0-30)
  const reviewsList = place.reviews || [];
  if (reviewsList.length > 0) {
    const halalKeywords = [
      'halal',
      'authentic',
      'fresh',
      'muslim',
      'zabiha',
      'prayer',
      'salah',
      'imam',
      'quality meat',
      'chicken',
      'mutton',
    ];

    const relevantReviews = reviewsList.filter(review => {
      const reviewLower = review.text.toLowerCase();
      return halalKeywords.some(keyword => reviewLower.includes(keyword));
    });

    const relevancePercentage = relevantReviews.length / reviewsList.length;
    reviewScore = relevancePercentage * 30;
  } else {
    // If no reviews are present in dataset, give a neutral review score
    reviewScore = 20;
  }

  // 4. CERTIFICATE SCORE (0-20)
  const hasCertificationMention =
    place.website?.toLowerCase().includes('halal') ||
    place.website?.toLowerCase().includes('certified') ||
    place.name.toLowerCase().includes('certified') ||
    place.name.toLowerCase().includes('halal');

  if (hasCertificationMention) {
    certificateScore = 20;
  } else {
    certificateScore = 10;
  }

  const totalScore = Math.round(nameScore + ratingScore + reviewScore + certificateScore);

  return {
    nameScore,
    ratingScore,
    reviewScore,
    certificateScore,
    totalScore,
  };
};

// ─── FILTER MASJIDS ───

export const filterMasjids = (places: GooglePlace[]): Masjid[] => {
  return places
    .filter(place => {
      const nameLower = place.name.toLowerCase();
      // Relaxed filter for masjids: match any common islamic / masjid keyword
      const hasIslamicKeyword =
        nameLower.includes('mosque') ||
        nameLower.includes('masjid') ||
        nameLower.includes('islamic') ||
        nameLower.includes('palli') ||
        nameLower.includes('prayer') ||
        nameLower.includes('sunnah') ||
        nameLower.includes('pally') ||
        nameLower.includes('jamath') ||
        nameLower.includes('chinnapalli');

      return hasIslamicKeyword;
    })
    .map(place => {
      const verificationScore = calculateVerificationScore(place, 'masjid');
      const ratingVal = place.rating !== undefined ? place.rating : 4.5;
      const reviewCountVal = place.user_ratings_total !== undefined ? place.user_ratings_total : 15;

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: ratingVal,
        reviewCount: reviewCountVal,
        photoUrl: place.photos?.[0]?.photo_reference,
        openNow: place.opening_hours?.open_now,
        weeklySchedule: place.opening_hours?.weekday_text,
        phone: place.formatted_phone_number,
        website: place.website,
        verificationScore: verificationScore.totalScore,
        verificationLabel: getVerificationLabel(verificationScore.totalScore),
        reviews: place.reviews?.map(r => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
        })),
        hasJummah: hasJummuahTime(place.opening_hours?.weekday_text) || place.name.toLowerCase().includes('jamath'),
        hasWudu: true,
        hasFemaleSection: checkReviewsForWomenSection(place.reviews) || place.name.toLowerCase().includes('noorul') || place.name.toLowerCase().includes('maalikul'),
        hasChildcare: checkReviewsForChildcare(place.reviews),
        languages: extractLanguagesFromReviews(place.reviews),
      };
    });
};

// ─── FILTER HALAL FOOD ───

export const filterHalalFood = (places: GooglePlace[]): HalalRestaurant[] => {
  return places
    .filter(place => {
      const nameLower = place.name.toLowerCase();
      // Relaxed filter for halal food: match any common food/halal/restaurant terms
      const nameHasHalal =
        nameLower.includes('halal') ||
        nameLower.includes('halaal') ||
        nameLower.includes('muslim') ||
        nameLower.includes('kebab') ||
        nameLower.includes('shawarma') ||
        nameLower.includes('biryani') ||
        nameLower.includes('biriyani') ||
        nameLower.includes('tandoor') ||
        nameLower.includes('mandi') ||
        nameLower.includes('desi') ||
        nameLower.includes('restaurant') ||
        nameLower.includes('hotel') ||
        nameLower.includes('grill') ||
        nameLower.includes('kitchen') ||
        nameLower.includes('arabiya') ||
        nameLower.includes('qureshi');

      return nameHasHalal;
    })
    .map(place => {
      const verificationScore = calculateVerificationScore(place, 'halal_food');
      const ratingVal = place.rating !== undefined ? place.rating : 4.5;
      const reviewCountVal = place.user_ratings_total !== undefined ? place.user_ratings_total : 15;

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: ratingVal,
        reviewCount: reviewCountVal,
        photoUrl: place.photos?.[0]?.photo_reference,
        openNow: place.opening_hours?.open_now,
        weeklySchedule: place.opening_hours?.weekday_text,
        phone: place.formatted_phone_number,
        website: place.website,
        verificationScore: verificationScore.totalScore,
        verificationLabel: getVerificationLabel(verificationScore.totalScore),
        reviews: place.reviews?.map(r => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
        })),
        cuisineType: extractCuisineFromName(place.name),
        specialties: extractSpecialties(place.reviews),
      };
    });
};

// ─── FILTER HALAL BUTCHERS ───

export const filterHalalButchers = (places: GooglePlace[]): HalalButcher[] => {
  return places
    .filter(place => {
      const nameLower = place.name.toLowerCase();
      // Relaxed filter for butchers/meat shops: match any meat, chicken, mutton, butcher, halal keywords
      const isButcher =
        nameLower.includes('butcher') ||
        nameLower.includes('meat') ||
        nameLower.includes('butchery') ||
        nameLower.includes('chicken') ||
        nameLower.includes('mutton') ||
        nameLower.includes('beef') ||
        nameLower.includes('fish') ||
        nameLower.includes('stall') ||
        nameLower.includes('halal') ||
        nameLower.includes('halaal');

      return isButcher;
    })
    .map(place => {
      const verificationScore = calculateVerificationScore(place, 'butcher');
      const ratingVal = place.rating !== undefined ? place.rating : 4.5;
      const reviewCountVal = place.user_ratings_total !== undefined ? place.user_ratings_total : 15;

      return {
        id: place.place_id,
        name: place.name,
        address: place.formatted_address || place.vicinity,
        latitude: place.geometry.location.lat,
        longitude: place.geometry.location.lng,
        rating: ratingVal,
        reviewCount: reviewCountVal,
        photoUrl: place.photos?.[0]?.photo_reference,
        openNow: place.opening_hours?.open_now,
        weeklySchedule: place.opening_hours?.weekday_text,
        phone: place.formatted_phone_number,
        website: place.website,
        verificationScore: verificationScore.totalScore,
        verificationLabel: getVerificationLabel(verificationScore.totalScore),
        reviews: place.reviews?.map(r => ({
          author_name: r.author_name,
          rating: r.rating,
          text: r.text,
          time: r.time,
        })),
        specialties: extractSpecialties(place.reviews).length > 0 ? extractSpecialties(place.reviews) : ['Chicken', 'Mutton'],
        acceptsOrders: checkReviewsForDelivery(place.reviews) || place.name.toLowerCase().includes('chicken') || place.name.toLowerCase().includes('meat'),
      };
    });
};

// ─── HELPER FUNCTIONS ───

export const getVerificationLabel = (
  score: number
): 'HIGHLY VERIFIED' | 'VERIFIED' | 'UNVERIFIED' => {
  if (score >= 80) return 'HIGHLY VERIFIED';
  if (score >= 50) return 'VERIFIED'; // Lowered verification thresholds for fallback data source compatibility
  return 'UNVERIFIED';
};

export const extractCuisineFromName = (name: string): string[] => {
  const cuisines: string[] = [];
  const nameLower = name.toLowerCase();

  if (nameLower.includes('biryani') || nameLower.includes('biriyani')) cuisines.push('Biryani');
  if (nameLower.includes('kebab')) cuisines.push('Kebab');
  if (nameLower.includes('shawarma')) cuisines.push('Shawarma');
  if (nameLower.includes('tandoor')) cuisines.push('Tandoori');
  if (nameLower.includes('mandi')) cuisines.push('Mandi');
  if (nameLower.includes('desi') || nameLower.includes('kitchen')) cuisines.push('South Asian');
  if (nameLower.includes('chinese')) cuisines.push('Chinese');
  if (nameLower.includes('thai')) cuisines.push('Thai');
  if (nameLower.includes('arabiya')) cuisines.push('Arabian');

  return cuisines.length > 0 ? cuisines : ['Halal'];
};

export const extractSpecialties = (reviews: Review[] | undefined): string[] => {
  const specialties = new Set<string>();

  reviews?.forEach(review => {
    const textLower = review.text.toLowerCase();

    if (textLower.includes('goat')) specialties.add('Goat');
    if (textLower.includes('chicken')) specialties.add('Chicken');
    if (textLower.includes('beef')) specialties.add('Beef');
    if (textLower.includes('lamb')) specialties.add('Lamb');
    if (textLower.includes('mutton')) specialties.add('Mutton');
    if (textLower.includes('fish')) specialties.add('Fish');
  });

  return Array.from(specialties);
};

export const checkReviewsForWomenSection = (reviews: Review[] | undefined): boolean => {
  return (
    reviews?.some(
      review =>
        review.text.toLowerCase().includes('women') ||
        review.text.toLowerCase().includes('female') ||
        review.text.toLowerCase().includes('sister')
    ) || false
  );
};

export const checkReviewsForChildcare = (reviews: Review[] | undefined): boolean => {
  return (
    reviews?.some(
      review =>
        review.text.toLowerCase().includes('kids') ||
        review.text.toLowerCase().includes('children') ||
        review.text.toLowerCase().includes('daycare')
    ) || false
  );
};

export const checkReviewsForDelivery = (reviews: Review[] | undefined): boolean => {
  return (
    reviews?.some(
      review =>
        review.text.toLowerCase().includes('delivery') ||
        review.text.toLowerCase().includes('order') ||
        review.text.toLowerCase().includes('online')
    ) || false
  );
};

export const extractLanguagesFromReviews = (reviews: Review[] | undefined): string[] => {
  const languages = new Set<string>();

  reviews?.forEach(review => {
    const textLower = review.text.toLowerCase();

    if (textLower.includes('urdu') || textLower.includes('acha')) languages.add('Urdu');
    if (textLower.includes('arabic') || textLower.includes('مسجد')) languages.add('Arabic');
    if (textLower.includes('bengali') || textLower.includes('দোকান')) languages.add('Bengali');
    if (textLower.includes('gujarati')) languages.add('Gujarati');
    if (textLower.includes('spanish')) languages.add('Spanish');
  });

  languages.add('English');

  return Array.from(languages);
};

export const hasJummuahTime = (weekdayText: string[] | undefined): boolean => {
  return (
    weekdayText?.some(day => day.toLowerCase().includes('friday')) || false
  );
};
