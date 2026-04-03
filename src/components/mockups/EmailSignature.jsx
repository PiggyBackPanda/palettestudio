import { textOn } from '../../utils/colourMath';

export default function EmailSignature({ palette, headingFont, bodyFont, brandInfo = {} }) {
  const { hero, accent, background: bg, text } = palette;
  const { companyName = 'YourBrand', personName = 'Jane Doe', personTitle = 'Creative Director', email = 'hello@yourbrand.com', phone = '+1 (555) 123-4567' } = brandInfo;
  return (
    <div style={{ padding: '24px 28px', background: bg, borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: hero, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}>
          <span style={{ fontFamily: headingFont, fontSize: 22, color: textOn(hero), fontWeight: 600 }}>{personName.charAt(0)}</span>
        </div>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600, marginBottom: 2 }}>{personName}</div>
          <div style={{ fontSize: 10, color: accent, marginBottom: 8 }}>{personTitle} at {companyName}</div>
          <div style={{ width: 32, height: 2, background: hero, borderRadius: 1, marginBottom: 8 }} />
          <div style={{ fontSize: 9, color: text, opacity: .6, lineHeight: 1.8 }}>{phone} · {email}</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, marginTop: 2 }}>www.{companyName.toLowerCase().replace(/\s+/g, '')}.com</div>
        </div>
      </div>
    </div>
  );
}
