import { useState } from 'react';
import { generatePaletteFromBrief } from '../utils/generateFromBrief';
import { diagnose, healthScore } from '../utils/diagnose';
import ScoreRing from '../components/ScoreRing';
import IssueCard from '../components/IssueCard';

const MAX_BRIEF = 500;
const SESSION_KEY = 'ps-ai-history';

const EXAMPLES = [
  "A sustainable outdoor clothing brand — earthy, adventurous, trustworthy",
  "A luxury legal firm — authoritative, traditional, established",
  "A playful children's education app — bright, friendly, accessible",
];

const ROLE_BADGE = {
  Background: { bg: '#e0f2fe', text: '#0369a1' },
  Hero:       { bg: '#ede9fe', text: '#7c3aed' },
  Accent:     { bg: '#fce7f3', text: '#be185d' },
  Text:       { bg: '#f1f5f9', text: '#334155' },
  Neutral:    { bg: '#f0fdf4', text: '#166534' },
};

function getHistory() {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveHistory(entry) {
  try {
    const hist = getHistory();
    const next = [entry, ...hist].slice(0, 3);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {}
}

function LoadingDots() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, padding: '20px 0' }}>
      <div style={{ display: 'flex', gap: 6 }}>
        {[0, 1, 2].map(i => (
          <div
            key={i}
            style={{
              width:      8,
              height:     8,
              borderRadius: '50%',
              background: 'var(--ps-accent)',
              animation:  `ps-pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)', fontWeight: 600 }}>
        Claude is designing your palette...
      </div>
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xs)', color: 'var(--ps-text-tertiary)' }}>
        Analysing your brief and selecting harmonious colours
      </div>
    </div>
  );
}

function ErrorBanner({ type }) {
  const messages = {
    no_key:  'No API key found. Add VITE_ANTHROPIC_API_KEY to your .env file to use AI generation.',
    network: 'No response from the API — check your connection and try again.',
    invalid: "Couldn't generate a palette this time — the AI response wasn't in the expected format. Try rephrasing your brief or try again.",
  };
  return (
    <div
      style={{
        background:   'var(--ps-warning-subtle)',
        border:       '1px solid var(--ps-warning)',
        borderRadius: 'var(--ps-radius-lg)',
        padding:      '14px 16px',
        fontFamily:   'var(--ps-font-ui)',
        fontSize:     'var(--ps-text-sm)',
        color:        'var(--ps-text-primary)',
        lineHeight:   1.6,
      }}
    >
      {messages[type] || messages.invalid}
    </div>
  );
}

function Rationale({ result }) {
  const issues    = diagnose(result.colors);
  const score     = healthScore(issues);
  const topIssues = issues.slice(0, 3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Palette name */}
      <div style={{ fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-xl)', fontWeight: 700, color: 'var(--ps-text-primary)' }}>
        {result.paletteName}
      </div>

      {/* Colour cards */}
      <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
        {result.colors.map(hex => {
          const role      = result.roles?.[hex];
          const rationale = result.rationale?.[hex];
          const badge     = role ? (ROLE_BADGE[role] || { bg: '#f1f5f9', text: '#334155' }) : null;
          return (
            <div
              key={hex}
              style={{
                width:        160,
                flexShrink:   0,
                border:       '1px solid var(--ps-border)',
                borderRadius: 'var(--ps-radius-lg)',
                overflow:     'hidden',
                background:   'var(--ps-bg-surface)',
              }}
            >
              <div style={{ width: '100%', height: 48, background: hex }} />
              <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div style={{ fontFamily: 'var(--ps-font-mono)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-primary)' }}>
                  {hex}
                </div>
                {badge && (
                  <span
                    style={{
                      display:      'inline-block',
                      background:   badge.bg,
                      color:        badge.text,
                      borderRadius: 'var(--ps-radius-sm)',
                      padding:      '2px 7px',
                      fontFamily:   'var(--ps-font-ui)',
                      fontSize:     'var(--ps-text-xs)',
                      fontWeight:   600,
                      width:        'fit-content',
                    }}
                  >
                    {role}
                  </span>
                )}
                {rationale && (
                  <p
                    style={{
                      fontFamily:          'var(--ps-font-ui)',
                      fontSize:            'var(--ps-text-xs)',
                      color:               'var(--ps-text-secondary)',
                      lineHeight:          1.5,
                      margin:              0,
                      display:             '-webkit-box',
                      WebkitLineClamp:     3,
                      WebkitBoxOrient:     'vertical',
                      overflow:            'hidden',
                    }}
                  >
                    {rationale}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Diagnostic preview */}
      <div>
        <div
          style={{
            fontFamily:    'var(--ps-font-ui)',
            fontSize:      'var(--ps-text-xs)',
            fontWeight:    600,
            color:         'var(--ps-text-tertiary)',
            letterSpacing: '.06em',
            marginBottom:  12,
          }}
        >
          INSTANT DIAGNOSTIC
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <ScoreRing score={score} />
          <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {topIssues.length === 0 ? (
              <div
                style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize:   'var(--ps-text-sm)',
                  color:      'var(--ps-success)',
                  fontWeight: 600,
                  paddingTop: 8,
                }}
              >
                ✓ No significant issues detected
              </div>
            ) : topIssues.map((issue, idx) => (
              <IssueCard key={idx} issue={issue} fixApplied={false} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AIGenerateTab({ onNavigate, onLoadPalette }) {
  const [brief,     setBrief]     = useState('');
  const [status,    setStatus]    = useState('idle'); // idle | loading | result | error
  const [result,    setResult]    = useState(null);
  const [errorType, setErrorType] = useState('invalid');
  const [history,   setHistory]   = useState(getHistory);

  const handleGenerate = async () => {
    if (!brief.trim()) return;
    setStatus('loading');
    setErrorType('invalid');
    try {
      const data = await generatePaletteFromBrief(brief.trim());
      setResult(data);
      setStatus('result');
      saveHistory({ paletteName: data.paletteName, colors: data.colors });
      setHistory(getHistory());
    } catch (err) {
      setStatus('error');
      if (err.message === 'NO_API_KEY') {
        setErrorType('no_key');
      } else if (err.message === 'NETWORK_ERROR' || err.name === 'TypeError') {
        setErrorType('network');
      } else {
        setErrorType('invalid');
      }
    }
  };

  const handleUse = () => {
    if (!result) return;
    onLoadPalette(result.colors, result.roles || {});
    onNavigate('issues');
  };

  const handleRetry = () => {
    setStatus('idle');
    setResult(null);
  };

  const handleHistoryLoad = entry => {
    onLoadPalette(entry.colors, {});
    onNavigate('issues');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header card */}
      <div className="card" style={{ padding: '20px 24px' }}>
        <h2
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-lg)',
            fontWeight: 700,
            color:      'var(--ps-text-primary)',
            margin:     '0 0 8px',
          }}
        >
          Generate from a brief
        </h2>
        <p
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
            lineHeight: 1.6,
            margin:     '0 0 14px',
          }}
        >
          Describe your brand in plain English and we'll generate a colour palette for it — then run the full Palette Studio diagnostic automatically.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {EXAMPLES.map((ex, i) => (
            <button
              key={i}
              onClick={() => setBrief(ex)}
              style={{
                background:   'var(--ps-bg-subtle)',
                border:       '1px solid var(--ps-border)',
                borderRadius: 'var(--ps-radius-md)',
                padding:      '5px 10px',
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-xs)',
                color:        'var(--ps-text-secondary)',
                cursor:       'pointer',
                textAlign:    'left',
                lineHeight:   1.4,
                transition:   'border-color .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--ps-accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--ps-border)'}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Input + generate */}
      {status !== 'result' && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <textarea
            value={brief}
            onChange={e => setBrief(e.target.value.slice(0, MAX_BRIEF))}
            disabled={status === 'loading'}
            placeholder="Describe your brand — its personality, industry, audience, and the feeling you want to create..."
            style={{
              width:        '100%',
              minHeight:    100,
              fontFamily:   'var(--ps-font-ui)',
              fontSize:     'var(--ps-text-sm)',
              color:        'var(--ps-text-primary)',
              border:       '1px solid var(--ps-border)',
              borderRadius: 'var(--ps-radius-md)',
              padding:      '10px 12px',
              resize:       'vertical',
              outline:      'none',
              boxSizing:    'border-box',
              background:   status === 'loading' ? 'var(--ps-bg-subtle)' : 'var(--ps-bg-surface)',
              lineHeight:   1.6,
              transition:   'border-color .15s',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--ps-border-focus)'}
            onBlur={e   => e.target.style.borderColor = 'var(--ps-border)'}
          />
          <div
            style={{
              textAlign:  'right',
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-tertiary)',
              marginTop:  4,
            }}
          >
            {brief.length} / {MAX_BRIEF}
          </div>

          {status === 'loading' ? (
            <LoadingDots />
          ) : (
            <button
              onClick={handleGenerate}
              disabled={!brief.trim()}
              style={{
                marginTop:     14,
                width:         '100%',
                background:    brief.trim() ? 'var(--ps-accent)' : 'var(--ps-bg-overlay)',
                color:         brief.trim() ? 'var(--ps-accent-text)' : 'var(--ps-text-disabled)',
                border:        'none',
                borderRadius:  'var(--ps-radius-md)',
                padding:       '10px 20px',
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-md)',
                fontWeight:    600,
                cursor:        brief.trim() ? 'pointer' : 'not-allowed',
                letterSpacing: '.01em',
                transition:    'background .15s',
              }}
              onMouseEnter={e => brief.trim() && (e.currentTarget.style.background = 'var(--ps-accent-hover)')}
              onMouseLeave={e => brief.trim() && (e.currentTarget.style.background = 'var(--ps-accent)')}
            >
              Generate palette ✦
            </button>
          )}
        </div>
      )}

      {/* Error banner */}
      {status === 'error' && <ErrorBanner type={errorType} />}

      {/* Result */}
      {status === 'result' && result && (
        <div className="card" style={{ padding: '20px 24px' }}>
          <Rationale result={result} />

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={handleUse}
              style={{
                background:    'var(--ps-accent)',
                color:         'var(--ps-accent-text)',
                border:        'none',
                borderRadius:  'var(--ps-radius-md)',
                padding:       '9px 20px',
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-sm)',
                fontWeight:    600,
                cursor:        'pointer',
                transition:    'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
            >
              Use this palette →
            </button>
            <button
              onClick={handleRetry}
              style={{
                background:   'var(--ps-bg-surface)',
                color:        'var(--ps-text-secondary)',
                border:       '1px solid var(--ps-border)',
                borderRadius: 'var(--ps-radius-md)',
                padding:      '9px 20px',
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-sm)',
                fontWeight:   500,
                cursor:       'pointer',
                transition:   'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-bg-subtle)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-bg-surface)'}
            >
              Try a different palette
            </button>
          </div>
        </div>
      )}

      {/* Session history */}
      {history.length > 0 && (
        <div>
          <div
            style={{
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              fontWeight:    600,
              color:         'var(--ps-text-tertiary)',
              letterSpacing: '.06em',
              marginBottom:  8,
            }}
          >
            RECENT GENERATIONS
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {history.map((entry, i) => (
              <button
                key={i}
                onClick={() => handleHistoryLoad(entry)}
                style={{
                  background:   'var(--ps-bg-surface)',
                  border:       '1px solid var(--ps-border)',
                  borderRadius: 'var(--ps-radius-md)',
                  padding:      '8px 10px',
                  cursor:       'pointer',
                  display:      'flex',
                  flexDirection: 'column',
                  gap:          6,
                  textAlign:    'left',
                  transition:   'box-shadow .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.boxShadow = 'var(--ps-shadow-md)'}
                onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
              >
                <div style={{ display: 'flex', gap: 3 }}>
                  {entry.colors.map(c => (
                    <div key={c} style={{ width: 20, height: 20, background: c, borderRadius: 3 }} />
                  ))}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--ps-font-ui)',
                    fontSize:   'var(--ps-text-xs)',
                    color:      'var(--ps-text-secondary)',
                  }}
                >
                  {entry.paletteName}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
