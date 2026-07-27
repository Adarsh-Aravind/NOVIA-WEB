export const MOODS = ['Happy', 'Overwhelmed', 'Exhausted', 'Low Energy', 'Neutral'] as const;

export const MOOD_EMOJI: Record<string, string> = {
  Happy: '😊',
  Overwhelmed: '😵‍💫',
  Exhausted: '😴',
  'Low Energy': '🪫',
  Neutral: '🙂',
};

export const MOOD_COLOR: Record<string, string> = {
  Happy: 'var(--lime)',
  Overwhelmed: 'var(--brick)',
  Exhausted: '#7D8A6F',
  'Low Energy': '#D8B863',
  Neutral: 'var(--forest)',
};

export function partnerMoodAdvice(mood: string, name: string): string {
  switch (mood) {
    case 'Happy':
      return `${name} is feeling Happy today. Plan a sweet dessert date, share a high-energy activity, or celebrate this vibe together.`;
    case 'Overwhelmed':
      return `${name} is feeling Overwhelmed. Take care of any pending chores, keep your communication extremely soft, and defer deep or stressful debates for later.`;
    case 'Exhausted':
      return `${name} is Exhausted. Create a cozy, quiet sanctuary at home, offer a soothing warm beverage, and keep the environment restful.`;
    case 'Low Energy':
      return `${name} has Low Energy. Gentle cuddles, warm physical presence, and check-in without placing demands will make them feel loved.`;
    default:
      return `${name} is feeling balanced. Send a cute meme, check in with a thoughtful text, or plan a tiny shared moment.`;
  }
}

export const NOTE_REACTIONS = ['❤️', '😂', '👍', '🥺', '🔥'] as const;

// Daily check-in feelings, ordered brightest → lowest. Mirrors the app.
export const CHECK_IN_FEELINGS: { emoji: string; label: string }[] = [
  { emoji: '😄', label: 'Great' },
  { emoji: '🙂', label: 'Good' },
  { emoji: '😐', label: 'Okay' },
  { emoji: '😔', label: 'Low' },
  { emoji: '😢', label: 'Rough' },
];

// Emoji palette offered when creating a milestone. Mirrors the app.
export const MILESTONE_EMOJIS = ['💛', '💍', '🌹', '🎉', '✈️', '🏡', '🎂', '⭐'] as const;

export const BRAINSTORM_CATEGORIES = [
  { key: 'todo', label: 'To-do', emoji: '✅' },
  { key: 'study', label: 'Study', emoji: '📚' },
  { key: 'date_ideas', label: 'Date ideas', emoji: '💐' },
] as const;

export const BUCKET_CATEGORIES = [
  { key: 'traveling', label: 'Traveling', emoji: '✈️' },
  { key: 'fine_dining', label: 'Fine dining', emoji: '🍽️' },
  { key: 'adventure', label: 'Adventure', emoji: '⛰️' },
  { key: 'learning', label: 'Learning', emoji: '🎓' },
] as const;

export const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack'] as const;

export const PERIOD_SYMPTOMS = [
  'Cramps',
  'Headache',
  'Fatigue',
  'Bloating',
  'Mood swings',
  'Backache',
  'Nausea',
  'Cravings',
  'Tender breasts',
  'Acne',
] as const;

export const PHASE_COLOR: Record<string, string> = {
  Menstruation: 'var(--brick)',
  Follicular: 'var(--moss)',
  Ovulation: 'var(--lime)',
  Luteal: '#D8B863',
  Unknown: '#8A8B7C',
};
