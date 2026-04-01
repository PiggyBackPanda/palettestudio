import { useState, useEffect } from 'react';
import { usePalette } from './hooks/usePalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { encodePalette, decodePalette } from './utils/paletteURL';
import { TABS } from './constants';

import ScoreRing      from './components/ScoreRing';
import PaletteStrip   from './components/PaletteStrip';
import ImageExtractor from './components/ImageExtractor';
import SaveSlots      from './components/SaveSlots';

import IssuesTab      from './tabs/IssuesTab';
import ReadabilityTab from './tabs/ReadabilityTab';
import AddColoursTab  from './tabs/AddColoursTab';
import ColourBlindTab  from './tabs/ColourBlindTab';
import ColourNamesTab  from './tabs/ColourNamesTab';
import RolesTab        from './tabs/RolesTab';
import ExportTab      from './tabs/ExportTab';
import MockupsTab     from './tabs/MockupsTab';

export default function App() {
  const [tab,            setTab]            = useState('issues');
  const [picker,         setPicker]         = useState('#888888');
  const [cvdType,        setCvdType]        = useState('protanopia');
  const [shareCopied,    setShareCopied]    = useState(false);
  const [sharePopupUrl,  setSharePopupUrl]  = useState(null);
  const [showShortcuts,  setShowShortcuts]  = useState(false);

  const palette = usePalette();

  const {
    colors, roles, autoReasons, fixedCodes, fromImage,
    savedSlots, storageUnavailable, issues, score, suggestions, warnCount, scales,
    addColor, addColors, removeColor, updateColor,
    setRole, chooseForMe, clearRoles, applyFix,
    saveSlot, loadSlot, deleteSlot, renameSlot,
    generateRandomPalette, loadPreset,
    undo, redo, canUndo, canRedo, loadFromURL,
  } = palette;

  // ── Load palette from URL on mount ─────────────────────────────────────────
  useEffect(() => {
    const decoded = decodePalette(window.location.href);
    if (decoded) {
      loadFromURL(decoded);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard shortcuts ──────────────────────────────────────────────────────
  useKeyboardShortcuts({ undo, redo, saveSlot, generateRandomPalette, setTab, tabs: TABS });

  // ── Close shortcuts panel on Escape ────────────────────────────────────────
  useEffect(() => {
    if (!showShortcuts) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setShowShortcuts(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShortcuts]);

  // ── Share handler ───────────────────────────────────────────────────────────
  const handleShare = async () => {
    const url = encodePalette(colors, roles);
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setSharePopupUrl(null);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      setSharePopupUrl(url);
    }
  };

  const ghostBtn = (disabled) => ({
    background:     'none',
    border:         'none',
    borderRadius:   'var(--ps-radius-md)',
    padding:        '5px 7px',
    cursor:         disabled ? 'default' : 'pointer',
    color:          disabled ? 'var(--ps-text-disabled)' : 'var(--ps-text-secondary)',
    opacity:        disabled ? 0.35 : 1,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    transition:     'background .15s, color .15s',
  });

  const SHORTCUTS = [
    { keys: ['Ctrl', 'Z'],          desc: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
    { keys: ['Ctrl', 'S'],          desc: 'Save palette' },
    { keys: ['Ctrl', 'R'],          desc: 'Random palette' },
    ...TABS.map((t, i) => ({ keys: [String(i + 1)], desc: `${t.label} tab` })),
  ];

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header
        style={{
          borderBottom: '1px solid var(--ps-border)',
          background:   'var(--ps-bg-surface)',
          position:     'sticky',
          top:          0,
          zIndex:       100,
          boxShadow:    'var(--ps-shadow-sm)',
        }}
      >
        <div
          style={{
            maxWidth:       980,
            margin:         '0 auto',
            padding:        '12px 24px',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            gap:            12,
            flexWrap:       'wrap',
          }}
        >
          <div>
            <h1
              style={{
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-xl)',
                fontWeight:    700,
                color:         'var(--ps-text-primary)',
                letterSpacing: '-.01em',
              }}
            >
              Palette Studio
            </h1>
            <p
              style={{
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-xs)',
                color:         'var(--ps-text-tertiary)',
                letterSpacing: '.08em',
                marginTop:     2,
              }}
            >
              UPLOAD LOGO · DIAGNOSE · FIX · ASSIGN COLOUR JOBS
            </p>
          </div>
          {/* Right — controls + score ring + help */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>

            {/* Undo */}
            <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={ghostBtn(!canUndo)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M5.5 5.5H11a3 3 0 0 1 0 6H8v-1.5h3a1.5 1.5 0 0 0 0-3H5.5V9L2 6.5 5.5 4v1.5z"/>
              </svg>
            </button>

            {/* Redo */}
            <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" style={ghostBtn(!canRedo)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M10.5 5.5H5a3 3 0 0 0 0 6h3v-1.5H5a1.5 1.5 0 0 1 0-3h5.5V9L14 6.5 10.5 4v1.5z"/>
              </svg>
            </button>

            <div style={{ width: 1, height: 20, background: 'var(--ps-border)', margin: '0 2px' }} />

            {/* Share */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={handleShare}
                style={{
                  display:      'flex',
                  alignItems:   'center',
                  gap:          5,
                  background:   'var(--ps-bg-surface)',
                  border:       '1px solid var(--ps-border)',
                  borderRadius: 'var(--ps-radius-md)',
                  padding:      '5px 11px',
                  fontFamily:   'var(--ps-font-ui)',
                  fontSize:     'var(--ps-text-sm)',
                  fontWeight:   500,
                  color:        shareCopied ? 'var(--ps-success)' : 'var(--ps-text-secondary)',
                  cursor:       'pointer',
                  transition:   'border-color .15s, color .15s',
                  whiteSpace:   'nowrap',
                }}
              >
                {shareCopied ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z"/>
                    </svg>
                    Link copied!
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M10.5 1a3 3 0 0 1 2.12 5.12L9.88 8.88A3 3 0 1 1 5.5 12v-.5h1.5V12a1.5 1.5 0 1 0 1.5-1.5h-.5V9h.5a3 3 0 0 1 2.12-5.12zM5.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
                    </svg>
                    Share
                  </>
                )}
              </button>
              {sharePopupUrl && (
                <div style={{
                  position:     'absolute',
                  top:          'calc(100% + 6px)',
                  right:        0,
                  background:   'var(--ps-bg-surface)',
                  border:       '1px solid var(--ps-border)',
                  borderRadius: 'var(--ps-radius-md)',
                  padding:      '8px 10px',
                  boxShadow:    'var(--ps-shadow-md)',
                  zIndex:       200,
                  minWidth:     280,
                }}>
                  <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', marginBottom: 6 }}>
                    Copy this link manually:
                  </p>
                  <input
                    readOnly
                    value={sharePopupUrl}
                    onClick={e => e.target.select()}
                    style={{
                      width:        '100%',
                      fontFamily:   'var(--ps-font-mono)',
                      fontSize:     'var(--ps-text-xs)',
                      border:       '1px solid var(--ps-border)',
                      borderRadius: 'var(--ps-radius-sm)',
                      padding:      '4px 8px',
                      color:        'var(--ps-text-primary)',
                      background:   'var(--ps-bg-subtle)',
                      outline:      'none',
                    }}
                  />
                  <button
                    onClick={() => setSharePopupUrl(null)}
                    style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', padding: 0 }}
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </div>

            <ScoreRing score={score} />

            {/* Keyboard shortcuts toggle */}
            <button
              onClick={() => setShowShortcuts(s => !s)}
              title="Keyboard shortcuts"
              style={{
                background:     showShortcuts ? 'var(--ps-accent-subtle)' : 'none',
                border:         '1px solid',
                borderColor:    showShortcuts ? 'var(--ps-accent)' : 'var(--ps-border)',
                borderRadius:   'var(--ps-radius-full)',
                width:          24,
                height:         24,
                display:        'flex',
                alignItems:     'center',
                justifyContent: 'center',
                fontFamily:     'var(--ps-font-ui)',
                fontSize:       'var(--ps-text-sm)',
                fontWeight:     600,
                color:          showShortcuts ? 'var(--ps-accent)' : 'var(--ps-text-tertiary)',
                cursor:         'pointer',
                transition:     'background .15s, color .15s, border-color .15s',
                flexShrink:     0,
              }}
            >
              ?
            </button>
          </div>
        </div>

        {/* ── Keyboard shortcuts panel ──────────────────────────────────── */}
        {showShortcuts && (
          <div style={{ borderTop: '1px solid var(--ps-border)', background: 'var(--ps-bg-surface)', padding: 'var(--ps-space-4) var(--ps-space-8)' }}>
            <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '8px 24px' }}>
              {SHORTCUTS.map(({ keys, desc }) => (
                <div key={desc} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
                    {keys.map((k, i) => (
                      <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {i > 0 && <span style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)' }}>+</span>}
                        <kbd style={{ fontFamily: 'var(--ps-font-mono)', fontSize: 10, padding: '1px 5px', border: '1px solid var(--ps-border-strong)', borderRadius: 'var(--ps-radius-sm)', background: 'var(--ps-bg-subtle)', color: 'var(--ps-text-primary)', boxShadow: '0 1px 0 var(--ps-border-strong)', whiteSpace: 'nowrap' }}>{k}</kbd>
                      </span>
                    ))}
                  </div>
                  <span style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-secondary)' }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* ── Main ───────────────────────────────────────────────────────── */}
      <main style={{ maxWidth: 980, margin: '0 auto', padding: '20px 24px 60px' }}>

        {/* Image extractor */}
        <ImageExtractor
          onAddColors={addColors}
          onNavigate={setTab}
        />

        {/* Palette strip */}
        <PaletteStrip
          colors={colors}
          roles={roles}
          scales={scales}
          onUpdate={updateColor}
          onRemove={removeColor}
          onAdd={addColor}
          picker={picker}
          onPickerChange={setPicker}
          warnCount={warnCount}
          onGenerateRandom={generateRandomPalette}
        />

        {/* ── Tab navigation ─────────────────────────────────────────── */}
        <div
          style={{
            borderBottom:  '1px solid var(--ps-border)',
            marginBottom:  18,
            display:       'flex',
            overflowX:     'auto',
            gap:           0,
            background:    'var(--ps-bg-surface)',
            borderRadius:  'var(--ps-radius-lg) var(--ps-radius-lg) 0 0',
            padding:       '0 4px',
          }}
        >
          {TABS.map(t => (
            <button
              key={t.key}
              className={`tb${tab === t.key ? ' on' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
              {t.key === 'issues' && warnCount > 0 && (
                <span
                  style={{
                    marginLeft:     5,
                    background:     'var(--ps-accent)',
                    color:          'var(--ps-accent-text)',
                    borderRadius:   'var(--ps-radius-full)',
                    width:          16,
                    height:         16,
                    display:        'inline-flex',
                    alignItems:     'center',
                    justifyContent: 'center',
                    fontSize:       9,
                    fontWeight:     700,
                    verticalAlign:  'middle',
                  }}
                >
                  {warnCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Tab content ────────────────────────────────────────────── */}
        {tab === 'issues' && (
          <IssuesTab
            issues={issues}
            colors={colors}
            fixedCodes={fixedCodes}
            fromImage={fromImage}
            warnCount={warnCount}
            onFix={applyFix}
          />
        )}
        {tab === 'readability' && (
          <ReadabilityTab colors={colors} />
        )}
        {tab === 'addcolours' && (
          <AddColoursTab
            suggestions={suggestions}
            colors={colors}
            onAdd={addColor}
            onLoadPreset={loadPreset}
          />
        )}
        {tab === 'colourblind' && (
          <ColourBlindTab
            colors={colors}
            cvdType={cvdType}
            setCvdType={setCvdType}
          />
        )}
        {tab === 'colournames' && (
          <ColourNamesTab colors={colors} />
        )}
        {tab === 'roles' && (
          <RolesTab
            colors={colors}
            roles={roles}
            autoReasons={autoReasons}
            onSetRole={setRole}
            onChooseForMe={chooseForMe}
            onClearRoles={clearRoles}
          />
        )}
        {tab === 'export' && (
          <ExportTab
            colors={colors}
            roles={roles}
            score={score}
            issues={issues}
            scales={scales}
          />
        )}
        {tab === 'mockups' && (
          <MockupsTab
            roles={roles}
            colors={colors}
            onNavigate={setTab}
          />
        )}

        {/* ── Save Slots ─────────────────────────────────────────────── */}
        <SaveSlots
          savedSlots={savedSlots}
          currentColors={colors}
          storageUnavailable={storageUnavailable}
          onSave={saveSlot}
          onLoad={loadSlot}
          onDelete={deleteSlot}
          onRename={renameSlot}
        />
      </main>
    </>
  );
}
