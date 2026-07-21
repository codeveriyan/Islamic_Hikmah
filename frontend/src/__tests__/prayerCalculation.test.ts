import { calculateLocalPrayerTimes } from "../services/prayerCalculation";

describe("calculateLocalPrayerTimes", () => {
  it("calculates valid 24h prayer time strings for Makkah coordinates", () => {
    const times = calculateLocalPrayerTimes({
      latitude: 21.4225,
      longitude: 39.8262,
      date: new Date(2026, 6, 21),
      method: 4, // Umm Al-Qura
    });

    expect(times).toHaveProperty("Fajr");
    expect(times).toHaveProperty("Sunrise");
    expect(times).toHaveProperty("Dhuhr");
    expect(times).toHaveProperty("Asr");
    expect(times).toHaveProperty("Maghrib");
    expect(times).toHaveProperty("Isha");
    expect(times).toHaveProperty("Qiyam");

    // All times should be in HH:mm format
    const timeRegex = /^\d{2}:\d{2}$/;
    expect(times.Fajr).toMatch(timeRegex);
    expect(times.Dhuhr).toMatch(timeRegex);
    expect(times.Maghrib).toMatch(timeRegex);
  });
});
