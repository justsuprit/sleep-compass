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
