import { useState, useRef, useEffect } from 'react';
import { hexToRgb, rgbToHsl } from '../utils/colourMath';
import { getColourName } from '../utils/colourNames';

const ADJECTIVES = ['Bold', 'Fresh', 'Warm', 'Cool', 'Crisp', 'Rich', 'Vivid', 'Deep', 'Bright', 'Clean'];

function relativeTime(isoString) {
  const diff = Date.now() - new Date(isoString).getTime();
  const secs  = Math.floor(diff / 1000);
  if (secs < 60)                      return 'just now';
  const mins  = Math.floor(secs / 60);
  if (mins < 60)                      return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24)                     return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function defaultName(colors) {
  if (!colors || colors.length === 0) return 'My Palette';
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const dominant = colors.reduce((best, hex) => {
    const { r, g, b }          = hexToRgb(hex);
    const { s }                = rgbToHsl(r, g, b);
    const { r: br, g: bg2, b: bb } = hexToRgb(best);
    const { s: bs }            = rgbToHsl(br, bg2, bb);
    return s > bs ? hex : best;
  }, colors[0]);
  return `${adj} ${getColourName(dominant)}`;
}

// ── Color strip ───────────────────────────────────────────────────────────────
function MiniStrip({ colors }) {
  const swatches = colors.slice(0, 5);
  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {swatches.map((c, i) => (
        <div
          key={i}
          style={{
            width:        20,
            height:       '100%',
            minHeight:    52,
            background:   c,
            borderRadius: i === 0
              ? 'var(--ps-radius-md) 0 0 var(--ps-radius-md)'
              : i === swatches.length - 1
              ? '0 var(--ps-radius-md) var(--ps-radius-md) 0'
              : 0,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function SaveSlots({
  savedSlots,
  onSave,
  onLoad,
  onDelete,
  onRename,
  currentColors,
  storageUnavailable,
}) {
  const [newName,       setNewName]       = useState(() => defaultName(currentColors));
  const [pendingDelete, setPendingDelete] = useState(null);
  const deleteTimer = useRef(null);

  const prevColors = useRef(currentColors);
  useEffect(() => {
    if (JSON.stringify(prevColors.current) !== JSON.stringify(currentColors)) {
      prevColors.current = currentColors;
      setNewName(defaultName(currentColors));
    }
  }, [currentColors]);

  const atMax    = savedSlots.length >= 4;
  const isActive = slot => JSON.stringify(slot.colors) === JSON.stringify(currentColors);

  const handleSave = () => {
    if (atMax) return;
    onSave(newName.trim() || 'My Palette');
    setNewName(defaultName(currentColors));
  };

  const handleDeleteClick = id => {
    if (pendingDelete === id) {
      clearTimeout(deleteTimer.current);
      setPendingDelete(null);
      onDelete(id);
    } else {
      if (deleteTimer.current) clearTimeout(deleteTimer.current);
      setPendingDelete(id);
      deleteTimer.current = setTimeout(() => setPendingDelete(null), 3000);
    }
  };

  return (
    <div
      style={{
        borderTop:  '1px solid var(--ps-border)',
        paddingTop: 16,
        marginTop:  16,
      }}
    >
      {/* Section header */}
      <div
        style={{
          fontFamily:   'var(--ps-font-ui)',
          fontSize:     'var(--ps-text-lg)',
          fontWeight:   700,
          color:        'var(--ps-text-primary)',
          marginBottom: 8,
        }}
      >
        Saved Palettes
      </div>
      {/* Storage warning */}
      {storageUnavailable && (
        <div
          style={{
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-xs)',
            color:        'var(--ps-danger)',
            marginBottom: 14,
            padding:      '7px 12px',
            background:   'var(--ps-danger-subtle)',
            borderRadius: 'var(--ps-radius-md)',
            border:       '1px solid var(--ps-danger)',
            lineHeight:   1.5,
          }}
        >
          Local storage is unavailable — saved palettes won't persist after you close this tab.
        </div>
      )}

      {/* ── Save row ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <input
          type="text"
          value={newName}
          onChange={e => setNewName(e.target.value)}
          placeholder="Name this palette to save a snapshot…"
          onKeyDown={e => { if (e.key === 'Enter' && !atMax) handleSave(); }}
          disabled={atMax}
          style={{
            flex:         1,
            border:       '1px solid var(--ps-border)',
            borderRadius: 'var(--ps-radius-md)',
            padding:      '7px 10px',
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-sm)',
            background:   atMax ? 'var(--ps-bg-subtle)' : 'var(--ps-bg-surface)',
            color:        'var(--ps-text-primary)',
            outline:      'none',
            opacity:      atMax ? 0.6 : 1,
          }}
        />
        <button
          onClick={handleSave}
          disabled={atMax}
          style={{
            background:    atMax ? 'var(--ps-border)' : 'var(--ps-accent)',
            color:         atMax ? 'var(--ps-text-tertiary)' : 'var(--ps-accent-text)',
            border:        'none',
            borderRadius:  'var(--ps-radius-md)',
            padding:       '8px 16px',
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-sm)',
            fontWeight:    500,
            cursor:        atMax ? 'default' : 'pointer',
            letterSpacing: '.02em',
            flexShrink:    0,
            transition:    'background .15s',
          }}
          onMouseEnter={e => { if (!atMax) e.currentTarget.style.background = 'var(--ps-accent-hover)'; }}
          onMouseLeave={e => { if (!atMax) e.currentTarget.style.background = 'var(--ps-accent)'; }}
        >
          Save
        </button>
        {atMax && (
          <span
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-tertiary)',
              flexShrink: 0,
            }}
          >
            Delete a slot first
          </span>
        )}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      {savedSlots.length === 0 && (
        <div
          style={{
            textAlign:    'center',
            padding:      '28px 20px',
            background:   'var(--ps-bg-subtle)',
            borderRadius: 'var(--ps-radius-lg)',
            border:       '1.5px dashed var(--ps-border)',
            fontFamily:   'var(--ps-font-ui)',
            fontSize:     'var(--ps-text-sm)',
            color:        'var(--ps-text-tertiary)',
            fontStyle:    'italic',
          }}
        >
          No saved palettes yet. Give your palette a name above and hit Save.
        </div>
      )}

      {/* ── Slot cards ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {savedSlots.map(slot => {
          const active   = isActive(slot);
          const deleting = pendingDelete === slot.id;

          return (
            <div
              key={slot.id}
              style={{
                border:       `1px solid ${active ? 'var(--ps-accent)' : 'var(--ps-border)'}`,
                borderRadius: 'var(--ps-radius-lg)',
                background:   'var(--ps-bg-surface)',
                display:      'flex',
                alignItems:   'stretch',
                overflow:     'hidden',
                boxShadow:    'var(--ps-shadow-sm)',
              }}
            >
              {/* Color strip */}
              <MiniStrip colors={slot.colors} />

              {/* Content */}
              <div
                style={{
                  flex:           1,
                  padding:        '10px 14px',
                  display:        'flex',
                  flexDirection:  'column',
                  justifyContent: 'center',
                  gap:            5,
                  minWidth:       0,
                }}
              >
                {/* Name + active badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input
                    value={slot.name}
                    onChange={e => onRename(slot.id, e.target.value)}
                    style={{
                      flex:       1,
                      border:     'none',
                      background: 'transparent',
                      fontFamily: 'var(--ps-font-ui)',
                      fontSize:   'var(--ps-text-sm)',
                      fontWeight: 600,
                      color:      'var(--ps-text-primary)',
                      outline:    'none',
                      minWidth:   0,
                    }}
                  />
                  {active && (
                    <span
                      style={{
                        fontFamily:    'var(--ps-font-ui)',
                        fontSize:      8,
                        color:         'var(--ps-accent)',
                        fontWeight:    700,
                        letterSpacing: '.08em',
                        background:    'var(--ps-accent-subtle)',
                        border:        '1px solid var(--ps-accent)',
                        borderRadius:  'var(--ps-radius-sm)',
                        padding:       '1px 5px',
                        flexShrink:    0,
                      }}
                    >
                      ACTIVE
                    </span>
                  )}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {/* Score pill */}
                  <span
                    style={{
                      fontFamily:    'var(--ps-font-ui)',
                      fontSize:      9,
                      fontWeight:    700,
                      color:         slot.score >= 80 ? 'var(--ps-success)' : slot.score >= 50 ? 'var(--ps-warning)' : 'var(--ps-danger)',
                      background:    slot.score >= 80 ? 'var(--ps-success-subtle)' : slot.score >= 50 ? 'var(--ps-warning-subtle)' : 'var(--ps-danger-subtle)',
                      borderRadius:  'var(--ps-radius-sm)',
                      padding:       '1px 6px',
                      letterSpacing: '.04em',
                      flexShrink:    0,
                    }}
                  >
                    Score {slot.score}
                  </span>

                  {/* Issue count */}
                  {slot.issueCount > 0 && (
                    <span
                      style={{
                        fontFamily:    'var(--ps-font-ui)',
                        fontSize:      9,
                        color:         'var(--ps-danger)',
                        background:    'var(--ps-danger-subtle)',
                        borderRadius:  'var(--ps-radius-sm)',
                        padding:       '1px 6px',
                        letterSpacing: '.04em',
                        flexShrink:    0,
                      }}
                    >
                      {slot.issueCount} issue{slot.issueCount !== 1 ? 's' : ''}
                    </span>
                  )}

                  {/* Timestamp */}
                  <span
                    style={{
                      fontFamily: 'var(--ps-font-ui)',
                      fontSize:   9,
                      color:      'var(--ps-text-tertiary)',
                      flexShrink: 0,
                    }}
                  >
                    {relativeTime(slot.savedAt)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div
                style={{
                  display:       'flex',
                  flexDirection: 'column',
                  alignItems:    'stretch',
                  borderLeft:    '1px solid var(--ps-border)',
                  flexShrink:    0,
                }}
              >
                <button
                  onClick={() => onLoad(slot.id)}
                  style={{
                    flex:          1,
                    background:    'none',
                    border:        'none',
                    borderBottom:  '1px solid var(--ps-border)',
                    color:         'var(--ps-accent)',
                    fontFamily:    'var(--ps-font-ui)',
                    fontSize:      'var(--ps-text-xs)',
                    fontWeight:    600,
                    cursor:        'pointer',
                    padding:       '0 16px',
                    letterSpacing: '.04em',
                    whiteSpace:    'nowrap',
                    transition:    'background .15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-subtle)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  Load
                </button>
                <button
                  onClick={() => handleDeleteClick(slot.id)}
                  style={{
                    flex:          1,
                    background:    deleting ? 'var(--ps-danger-subtle)' : 'none',
                    border:        'none',
                    color:         deleting ? 'var(--ps-danger)' : 'var(--ps-text-tertiary)',
                    fontFamily:    'var(--ps-font-ui)',
                    fontSize:      'var(--ps-text-xs)',
                    fontWeight:    deleting ? 700 : 400,
                    cursor:        'pointer',
                    padding:       '0 16px',
                    letterSpacing: '.04em',
                    whiteSpace:    'nowrap',
                    transition:    'background .15s, color .15s',
                  }}
                >
                  {deleting ? 'Sure?' : '×'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
