import IssueCard from '../components/IssueCard';

// ── Status indicator (CSS shape, not emoji) ───────────────────────────────────
function StatusDot({ hasCritical, hasWarning }) {
  const color = hasCritical ? 'var(--ps-danger)' : hasWarning ? 'var(--ps-warning)' : 'var(--ps-success)';
  return (
    <div
      style={{
        width:        10,
        height:       10,
        borderRadius: '50%',
        background:   color,
        flexShrink:   0,
      }}
    />
  );
}

export default function IssuesTab({ issues, colors, fixedCodes, fromImage, warnCount, onFix }) {
  const hasCritical = issues.some(i => i.type === 'critical');
  const hasWarning  = issues.some(i => i.type === 'warning');

  const summary =
    hasCritical ? 'Critical issues found — fix these before using this palette.' :
    hasWarning  ? 'Some improvements recommended for a professional result.' :
    issues.length === 0 ? 'No issues detected — looking good.' :
                  'Minor notes only — the palette is in good shape.';

  const bannerBg     = hasCritical ? 'var(--ps-danger-subtle)' : hasWarning ? 'var(--ps-warning-subtle)' : 'var(--ps-success-subtle)';
  const bannerBorder = hasCritical ? 'var(--ps-danger)' : hasWarning ? 'var(--ps-warning)' : 'var(--ps-success)';

  return (
    <div className="card">
      {/* Banner */}
      <div
        style={{
          background:   bannerBg,
          border:       `1px solid ${bannerBorder}`,
          borderRadius: 'var(--ps-radius-md)',
          padding:      '10px 14px',
          marginBottom: 16,
          display:      'flex',
          alignItems:   'center',
          gap:          10,
        }}
      >
        <StatusDot hasCritical={hasCritical} hasWarning={hasWarning} />
        <div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontWeight: 600,
              fontSize:   'var(--ps-text-sm)',
              color:      'var(--ps-text-primary)',
            }}
          >
            {issues.length} issue{issues.length !== 1 ? 's' : ''} found
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
            }}
          >
            {summary}
          </div>
        </div>
        {fromImage && (
          <div
            style={{
              marginLeft:    'auto',
              fontFamily:    'var(--ps-font-ui)',
              fontSize:      'var(--ps-text-xs)',
              color:         'var(--ps-accent)',
              fontWeight:    600,
              letterSpacing: '.06em',
            }}
          >
            FROM IMAGE
          </div>
        )}
      </div>

      {/* Issue list */}
      {issues.length === 0 ? (
        <div
          style={{
            textAlign:  'center',
            padding:    '30px 0',
            color:      'var(--ps-success)',
          }}
        >
          <div
            style={{
              width:        40,
              height:       40,
              borderRadius: '50%',
              border:       '2px solid var(--ps-success)',
              display:      'flex',
              alignItems:   'center',
              justifyContent: 'center',
              margin:       '0 auto 12px',
              fontSize:     18,
            }}
          >
            ✓
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontWeight: 600,
              fontSize:   'var(--ps-text-base)',
              color:      'var(--ps-text-primary)',
            }}
          >
            Your palette passes all diagnostic checks.
          </div>
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-sm)',
              color:      'var(--ps-text-secondary)',
              marginTop:  4,
            }}
          >
            Assign colour roles in the Colour Jobs tab to continue.
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {issues.map((issue, idx) => {
            const key = issue.code + (issue.i ?? '') + (issue.j ?? '');
            return (
              <IssueCard
                key={idx}
                issue={issue}
                onFix={() => onFix(issue)}
                fixApplied={fixedCodes.has(key)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
