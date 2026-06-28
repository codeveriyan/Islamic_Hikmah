export type Emotion = {
  id: string;
  label: string;
  emoji: string;
  description: string;
  duaIds: string[]; // references CATEGORIES[].duas[].id
  gradient: readonly [string, string];
};

export const EMOTIONS: Emotion[] = [
  {
    id: 'anxious',
    label: 'Anxious',
    emoji: '😟',
    description: 'When worry tightens the chest',
    duaIds: ['diff-1', 'iman-1'],
    gradient: ['#1E40AF', '#60A5FA'],
  },
  {
    id: 'grateful',
    label: 'Grateful',
    emoji: '🤲',
    description: 'To thank Allah for His blessings',
    duaIds: ['morning-1', 'salah-1'],
    gradient: ['#047857', '#34D399'],
  },
  {
    id: 'sad',
    label: 'Sad',
    emoji: '🥺',
    description: 'When sorrow weighs heavy',
    duaIds: ['diff-1', 'after-1'],
    gradient: ['#7C3AED', '#C4B5FD'],
  },
  {
    id: 'hopeful',
    label: 'Hopeful',
    emoji: '🌅',
    description: 'Seeking blessings ahead',
    duaIds: ['morning-2', 'tahajjud-1'],
    gradient: ['#EA580C', '#FCD34D'],
  },
  {
    id: 'angry',
    label: 'Angry',
    emoji: '😤',
    description: 'When patience grows thin',
    duaIds: ['social-1', 'after-1'],
    gradient: ['#B91C1C', '#FB7185'],
  },
  {
    id: 'lonely',
    label: 'Lonely',
    emoji: '😔',
    description: 'For closeness to Allah',
    duaIds: ['evening-2', 'iman-1'],
    gradient: ['#0F766E', '#5EEAD4'],
  },
];
