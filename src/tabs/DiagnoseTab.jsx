import { useState } from 'react';
import IssuesTab from './IssuesTab';
import ReadabilityTab from './ReadabilityTab';
import ColourBlindTab from './ColourBlindTab';

const SECTIONS = [
  { key: 'issues', label: 'Issues' },
  { key: 'contrast', label: 'Contrast' },
  { key: 'colourvision', label: 'Colour Vision' },
];

export default function DiagnoseTab({ issues, colors, fixedCodes, fromImage, warnCount, onFix, cvdType, setCvdType }) {
  const [section, setSection] = useState('issues');

  return (
    <div>
      {/* Sub-nav pills */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {SECTIONS.map(s => (
          <button
            key={s.key}
            onClick={() => setSection(s.key)}
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize: 'var(--ps-text-sm)',
              fontWeight: section === s.key ? 600 : 400,
              padding: '6px 14px',
              borderRadius: 'var(--ps-radius-full)',
              border: '1px solid ' + (section === s.key ? 'var(--ps-accent)' : 'var(--ps-border)'),
              background: section === s.key ? 'var(--ps-accent-subtle)' : 'var(--ps-bg-surface)',
              color: section === s.key ? 'var(--ps-accent)' : 'var(--ps-text-secondary)',
              cursor: 'pointer',
              transition: 'all .15s',
            }}
          >
            {s.label}
            {s.key === 'issues' && warnCount > 0 && (
              <span style={{ marginLeft: 5, background: 'var(--ps-accent)', color: 'var(--ps-accent-text)', borderRadius: 'var(--ps-radius-full)', width: 16, height: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, verticalAlign: 'middle' }}>{warnCount}</span>
            )}
          </button>
        ))}
      </div>

      {section === 'issues' && <IssuesTab issues={issues} colors={colors} fixedCodes={fixedCodes} fromImage={fromImage} warnCount={warnCount} onFix={onFix} />}
      {section === 'contrast' && <ReadabilityTab colors={colors} />}
      {section === 'colourvision' && <ColourBlindTab colors={colors} cvdType={cvdType} setCvdType={setCvdType} />}
    </div>
  );
}
