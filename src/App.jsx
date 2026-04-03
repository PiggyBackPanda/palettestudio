import { useState, useEffect, useRef } from 'react';
import { usePalette } from './hooks/usePalette';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { encodePalette, decodePalette } from './utils/paletteURL';
import { TABS } from './constants';
import { PRESETS } from './data/presets';

import ScoreRing      from './components/ScoreRing';
import PaletteStrip   from './components/PaletteStrip';
import ImageExtractor from './components/ImageExtractor';
import SaveSlots      from './components/SaveSlots';
import WelcomeModal   from './components/WelcomeModal';

import DiagnoseTab     from './tabs/DiagnoseTab';
import ColoursTab      from './tabs/ColoursTab';
import RolesTab        from './tabs/RolesTab';
import TypographyTab   from './tabs/TypographyTab';
import MockupsTab      from './tabs/MockupsTab';
import ExportTab       from './tabs/ExportTab';
import VariationsTab   from './tabs/VariationsTab';
import BrandGuideTab   from './tabs/BrandGuideTab';
import CompetitorTab   from './tabs/CompetitorTab';

export default function App() {
  const [tab,            setTab]            = useState('diagnose');
  const [picker,         setPicker]         = useState('#888888');
  const [cvdType,        setCvdType]        = useState('protanopia');
  const [shareCopied,    setShareCopied]    = useState(false);
  const [sharePopupUrl,  setSharePopupUrl]  = useState(null);
  const [showShortcuts,  setShowShortcuts]  = useState(false);
  const [selectedFont,   setSelectedFont]   = useState(null);

  const palette = usePalette();

  const {
    colors, roles, autoReasons, fixedCodes, fromImage,
    savedSlots, storageUnavailable, issues, score, suggestions, warnCount, scales,
    addColor, addColors, removeColor, updateColor,
    setRole, chooseForMe, clearRoles, applyFix,
    saveSlot, loadSlot, deleteSlot, renameSlot,
    generateRandomPalette, loadPreset,
    undo, redo, canUndo, canRedo, loadFromURL, applyPalette,
  } = palette;

  useEffect(() => {
    const decoded = decodePalette(window.location.href);
    if (decoded) {
      loadFromURL(decoded);
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useKeyboardShortcuts({ undo, redo, saveSlot, generateRandomPalette, setTab, tabs: TABS });

  useEffect(() => {
    if (!showShortcuts) return;
    const handleEsc = (e) => { if (e.key === 'Escape') setShowShortcuts(false); };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShortcuts]);

  // Focus the active tab button when tab changes (for keyboard navigation)
  useEffect(() => {
    const el = document.getElementById(`tab-${tab}`);
    if (el && document.activeElement?.role === 'tab') el.focus();
  }, [tab]);

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
    background: 'none', border: 'none', borderRadius: 'var(--ps-radius-md)',
    padding: '5px 7px', cursor: disabled ? 'default' : 'pointer',
    color: disabled ? 'var(--ps-text-disabled)' : 'var(--ps-text-secondary)',
    opacity: disabled ? 0.40 : 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', transition: 'background .15s, color .15s',
  });

  const SHORTCUTS = [
    { keys: ['Ctrl', 'Z'], desc: 'Undo' },
    { keys: ['Ctrl', 'Shift', 'Z'], desc: 'Redo' },
    { keys: ['Ctrl', 'S'], desc: 'Save palette' },
    { keys: ['Ctrl', 'R'], desc: 'Random palette' },
    ...TABS.map((t, i) => ({ keys: [String(i + 1)], desc: `${t.label} tab` })),
  ];

  return (
    <>
      <header style={{ borderBottom: '1px solid var(--ps-border)', background: 'var(--ps-bg-surface)', position: 'sticky', top: 0, zIndex: 100, boxShadow: 'var(--ps-shadow-sm)' }}>
        <div className="ps-header-inner" style={{ maxWidth: 980, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xl)', fontWeight: 700, color: 'var(--ps-text-primary)', letterSpacing: '-.01em' }}>Palette Studio</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ps-bg-subtle)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-full)', padding: '2px 4px', gap: 2 }}>
              <button onClick={undo} disabled={!canUndo} title="Undo (Ctrl+Z)" style={ghostBtn(!canUndo)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5.5 5.5H11a3 3 0 0 1 0 6H8v-1.5h3a1.5 1.5 0 0 0 0-3H5.5V9L2 6.5 5.5 4v1.5z"/></svg>
              </button>
              <div style={{ width: 1, height: 14, background: 'var(--ps-border)' }} />
              <button onClick={redo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)" style={ghostBtn(!canRedo)}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 5.5H5a3 3 0 0 0 0 6h3v-1.5H5a1.5 1.5 0 0 1 0-3h5.5V9L14 6.5 10.5 4v1.5z"/></svg>
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <button onClick={handleShare} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'var(--ps-bg-surface)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-md)', padding: '5px 11px', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', fontWeight: 500, color: shareCopied ? 'var(--ps-success)' : 'var(--ps-text-secondary)', cursor: 'pointer', transition: 'border-color .15s, color .15s', whiteSpace: 'nowrap' }}>
                {shareCopied ? (
                  <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M13.5 3.5L6 11 2.5 7.5l-1 1L6 13l8.5-8.5z"/></svg>Link copied!</>
                ) : (
                  <><svg width="13" height="13" viewBox="0 0 16 16" fill="currentColor"><path d="M10.5 1a3 3 0 0 1 2.12 5.12L9.88 8.88A3 3 0 1 1 5.5 12v-.5h1.5V12a1.5 1.5 0 1 0 1.5-1.5h-.5V9h.5a3 3 0 0 1 2.12-5.12zM5.5 3a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/></svg>Share</>
                )}
              </button>
              {sharePopupUrl && (
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--ps-bg-surface)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-lg)', padding: '14px 16px', boxShadow: 'var(--ps-shadow-lg)', zIndex: 200, minWidth: 300 }}>
                  <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', fontWeight: 600, color: 'var(--ps-text-primary)', marginBottom: 8 }}>Share your palette</div>
                  <div style={{ display: 'flex', gap: 0, borderRadius: 'var(--ps-radius-md)', overflow: 'hidden', marginBottom: 10, border: '1px solid var(--ps-border)' }}>
                    {colors.map((hex, i) => <div key={i} style={{ flex: 1, height: 24, background: hex }} />)}
                  </div>
                  <p style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', marginBottom: 8, lineHeight: 1.5 }}>
                    Anyone with this link will see your {colors.length} colours{Object.keys(roles).length > 0 ? ' and assigned roles' : ''}.
                  </p>
                  <input readOnly value={sharePopupUrl} onClick={e => e.target.select()} style={{ width: '100%', fontFamily: 'var(--ps-font-mono)', fontSize: 'var(--ps-text-xs)', border: '1px solid var(--ps-border)', borderRadius: 'var(--ps-radius-sm)', padding: '6px 8px', color: 'var(--ps-text-primary)', background: 'var(--ps-bg-subtle)', outline: 'none', marginBottom: 8 }} />
                  <div style={{ display: 'flex', gap: 8, justifyContent: 'space-between', alignItems: 'center' }}>
                    <button onClick={() => { navigator.clipboard.writeText(sharePopupUrl).then(() => { setShareCopied(true); setSharePopupUrl(null); setTimeout(() => setShareCopied(false), 2000); }).catch(() => {}); }} style={{ background: 'var(--ps-accent)', color: 'var(--ps-accent-text)', border: 'none', borderRadius: 'var(--ps-radius-md)', padding: '6px 14px', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', fontWeight: 500, cursor: 'pointer' }}>Copy link</button>
                    <button onClick={() => setSharePopupUrl(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)', padding: 0 }}>Dismiss</button>
                  </div>
                </div>
              )}
            </div>
            <div className="ps-score-ring-wrap"><ScoreRing score={score} /></div>
            <button onClick={() => setShowShortcuts(s => !s)} title="Keyboard shortcuts" style={{ ...ghostBtn(false), background: showShortcuts ? 'var(--ps-accent-subtle)' : 'none', color: showShortcuts ? 'var(--ps-accent)' : 'var(--ps-text-tertiary)', fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-md)', fontWeight: 600 }}>?</button>
          </div>
        </div>
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

      <main style={{ maxWidth: 980, margin: '0 auto', padding: '20px 24px 32px' }}>
        <ImageExtractor onAddColors={addColors} onNavigate={setTab} />
        <PaletteStrip colors={colors} roles={roles} scales={scales} onUpdate={updateColor} onRemove={removeColor} onAdd={addColor} picker={picker} onPickerChange={setPicker} warnCount={warnCount} onGenerateRandom={generateRandomPalette} />
        <SaveSlots savedSlots={savedSlots} currentColors={colors} storageUnavailable={storageUnavailable} onSave={saveSlot} onLoad={loadSlot} onDelete={deleteSlot} onRename={renameSlot} />

        <div style={{ position: 'relative', marginBottom: 18 }}>
          <div className="ps-tab-bar" role="tablist" aria-label="Palette Studio sections" style={{ borderBottom: '1px solid var(--ps-border)', display: 'flex', overflowX: 'auto', gap: 0, background: 'var(--ps-bg-surface)', borderRadius: 'var(--ps-radius-lg) var(--ps-radius-lg) 0 0', padding: '0 4px', scrollbarWidth: 'none' }}>
            {TABS.map((t, i) => (
              <button key={t.key} role="tab" aria-selected={tab === t.key} aria-controls={`tabpanel-${t.key}`} id={`tab-${t.key}`} tabIndex={tab === t.key ? 0 : -1} className={`tb${tab === t.key ? ' on' : ''}`} onClick={() => setTab(t.key)}
                onKeyDown={e => {
                  const len = TABS.length;
                  if (e.key === 'ArrowRight') { e.preventDefault(); const next = TABS[(i + 1) % len].key; setTab(next); }
                  if (e.key === 'ArrowLeft')  { e.preventDefault(); const prev = TABS[(i - 1 + len) % len].key; setTab(prev); }
                  if (e.key === 'Home')       { e.preventDefault(); setTab(TABS[0].key); }
                  if (e.key === 'End')        { e.preventDefault(); setTab(TABS[len - 1].key); }
                }}
              >
                {t.label}
                {t.key === 'diagnose' && warnCount > 0 && (
                  <span aria-label={`${warnCount} issues`} style={{ marginLeft: 5, background: 'var(--ps-accent)', color: 'var(--ps-accent-text)', borderRadius: 'var(--ps-radius-full)', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}>{warnCount}</span>
                )}
              </button>
            ))}
          </div>
          <div className="ps-tab-fade" />
        </div>

        {tab === 'diagnose' && <DiagnoseTab issues={issues} colors={colors} fixedCodes={fixedCodes} fromImage={fromImage} warnCount={warnCount} onFix={applyFix} cvdType={cvdType} setCvdType={setCvdType} />}
        {tab === 'colours' && <ColoursTab suggestions={suggestions} colors={colors} roles={roles} scales={scales} onAdd={addColor} onLoadPreset={loadPreset} onApplyPalette={applyPalette} />}
        {tab === 'roles' && <RolesTab colors={colors} roles={roles} autoReasons={autoReasons} onSetRole={setRole} onChooseForMe={chooseForMe} onClearRoles={clearRoles} />}
        {tab === 'typography' && <TypographyTab colors={colors} roles={roles} selectedFont={selectedFont} onSelectFont={setSelectedFont} />}
        {tab === 'variations' && <VariationsTab colors={colors} roles={roles} onApplyPalette={applyPalette} />}
        {tab === 'mockups' && <MockupsTab roles={roles} colors={colors} onNavigate={setTab} selectedFont={selectedFont} />}
        {tab === 'export' && <ExportTab colors={colors} roles={roles} score={score} issues={issues} scales={scales} selectedFont={selectedFont} />}
        {tab === 'guide' && <BrandGuideTab colors={colors} roles={roles} selectedFont={selectedFont} />}
        {tab === 'compare' && <CompetitorTab colors={colors} savedSlots={savedSlots} />}
      </main>

      <WelcomeModal onClose={() => {}} onLoadExample={() => loadPreset(PRESETS[0])} />
    </>
  );
}
