export default function InvoiceMockup({ palette, headingFont, bodyFont, brandInfo = {} }) {
  const { hero, accent, background: bg, text, neutral } = palette;
  const { companyName = 'YourBrand' } = brandInfo;
  const items = [['Brand Strategy Workshop', '2', '$950.00', '$1,900.00'], ['Logo Design Package', '1', '$2,400.00', '$2,400.00'], ['Brand Guidelines Document', '1', '$800.00', '$800.00']];
  return (
    <div style={{ background: bg, padding: '24px 28px', borderRadius: 8, width: '100%', maxWidth: 480, fontFamily: bodyFont }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: headingFont, fontSize: 18, color: text, fontWeight: 600 }}>INVOICE</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, marginTop: 4 }}>#INV-2024-0042</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: headingFont, fontSize: 12, color: hero, fontWeight: 600 }}>{companyName}</div>
          <div style={{ fontSize: 9, color: text, opacity: .5, lineHeight: 1.6 }}>123 Design Street<br />New York, NY 10001</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${neutral}40`, marginBottom: 12 }} />
      <div style={{ marginBottom: 12 }}>
        {items.map(([desc, qty, rate, total], idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: `1px solid ${neutral}20`, fontSize: 10, color: text }}>
            <span style={{ flex: 2 }}>{desc}</span>
            <span style={{ flex: .5, textAlign: 'center', opacity: .6 }}>{qty}</span>
            <span style={{ flex: 1, textAlign: 'right', opacity: .6 }}>{rate}</span>
            <span style={{ flex: 1, textAlign: 'right', fontWeight: 500 }}>{total}</span>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20, padding: '10px 0' }}>
        <span style={{ fontSize: 11, color: text, opacity: .6 }}>Total Due</span>
        <span style={{ fontFamily: headingFont, fontSize: 20, color: hero, fontWeight: 700 }}>$5,100.00</span>
      </div>
      <div style={{ marginTop: 12, padding: '8px 14px', background: `${accent}15`, borderRadius: 'var(--ps-radius-md)', fontSize: 9, color: accent, textAlign: 'center' }}>Payment due within 30 days · Thank you for your business</div>
    </div>
  );
}
