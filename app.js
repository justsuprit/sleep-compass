// ============================================================
// app.js — DOM wiring, state, and orchestration. This is the file
// that reads config.js (data) and utils.js (generic helpers) and
// ties them together into the actual running app.
// ============================================================

import { RATING_COLORS, OCTANT_LABELS, PROFILES, THEMES, SETTINGS_KEY, CALIBRATION_TIP_KEY, KUA_DIRECTIONS, KUA_STAR_INFO } from './config.js';
import { hexToRgba, degToCompassPoint, headingToOctant, shortestDelta, calculateKuaNumber } from './utils.js';

// ============================================================
// Step 2: compass rose UI setup (ticks, cardinal labels)
// ============================================================
const rose = document.getElementById('rose');
const dial = document.getElementById('dial');
const cardinals = [
  { deg: 0,   label: 'N' },
  { deg: 90,  label: 'E' },
  { deg: 180, label: 'S' },
  { deg: 270, label: 'W' }
];

// The ring's on-screen size now flexes with viewport height (see #rose's
// clamp() in styles.css) so the whole Compass tab fits one screen with no
// scrolling. Ticks/petals/labels are positioned with trig math relative to
// the ring's *actual measured* center and radius (not a hardcoded 135px),
// scaled proportionally from the original 270px design (radii 118/92 out
// of a 135px center = ~0.874 / ~0.681), so the ring redraws correctly at
// any size. buildRing() is re-run on resize/orientation change in case the
// available height changes (e.g. rotating the phone, or the browser chrome
// showing/hiding).
let vastuPetals = [];
let cardinalLabels = [];

function buildRing() {
  dial.querySelectorAll('.tick, .vastu-petal, .label').forEach((el) => el.remove());
  vastuPetals = [];
  cardinalLabels = [];

  const size = rose.getBoundingClientRect().width || 270;
  const centerPx = size / 2;
  const tickRadius = centerPx * (118 / 135);
  const labelRadius = centerPx * (92 / 135);

  for (let deg = 0; deg < 360; deg += 22.5) {
    const rad = (deg - 90) * (Math.PI / 180);
    const tx = centerPx + tickRadius * Math.cos(rad);
    const ty = centerPx + tickRadius * Math.sin(rad);

    // Vastu mandala petal (only at the 8 principal points) — appended first
    // so it paints behind the tick, and rotates rigidly with it since both
    // live inside #dial and share the same tick position/orientation.
    if (deg % 45 === 0) {
      const petal = document.createElement('div');
      petal.className = 'vastu-petal';
      petal.style.left = `${tx}px`;
      petal.style.top = `${ty}px`;
      petal.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
      if (currentProfile === 'vastu_shastra') petal.classList.add('active');
      dial.appendChild(petal);
      vastuPetals.push(petal);
    }

    const tick = document.createElement('div');
    const isMajor = deg % 90 === 0;
    tick.className = 'tick' + (isMajor ? ' major' : '') + (deg === 0 ? ' tick-north' : '');
    tick.style.left = `${tx}px`;
    tick.style.top = `${ty}px`;
    tick.style.transform = `translate(-50%, -50%) rotate(${deg}deg)`;
    dial.appendChild(tick);
  }

  cardinals.forEach(({ deg, label }) => {
    const el = document.createElement('div');
    el.className = 'label';
    el.textContent = label;
    const rad = (deg - 90) * (Math.PI / 180);
    const x = centerPx + labelRadius * Math.cos(rad);
    const y = centerPx + labelRadius * Math.sin(rad);
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.transform = `translate(-50%, -50%) rotate(${lastHeadingDeg !== null ? Math.round(lastHeadingDeg) : 0}deg)`;
    dial.appendChild(el);
    cardinalLabels.push(el);
  });
}

const startBtn = document.getElementById('startBtn');
const compassWrap = document.getElementById('compassWrap');
const headingEl = document.getElementById('heading');
const directionEl = document.getElementById('direction');
const statusEl = document.getElementById('status');

// ============================================================
// Step 3: sleep-direction rating engine
// ============================================================

// Bridges config.js's KUA_DIRECTIONS (kua number -> octant -> star key)
// and KUA_STAR_INFO (star key -> rating/score/title/reason) into the same
// { octant-keyed rules } shape PROFILES entries use, so evaluateHeading
// below can treat "My Kua" like any other profile.
function getKuaRules(kuaNumber) {
  const directions = KUA_DIRECTIONS[kuaNumber];
  const rules = {};
  for (const octant of Object.keys(directions)) {
    if (octant === 'group') continue;
    rules[octant] = KUA_STAR_INFO[directions[octant]];
  }
  return rules;
}

// Public evaluation function — given a heading and a profile key,
// returns { octant, rating, score, title, reason }.
function evaluateHeading(headingDeg, profileKey, southernHemisphere) {
  const octant = headingToOctant(headingDeg);

  if (profileKey === 'kua_direction') {
    if (!currentKuaNumber) {
      return {
        octant,
        rating: 'YELLOW',
        score: 0,
        title: 'Add your birth details',
        reason: 'Enter your birth date and gender in Settings to see your personal Kua direction.'
      };
    }
    return { octant, ...getKuaRules(currentKuaNumber)[octant] };
  }

  const profile = PROFILES[profileKey];
  let effectiveOctant = octant;
  if (southernHemisphere && profile.hemisphereSwap && profile.hemisphereSwap[octant]) {
    effectiveOctant = profile.hemisphereSwap[octant];
  }
  return { octant, ...profile.rules[effectiveOctant] };
}

// --- rating UI wiring ---
const ratingBadge = document.getElementById('ratingBadge');
const ratingTitle = document.getElementById('ratingTitle');
const ratingOctant = document.getElementById('ratingOctant');
const ratingScoreFill = document.getElementById('ratingScoreFill');
const ratingReason = document.getElementById('ratingReason');

const southernHemisphereInput = document.getElementById('southernHemisphere');
const artIsha = document.getElementById('artIsha');
const artVastu = document.getElementById('artVastu');
const restartBtn = document.getElementById('restartBtn');
const themePickerEl = document.getElementById('themePicker');

let currentProfile = 'isha_sadhguru';
let southernHemisphere = false;
let currentTheme = 'ember';
let lastHeadingDeg = null;
let lastRating = null;
let calibrationTipShown = false;
let kuaBirthDate = '';
let kuaGender = '';
let currentKuaNumber = null;

const calibrationTip = document.getElementById('calibrationTip');
const calibrationTipDismiss = document.getElementById('calibrationTipDismiss');

// Fades the tip out; `persist: true` (manual X) means "never show again",
// while the automatic timeout just clears it for this viewing.
function hideCalibrationTip({ persist } = {}) {
  calibrationTip.style.opacity = '0';
  setTimeout(() => {
    calibrationTip.style.display = 'none';
  }, 600);
  if (persist) {
    try {
      localStorage.setItem(CALIBRATION_TIP_KEY, 'true');
    } catch (e) {
      // ignore — not required for the app to work
    }
  }
}

calibrationTipDismiss.addEventListener('click', () => hideCalibrationTip({ persist: true }));

// Small "About this app" popover, collapsed by default so it doesn't
// eat vertical space above the rating card.
const infoBtn = document.getElementById('infoBtn');
const infoPopover = document.getElementById('infoPopover');
infoBtn.addEventListener('click', () => {
  const opening = infoPopover.hasAttribute('hidden');
  if (opening) {
    infoPopover.removeAttribute('hidden');
  } else {
    infoPopover.setAttribute('hidden', '');
  }
  infoBtn.setAttribute('aria-expanded', String(opening));
});

// Remember the last-picked profile + hemisphere setting on this phone so
// you don't have to re-tap them every night. Wrapped in try/catch since
// some browsers (private mode, storage blocked) can throw on access —
// persistence is a nice-to-have, never required for the app to work.
function loadSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (saved.profile && (PROFILES[saved.profile] || saved.profile === 'kua_direction')) currentProfile = saved.profile;
    if (typeof saved.southernHemisphere === 'boolean') southernHemisphere = saved.southernHemisphere;
    if (saved.theme && THEMES.some((t) => t.id === saved.theme)) currentTheme = saved.theme;
    if (typeof saved.kuaBirthDate === 'string') kuaBirthDate = saved.kuaBirthDate;
    if (saved.kuaGender === 'male' || saved.kuaGender === 'female') kuaGender = saved.kuaGender;
  } catch (e) {
    // fall back to defaults
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      profile: currentProfile,
      southernHemisphere,
      theme: currentTheme,
      kuaBirthDate,
      kuaGender
    }));
  } catch (e) {
    // ignore — not required for the app to work
  }
}

// Applies a theme id to the DOM: swaps the CSS variable set via
// data-theme, nudges the browser-chrome tint (address bar / recent-apps
// card) to match, and highlights the right swatch in Settings.
function applyThemeVisual(id) {
  document.documentElement.setAttribute('data-theme', id);
  const meta = document.querySelector('meta[name="theme-color"]');
  const theme = THEMES.find((t) => t.id === id) || THEMES[0];
  if (meta) meta.setAttribute('content', theme.bg);
  document.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.theme === id);
  });
}

// Build the theme picker in Settings from THEMES, and wire taps to
// switch + persist immediately.
if (themePickerEl) {
  themePickerEl.innerHTML = THEMES.map((t) => `
    <button class="theme-swatch" type="button" data-theme="${t.id}" aria-label="${t.label}">
      <span class="theme-swatch-preview" style="background:${t.bg};"><span style="background:${t.accent};"></span></span>
      <span class="theme-swatch-label">${t.label}</span>
    </button>
  `).join('');
  themePickerEl.querySelectorAll('.theme-swatch').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentTheme = btn.dataset.theme;
      applyThemeVisual(currentTheme);
      saveSettings();
    });
  });
}

function updateBackground() {
  artIsha.classList.toggle('active', currentProfile === 'isha_sadhguru');
  artVastu.classList.toggle('active', currentProfile === 'vastu_shastra');
  vastuPetals.forEach(p => p.classList.toggle('active', currentProfile === 'vastu_shastra'));
}

// Kua (personal direction) Settings wiring — birth date + gender feed
// calculateKuaNumber(), and the result re-renders the rating card live
// if "My Kua" happens to be the active profile already.
const kuaBirthDateInput = document.getElementById('kuaBirthDate');
const kuaGenderToggle = document.getElementById('kuaGenderToggle');
const kuaResultEl = document.getElementById('kuaResult');

function updateKuaResult() {
  currentKuaNumber = (kuaBirthDate && kuaGender) ? calculateKuaNumber(kuaBirthDate, kuaGender) : null;
  if (currentKuaNumber) {
    const group = KUA_DIRECTIONS[currentKuaNumber].group === 'east' ? 'East group' : 'West group';
    kuaResultEl.textContent = `Your Kua number: ${currentKuaNumber} (${group})`;
  } else {
    kuaResultEl.textContent = 'Enter your birth date and gender above to calculate your Kua number.';
  }
  if (currentProfile === 'kua_direction' && lastHeadingDeg !== null) updateRatingDisplay(lastHeadingDeg);
}

kuaBirthDateInput.addEventListener('change', (e) => {
  kuaBirthDate = e.target.value;
  saveSettings();
  updateKuaResult();
});

kuaGenderToggle.querySelectorAll('.seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    kuaGenderToggle.querySelectorAll('.seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    kuaGender = btn.dataset.gender;
    saveSettings();
    updateKuaResult();
  });
});

// Apply whatever was saved last time, before we render anything.
loadSettings();
applyThemeVisual(currentTheme);
document.querySelectorAll('#profileToggle .seg-btn').forEach((btn) => {
  btn.classList.toggle('active', btn.dataset.profile === currentProfile);
});
southernHemisphereInput.checked = southernHemisphere;
kuaBirthDateInput.value = kuaBirthDate;
kuaGenderToggle.querySelectorAll('.seg-btn').forEach((btn) => {
  btn.classList.toggle('active', btn.dataset.gender === kuaGender);
});
updateKuaResult();
updateBackground();
buildRing();

// Rebuild the ring's ticks/petals/labels if its measured size changes —
// e.g. rotating the phone, or a shorter/taller browser chrome state —
// then re-apply whatever heading we last had so nothing visually jumps.
let resizeTimer = null;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    buildRing();
    updateBackground();
    if (lastHeadingDeg !== null) updateHeading(lastHeadingDeg);
  }, 150);
});

function updateRatingDisplay(deg) {
  lastHeadingDeg = deg;
  const result = evaluateHeading(deg, currentProfile, southernHemisphere);
  const color = RATING_COLORS[result.rating];

  // Small buzz only on the moment you roll INTO green — not a constant
  // buzz while you sit there, and only on devices that support it.
  if (result.rating === 'GREEN' && lastRating !== 'GREEN' && navigator.vibrate) {
    navigator.vibrate(60);
  }
  lastRating = result.rating;

  ratingBadge.textContent = result.rating;
  ratingBadge.style.background = color;
  ratingBadge.style.color = '#1a1a1a';

  ratingTitle.textContent = result.title;
  ratingOctant.textContent = `${OCTANT_LABELS[result.octant]} zone — ${result.score}% score`;
  ratingReason.textContent = result.reason;

  ratingScoreFill.style.width = `${result.score}%`;
  ratingScoreFill.style.background = color;

  headingEl.style.color = color;
  rose.style.borderColor = color;
  rose.style.boxShadow = `0 0 22px 3px ${hexToRgba(color, 0.35)}, inset 0 0 34px ${hexToRgba(color, 0.14)}`;
}

document.querySelectorAll('#profileToggle .seg-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#profileToggle .seg-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    currentProfile = btn.dataset.profile;
    updateBackground();
    saveSettings();
    if (lastHeadingDeg !== null) updateRatingDisplay(lastHeadingDeg);
  });
});

southernHemisphereInput.addEventListener('change', (e) => {
  southernHemisphere = e.target.checked;
  saveSettings();
  if (lastHeadingDeg !== null) updateRatingDisplay(lastHeadingDeg);
});

// Reset back to the start screen without a full page reload — handy while
// testing different spots in the room.
restartBtn.addEventListener('click', () => {
  window.removeEventListener('deviceorientationabsolute', handleOrientation, true);
  window.removeEventListener('deviceorientation', handleOrientation, true);
  compassWrap.style.display = 'none';
  startBtn.style.display = 'inline-block';
  headingEl.textContent = '--°';
  directionEl.textContent = '--';
  statusEl.textContent = '';
  dialRotation = 0;
  dial.style.transform = 'rotate(0deg)';
  lastHeadingDeg = null;
});

// ============================================================
// Step 2: sensor plumbing (unchanged), now also drives the rating
// ============================================================
// Accumulated (unwrapped) rotation applied to #dial. We track this instead
// of setting rotate(${-heading}deg) directly because heading wraps at
// 0°/360° — e.g. going from 359° to 1° is a 2° turn in real life, but a
// naive `rotate(-359deg)` -> `rotate(-1deg)` jump would animate almost a
// full spin. shortestDelta() always advances by the smaller of the two
// possible arcs, so the dial only ever turns the short way.
let dialRotation = 0;

function setDialRotation(headingDeg) {
  const target = -headingDeg;
  dialRotation += shortestDelta(target, dialRotation);
  dial.style.transform = `rotate(${dialRotation}deg)`;
}

function updateHeading(deg) {
  const rounded = Math.round(deg);
  headingEl.textContent = `${rounded}°`;
  directionEl.textContent = degToCompassPoint(rounded);
  // Rotate the dial (ticks + cardinal labels) opposite the heading so
  // whichever direction you're currently facing lines up with the
  // fixed pointer at the top of the ring — like a real phone compass.
  setDialRotation(rounded);
  // Counter-rotate each cardinal letter by the same amount the dial just
  // rotated, so N/E/S/W stay upright and readable instead of spinning
  // sideways with the ring.
  cardinalLabels.forEach((el) => {
    el.style.transform = `translate(-50%, -50%) rotate(${rounded}deg)`;
  });
  updateRatingDisplay(rounded);
}

function handleOrientation(event) {
  let heading = null;

  if (typeof event.webkitCompassHeading === 'number') {
    heading = event.webkitCompassHeading;
  } else if (event.absolute && event.alpha !== null) {
    heading = 360 - event.alpha;
  } else if (event.alpha !== null) {
    heading = 360 - event.alpha;
  }

  if (heading === null || isNaN(heading)) {
    statusEl.textContent = 'No compass data from this sensor event.';
    return;
  }

  statusEl.textContent = '';

  if (!calibrationTipShown) {
    calibrationTipShown = true;
    let dismissedBefore = false;
    try {
      dismissedBefore = localStorage.getItem(CALIBRATION_TIP_KEY) === 'true';
    } catch (e) {
      // ignore — default to showing the tip
    }
    if (!dismissedBefore) {
      calibrationTip.style.display = 'flex';
      calibrationTip.style.opacity = '1';
      setTimeout(() => hideCalibrationTip({ persist: false }), 6000);
    }
  }

  updateHeading((heading + 360) % 360);
}

function startCompass() {
  startBtn.style.display = 'none';
  compassWrap.style.display = 'flex';

  const hasAbsolute = 'ondeviceorientationabsolute' in window;

  if (hasAbsolute) {
    window.addEventListener('deviceorientationabsolute', handleOrientation, true);
  } else {
    window.addEventListener('deviceorientation', handleOrientation, true);
  }

  setTimeout(() => {
    if (headingEl.textContent === '--°') {
      statusEl.textContent = 'No sensor data received. Some browsers need HTTPS ' +
        '(not a local file) or a phone with a magnetometer to send compass data.';
    }
  }, 3000);
}

startBtn.addEventListener('click', () => {
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then((response) => {
        if (response === 'granted') {
          startCompass();
        } else {
          statusEl.textContent = 'Compass permission denied.';
        }
      })
      .catch((err) => {
        statusEl.textContent = 'Permission request failed: ' + err.message;
      });
  } else {
    startCompass();
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}

// ============================================================
// Tab bar — pure show/hide of pre-built screens. The compass sensor
// listener (registered in startCompass, above) is attached to `window`
// once and keeps running no matter which tab is visible, so switching
// tabs never re-asks for permission or restarts anything.
// ============================================================
const tabButtons = document.querySelectorAll('.tab-btn');
const screenEls = document.querySelectorAll('.screen');
tabButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;
    screenEls.forEach((s) => s.classList.toggle('active', s.id === `screen-${target}`));
    tabButtons.forEach((b) => b.classList.toggle('active', b === btn));
    // The ring's clamp()-based size can differ once the browser has
    // settled after the initial paint (address-bar collapse, etc.) —
    // cheap to recompute again the first time you land on Compass.
    if (target === 'compass') {
      buildRing();
      updateBackground();
      if (lastHeadingDeg !== null) updateHeading(lastHeadingDeg);
    }
  });
});
