import { rgbToHex, deltaE } from './colourMath';

function colorDist3(a, b) {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

function kMeansPlusPlus(pixels, k) {
  const centers = [pixels[Math.floor(Math.random() * pixels.length)]];
  while (centers.length < k) {
    const dists = pixels.map(p => Math.min(...centers.map(c => colorDist3(p, c) ** 2)));
    const sum   = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum, cum = 0;
    for (let i = 0; i < dists.length; i++) {
      cum += dists[i];
      if (cum >= r) { centers.push(pixels[i]); break; }
    }
  }
  return centers;
}

function kMeans(pixels, k, iters = 20) {
  let centers = kMeansPlusPlus(pixels, k);
  let asgn    = new Int32Array(pixels.length);

  for (let it = 0; it < iters; it++) {
    for (let i = 0; i < pixels.length; i++) {
      let mn = Infinity, mc = 0;
      for (let c = 0; c < centers.length; c++) {
        const d = colorDist3(pixels[i], centers[c]);
        if (d < mn) { mn = d; mc = c; }
      }
      asgn[i] = mc;
    }
    const s = Array.from({ length: k }, () => [0, 0, 0, 0]);
    for (let i = 0; i < pixels.length; i++) {
      const c = asgn[i];
      s[c][0] += pixels[i][0]; s[c][1] += pixels[i][1];
      s[c][2] += pixels[i][2]; s[c][3]++;
    }
    centers = s.map((x, i) =>
      x[3] > 0 ? [x[0] / x[3], x[1] / x[3], x[2] / x[3]] : centers[i]
    );
  }

  const cnt = new Array(k).fill(0);
  for (let i = 0; i < asgn.length; i++) cnt[asgn[i]]++;
  return centers
    .map((c, i) => ({ rgb: c, count: cnt[i] }))
    .sort((a, b) => b.count - a.count);
}

export function extractColorsFromImage(file, numColors = 8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.onload = evt => {
      const img = new Image();
      img.onerror = () => reject(new Error('Image failed to load'));
      img.onload = () => {
        try {
          const size   = 200;
          const canvas = document.createElement('canvas');
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;

          // Detect dominant background colour
          const buckets = {};
          for (let i = 0; i < data.length; i += 4) {
            const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            if (a < 80) continue;
            const k = `${Math.round(r / 32) * 32},${Math.round(g / 32) * 32},${Math.round(b / 32) * 32}`;
            buckets[k] = (buckets[k] || 0) + 1;
          }
          const total = Object.values(buckets).reduce((a, b) => a + b, 0);
          const top   = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
          const [dr, dg, db] = top ? top[0].split(',').map(Number) : [0, 0, 0];
          const isBg  = top && top[1] / total > 0.25;

          // Collect usable pixels
          let pixels = [];
          for (let i = 0; i < data.length; i += 4) {
            const [r, g, b, a] = [data[i], data[i + 1], data[i + 2], data[i + 3]];
            if (a < 80) continue;
            if (r > 238 && g > 238 && b > 238) continue;
            if (r < 18  && g < 18  && b < 18)  continue;
            if (isBg && Math.abs(r - dr) < 32 && Math.abs(g - dg) < 32 && Math.abs(b - db) < 32) continue;
            pixels.push([r, g, b]);
          }

          // Fallback if too aggressive
          if (pixels.length < 100) {
            pixels = [];
            for (let i = 0; i < data.length; i += 4) {
              if (data[i + 3] < 80) continue;
              pixels.push([data[i], data[i + 1], data[i + 2]]);
            }
          }

          if (pixels.length < 30) { resolve([]); return; }

          const sampled =
            pixels.length > 6000
              ? pixels.filter((_, i) => i % Math.floor(pixels.length / 6000) === 0)
              : pixels;

          const clusters  = kMeans(sampled, numColors);
          const hexColors = [];
          for (const cl of clusters) {
            if (cl.count < 3) continue;
            const h = rgbToHex(cl.rgb[0], cl.rgb[1], cl.rgb[2]);
            if (!hexColors.some(e => deltaE(e, h) < 10)) hexColors.push(h);
            if (hexColors.length >= 6) break;
          }
          resolve(hexColors);
        } catch (e) { reject(e); }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}
