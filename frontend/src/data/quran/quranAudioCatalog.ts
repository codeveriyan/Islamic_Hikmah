/**
 * QuranicAudio chapter recordings shared by the Read and Listen Quran pickers.
 * These sources publish one MP3 per surah. They do not expose word timings.
 */
export type QuranAudioCategory =
  | "Recitations"
  | "Haramain Taraweeh"
  | "Non-Hafs Recitations"
  | "Recitations with Translations";

export type QuranAudioCatalogReciter = {
  id: string;
  name: string;
  style: string;
  path: string;
  category: QuranAudioCategory;
  categoryGroup?: string;
};

const chapter = (
  id: number,
  name: string,
  folder: string,
  style = "Murattal",
  category: QuranAudioCategory = "Recitations",
  categoryGroup?: string,
): QuranAudioCatalogReciter => ({
  id: `quranicaudio-${id}`,
  name,
  style,
  path: `https://download.quranicaudio.com/quran/${folder}/`,
  category,
  categoryGroup,
});

const STANDARD = [
  [1, "Abdullah Awad al-Juhani", "abdullaah_3awwaad_al-juhaynee"], [2, "Abdullah Basfar", "abdullaah_basfar"],
  [8, "Ali Abdur-Rahman al-Huthaify", "huthayfi"], [11, "AbdulMuhsin al-Qasim", "abdul_muhsin_alqasim"],
  [15, "AbdulBari ath-Thubaity", "thubaity"], [21, "AbdulAzeez al-Ahmad", "abdulazeez_al-ahmad"],
  [40, "AbdulWadud Haneef", "abdulwadood_haneef"], [125, "AbdulWadood Haneef", "abdul_wadood_haneef_rare", "Rare"],
  [44, "Aziz Alili", "aziz_alili"], [55, "Al-Hussayni Al-'Azazy (with Children)", "alhusaynee_al3azazee_with_children", "With Children"],
  [68, "Abdur-Razaq bin Abtan al-Dulaimi", "abdulrazaq_bin_abtan_al_dulaimi", "Mujawwad"], [72, "Abdullah Khayat", "khayat"],
  [81, "Adel Kalbani", "adel_kalbani"], [106, "AbdulKareem Al Hazmi", "abdulkareem_al_hazmi"],
  [108, "Abdul-Mun'im Abdul-Mubdi'", "abdulmun3im_abdulmubdi2"], [109, "Abdur-Rashid Sufi", "abdurrashid_sufi"],
  [113, "Ahmad al-Huthaify", "ahmad_alhuthayfi"], [115, "Abu Bakr al-Shatri", "abu_bakr_ash-shatri_tarawee7", "Taraweeh"],
  [124, "Abdullah Matroud", "abdullah_matroud"], [126, "Ahmad Nauina", "ahmad_nauina"],
  [127, "Akram Al-Alaqmi", "akram_al_alaqmi"], [128, "Ali Hajjaj Alsouasi", "ali_hajjaj_alsouasi"],
  [135, "Asim Abdul Aleem", "asim_abdulaleem"], [136, "Abdallah Abdal", "abdallah_abdal"],
  [162, "Abdulrahman al-Shahat", "abdulrahman_al_shahat"], [163, "Abdulaziz bin Saleh al-Zahrani", "abdulaziz_bin_saleh_alzahrani"],
  [166, "Alijon Qari", "alijon_qari/mp3"], [167, "Badr Al Turki", "badr_al_turki/mp3"],
  [74, "Dr. Shawqy Hamed", "dr.shawqy_7amed/murattal"], [14, "Fares Abbad", "fares"],
  [170, "Farman Shawani", "farman_shawani/mp3"], [64, "Hamad Sinan", "hamad_sinan"],
  [85, "Hatem Farid", "hatem_farid/collection"], [28, "Ibrahim Al-Jibrin", "jibreen"],
  [93, "Imad Zuhair Hafez", "imad_zuhair_hafez"], [103, "Ibrahim Al Akhdar", "ibrahim_al_akhdar"],
  [116, "Idrees Abkar", "idrees_abkar"], [9, "Khalid al-Qahtani", "khaalid_al-qahtaanee"],
  [105, "Khalid Al Ghamdi", "khalid_alghamdi", "Selected Surahs"], [41, "Muhammad Siddiq al-Minshawi", "minshawi_mujawwad", "Mujawwad"],
  [12, "Muhammad Jibreel", "muhammad_jibreel/complete"], [26, "Muhammad al-Mehysni", "mehysni"],
  [53, "Muhammad al-Luhaidan", "muhammad_alhaidan"], [70, "Muhammad Abdul-Kareem", "muhammad_abdulkareem"],
  [71, "Mustafa al-'Azawi", "mustafa_al3azzawi"], [79, "Muhammad Hassan", "mu7ammad_7assan"],
  [88, "Mostafa Ismaeel", "mostafa_ismaeel"], [90, "Muhammad Sulaiman Patel", "muhammad_patel"],
  [91, "Mohammad Al-Tablawi", "mohammad_altablawi"], [92, "Mohammad Ismaeel Al-Muqaddim", "mohammad_ismaeel_almuqaddim"],
  [107, "Muhammad Ayyoob", "muhammad_ayyoob_hq", "Taraweeh"], [118, "Masjid Quba Taraweeh 1434", "masjid_quba_1434", "Taraweeh"],
  [119, "Muhammad Khaleel", "muhammad_khaleel"], [129, "Mahmood Ali Al-Bana", "mahmood_ali_albana"],
  [164, "Mahmoud Khaleel Al-Husary", "generated/husary_mujawwad", "Mujawwad"], [10, "Nabil ar-Rifai", "nabil_rifa3i"],
  [104, "Nasser Al Qatami", "nasser_bin_ali_alqatami"], [169, "Peshawa Qadir al-Kurdi", "peshawa_qadir_al-kurdi/mp3"],
  [168, "Raad Mohammad al-Kurdi", "raad_mohammad_al_kurdi/mp3"], [17, "Sahl Yasin", "sahl_yaaseen"],
  [18, "Salah Bukhatir", "salaah_bukhaatir"], [20, "Sudais and Shuraym", "sodais_and_shuraim"],
  [35, "Saleh al Taleb", "saleh_al_taleb"], [43, "Salah al-Budair", "salahbudair"],
  [61, "Sadaqat `Ali", "sadaqat_ali"], [80, "Salah Al-Hashim", "salah_alhashim"],
  [23, "Tawfeeq ibn Sa`id as-Sawa'igh", "tawfeeq_bin_saeed-as-sawaaigh"], [130, "Wadee Hammadi Al Yamani", "wadee_hammadi_al-yamani"],
] as const;

const HARAMAIN = [
  [29, "Makkah", 1426], [34, "Makkah", 1427], [45, "Makkah", 1425], [59, "Makkah", 1428], [63, "Makkah", 1424], [77, "Makkah", 1429], [82, "Makkah", 1430], [83, "Makkah", 1431], [94, "Makkah", 1432], [98, "Makkah", 1433], [120, "Makkah", 1434], [131, "Makkah", 1435], [132, "Makkah", 1436], [133, "Makkah", 1437], [150, "Makkah", 1438], [151, "Makkah", 1439], [152, "Makkah", 1440], [153, "Makkah", 1441], [154, "Makkah", 1442], [175, "Makkah", 1443], [176, "Makkah", 1444], [177, "Makkah", 1445], [178, "Makkah", 1446], [179, "Makkah", 1447],
  [25, "Madinah", 1419], [30, "Madinah", 1426], [33, "Madinah", 1427], [46, "Madinah", 1423], [73, "Madinah", 1428], [84, "Madinah", 1431], [99, "Madinah", 1429], [100, "Madinah", 1430], [101, "Madinah", 1432], [102, "Madinah", 1433], [123, "Madinah", 1435], [143, "Madinah", 1434], [144, "Madinah", 1436], [145, "Madinah", 1437], [146, "Madinah", 1439], [147, "Madinah", 1440], [148, "Madinah", 1441], [149, "Madinah", 1442], [171, "Madinah", 1443], [172, "Madinah", 1444], [173, "Madinah", 1445], [174, "Madinah", 1446], [180, "Madinah", 1447],
] as const;

const NON_HAFS = [
  [54, "AbdulBaset AbdulSamad", "abdulbaset_warsh", "Warsh"], [60, "Abdur-Rashid Sufi", "abdurrashid_sufi_soosi_rec", "Soosi"], [62, "Abdur-Rashid Sufi", "abdurrashid_sufi_-_khalaf_3an_7amza_recitation", "Khalaf"], [110, "Abdur-Rashid Sufi", "abdurrashid_sufi_abi_al7arith", "Abi al-Haarith an al-Kasaa'ee"], [111, "Abdur-Rashid Sufi", "abdurrashid_sufi_doori", "ad-Doori an Abi Amr"], [112, "Abdur-Rashid Sufi", "abdurrashid_sufi_shu3ba", "Shu'bah an Asim"], [114, "Ali al-Huthaify", "huthayfi_qaloon", "Qaloon"], [137, "Abdur-Rashid Sufi", "abdurrashid_sufi_soosi_2020", "Soosi (2020)"], [78, "Mahmoud Khalil Al-Husary", "mahmood_khaleel_al-husaree_doori", "Doori"], [155, "Noreen Siddiq", "noreen_siddiq", "ad-Doori an Abi Amr"],
] as const;

const TRANSLATIONS = [
  [47, "AbdulBaset AbdulSamad with Naeem Sultan", "abdulbaset_with_naeem_sultan_pickthall", "Pickthall Translation"], [57, "AbdulBaset AbdulSamad with Ibrahim Walk", "abdulbasit_w_ibrahim_walk_si", "Saheeh Intl Translation"], [66, "Abdullah Basfar with Ibrahim Walk", "abdullah_basfar_w_ibrahim_walk_si", "Saheeh Intl Translation"], [165, "Ibrahim Walk", "ibrahim_walk", "English Translation"], [39, "Muhammad Ayyub with Mikaal Waters", "muhammad_ayub_and_mikaal_waters", "Muhsin Khan Translation"], [49, "Mishari ibn Rashid al-`Afasy with Saabir", "mishaari_with_saabir_mkhan", "Muhsin Khan Translation"], [58, "Mishari ibn Rashid al-`Afasy with Ibrahim Walk", "mishaari_w_ibrahim_walk_si", "Saheeh Intl Translation"], [36, "Sudais and Shuraym with Aslam Athar", "sudais_shuraim_and_english", "Pickthall Translation"], [42, "Shakir Qasami with Aslam Athar", "shakir_qasami_with_english", "Pickthall Translation"], [48, "Sudais and Shuraym with Naeem Sultan", "sudais_shuraim_with_naeem_sultan_pickthall", "Pickthall Translation"], [67, "Sudais and Shuraym", "sudais_and_shuraim_with_urdu", "Urdu Translation"],
] as const;

export const QURAN_AUDIO_CATEGORIES: QuranAudioCategory[] = [
  "Recitations", "Haramain Taraweeh", "Non-Hafs Recitations", "Recitations with Translations",
];

export const QURAN_AUDIO_CATALOG: QuranAudioCatalogReciter[] = [
  ...STANDARD.map(([id, name, folder, style]) => chapter(id, name, folder, style)),
  ...HARAMAIN.map(([id, mosque, year]) => chapter(id, `${mosque} Taraweeh ${year}`, `${mosque.toLowerCase()}_${year}${year >= 1443 ? "/mp3" : ""}`, "Taraweeh", "Haramain Taraweeh", mosque)),
  ...NON_HAFS.map(([id, name, folder, style]) => chapter(id, name, folder, style, "Non-Hafs Recitations", style)),
  ...TRANSLATIONS.map(([id, name, folder, style]) => chapter(id, name, folder, style, "Recitations with Translations", style)),
];
