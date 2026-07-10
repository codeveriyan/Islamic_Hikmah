import AsyncStorage from "@react-native-async-storage/async-storage";

export async function translateText(text: string, targetLang: string): Promise<string> {
  if (!targetLang || targetLang === "en" || !text) return text;

  const key = `hikmah:translate:${targetLang}:${hashCode(text)}`;
  try {
    const cached = await AsyncStorage.getItem(key);
    if (cached) return cached;
  } catch (e) {}

  try {
    // If it's a multi-line paragraph, translate each separately to keep formatting intact
    const paragraphs = text.split("\n\n");
    const translatedList = await Promise.all(
      paragraphs.map(async (para) => {
        if (!para.trim()) return para;

        let prefix = "";
        let cleanPara = para;

        // Keep list formatting (e.g. "- ", "* ", "1. ")
        const bulletMatch = para.match(/^(\s*[-*•]\s+|\s*\d+\.\s+)/);
        if (bulletMatch) {
          prefix = bulletMatch[1];
          cleanPara = para.substring(prefix.length);
        }

        // Call the free MyMemory translation API
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanPara)}&langpair=en|${targetLang}`;
        const response = await fetch(url);
        const json = await response.json();
        const translated = json?.responseData?.translatedText || cleanPara;

        return prefix + translated;
      })
    );

    const result = translatedList.join("\n\n");
    await AsyncStorage.setItem(key, result);
    return result;
  } catch (err) {
    console.warn("Seerah Translation error:", err);
    return text;
  }
}

function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return String(hash);
}
