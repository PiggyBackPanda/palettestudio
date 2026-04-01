import { useState, useMemo, useRef } from 'react';
import { diagnose, healthScore } from '../utils/diagnose';
import { makeSuggestions } from '../utils/suggestions';
import { autoAssignRoles } from '../utils/autoRoles';
import { generateScale } from '../utils/tintShade';
import { hslToHex } from '../utils/colourMath';
import { DEFAULTS } from '../constants';

const STORAGE_KEY = 'palette-studio-slots';
const MAX_HISTORY = 50;

function loadSlotsFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeSlotsToStorage(slots, onUnavailable) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
  } catch {
    onUnavailable();
  }
}

export function usePalette() {
  const [colors,             setColors]             = useState(DEFAULTS);
  const [roles,              setRolesState]         = useState({});
  const [autoReasons,        setAutoReasons]        = useState({});
  const [fixedCodes,         setFixedCodes]         = useState(new Set());
  const [fromImage,          setFromImage]          = useState(false);
  const [fromAI,             setFromAI]             = useState(false);
  const [savedSlots,         setSavedSlots]         = useState(loadSlotsFromStorage);
  const [storageUnavailable, setStorageUnavailable] = useState(false);

  // ── History for undo/redo ────────────────────────────────────────────────────
  // historyRef holds the snapshot array; historyIdx (state) drives re-renders
  // so canUndo/canRedo update correctly.
  const historyRef = useRef([{ colors: DEFAULTS, roles: {} }]);
  const [historyIdx, setHistoryIdx] = useState(0);

  const pushHistory = (newColors, newRoles) => {
    const trimmed = historyRef.current.slice(0, historyIdx + 1);
    trimmed.push({ colors: newColors, roles: newRoles });
    if (trimmed.length > MAX_HISTORY) trimmed.shift();
    historyRef.current = trimmed;
    setHistoryIdx(trimmed.length - 1);
  };

  const undo = () => {
    setHistoryIdx(prev => {
      if (prev <= 0) return prev;
      const newIdx = prev - 1;
      const snap = historyRef.current[newIdx];
      setColors(snap.colors);
      setRolesState(snap.roles);
      setFixedCodes(new Set());
      setAutoReasons({});
      return newIdx;
    });
  };

  const redo = () => {
    setHistoryIdx(prev => {
      if (prev >= historyRef.current.length - 1) return prev;
      const newIdx = prev + 1;
      const snap = historyRef.current[newIdx];
      setColors(snap.colors);
      setRolesState(snap.roles);
      setFixedCodes(new Set());
      setAutoReasons({});
      return newIdx;
    });
  };

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < historyRef.current.length - 1;

  // Derived values — recomputed on every render when colors change
  const issues      = diagnose(colors);
  const score       = healthScore(issues);
  const suggestions = makeSuggestions(colors);
  const warnCount   = issues.filter(i => i.type === 'warning' || i.type === 'critical').length;

  // Tint/shade scales — memoised; only recomputes when the colors array changes.
  // generateScale() is called ONLY here — never in individual components.
  const scales = useMemo(() => {
    const result = {};
    for (const hex of colors) {
      result[hex] = generateScale(hex);
    }
    return result;
  }, [colors]); // eslint-disable-line react-hooks/exhaustive-deps

  const markStorageUnavailable = () => setStorageUnavailable(true);

  // ── Palette mutations ───────────────────────────────────────────────────────

  const addColor = hex => {
    if (colors.length < 8 && !colors.includes(hex)) {
      const newColors = [...colors, hex];
      pushHistory(newColors, roles);
      setColors(newColors);
    }
  };

  const addColors = (list, isFromImage = false) => {
    let newColors = [...colors];
    for (const h of list) {
      if (newColors.length < 8 && !newColors.includes(h)) newColors.push(h);
    }
    pushHistory(newColors, roles);
    setColors(newColors);
    if (isFromImage) {
      setFromImage(true);
      setFixedCodes(new Set());
    }
  };

  const removeColor = i => {
    const removedHex = colors[i];
    const newColors = colors.filter((_, idx) => idx !== i);
    let newRoles = { ...roles };
    if (removedHex && removedHex in newRoles) delete newRoles[removedHex];
    pushHistory(newColors, newRoles);
    setColors(newColors);
    setRolesState(newRoles);
  };

  const updateColor = (i, hex) => {
    const oldHex = colors[i];
    const newColors = [...colors];
    newColors[i] = hex;
    let newRoles = { ...roles };
    if (oldHex && oldHex !== hex && oldHex in newRoles) {
      newRoles[hex] = newRoles[oldHex];
      delete newRoles[oldHex];
    }
    pushHistory(newColors, newRoles);
    setColors(newColors);
    setRolesState(newRoles);
  };

  // ── Role mutations ──────────────────────────────────────────────────────────

  const setRole = (hex, role) => {
    const n = { ...roles };
    Object.keys(n).forEach(k => { if (n[k] === role) delete n[k]; });
    if (n[hex] === role) delete n[hex];
    else n[hex] = role;
    pushHistory(colors, n);
    setRolesState(n);
  };

  const chooseForMe = () => {
    const { roles: suggested, reasons } = autoAssignRoles(colors);
    setRolesState(suggested);
    setAutoReasons(reasons);
  };

  const clearRoles = () => {
    setRolesState({});
    setAutoReasons({});
  };

  // ── Fix application ─────────────────────────────────────────────────────────

  const applyFix = issue => {
    if (!issue.fix) return;
    const newColors = issue.fix.fn(colors);
    pushHistory(newColors, roles);
    setColors(newColors);
    const key = issue.code + (issue.i ?? '') + (issue.j ?? '');
    setFixedCodes(p => new Set([...p, key]));
  };

  // ── Save slots ──────────────────────────────────────────────────────────────

  const saveSlot = (name) => {
    if (savedSlots.length >= 4) return;
    const slot = {
      id:         Date.now().toString(),
      name:       name || `Palette ${savedSlots.length + 1}`,
      colors:     [...colors],
      roles:      { ...roles },
      score,
      issueCount: warnCount,
      savedAt:    new Date().toISOString(),
    };
    const next = [...savedSlots, slot];
    setSavedSlots(next);
    writeSlotsToStorage(next, markStorageUnavailable);
  };

  const loadSlot = (id) => {
    const slot = savedSlots.find(s => s.id === id);
    if (!slot) return;
    pushHistory(slot.colors, slot.roles);
    setColors(slot.colors);
    setRolesState(slot.roles);
    setAutoReasons({});
    setFixedCodes(new Set());
    setFromImage(false);
  };

  const deleteSlot = id => {
    const next = savedSlots.filter(s => s.id !== id);
    setSavedSlots(next);
    writeSlotsToStorage(next, markStorageUnavailable);
  };

  const renameSlot = (id, name) => {
    const next = savedSlots.map(s => (s.id === id ? { ...s, name } : s));
    setSavedSlots(next);
    writeSlotsToStorage(next, markStorageUnavailable);
  };

  const loadPreset = (preset) => {
    setColors(preset.colors);
    setRolesState(preset.roles);
    setAutoReasons({});
    setFixedCodes(new Set());
    setFromImage(false);
    setFromAI(false);
  };

  const loadGeneratedPalette = (newColors, newRoles) => {
    pushHistory(newColors, newRoles);
    setColors(newColors);
    setRolesState(newRoles);
    setAutoReasons({});
    setFixedCodes(new Set());
    setFromImage(false);
    setFromAI(true);
  };

  // ── URL loading ─────────────────────────────────────────────────────────────

  const loadFromURL = (data) => {
    const newColors = data.colors;
    const newRoles = data.roles || {};
    historyRef.current = [{ colors: newColors, roles: newRoles }];
    setHistoryIdx(0);
    setColors(newColors);
    setRolesState(newRoles);
    setAutoReasons({});
    setFixedCodes(new Set());
    setFromImage(false);
  };

  const generateRandomPalette = () => {
    // 1. Random base hue
    const baseHue = Math.floor(Math.random() * 360);

    // 2. Random harmony type
    const harmonies = ['complementary', 'analogous', 'split-complement', 'triadic'];
    const harmonyType = harmonies[Math.floor(Math.random() * harmonies.length)];

    // 3. Build hue set
    let hues;
    if (harmonyType === 'complementary')    hues = [baseHue, (baseHue + 180) % 360];
    else if (harmonyType === 'analogous')   hues = [baseHue, (baseHue + 30) % 360, (baseHue + 60) % 360];
    else if (harmonyType === 'split-complement') hues = [baseHue, (baseHue + 150) % 360, (baseHue + 210) % 360];
    else /* triadic */                      hues = [baseHue, (baseHue + 120) % 360, (baseHue + 240) % 360];

    // random in range [min, max]
    const rnd = (min, max) => min + Math.random() * (max - min);

    // 4. Vivid mid-tones for each hue
    const vivids = hues.map(h => {
      const s = rnd(65, 80);
      const l = rnd(40, 55);
      return hslToHex(h, s, l);
    });

    // 5. Light neutral and dark neutral, tinted to base hue
    const lightNeutral = hslToHex(baseHue, rnd(4, 8),   rnd(92, 96));
    const darkNeutral  = hslToHex(baseHue, rnd(8, 14),  rnd(8, 14));

    // 6. Combine and shuffle
    const all = [...vivids, lightNeutral, darkNeutral];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }

    // 7. Apply — fresh start, clear everything; push to history
    pushHistory(all, {});
    setColors(all);
    setRolesState({});
    setAutoReasons({});
    setFixedCodes(new Set());
    setFromImage(false);
  };

  return {
    // State
    colors,
    roles,
    autoReasons,
    fixedCodes,
    fromImage,
    fromAI,
    savedSlots,
    storageUnavailable,
    // Derived
    issues,
    score,
    suggestions,
    warnCount,
    scales,
    // Undo/Redo
    undo,
    redo,
    canUndo,
    canRedo,
    // Mutations
    addColor,
    addColors,
    removeColor,
    updateColor,
    setRole,
    chooseForMe,
    clearRoles,
    applyFix,
    saveSlot,
    loadSlot,
    deleteSlot,
    renameSlot,
    generateRandomPalette,
    loadPreset,
    loadGeneratedPalette,
    loadFromURL,
  };
}
