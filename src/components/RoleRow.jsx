import { textOn } from '../utils/colourMath';
import { ROLES, ROLE_COL, ROLE_DESC } from '../utils/autoRoles';

export default function RoleRow({ hex, assignedRole, reason, onSetRole }) {
  const txtCol = textOn(hex);

  return (
    <div className="rp">
      {/* Colour swatch */}
      <div
        style={{
          width:          44,
          height:         44,
          borderRadius:   'var(--ps-radius-md)',
          background:     hex,
          flexShrink:     0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          fontFamily:     'var(--ps-font-mono)',
          fontSize:       8,
          color:          txtCol,
          fontWeight:     500,
          letterSpacing:  '.04em',
        }}
      >
        {hex.toUpperCase()}
      </div>

      {/* Role pills */}
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: reason ? 5 : 0 }}>
          {ROLES.map(role => {
            const active = assignedRole === role;
            return (
              <button
                key={role}
                onClick={() => onSetRole(hex, role)}
                title={ROLE_DESC[role]}
                style={{
                  background:    active ? ROLE_COL[role] : 'transparent',
                  color:         active ? '#fff' : ROLE_COL[role],
                  border:        `1.5px solid ${ROLE_COL[role]}`,
                  borderRadius:  'var(--ps-radius-sm)',
                  padding:       '3px 10px',
                  fontFamily:    'var(--ps-font-ui)',
                  fontSize:      'var(--ps-text-xs)',
                  fontWeight:    600,
                  cursor:        'pointer',
                  letterSpacing: '.04em',
                  transition:    'background .15s, color .15s',
                }}
              >
                {role}
              </button>
            );
          })}
        </div>

        {reason && (
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-xs)',
              color:      'var(--ps-text-secondary)',
              lineHeight: 1.45,
              fontStyle:  'italic',
            }}
          >
            {reason}
          </div>
        )}
      </div>
    </div>
  );
}
