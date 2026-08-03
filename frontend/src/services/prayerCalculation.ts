/**
 * Local Offline Prayer Time Calculation Service
 * Fully offline solar astronomical calculation engine based on latitude, longitude, date, calculation method & juristic method.
 */

export interface PrayerCalculationParams {
  latitude: number;
  longitude: number;
  date?: Date;
  method?: number;   // Method ID — see METHOD_ANGLES below for the full list
  juristic?: number; // 0=Shafi/Standard (shadow length 1x), 1=Hanafi (shadow length 2x)
}

export interface CalculatedPrayerTimes {
  [key: string]: string;
  Fajr: string;
  Sunrise: string;
  Dhuhr: string;
  Asr: string;
  Maghrib: string;
  Isha: string;
  Qiyam: string;
}

/**
 * Complete list of prayer-time calculation methods.
 *
 * IDs 0–23 match the Aladhan.com API: https://api.aladhan.com/v1/methods
 *
 * - `fajr`  / `isha`          : sun-angle degrees below the horizon
 * - `ishaIsMinutes: true`     : `isha` is a minute offset after Maghrib instead of an angle
 * - `maghribAngle`            : sun-angle for Maghrib  (when different from standard 0.833°)
 * - `maghribMinutes`          : minute offset after sunset for Maghrib
 */
const METHOD_ANGLES: Record<number, {
  fajr: number;
  isha: number;
  ishaIsMinutes?: boolean;
  maghribAngle?: number;
  maghribMinutes?: number;
}> = {
  0:  { fajr: 16,   isha: 14,   maghribAngle: 4 },        // Shia Ithna-Ashari, Leva Institute, Qum (Jafri)
  1:  { fajr: 18,   isha: 18 },                            // University of Islamic Sciences, Karachi (UISK)
  2:  { fajr: 15,   isha: 15 },                            // Islamic Society of North America (ISNA)
  3:  { fajr: 18,   isha: 17 },                            // Muslim World League (MWL)
  4:  { fajr: 18.5, isha: 90,  ishaIsMinutes: true },      // Umm Al-Qura University, Makkah
  5:  { fajr: 19.5, isha: 17.5 },                          // Egyptian General Authority of Survey (EGAS)
  7:  { fajr: 17.7, isha: 14,  maghribAngle: 4.5 },        // Institute of Geophysics, University of Tehran
  8:  { fajr: 19.5, isha: 90,  ishaIsMinutes: true },      // Gulf Region
  9:  { fajr: 18,   isha: 17.5 },                          // Kuwait
  10: { fajr: 18,   isha: 90,  ishaIsMinutes: true },      // Qatar
  11: { fajr: 20,   isha: 18 },                            // Majlis Ugama Islam Singapura (MUIS)
  12: { fajr: 12,   isha: 12 },                            // Union of Islamic Organisations of France (UOIF)
  13: { fajr: 18,   isha: 17 },                            // Diyanet İşleri Başkanlığı, Turkey
  14: { fajr: 16,   isha: 15 },                            // Spiritual Administration of Muslims of Russia
  15: { fajr: 18,   isha: 18 },                            // Moonsighting Committee Worldwide (fallback angles)
  16: { fajr: 18.2, isha: 18.2 },                          // Dubai (experimental)
  17: { fajr: 20,   isha: 18 },                            // Jabatan Kemajuan Islam Malaysia (JAKIM)
  18: { fajr: 18,   isha: 18 },                            // Tunisia
  19: { fajr: 18,   isha: 17 },                            // Algeria
  20: { fajr: 20,   isha: 18 },                            // Kementerian Agama Republik Indonesia (Sihat/Kemenag)
  21: { fajr: 19,   isha: 17 },                            // Morocco
  22: { fajr: 18,   isha: 77,  ishaIsMinutes: true, maghribMinutes: 3 }, // Comunidade Islamica de Lisboa
  23: { fajr: 18,   isha: 18,  maghribMinutes: 5 },        // Ministry of Awqaf, Jordan
};

const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;
const fixAngle = (a: number) => ((a % 360) + 360) % 360;
const fixHour = (h: number) => ((h % 24) + 24) % 24;

/**
 * Calculates local prayer times offline.
 */
export function calculateLocalPrayerTimes(params: PrayerCalculationParams): CalculatedPrayerTimes {
  const { latitude: lat, longitude: lng, date = new Date(), method = 3, juristic = 0 } = params;

  // Day of year and solar declination
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - startOfYear.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

  // Timezone offset in hours
  const tzOffset = -date.getTimezoneOffset() / 60;

  // Solar position parameters
  const D = dayOfYear;
  const g = fixAngle(357.529 + 0.98560028 * D);
  const q = fixAngle(280.459 + 0.98564736 * D);
  const L = fixAngle(q + 1.915 * Math.sin(d2r(g)) + 0.02 * Math.sin(d2r(2 * g)));
  const e = 23.439 - 0.00000036 * D;

  // Solar declination angle
  const decl = r2d(Math.asin(Math.sin(d2r(e)) * Math.sin(d2r(L))));
  
  // Equation of time (minutes)
  const RA = r2d(Math.atan2(Math.cos(d2r(e)) * Math.sin(d2r(L)), Math.cos(d2r(L)))) / 15;
  const EqT = q / 15 - fixHour(RA);

  // Solar noon (Dhuhr)
  const dhuhrHour = fixHour(12 + tzOffset - lng / 15 - EqT);

  // Helper function to calculate hour angle T for a given sun angle
  const sunAngleTime = (angle: number, direction: 'ccw' | 'cw') => {
    const cosH = (Math.sin(d2r(-angle)) - Math.sin(d2r(lat)) * Math.sin(d2r(decl))) /
                 (Math.cos(d2r(lat)) * Math.cos(d2r(decl)));
    
    if (cosH < -1 || cosH > 1) {
      // Polar regions or extreme latitudes fallback
      return dhuhrHour;
    }

    const H = r2d(Math.acos(cosH)) / 15;
    return direction === 'ccw' ? dhuhrHour - H : dhuhrHour + H;
  };

  // Helper for Asr time angle calculation
  const asrTime = (factor: number) => {
    const phi = Math.abs(lat - decl);
    const cotG = factor + Math.tan(d2r(phi));
    const angle = r2d(Math.atan(1 / cotG));
    const cosH = (Math.sin(d2r(angle)) - Math.sin(d2r(lat)) * Math.sin(d2r(decl))) /
                 (Math.cos(d2r(lat)) * Math.cos(d2r(decl)));
    if (cosH < -1 || cosH > 1) return dhuhrHour + 3;
    const H = r2d(Math.acos(cosH)) / 15;
    return dhuhrHour + H;
  };

  const methodConfig = METHOD_ANGLES[method] || METHOD_ANGLES[3];

  const fajrHour = sunAngleTime(methodConfig.fajr, 'ccw');
  const sunriseHour = sunAngleTime(0.833, 'ccw');
  const asrFactor = juristic === 1 ? 2 : 1;
  const asrHour = asrTime(asrFactor);

  // Maghrib: use maghribAngle if specified, otherwise standard 0.833° sunset,
  // then add maghribMinutes offset if defined.
  let maghribHour: number;
  if (methodConfig.maghribAngle) {
    maghribHour = sunAngleTime(methodConfig.maghribAngle, 'cw');
  } else {
    maghribHour = sunAngleTime(0.833, 'cw');
  }
  if (methodConfig.maghribMinutes) {
    maghribHour += methodConfig.maghribMinutes / 60;
  }

  let ishaHour: number;
  if (methodConfig.ishaIsMinutes) {
    ishaHour = maghribHour + (methodConfig.isha / 60);
  } else {
    ishaHour = sunAngleTime(methodConfig.isha, 'cw');
  }

  // Qiyam (last third of the night, between Maghrib and Fajr next day)
  const nightLength = (24 - maghribHour) + fajrHour;
  const qiyamHour = fixHour(maghribHour + (nightLength * 2) / 3);

  const formatTimeStr = (h: number) => {
    const cleanH = fixHour(h);
    const hours = Math.floor(cleanH);
    const mins = Math.floor((cleanH - hours) * 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  return {
    Fajr: formatTimeStr(fajrHour),
    Sunrise: formatTimeStr(sunriseHour),
    Dhuhr: formatTimeStr(dhuhrHour),
    Asr: formatTimeStr(asrHour),
    Maghrib: formatTimeStr(maghribHour),
    Isha: formatTimeStr(ishaHour),
    Qiyam: formatTimeStr(qiyamHour),
  };
}
