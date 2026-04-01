export function encodePalette(colors, roles) {
  const data = { c: colors, r: roles };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  return window.location.origin + window.location.pathname + '?p=' + encoded;
}

export function decodePalette(urlString) {
  try {
    const url = new URL(urlString);
    const param = url.searchParams.get('p');
    if (!param) return null;
    const decoded = JSON.parse(decodeURIComponent(escape(atob(param))));
    if (!decoded.c || !Array.isArray(decoded.c) || decoded.c.length === 0) return null;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    for (const hex of decoded.c) {
      if (!hexRegex.test(hex)) return null;
    }
    return { colors: decoded.c, roles: decoded.r || {} };
  } catch {
    return null;
  }
}
