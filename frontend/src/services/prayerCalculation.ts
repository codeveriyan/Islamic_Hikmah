/**
 * Local Offline Prayer Time Calculation Service
 * Fully offline solar astronomical calculation engine based on latitude, longitude, date, calculation method & juristic method.
 */

export interface PrayerCalculationParams {
  latitude: number;
  longitude: number;
  date?: Date;
  method?: number;   // Method ID: 1=Karachi/MWL, 2=ISNA, 3=MWL, 4=Umm Al-Qura, 5=Egyptian, 7=Tehran, 8=Gulf, 13=Diyanet
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

// Angles for calculation methods: [Fajr Angle, Isha Angle / Minute offset]
const METHOD_ANGLES: Record<number, { fajr: number; isha: number; ishaIsMinutes?: boolean }> = {
  1: { fajr: 18, isha: 18 },       // Karachi / MWL
  2: { fajr: 15, isha: 15 },       // ISNA
  3: { fajr: 18, isha: 17 },       // Muslim World League
  4: { fajr: 18.5, isha: 90, ishaIsMinutes: true }, // Umm Al-Qura (90 mins after Maghrib)
  5: { fajr: 19.5, isha: 17.5 },   // Egyptian
  7: { fajr: 17.7, isha: 14 },     // Tehran
  8: { fajr: 19.5, isha: 90, ishaIsMinutes: true }, // Gulf
  13: { fajr: 18, isha: 17 },      // Diyanet (Turkey)
};

const d2r = (d: number) => (d * Math.PI) / 180;
const r2d = (r: number) => (r * 180) / Math.PI;
const fixAngle = (a: number) => ((a % 360) + 360) % 360;
const fixHour = (h: number) => ((h % 24) + 24) % 24;

/**
 * Calculates local prayer times offline.
 */
export function calculateLocalPrayerTimes(params: PrayerCalculationParams): CalculatedPrayerTimes {
  const { latitude: lat, longitude: lng, date = new Date(), method = 1, juristic = 0 } = params;

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

  const methodConfig = METHOD_ANGLES[method] || METHOD_ANGLES[1];

  const fajrHour = sunAngleTime(methodConfig.fajr, 'ccw');
  const sunriseHour = sunAngleTime(0.833, 'ccw');
  const maghribHour = sunAngleTime(0.833, 'cw');
  const asrFactor = juristic === 1 ? 2 : 1;
  const asrHour = asrTime(asrFactor);

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
