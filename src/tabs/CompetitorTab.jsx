import { useState, useRef } from 'react';
import { hexToRgb, rgbToHsl, luminance, textOn, tempCategory } from '../utils/colourMath';
import { extractColorsFromImage } from '../utils/imageExtraction';
import { diagnose } from '../utils/diagnose';

/* ── helpers ─────────────────────────────────────────────────────────────────── */

function healthScore(colors) {
  const issues = diagnose(colors);
  let score = 100;
  for (const i of issues) {
    if (i.type === 'critical') score -= 20;
    else if (i.type === 'warning') score -= 12;
    else if (i.type === 'info') score -= 3;
  }
  return Math.max(0, score);
}

function hslData(colors) {
  return colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return { hex, ...rgbToHsl(r, g, b) };
  });
}

function avgStat(data, key) {
  if (!data.length) return 0;
  return data.reduce((s, c) => s + c[key], 0) / data.length;
}

function tempBreakdown(data) {
  const counts = { warm: 0, cool: 0, neutral: 0 };
  data.forEach(c => {
    const cat = tempCategory(c.h, c.s);
    if (cat.label === 'warm' || cat.label === 'warm-green') counts.warm++;
    else if (cat.label === 'cool') counts.cool++;
    else counts.neutral++;
  });
  const total = data.length || 1;
  return {
    warm:    Math.round((counts.warm / total) * 100),
    cool:    Math.round((counts.cool / total) * 100),
    neutral: Math.round((counts.neutral / total) * 100),
  };
}

function hueSpread(data) {
  if (data.length < 2) return 0;
  const hues = data.map(c => c.h).sort((a, b) => a - b);
  let maxGap = 0;
  for (let i = 1; i < hues.length; i++) maxGap = Math.max(maxGap, hues[i] - hues[i - 1]);
  maxGap = Math.max(maxGap, 360 - hues[hues.length - 1] + hues[0]);
  return 360 - maxGap;
}

function generateInsights(yourData, compData, yourScore, compScore) {
  const insights = [];
  const yAvgS = avgStat(yourData, 's');
  const cAvgS = avgStat(compData, 's');
  const diff = Math.abs(yAvgS - cAvgS);
  if (diff > 10) {
    insights.push(
      yAvgS > cAvgS
        ? `Your palette is more saturated on average (${Math.round(yAvgS)}% vs ${Math.round(cAvgS)}%), giving it a bolder, more vibrant feel.`
        : `The competitor palette is more saturated (${Math.round(cAvgS)}% vs ${Math.round(yAvgS)}%), which may feel more energetic to viewers.`
    );
  } else {
    insights.push(`Both palettes have similar average saturation (~${Math.round(yAvgS)}%), so neither feels significantly bolder.`);
  }

  const yAvgL = avgStat(yourData, 'l');
  const cAvgL = avgStat(compData, 'l');
  if (Math.abs(yAvgL - cAvgL) > 10) {
    insights.push(
      yAvgL > cAvgL
        ? `Your colours are lighter overall (${Math.round(yAvgL)}% vs ${Math.round(cAvgL)}%), creating an airier, more open tone.`
        : `The competitor uses lighter tones (${Math.round(cAvgL)}% vs ${Math.round(yAvgL)}%), which may feel more approachable.`
    );
  }

  const yTemp = tempBreakdown(yourData);
  const cTemp = tempBreakdown(compData);
  if (yTemp.warm > 50 && cTemp.cool > 50) {
    insights.push('Your palette leans warm while the competitor leans cool \u2014 this creates a clear emotional contrast between the two brands.');
  } else if (yTemp.cool > 50 && cTemp.warm > 50) {
    insights.push('Your palette leans cool while the competitor leans warm \u2014 you may appear more professional and calm in comparison.');
  }

  const ySpread = hueSpread(yourData);
  const cSpread = hueSpread(compData);
  if (Math.abs(ySpread - cSpread) > 40) {
    insights.push(
      ySpread > cSpread
        ? `Your hue range is wider (${Math.round(ySpread)}\u00b0 vs ${Math.round(cSpread)}\u00b0), suggesting a more diverse, playful brand.`
        : `The competitor uses a wider hue range (${Math.round(cSpread)}\u00b0 vs ${Math.round(ySpread)}\u00b0), giving them a more varied visual vocabulary.`
    );
  }

  if (Math.abs(yourScore - compScore) >= 5) {
    insights.push(
      yourScore > compScore
        ? `Your palette health score is higher (${yourScore} vs ${compScore}), indicating fewer colour harmony issues.`
        : `The competitor has a higher health score (${compScore} vs ${yourScore}). Review your palette's issues to close the gap.`
    );
  } else {
    insights.push(`Both palettes have similar health scores (${yourScore} vs ${compScore}), so neither has a clear technical advantage.`);
  }

  return insights.slice(0, 5);
}

/* ── sub-components ──────────────────────────────────────────────────────────── */

function SwatchStrip({ colors }) {
  return (
    <div style={{ display: 'flex', borderRadius: 'var(--ps-radius-md)', overflow: 'hidden', height: 36 }}>
      {colors.map((hex, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            background: hex,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'var(--ps-font-mono)',
            fontSize: 'var(--ps-text-sm)',
            color: textOn(hex),
            letterSpacing: '.02em',
          }}
        >
          {hex}
        </div>
      ))}
    </div>
  );
}

function HueWheel({ data, size = 120 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 14;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--ps-border)" strokeWidth={1} />
      {data.map((c, i) => {
        const angle = (c.h - 90) * (Math.PI / 180);
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        return <circle key={i} cx={x} cy={y} r={5} fill={c.hex} stroke="var(--ps-bg-surface)" strokeWidth={1.5} />;
      })}
    </svg>
  );
}

function ScatterPlot({ data, size = 140 }) {
  const pad = 14;
  const inner = size - pad * 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={pad} y={pad} width={inner} height={inner} fill="none" stroke="var(--ps-border)" strokeWidth={1} rx={4} />
      <text x={size / 2} y={size - 1} textAnchor="middle" fill="var(--ps-text-secondary)" fontSize={9} fontFamily="var(--ps-font-ui)">Saturation</text>
      <text x={3} y={size / 2} textAnchor="middle" fill="var(--ps-text-secondary)" fontSize={9} fontFamily="var(--ps-font-ui)" transform={`rotate(-90,3,${size / 2})`}>Lightness</text>
      {data.map((c, i) => {
        const x = pad + (c.s / 100) * inner;
        const y = pad + ((100 - c.l) / 100) * inner;
        return <circle key={i} cx={x} cy={y} r={5} fill={c.hex} stroke="var(--ps-bg-surface)" strokeWidth={1.5} />;
      })}
    </svg>
  );
}

function TempBar({ data }) {
  const t = tempBreakdown(data);
  return (
    <div>
      <div style={{ display: 'flex', borderRadius: 'var(--ps-radius-md)', overflow: 'hidden', height: 14 }}>
        {t.warm > 0 && <div style={{ width: `${t.warm}%`, background: '#c05020' }} />}
        {t.neutral > 0 && <div style={{ width: `${t.neutral}%`, background: '#888' }} />}
        {t.cool > 0 && <div style={{ width: `${t.cool}%`, background: '#205080' }} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)', color: 'var(--ps-text-secondary)' }}>
        <span>Warm {t.warm}%</span>
        <span>Neutral {t.neutral}%</span>
        <span>Cool {t.cool}%</span>
      </div>
    </div>
  );
}

function ScoreBadge({ score }) {
  const color = score >= 80 ? '#2a7' : score >= 50 ? '#c90' : '#c33';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
      color: 'var(--ps-text-primary)',
    }}>
      <span style={{
        display: 'inline-block', width: 32, height: 32, lineHeight: '32px',
        textAlign: 'center', borderRadius: '50%', fontWeight: 700,
        background: color, color: '#fff', fontSize: 13,
      }}>
        {score}
      </span>
      Health Score
    </div>
  );
}

function PalettePanel({ label, colors, data, score }) {
  return (
    <div style={{ flex: 1 }}>
      <h3 style={{
        fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
        fontWeight: 600, color: 'var(--ps-text-primary)', marginBottom: 10,
        letterSpacing: '.03em', textTransform: 'uppercase',
      }}>
        {label}
      </h3>

      <SwatchStrip colors={colors} />

      <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--ps-font-ui)', color: 'var(--ps-text-secondary)', marginBottom: 4 }}>Hue wheel</div>
          <HueWheel data={data} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 10, fontFamily: 'var(--ps-font-ui)', color: 'var(--ps-text-secondary)', marginBottom: 4 }}>Sat / Light</div>
          <ScatterPlot data={data} />
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--ps-font-ui)', color: 'var(--ps-text-secondary)', marginBottom: 4 }}>Temperature</div>
        <TempBar data={data} />
      </div>

      <div style={{ marginTop: 14 }}>
        <ScoreBadge score={score} />
      </div>
    </div>
  );
}

/* ── main component ──────────────────────────────────────────────────────────── */

export default function CompetitorTab({ colors }) {
  const [competitorColors, setCompetitorColors] = useState([]);
  const [competitorImage, setCompetitorImage]   = useState(null);
  const [dragging, setDragging]                 = useState(false);
  const [extracting, setExtracting]             = useState(false);
  const fileRef                                 = useRef(null);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    setExtracting(true);
    try {
      if (competitorImage) URL.revokeObjectURL(competitorImage);
      const url = URL.createObjectURL(file);
      setCompetitorImage(url);
      const extracted = await extractColorsFromImage(file, 10);
      setCompetitorColors(extracted.slice(0, 6));
    } catch {
      /* extraction failed silently */
    } finally {
      setExtracting(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const onDragOver = (e) => { e.preventDefault(); setDragging(true); };
  const onDragLeave = () => setDragging(false);

  const reset = () => {
    if (competitorImage) URL.revokeObjectURL(competitorImage);
    setCompetitorColors([]);
    setCompetitorImage(null);
  };

  /* ── no competitor yet: show upload zone ────────────────────────────────── */
  if (!competitorImage || competitorColors.length === 0) {
    return (
      <div className="card">
        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onClick={() => fileRef.current?.click()}
          style={{
            border:       `2px dashed ${dragging ? 'var(--ps-accent)' : 'var(--ps-border)'}`,
            borderRadius: 'var(--ps-radius-lg)',
            padding:      '48px 24px',
            textAlign:    'center',
            cursor:       'pointer',
            background:   dragging ? 'color-mix(in srgb, var(--ps-accent) 6%, transparent)' : 'transparent',
            transition:   'border-color .15s, background .15s',
          }}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div style={{
            fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
            color: 'var(--ps-text-secondary)', lineHeight: 1.6,
          }}>
            {extracting
              ? 'Extracting colours\u2026'
              : 'Upload a competitor\u2019s logo or screenshot'}
          </div>
          <div style={{
            fontFamily: 'var(--ps-font-ui)', fontSize: 11,
            color: 'var(--ps-text-secondary)', opacity: 0.6, marginTop: 8,
          }}>
            Drag & drop or click to browse
          </div>
        </div>
      </div>
    );
  }

  /* ── comparison view ───────────────────────────────────────────────────── */
  const yourData = hslData(colors);
  const compData = hslData(competitorColors);
  const yourScore = healthScore(colors);
  const compScore = healthScore(competitorColors);
  const insights  = generateInsights(yourData, compData, yourScore, compScore);

  return (
    <div className="card">
      {/* side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 28, marginBottom: 28 }}>
        <PalettePanel label="Your Brand"  colors={colors}           data={yourData} score={yourScore} />
        <PalettePanel label="Competitor"   colors={competitorColors} data={compData} score={compScore} />
      </div>

      {/* competitor image thumbnail */}
      {competitorImage && (
        <div style={{ marginBottom: 20, textAlign: 'center' }}>
          <img
            src={competitorImage}
            alt="Competitor reference"
            style={{
              maxHeight: 100,
              borderRadius: 'var(--ps-radius-md)',
              boxShadow: 'var(--ps-shadow-sm)',
            }}
          />
        </div>
      )}

      {/* insights */}
      <div style={{
        background: 'var(--ps-bg-surface)',
        border: '1px solid var(--ps-border)',
        borderRadius: 'var(--ps-radius-lg)',
        padding: '18px 22px',
        marginBottom: 16,
      }}>
        <h3 style={{
          fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
          fontWeight: 600, color: 'var(--ps-text-primary)', marginBottom: 12,
          letterSpacing: '.03em', textTransform: 'uppercase',
        }}>
          Insights
        </h3>
        <ul style={{
          margin: 0, paddingLeft: 18,
          fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
          color: 'var(--ps-text-secondary)', lineHeight: 1.75,
        }}>
          {insights.map((text, i) => <li key={i}>{text}</li>)}
        </ul>
      </div>

      {/* reset link */}
      <div style={{ textAlign: 'center' }}>
        <button
          onClick={reset}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--ps-font-ui)', fontSize: 'var(--ps-text-sm)',
            color: 'var(--ps-accent)', textDecoration: 'underline',
            padding: '4px 8px',
          }}
        >
          Upload a different image
        </button>
      </div>
    </div>
  );
}
