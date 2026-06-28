# Ruhani — Islamic Companion App (PRD)

## Overview
Ruhani is a React Native / Expo Islamic mobile application offering Du'as, Dhikr (Tasbih), Quran recitation, Prayer Times, Qibla direction, Emotion-based Du'a suggestions, Articles, and Reminders.

## Tech Stack
- Expo Router (file-based navigation)
- React Native + react-native-reanimated + expo-linear-gradient + expo-image
- expo-audio (Quran recitation), expo-location + expo-sensors (Qibla compass)
- expo-notifications (daily reminders), expo-haptics (Tasbih feedback)
- AsyncStorage for local persistence (favourites, dhikr counts, reminders, location)
- AlQuran Cloud API (https://api.alquran.cloud) — Quran text + en.asad translation + ar.alafasy audio
- Aladhan API (https://api.aladhan.com) — prayer times

## Bottom Tabs
1. **Home** — Quick actions (Quran/Tasbih/Prayer/Qibla) + Main/Other category toggle + colorful gradient cards (19 Du'a categories)
2. **Favourites** — Saved Du'as & Ayahs
3. **Articles** — Islamic articles with cover images
4. **Emotions** — Mood-based Du'a suggestions (Anxious, Grateful, Sad, Hopeful, Angry, Lonely)
5. **Reminder** — Local daily notification scheduler

## Detail Screens
- `dua/[category]` — Du'as with Arabic + transliteration + translation + favourite toggle
- `dhikr` — Tasbih counter with progress ring, haptic feedback, 6 preset dhikrs
- `quran/index` — Surah list (fetched live) with search
- `quran/[id]` — Surah detail with per-ayah Arabic + translation + play/pause audio + favourite
- `prayer-times` — 5 daily prayers based on location, next prayer hero card
- `qibla` — Magnetometer-based compass pointing to Kaaba (21.4225, 39.8262)
- `article/[id]` — Article reader with hero cover
- `settings` — Quick links menu

## Design System
- Dark navy surface (`#0B1120`) + colorful gradient cards per category
- Amiri font loaded via expo-font for Arabic script
- 8pt spacing tokens, pill segmented controls
- Phosphor-style icons via @expo/vector-icons MaterialCommunityIcons

## Data
- Bundled JSON data for 19 Du'a categories with curated Du'as
- 6 preset Dhikrs (SubhanAllah/Alhamdulillah/Allahu Akbar/La ilaha illallah/Astaghfirullah/Salawat)
- 5 seeded Islamic articles
- 6 emotion → dua mappings

## Authentication
None — fully local-first per user choice.

## Permissions
- iOS: NSLocationWhenInUseUsageDescription, NSMotionUsageDescription
- Android: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, VIBRATE
