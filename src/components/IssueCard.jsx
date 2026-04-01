// ── Type indicator shapes (CSS, no emoji) ────────────────────────────────────
function TypeIndicator({ type }) {
  if (type === 'critical') {
    return (
      <div
        style={{
          width:        8,
          height:       8,
          borderRadius: '50%',
          background:   'var(--ps-danger)',
          flexShrink:   0,
          marginTop:    6,
        }}
      />
    );
  }
  if (type === 'warning') {
    return (
      <div
        style={{
          width:        8,
          height:       8,
          borderRadius: 1,
          background:   'var(--ps-warning)',
          flexShrink:   0,
          marginTop:    6,
        }}
      />
    );
  }
  // info
  return (
    <div
      style={{
        width:        8,
        height:       8,
        borderRadius: '50%',
        border:       '2px solid var(--ps-info)',
        background:   'transparent',
        flexShrink:   0,
        marginTop:    6,
      }}
    />
  );
}

const TYPE_META = {
  critical: {
    border:      'var(--ps-danger)',
    bg:          'var(--ps-danger-subtle)',
    badgeBg:     'var(--ps-danger)',
    label:       'Critical',
  },
  warning: {
    border:      'var(--ps-warning)',
    bg:          'var(--ps-warning-subtle)',
    badgeBg:     'var(--ps-warning)',
    label:       'Warning',
  },
  info: {
    border:      'var(--ps-info)',
    bg:          'var(--ps-info-subtle)',
    badgeBg:     'var(--ps-info)',
    label:       'Info',
  },
};

export default function IssueCard({ issue, onFix, fixApplied }) {
  const tm = TYPE_META[issue.type] || TYPE_META.info;

  return (
    <div
      style={{
        border:       `1px solid ${tm.border}`,
        borderRadius: 'var(--ps-radius-lg)',
        background:   tm.bg,
        padding:      '14px 16px',
        opacity:      fixApplied ? 0.45 : 1,
        transition:   'opacity .3s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        {/* Geometric indicator */}
        <TypeIndicator type={issue.type} />

        <div style={{ flex: 1 }}>
          {/* Badge + title row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                background:    tm.badgeBg,
                color:         '#fff',
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-xs)',
                fontWeight:    600,
                letterSpacing: '.06em',
                padding:       '2px 7px',
                borderRadius:  'var(--ps-radius-sm)',
                whiteSpace:    'nowrap',
                flexShrink:    0,
              }}
            >
              {tm.label.toUpperCase()}
            </span>
            <div
              style={{
                fontFamily: 'var(--ps-font-ui)',
                fontWeight: 600,
                fontSize:   'var(--ps-text-md)',
                color:      'var(--ps-text-primary)',
              }}
            >
              {issue.title}
            </div>
          </div>

          {/* Plain-English explanation */}
          <p
            style={{
              fontFamily:  'var(--ps-font-ui)',
              fontSize:    'var(--ps-text-sm)',
              color:       'var(--ps-text-secondary)',
              lineHeight:  1.6,
              margin:      '0 0 6px',
            }}
          >
            {issue.plain}
          </p>

          {/* Brand impact */}
          <div
            style={{
              fontFamily:  'var(--ps-font-ui)',
              fontSize:    'var(--ps-text-xs)',
              color:       'var(--ps-text-secondary)',
              lineHeight:  1.55,
              borderLeft:  '2px solid var(--ps-border-strong)',
              paddingLeft: 10,
              background:  'var(--ps-bg-subtle)',
              padding:     '6px 10px',
              borderRadius: '0 var(--ps-radius-sm) var(--ps-radius-sm) 0',
              fontStyle:   'italic',
            }}
          >
            {issue.brand}
          </div>

          {/* Fix button */}
          {issue.fix && !fixApplied && (
            <button
              onClick={onFix}
              style={{
                marginTop:     10,
                background:    'var(--ps-accent)',
                color:         'var(--ps-accent-text)',
                border:        'none',
                borderRadius:  'var(--ps-radius-md)',
                padding:       '7px 16px',
                fontFamily:    'var(--ps-font-ui)',
                fontSize:      'var(--ps-text-sm)',
                fontWeight:    500,
                cursor:        'pointer',
                letterSpacing: '.02em',
                transition:    'background .15s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--ps-accent-hover)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--ps-accent)'}
            >
              {issue.fix.label}
            </button>
          )}
          {fixApplied && (
            <div
              style={{
                marginTop:  8,
                fontFamily: 'var(--ps-font-ui)',
                fontSize:   'var(--ps-text-sm)',
                color:      'var(--ps-success)',
                fontWeight: 600,
              }}
            >
              ✓ Fixed
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
