export default function Letterhead({ palette, headingFont, bodyFont, brandInfo = {} }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  const { companyName = 'YourBrand', personName = 'Jane Doe', personTitle = 'Creative Director', email = 'hello@yourbrand.com', phone = '+1 (555) 123-4567' } = brandInfo;
  return (
    <div style={{ background: bg, padding: '28px 32px', minHeight: 320, display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 5, background: `linear-gradient(90deg, ${hero}, ${accent})`, borderRadius: '8px 8px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, paddingTop: 8 }}>
        <div style={{ fontFamily: headingFont, fontSize: 16, color: text, fontWeight: 600 }}>{companyName}</div>
        <div style={{ fontSize: 8, color: text, opacity: .5, textAlign: 'right', lineHeight: 1.6 }}>123 Design Street · New York, NY 10001<br />{email} · {phone}</div>
      </div>
      <div style={{ fontSize: 10, color: text, opacity: .6, marginBottom: 8 }}>April 1, 2026</div>
      <div style={{ fontSize: 10, color: text, opacity: .6, marginBottom: 16 }}>Dear Valued Client,</div>
      <div style={{ fontSize: 10, color: text, opacity: .7, lineHeight: 1.85, marginBottom: 20, flex: 1 }}>Thank you for choosing {companyName}. We are thrilled to partner with you on this exciting project. Our team is committed to delivering exceptional results that exceed your expectations and elevate your brand presence.</div>
      <div style={{ borderTop: `1px solid ${neutral}30`, paddingTop: 14, marginTop: 'auto' }}>
        <div style={{ fontFamily: headingFont, fontSize: 11, color: hero, fontWeight: 600, marginBottom: 2 }}>{personName}</div>
        <div style={{ fontSize: 9, color: text, opacity: .5 }}>{personTitle}</div>
      </div>
    </div>
  );
}
