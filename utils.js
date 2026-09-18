// ============================================================
// utils.js — small, generic, pure helper functions. None of these
// touch the DOM or know anything about PROFILES/THEMES; they just
// take inputs and return outputs, so they're easy to reuse (and
// easy to unit-test later if we ever add that).
// ============================================================

// hex (#rrggbb) -> rgba(...) string, so the ring glow can use the same
// rating colors at a soft opacity instead of a harsh solid shadow.
export function hexToRgba(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function degToCompassPoint(deg) {
  const points = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return points[index];
}

// Normalize any heading to [0, 360) and bucket it into one of 8 octants.
export function headingToOctant(deg) {
  const d = ((deg % 360) + 360) % 360;
  if (d >= 337.5 || d < 22.5) return 'N';
  if (d < 67.5) return 'NE';
  if (d < 112.5) return 'E';
  if (d < 157.5) return 'SE';
  if (d < 202.5) return 'S';
  if (d < 247.5) return 'SW';
  if (d < 292.5) return 'W';
  return 'NW';
}

// Shortest signed delta (in degrees) from `current` to `target`, always
// in [-180, 180]. Used to rotate the compass dial the "short way" instead
// of spinning almost a full turn when the heading wraps past 0°/360°.
export function shortestDelta(target, current) {
  let d = (target - current) % 360;
  if (d > 180) d -= 360;
  if (d < -180) d += 360;
  return d;
}

// Kua ("Life Gua") number — the Eight Mansions personal-direction number,
// from a birth date ('YYYY-MM-DD') + gender ('male'/'female'). Pure
// function, no dependency on config.js — the direction tables that use
// this number live there instead.
//
// Uses the Chinese solar year (Lichun, ~Feb 4) rather than the calendar
// year, so births in January or the first days of February count toward
// the *previous* solar year. Verified against the classical two-branch
// method (last-two-digits, pre/post-2000 branching, result-of-0 and
// result-of-5 overrides) via published feng shui references, Sept 2026.
export function calculateKuaNumber(birthDateStr, gender) {
  if (!birthDateStr) return null;
  const [yStr, mStr, dStr] = birthDateStr.split('-');
  let year = Number(yStr);
  const month = Number(mStr);
  const day = Number(dStr);
  if (!year || !month || !day) return null;

  if (month === 1 || (month === 2 && day < 4)) {
    year -= 1;
  }

  const reduceToSingleDigit = (n) => {
    n = Math.abs(n);
    while (n > 9) {
      n = String(n).split('').reduce((sum, d) => sum + Number(d), 0);
    }
    return n;
  };

  const last2 = year % 100;
  const digitSum = reduceToSingleDigit(Math.floor(last2 / 10) + (last2 % 10));

  let kua;
  if (year < 2000) {
    kua = gender === 'female' ? digitSum + 5 : 10 - digitSum;
  } else {
    kua = gender === 'female' ? digitSum + 6 : 9 - digitSum;
  }
  kua = reduceToSingleDigit(kua);

  // Kua 5 doesn't exist as its own direction set — by convention it
  // becomes 2 for men and 8 for women. A male result of exactly 0 (post-
  // 2000, digit sum of 9) wraps around to 9, "because the cycle repeats".
  if (kua === 5) kua = gender === 'female' ? 8 : 2;
  if (kua === 0) kua = 9;

  return kua;
}
