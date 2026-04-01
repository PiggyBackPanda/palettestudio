import { useState, useRef } from 'react';
import { extractColorsFromImage } from '../utils/imageExtraction';

export default function ImageExtractor({ onAddColors, onNavigate }) {
  const [status,     setStatus]    = useState('idle');
  const [preview,    setPreview]   = useState(null);
  const [extracted,  setExtracted] = useState([]);
  const [errMsg,     setErrMsg]    = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef();

  const handleFile = async file => {
    if (!file || !file.type.startsWith('image/')) {
      setStatus('error');
      setErrMsg('Please upload an image file (PNG, JPG, SVG, WebP).');
      return;
    }
    setStatus('loading');
    setPreview(URL.createObjectURL(file));
    try {
      const colors = await extractColorsFromImage(file, 8);
      if (!colors.length) throw new Error('No colours could be extracted. Try a different image.');
      setExtracted(colors);
      setStatus('done');
    } catch (e) {
      setStatus('error');
      setErrMsg(e.message || 'Extraction failed.');
    }
  };

  const handleDrop = e => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const useColors = () => {
    onAddColors(extracted, true);
    if (onNavigate) onNavigate('issues');
  };

  const borderColor = isDragging ? 'var(--ps-accent)' : 'var(--ps-border-strong)';
  const bgColor     = isDragging ? 'var(--ps-accent-subtle)' : 'var(--ps-bg-subtle)';

  return (
    <div style={{ marginBottom: 20 }}>
      {/* Section header */}
      <div style={{ marginBottom: 14 }}>
        <div
          style={{
            fontFamily:  'var(--ps-font-ui)',
            fontSize:    'var(--ps-text-md)',
            fontWeight:  600,
            color:       'var(--ps-text-primary)',
          }}
        >
          Step 1 — Upload your logo
        </div>
        <div
          style={{
            fontFamily: 'var(--ps-font-ui)',
            fontSize:   'var(--ps-text-sm)',
            color:      'var(--ps-text-secondary)',
          }}
        >
          Start here. We'll pull your brand colours straight from your image.
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onClick={() => status !== 'loading' && inputRef.current?.click()}
        style={{
          border:       `2px ${status === 'idle' && isDragging ? 'solid' : 'dashed'} ${borderColor}`,
          borderRadius: 'var(--ps-radius-lg)',
          padding:      status === 'idle' ? '48px 32px' : '18px 20px',
          minHeight:    180,
          background:   bgColor,
          cursor:       status === 'loading' ? 'wait' : 'pointer',
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          justifyContent: 'center',
          transition:   'border-color .15s, background .15s',
          boxSizing:    'border-box',
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {/* ── Idle state ── */}
        {status === 'idle' && (
          <>
            {/* Upload icon circle */}
            <div
              style={{
                width:           56,
                height:          56,
                borderRadius:    '50%',
                background:      isDragging ? 'rgba(79,70,229,0.18)' : 'var(--ps-accent-subtle)',
                display:         'flex',
                alignItems:      'center',
                justifyContent:  'center',
                marginBottom:    16,
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="var(--ps-accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="16 16 12 12 8 16" />
                <line x1="12" y1="12" x2="12" y2="21" />
                <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
              </svg>
            </div>

            {/* Primary text */}
            <div
              style={{
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-lg)',
                fontWeight:   600,
                color:        isDragging ? 'var(--ps-accent)' : 'var(--ps-text-primary)',
                textAlign:    'center',
                marginBottom: 6,
              }}
            >
              {isDragging ? 'Release to upload' : 'Drop your logo or brand image here'}
            </div>

            {/* Secondary text */}
            <div
              style={{
                fontFamily: 'var(--ps-font-ui)',
                fontSize:   'var(--ps-text-sm)',
                color:      'var(--ps-text-secondary)',
                textAlign:  'center',
              }}
            >
              We'll extract the dominant colours automatically · PNG, JPG, WebP, SVG, GIF
            </div>

            {/* "or" divider */}
            <div
              style={{
                display:   'flex',
                alignItems: 'center',
                gap:        10,
                width:      '100%',
                maxWidth:   320,
                margin:     '14px 0',
              }}
            >
              <div style={{ flex: 1, height: 1, background: 'var(--ps-border)' }} />
              <span
                style={{
                  fontFamily: 'var(--ps-font-ui)',
                  fontSize:   'var(--ps-text-xs)',
                  color:      'var(--ps-text-tertiary)',
                }}
              >
                or
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--ps-border)' }} />
            </div>

            {/* Browse files button */}
            <button
              onClick={e => { e.stopPropagation(); inputRef.current?.click(); }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--ps-accent)';
                e.currentTarget.style.color = 'var(--ps-accent)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--ps-border)';
                e.currentTarget.style.color = 'var(--ps-text-secondary)';
              }}
              style={{
                background:   'var(--ps-bg-surface)',
                color:        'var(--ps-text-secondary)',
                border:       '1px solid var(--ps-border)',
                borderRadius: 'var(--ps-radius-md)',
                padding:      '8px 20px',
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-sm)',
                fontWeight:   500,
                cursor:       'pointer',
              }}
            >
              Browse files
            </button>
          </>
        )}

        {/* ── Loading state ── */}
        {status === 'loading' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {preview && (
              <img
                src={preview}
                alt="Logo preview"
                style={{
                  width:        56,
                  height:       56,
                  objectFit:    'contain',
                  borderRadius: 'var(--ps-radius-md)',
                  background:   'var(--ps-bg-surface)',
                  padding:      3,
                  border:       '1px solid var(--ps-border)',
                }}
              />
            )}
            <div
              style={{
                fontFamily: 'var(--ps-font-ui)',
                fontSize:   'var(--ps-text-base)',
                color:      'var(--ps-accent)',
                fontWeight: 600,
              }}
            >
              Extracting colours…
            </div>
          </div>
        )}

        {/* ── Done state ── */}
        {status === 'done' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            {preview && (
              <img
                src={preview}
                alt="Logo preview"
                style={{
                  width:        56,
                  height:       56,
                  objectFit:    'contain',
                  borderRadius: 'var(--ps-radius-md)',
                  background:   'var(--ps-bg-surface)',
                  padding:      3,
                  border:       '1px solid var(--ps-border)',
                }}
              />
            )}
            <div style={{ display: 'flex', gap: 5 }}>
              {extracted.map((c, i) => (
                <div
                  key={i}
                  title={c}
                  style={{
                    width:        22,
                    height:       22,
                    borderRadius: 'var(--ps-radius-sm)',
                    background:   c,
                    border:       '1.5px solid rgba(0,0,0,.1)',
                    outline:      '2px solid transparent',
                    transition:   'outline-color .15s',
                  }}
                />
              ))}
            </div>
            <button
              onClick={e => { e.stopPropagation(); useColors(); }}
              style={{
                background:    'var(--ps-accent)',
                color:         'var(--ps-accent-text)',
                border:        'none',
                borderRadius:  'var(--ps-radius-md)',
                padding:       '6px 14px',
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
              Use these colours →
            </button>
            <button
              onClick={e => {
                e.stopPropagation();
                setStatus('idle');
                setPreview(null);
                inputRef.current.value = '';
              }}
              style={{
                background:   'var(--ps-bg-surface)',
                border:       '1px solid var(--ps-border)',
                color:        'var(--ps-text-secondary)',
                borderRadius: 'var(--ps-radius-md)',
                padding:      '5px 10px',
                fontFamily:   'var(--ps-font-ui)',
                fontSize:     'var(--ps-text-xs)',
                cursor:       'pointer',
                transition:   'border-color .15s, color .15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'var(--ps-border-strong)';
                e.currentTarget.style.color = 'var(--ps-text-primary)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--ps-border)';
                e.currentTarget.style.color = 'var(--ps-text-secondary)';
              }}
            >
              Try another
            </button>
          </div>
        )}

        {/* ── Error state ── */}
        {status === 'error' && (
          <div
            style={{
              fontFamily: 'var(--ps-font-ui)',
              fontSize:   'var(--ps-text-sm)',
              color:      'var(--ps-danger)',
            }}
          >
            {errMsg}{' '}
            <button
              onClick={e => { e.stopPropagation(); setStatus('idle'); }}
              style={{
                background:     'none',
                border:         'none',
                color:          'var(--ps-accent)',
                cursor:         'pointer',
                fontFamily:     'var(--ps-font-ui)',
                fontSize:       'var(--ps-text-sm)',
                textDecoration: 'underline',
                padding:        0,
              }}
            >
              Try again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
