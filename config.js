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

// ============================================================
// Kua (Eight Mansions / Ba Zhai) data — verified against multiple
// published feng shui references (Sept 2026): the classical two-branch
// formula (fengshuinexus.com, modernhousenumbers.com) and the full
// 8-direction matrix (fengshuimall.com, cross-checked row-by-row against
// wofs.com's live calculator and internal East/West group consistency).
// The formula itself lives in utils.js (calculateKuaNumber) since it's a
// pure function with no dependency on the tables below.
// ============================================================

// Meta for each of the 8 "stars" a direction can carry for a given Kua
// number — four auspicious (positive `value`), four inauspicious
// (negative `value`). `value` is kept around for the future Couples Mode
// "Disaster Invariant" (any -3/-4 for either partner disqualifies that
// direction outright).
export const KUA_STAR_INFO = {
  SHENG_CHI:  { rating: 'GREEN',  score: 100, value: 4,  title: 'Best — Sheng Chi',
                reason: 'Your #1 personal direction (Generating Breath) — the strongest of the four auspicious stars, linked to vitality and overall wellbeing.' },
  TIEN_YI:    { rating: 'GREEN',  score: 80,  value: 3,  title: 'Very Good — Tien Yi',
                reason: 'Heavenly Doctor — supports health and recovery; a strong, reliable direction to sleep toward.' },
  NIEN_YEN:   { rating: 'YELLOW', score: 65,  value: 2,  title: 'Good — Nien Yen',
                reason: 'Longevity — favors relationships and steady long-term wellbeing.' },
  FU_WEI:     { rating: 'YELLOW', score: 55,  value: 1,  title: 'Mild — Fu Wei',
                reason: 'Stability — the mildest of the four good directions; calm, but not a strong boost.' },
  HO_HAI:     { rating: 'YELLOW', score: 35,  value: -1, title: 'Mildly Unfavorable — Ho Hai',
                reason: 'Accidents & Mishaps — the mildest of the four inauspicious stars; minor setbacks.' },
  WU_KUEI:    { rating: 'RED',    score: 20,  value: -2, title: 'Unfavorable — Wu Kuei',
                reason: 'Five Ghosts — linked to arguments, financial loss, and disrupted sleep.' },
  LUI_SHA:    { rating: 'RED',    score: 10,  value: -3, title: 'Strongly Unfavorable — Lui Sha',
                reason: 'Six Killings — linked to setbacks and illness; best avoided for sleep.' },
  CHUEH_MING: { rating: 'RED',    score: 0,   value: -4, title: 'Strictly Avoid — Chueh Ming',
                reason: 'Total Loss — the most severe of the eight directions; classically the one to avoid entirely.' }
};

// Which star lands on which compass octant, for each Kua number. Kua 5
// has no row of its own — by convention a calculated 5 becomes 2 for men
// and 8 for women (handled in calculateKuaNumber). East group (1,3,4,9)
// always carries its 4 good stars on {N,S,E,SE}; West group (2,6,7,8)
// carries them on {W,NW,SW,NE} — the mirror image.
export const KUA_DIRECTIONS = {
  1: { group: 'east', N: 'FU_WEI',     NE: 'WU_KUEI',    E: 'TIEN_YI',    SE: 'SHENG_CHI',
                       S: 'NIEN_YEN',  SW: 'CHUEH_MING', W: 'HO_HAI',     NW: 'LUI_SHA' },
  2: { group: 'west', N: 'CHUEH_MING', NE: 'SHENG_CHI',  E: 'HO_HAI',     SE: 'WU_KUEI',
                       S: 'LUI_SHA',   SW: 'FU_WEI',      W: 'TIEN_YI',    NW: 'NIEN_YEN' },
  3: { group: 'east', N: 'TIEN_YI',    NE: 'LUI_SHA',     E: 'FU_WEI',     SE: 'NIEN_YEN',
                       S: 'SHENG_CHI', SW: 'HO_HAI',       W: 'CHUEH_MING', NW: 'WU_KUEI' },
  4: { group: 'east', N: 'SHENG_CHI',  NE: 'CHUEH_MING',  E: 'NIEN_YEN',   SE: 'FU_WEI',
                       S: 'TIEN_YI',   SW: 'WU_KUEI',      W: 'LUI_SHA',    NW: 'HO_HAI' },
  6: { group: 'west', N: 'LUI_SHA',    NE: 'TIEN_YI',     E: 'WU_KUEI',    SE: 'HO_HAI',
                       S: 'CHUEH_MING',SW: 'NIEN_YEN',     W: 'SHENG_CHI',  NW: 'FU_WEI' },
  7: { group: 'west', N: 'HO_HAI',     NE: 'NIEN_YEN',    E: 'CHUEH_MING', SE: 'LUI_SHA',
                       S: 'WU_KUEI',   SW: 'TIEN_YI',      W: 'FU_WEI',     NW: 'SHENG_CHI' },
  8: { group: 'west', N: 'WU_KUEI',    NE: 'FU_WEI',      E: 'LUI_SHA',    SE: 'CHUEH_MING',
                       S: 'HO_HAI',    SW: 'SHENG_CHI',    W: 'NIEN_YEN',   NW: 'TIEN_YI' },
  9: { group: 'east', N: 'NIEN_YEN',   NE: 'HO_HAI',      E: 'SHENG_CHI',  SE: 'TIEN_YI',
                       S: 'FU_WEI',    SW: 'LUI_SHA',      W: 'WU_KUEI',    NW: 'CHUEH_MING' }
};
