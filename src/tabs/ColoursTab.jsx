import { useState } from 'react';
import AddColoursTab from './AddColoursTab';
import ColourNamesTab from './ColourNamesTab';
import ColourScalesTab from './ColourScalesTab';
import BuildAroundSection from './BuildAroundSection';

const SECTIONS = [
  { key: 'add', label: 'Add' },
  { key: 'build', label: 'Build Around' },
  { key: 'names', label: 'Names' },
  { key: 'scales', label: 'Scales' },
];

export default function ColoursTab({ suggestions, colors, roles, scales, onAdd, onLoadPreset, onApplyPalette }) {
  const [section, setSection] = useState('add');

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
          </button>
        ))}
      </div>

      {section === 'add' && <AddColoursTab suggestions={suggestions} colors={colors} onAdd={onAdd} onLoadPreset={onLoadPreset} />}
      {section === 'build' && <BuildAroundSection colors={colors} onApplyPalette={onApplyPalette} />}
      {section === 'names' && <ColourNamesTab colors={colors} />}
      {section === 'scales' && <ColourScalesTab colors={colors} roles={roles} scales={scales} />}
    </div>
  );
}
