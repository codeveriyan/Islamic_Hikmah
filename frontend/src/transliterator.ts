const WORD_MAP: Record<string, string> = {
  "allah": "அல்லாஹ்",
  "allahu": "அல்லாஹ்",
  "allahumma": "அல்லாஹும்ம",
  "lillah": "லில்லாஹ்",
  "lillahi": "லில்லாஹi",
  "alhamdu": "அல்ஹம்து",
  "al-hamdu": "அல்ஹம்து",
  "rabbana": "ரப்பனா",
  "rabbi": "ரப்பீ",
  "bismillah": "பிஸ்மில்லாஹ்",
  "bismillahi": "பிஸ்மில்லாஹி",
  "la": "லா",
  "ilaha": "இலாஹ",
  "illa": "இல்லா",
  "illallah": "இல்லல்லாஹ்",
  "wa": "வ",
  "anta": "அன்த",
  "ana": "அன",
  "abduka": "அப்துக",
  "ala": "அலா",
  "fi": "ஃபீ",
  "min": "மின்",
  "in": "இன்",
  "bi": "பி",
  "ya": "யா",
  "alladhi": "அல்லதீ",
  "ahyana": "அஹ்யானா",
  "ba'da": "பஃத",
  "ma": "மா",
  "amatana": "அமாத்தனா",
  "wa-ilayhi": "வ இலைஹி",
  "ilayhi": "இலைஹி",
  "nushur": "நுஷூர்",
  "asbahna": "அஸ்பஹ்னா",
  "asbaha": "அஸ்பஹ",
  "al-mulku": "அல்முல்கு",
  "mulku": "முல்கு",
  "fitratil": "ஃபித்ரதில்",
  "fitrat": "ஃபித்ரத்",
  "islam": "இஸ்லாம்",
  "al-islam": "அல்இஸ்லாம்",
  "dini": "தீனி",
  "nabiyyina": "நபிய்யினா",
  "muhammad": "முஹம்மத்",
  "muhammadin": "முஹம்மதின்",
  "hasbi": "ஹஸ்பி",
  "huwa": "ஹuவ",
  "alayhi": "அலைஹி",
  "tawakkaltu": "தவக்கல்து",
  "rabbu": "ரப்பு",
  "arshi": "அர்ஷி",
  "al-arshi": "அல்அர்ஷி",
  "azim": "அழீம்",
  "al-azim": "அல்அழீம்",
  "raditu": "ரதீது",
  "billahi": "பில்லாஹி",
  "rabban": "ரப்பன்",
  "dinan": "தீனன்",
  "nabiyyan": "நபிய்யன்",
  "subhan": "ஸுப்ஹான்",
  "subhanallah": "ஸுப்ஹானல்லாஹ்",
  "al-adheem": "அல்அழீம்",
  "adheem": "அழீம்",
  "astaghfirullah": "அஸ்தஃபிருல்லாஹ்",
  "alhamdulillah": "அல்ஹம்துலில்லாஹ்",
  "akbar": "அக்பர்",
  "allahu-akbar": "அல்லாஹு அக்பர்",
  "amin": "ஆமீன்",
};

interface ConsonantMapping {
  base: string;
  dotted: string;
}

const CONSONANTS: Record<string, ConsonantMapping> = {
  "sh": { base: "ஷ", dotted: "ஷ்" },
  "kh": { base: "ஹ", dotted: "ஹ்" },
  "th": { base: "த", dotted: "த்" },
  "dh": { base: "த", dotted: "த்" },
  "gh": { base: "ஃப", dotted: "ஃப்" },
  "b": { base: "ப", dotted: "ப்" },
  "t": { base: "த", dotted: "த்" },
  "j": { base: "ஜ", dotted: "ஜ்" },
  "h": { base: "ஹ", dotted: "ஹ்" },
  "d": { base: "த", dotted: "த்" },
  "r": { base: "ர", dotted: "ர்" },
  "z": { base: "ஸ", dotted: "ஸ்" },
  "s": { base: "ஸ", dotted: "ஸ்" },
  "f": { base: "ஃப", dotted: "ஃப்" },
  "q": { base: "க", dotted: "க்" },
  "k": { base: "க", dotted: "க்" },
  "l": { base: "ல", dotted: "ல்" },
  "m": { base: "ம", dotted: "ம்" },
  "n": { base: "ன", dotted: "ன்" },
  "w": { base: "வ", dotted: "வ்" },
  "y": { base: "ய", dotted: "ய்" }
};

const VOWELS: Record<string, string> = {
  "aa": "ா",
  "ee": "ீ",
  "oo": "ூ",
  "a": "ா",
  "i": "ி",
  "u": "ு",
  "e": "ெ",
  "o": "ொ"
};

const VOWEL_INITIALS: Record<string, string> = {
  "aa": "ஆ",
  "ee": "ஈ",
  "oo": "ஊ",
  "a": "அ",
  "i": "இ",
  "u": "உ",
  "e": "எ",
  "o": "ஒ"
};

function transliterateWordToTamil(word: string): string {
  const cleanWord = word.toLowerCase().replace(/[^a-z']/g, "");
  if (WORD_MAP[cleanWord]) {
    return WORD_MAP[cleanWord];
  }
  
  let result = "";
  let i = 0;
  
  const match = (str: string) => {
    return cleanWord.substring(i, i + str.length) === str;
  };
  
  while (i < cleanWord.length) {
    let consonantKey = null;
    if (match("sh")) consonantKey = "sh";
    else if (match("kh")) consonantKey = "kh";
    else if (match("th")) consonantKey = "th";
    else if (match("dh")) consonantKey = "dh";
    else if (match("gh")) consonantKey = "gh";
    else if (cleanWord[i] in CONSONANTS) consonantKey = cleanWord[i];
    
    if (consonantKey) {
      const cons = CONSONANTS[consonantKey];
      i += consonantKey.length;
      
      let vowelKey = null;
      if (match("aa")) vowelKey = "aa";
      else if (match("ee")) vowelKey = "ee";
      else if (match("oo")) vowelKey = "oo";
      else if (["a", "i", "u", "e", "o"].includes(cleanWord[i])) vowelKey = cleanWord[i];
      
      if (vowelKey) {
        result += cons.base + VOWELS[vowelKey];
        i += vowelKey.length;
      } else {
        result += cons.dotted;
      }
      continue;
    }
    
    let vowelKey = null;
    if (match("aa")) vowelKey = "aa";
    else if (match("ee")) vowelKey = "ee";
    else if (match("oo")) vowelKey = "oo";
    else if (["a", "i", "u", "e", "o"].includes(cleanWord[i])) vowelKey = cleanWord[i];
    
    if (vowelKey) {
      result += (result === "") ? VOWEL_INITIALS[vowelKey] : VOWELS[vowelKey];
      i += vowelKey.length;
      continue;
    }
    
    if (match("'")) {
      result += "ஃ";
      i++;
      continue;
    }
    
    i++;
  }
  
  return result.replace(/ா+/g, "ா");
}

export function transliterateToTamil(text: string): string {
  if (!text) return "";
  return text.split(/([\s,\-\.\(\)\!\?]+)/).map(part => {
    if (/[\s,\-\.\(\)\!\?]+/.test(part)) {
      return part;
    }
    return transliterateWordToTamil(part);
  }).join("");
}
