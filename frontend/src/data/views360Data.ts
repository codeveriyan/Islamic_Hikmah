import { getCdnAssetUrl } from "@/src/utils/cdnAsset";

export interface HolyPlace360 {
  id: string;
  assetKey: string;
  title: string;
  subtitle: string;
  city: "Makkah" | "Madinah" | "Jerusalem";
  description: string;
  thumbnailUrl: string;
  panoramaUrl: string;
  badge?: string;
  latitude?: number;
  longitude?: number;
}

export const HOLY_PLACES_360: HolyPlace360[] = [
  {
    id: "hijr_ismail_kaaba",
    assetKey: "hijr_ismail",
    title: "(Hijr Ismail) Masjid Al-Haram",
    subtitle: "The Holy Kaaba from Hijr Ismail View",
    city: "Makkah",
    description:
      "Hijr Ismail (Hateem) is the semi-circular wall opposite the north-west wall of the Kaaba. It is considered part of the Kaaba itself, and praying inside Hijr Ismail carries the immense reward of praying inside the Kaaba.",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/hijr_ismail.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/hijr_ismail.jpg"),
    badge: "360° HD",
    latitude: 21.4225,
    longitude: 39.8262,
  },
  {
    id: "rawdah_masjid_nabawi",
    assetKey: "rawdah",
    title: "(Rawdah) in Masjid An-Nabawi",
    subtitle: "Riyazul Jannah between Prophet's ﷺ tomb & minbar",
    city: "Madinah",
    description:
      "Also called Riyazul Jannah (Garden of Paradise), refers to the area between the sacred chamber/tomb of Prophet Muhammad ﷺ and his minbar inside Masjid An-Nabawi in Madinah. The Prophet ﷺ said: 'Between my house and my minbar is a garden from the gardens of Paradise.'",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/rawdah.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/rawdah.jpg"),
    badge: "360° HD",
    latitude: 24.4672,
    longitude: 39.6111,
  },
  {
    id: "al_safa_mountain",
    assetKey: "al_safa",
    title: "Al-Safa Mountain",
    subtitle: "One of the two small hills inside Masjid Al-Haram",
    city: "Makkah",
    description:
      "Al-Safa and Al-Marwa are two small hills now enclosed inside Masjid Al-Haram. Pilgrims travel back and forth 7 times between them during Hajj & Umrah, honoring the historic devotion of Hajar (may Allah be pleased with her) searching for water for baby Ismail (peace be upon him).",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/al_safa.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/al_safa.jpg"),
    badge: "360° HD",
    latitude: 21.4221,
    longitude: 39.8273,
  },
  {
    id: "maqam_ibrahim",
    assetKey: "maqam_ibrahim",
    title: "Maqam Ibrahim",
    subtitle: "The Station of Prophet Ibrahim (peace be upon him)",
    city: "Makkah",
    description:
      "Maqam Ibrahim is the sacred stone block on which Prophet Ibrahim (peace be upon him) stood while rebuilding the Kaaba with his son Ismail. Allah commands in the Quran: 'And take, [O believers], from the standing place of Ibrahim a place of prayer.' (Surah Al-Baqarah 2:125)",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/maqam_ibrahim.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/maqam_ibrahim.jpg"),
    badge: "360° HD",
    latitude: 21.4226,
    longitude: 39.8263,
  },
  {
    id: "al_aqsa_mosque",
    assetKey: "al_aqsa",
    title: "Al-Aqsa Mosque (Al-Qibli Mosque)",
    subtitle: "The First Qibla of Islam in Jerusalem",
    city: "Jerusalem",
    description:
      "Al-Aqsa Mosque is the third holiest site in Islam, located in the Old City of Jerusalem. It served as the first Qibla for Muslims before the direction was changed to Makkah, and is the destination of the Prophet's ﷺ miraculous Night Journey (Isra and Mi'raj).",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/al_aqsa.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/al_aqsa.jpg"),
    badge: "360° HD",
    latitude: 31.7761,
    longitude: 35.2358,
  },
  {
    id: "dome_of_the_rock",
    assetKey: "dome_of_rock",
    title: "Dome of the Rock (Qubbat Al-Sakhrah)",
    subtitle: "Iconic golden dome on the Temple Mount compound",
    city: "Jerusalem",
    description:
      "The Dome of the Rock is an Islamic shrine located on the Temple Mount in the Old City of Jerusalem. Built in the late 7th century, it houses the sacred Foundation Stone from which Prophet Muhammad ﷺ ascended to the heavens during the Night of Mi'raj.",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/dome_of_rock.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/dome_of_rock.jpg"),
    badge: "360° HD",
    latitude: 31.7780,
    longitude: 35.2354,
  },
  {
    id: "mount_arafat",
    assetKey: "mount_arafat",
    title: "Mount Arafat (Jabal Al-Rahmah)",
    subtitle: "The Mount of Mercy during the pinnacle of Hajj",
    city: "Makkah",
    description:
      "Jabal Al-Rahmah (Mount of Mercy) is a granite hill in the plain of Arafat. Standing at Arafat on the 9th of Dhul Hijjah is the central pillar of Hajj. Prophet Muhammad ﷺ delivered his famous Farewell Sermon (Khutbat al-Wada') near this hill.",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/mount_arafat.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/mount_arafat.jpg"),
    badge: "360° HD",
    latitude: 21.3548,
    longitude: 39.9841,
  },
  {
    id: "cave_hira",
    assetKey: "cave_hira",
    title: "Cave Hira (Jabal Al-Nour)",
    subtitle: "The Cave of First Divine Revelation",
    city: "Makkah",
    description:
      "Cave Hira is located on Jabal Al-Nour (Mountain of Light) near Makkah. It is the cave where Prophet Muhammad ﷺ received the first divine revelations of the Holy Quran from Angel Jibreel (Gabriel), beginning with the command: 'Read! In the Name of your Lord Who created.'",
    thumbnailUrl: getCdnAssetUrl("360/thumbs/cave_hira.jpg"),
    panoramaUrl: getCdnAssetUrl("360/panos/cave_hira.jpg"),
    badge: "360° HD",
    latitude: 21.4574,
    longitude: 39.8593,
  },
];
