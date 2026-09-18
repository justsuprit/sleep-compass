// ============================================================
// config.js — static data and constants only. No DOM access, no
// logic beyond simple lookups. This is the file to edit when adding
// a new theme, a new rating profile, or a new octant-based dataset
// (like the upcoming Kua direction tables) — everything else in the
// app (app.js) just reads from here.
// ============================================================

export const RATING_COLORS = {
  GREEN: '#4ade80',
  YELLOW: '#facc15',
  RED: '#f87171'
};

export const OCTANT_LABELS = {
  N: 'North', NE: 'North-East', E: 'East', SE: 'South-East',
  S: 'South', SW: 'South-West', W: 'West', NW: 'North-West'
};

// Two independent rule sets (profiles), each mapping one of the 8
// compass octants to a rating/score/explanation. Ranges match the
// standard 22.5°-wide octant convention, centered on each
// cardinal/intercardinal point (e.g. East = 67.5°-112.5°).
export const PROFILES = {
  isha_sadhguru: {
    label: 'Isha / Sadhguru',
    // Only this profile has a documented hemisphere invariant:
    // south of the equator, North and South ratings swap.
    hemisphereSwap: { N: 'S', S: 'N' },
    rules: {
      N:  { rating: 'RED',    score: 0,   title: 'Strictly Prohibited',
            reason: 'Magnetic repulsion pulls iron-rich blood toward the brain — micro-circulation stress, restless sleep, nightmares, and elevated cardiovascular stress over time.' },
      NE: { rating: 'YELLOW', score: 50,  title: 'Borderline / Tolerable',
            reason: 'Sadhguru notes NE is "okay" as an intermediate angle, though not ideal.' },
      E:  { rating: 'GREEN',  score: 100, title: 'Optimal',
            reason: 'Best overall orientation. Enhances memory, mental clarity, and spiritual receptivity.' },
      SE: { rating: 'YELLOW', score: 50,  title: 'Sub-optimal / Mixed',
            reason: 'Intermediate zone inheriting partial effects of adjacent cardinal headings.' },
      S:  { rating: 'GREEN',  score: 80,  title: 'Very Good',
            reason: 'Neutralizes magnetic repulsion in the Northern Hemisphere; blood flows naturally without excess pressure on cerebral capillaries.' },
      SW: { rating: 'YELLOW', score: 70,  title: 'Green-Light Leaning',
            reason: 'Retains positive southern characteristics.' },
      W:  { rating: 'YELLOW', score: 60,  title: 'Neutral / Acceptable',
            reason: 'Acceptable fallback if East or South are physically unavailable in the room.' },
      NW: { rating: 'YELLOW', score: 50,  title: 'Sub-optimal / Mixed',
            reason: 'Intermediate zone inheriting partial effects of adjacent cardinal headings.' }
    }
  },
  vastu_shastra: {
    label: 'Classical Vastu',
    hemisphereSwap: null,
    rules: {
      N:  { rating: 'RED',    score: 0,   title: 'Strictly Prohibited',
            reason: 'Direct magnetic clash. Disrupts circadian rhythm, induces chronic insomnia, and depletes physical prana.' },
      NE: { rating: 'RED',    score: 20,  title: 'Ishanya (Sacred/Water) Zone',
            reason: 'Traditionally kept light and open; resting the head here creates energetic disturbances and headaches.' },
      E:  { rating: 'GREEN',  score: 90,  title: 'Excellent',
            reason: "Aligns with solar prana (sun's rise). Excellent for students, scholars, meditators, and cognitive clarity." },
      SE: { rating: 'YELLOW', score: 40,  title: 'Agni (Fire) Zone',
            reason: 'Can cause irritated sleep, excess body heat, or insomnia.' },
      S:  { rating: 'GREEN',  score: 100, title: '#1 Vastu Recommendation',
            reason: 'Polarity alignment (head attracts Earth’s South pole). Induces deep delta sleep, reduces blood pressure, promotes long-term health, vitality, and wealth.' },
      SW: { rating: 'YELLOW', score: 70,  title: 'Nairutya Corner',
            reason: 'Stable Earth element; acceptable if oriented slightly toward South.' },
      W:  { rating: 'YELLOW', score: 50,  title: 'Neutral / Acceptable',
            reason: 'Active Saturn/Varuna energies. Often restless or ambitious dreams; acceptable for guests or working professionals, neutral for long-term recovery.' },
      NW: { rating: 'YELLOW', score: 40,  title: 'Vayu (Wind) Zone',
            reason: 'Causes mental instability or unsettled sleep.' }
    }
  }
};

// Built-in color themes. `bg`/`accent` here are just for rendering the
// Settings swatches + tinting the browser chrome (theme-color meta) — the
// real palette lives in the CSS custom properties under each
// html[data-theme="..."] block in styles.css.
export const THEMES = [
  { id: 'ember', label: 'Coral Ember', bg: '#1a1a1a', accent: '#ff7a50' },
  { id: 'terracotta', label: 'Terracotta Clay', bg: '#1c1a18', accent: '#d97a52' },
  { id: 'amber', label: 'Amber Midnight', bg: '#14161c', accent: '#f0a03c' },
  { id: 'sage', label: 'Sage & Clay', bg: '#1b1f1c', accent: '#d98b5f' },
  { id: 'charcoal', label: 'Charcoal Mono', bg: '#1c1c1c', accent: '#e8c39e' },
  { id: 'daylight', label: 'Daylight', bg: '#f5f1ec', accent: '#ff7a50' },
  { id: 'lavender', label: 'Lavender Mist', bg: '#1a181c', accent: '#b8a4e3' },
  { id: 'rose', label: 'Rose Quartz', bg: '#1b1719', accent: '#e8a9bb' },
  { id: 'sky', label: 'Sky Powder', bg: '#12161e', accent: '#9ec6f0' },
  { id: 'teal', label: 'Frosted Teal', bg: '#12191a', accent: '#8fd4cf' },
];

// localStorage keys, kept here so app.js never hardcodes a magic string.
export const SETTINGS_KEY = 'sleepCompassSettings';
export const CALIBRATION_TIP_KEY = 'sleepCompassCalibrationTipDismissed';
