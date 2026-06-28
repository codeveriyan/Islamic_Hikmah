export type Article = {
  id: string;
  title: string;
  category: string;
  readingTime: string;
  cover: string;
  excerpt: string;
  body: string;
};

export const ARTICLES: Article[] = [
  {
    id: 'a1',
    title: 'The Spiritual Power of Morning Dhikr',
    category: 'Spirituality',
    readingTime: '5 min read',
    cover: 'https://images.unsplash.com/photo-1581224463294-908316338239?w=800',
    excerpt: 'Discover how starting your day with remembrance of Allah anchors the heart and protects the soul.',
    body: 'The Prophet ﷺ taught us that the morning hours carry a unique barakah. The angels descend, the heart is most receptive, and a few minutes of dhikr can transform the entire day.\n\nReciting Ayat al-Kursi, the last three Surahs, and the morning adhkar shields a believer from harm until evening. These practices are not just words — they are an active engagement with the Divine.\n\nMake them consistent, even if small.',
  },
  {
    id: 'a2',
    title: 'Why Tahajjud Changes Everything',
    category: 'Worship',
    readingTime: '4 min read',
    cover: 'https://images.unsplash.com/photo-1542816417-0983c9c9ad53?w=800',
    excerpt: 'The last third of the night holds answers to prayers that daylight rarely brings.',
    body: 'Tahajjud is the prayer of the sincere. When the world sleeps and the heart is quiet, Allah descends to the lowest heaven and asks: "Who is calling Me, that I may answer?"\n\nStart with two rakats. Then add as you grow. Even a single sajdah in the depth of night can rewrite the script of your life.',
  },
  {
    id: 'a3',
    title: 'Understanding Surah al-Fatiha',
    category: 'Quran',
    readingTime: '7 min read',
    cover: 'https://images.pexels.com/photos/36353350/pexels-photo-36353350.jpeg?w=800',
    excerpt: 'The opening chapter is a conversation, not a recitation.',
    body: 'When you recite al-Fatiha, Allah Himself responds to every verse. The hadith qudsi tells us: "I have divided the prayer between Me and My servant into two halves."\n\nEach line opens a window into the heart of worship — gratitude, lordship, mercy, judgment, and the cry for guidance.',
  },
  {
    id: 'a4',
    title: 'Dua: The Believer\'s Weapon',
    category: 'Dua',
    readingTime: '3 min read',
    cover: 'https://images.unsplash.com/photo-1627790497727-41fb43f961be?w=800',
    excerpt: 'Why supplication is the most powerful tool a believer carries.',
    body: 'Dua is not a last resort — it is a constant companion. The Prophet ﷺ called it "the essence of worship." Through dua, we acknowledge our dependence, soften our hearts, and unlock doors no key can reach.\n\nThe best times: between adhan and iqamah, the last third of the night, on Fridays, and while in sajdah.',
  },
  {
    id: 'a5',
    title: 'Ramadan: Beyond Hunger',
    category: 'Ramadan',
    readingTime: '6 min read',
    cover: 'https://images.unsplash.com/photo-1543699936-c901ddbf0c05?w=800',
    excerpt: 'A guide to making this Ramadan transformational, not just ritual.',
    body: 'Fasting is the school of taqwa. Ramadan trains us to control desire, treasure time, and find Allah in the everyday.\n\nDecide today what your Ramadan goal will be — a complete khatm, a daily charity, or a single bad habit defeated. Plan it like an athlete plans their season.',
  },
];
