import { useState, useRef, useCallback, useEffect, useMemo } from "react";

// Colour Math ───────────────────────────────────────────────
function hexToRgb(hex) {
  const c = hex.replace("#", "");
  return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) };
}
function rgbToHex(r, g, b) {
  return "#" + [r,g,b].map(x => Math.max(0,Math.min(255,Math.round(x))).toString(16).padStart(2,"0")).join("");
}
function rgbToHsl(r,g,b) {
  r/=255; g/=255; b/=255;
  const max=Math.max(r,g,b), min=Math.min(r,g,b);
  let h=0, s=0, l=(max+min)/2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d/(2-max-min) : d/(max+min);
    switch(max) {
      case r: h = ((g-b)/d + (g<b?6:0)) / 6; break;
      case g: h = ((b-r)/d + 2) / 6; break;
      case b: h = ((r-g)/d + 4) / 6; break;
    }
  }
  return { h: h*360, s: s*100, l: l*100 };
}
function hslToHex(h,s,l) {
  h/=360; s/=100; l/=100;
  const q = l < 0.5 ? l*(1+s) : l+s-l*s, p = 2*l-q;
  const hr = (p,q,t) => {
    if(t<0) t+=1; if(t>1) t-=1;
    if(t<1/6) return p+(q-p)*6*t;
    if(t<1/2) return q;
    if(t<2/3) return p+(q-p)*(2/3-t)*6;
    return p;
  };
  const [r,g,b] = s===0 ? [l,l,l] : [hr(p,q,h+1/3), hr(p,q,h), hr(p,q,h-1/3)];
  return rgbToHex(r*255, g*255, b*255);
}
function luminance(r,g,b) {
  return [r,g,b].reduce((a,c,i) => {
    c/=255;
    c = c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4);
    return a + c * [0.2126,0.7152,0.0722][i];
  }, 0);
}
function contrastRatio(h1,h2) {
  const {r:r1,g:g1,b:b1} = hexToRgb(h1), {r:r2,g:g2,b:b2} = hexToRgb(h2);
  const l1 = luminance(r1,g1,b1), l2 = luminance(r2,g2,b2);
  return (Math.max(l1,l2)+0.05) / (Math.min(l1,l2)+0.05);
}
function textOn(hex) {
  const {r,g,b} = hexToRgb(hex);
  return luminance(r,g,b) > 0.35 ? "#1a1a1a" : "#f5f0e8";
}
function rgbToLab(r,g,b) {
  const lin = c => { c/=255; return c<=0.04045 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
  const [lr,lg,lb] = [r,g,b].map(lin);
  let X = lr*0.4124564 + lg*0.3575761 + lb*0.1804375;
  let Y = lr*0.2126729 + lg*0.7151522 + lb*0.0721750;
  let Z = lr*0.0193339 + lg*0.1191920 + lb*0.9503041;
  X/=0.95047; Y/=1.00000; Z/=1.08883;
  const f = t => t > 0.008856 ? Math.cbrt(t) : 7.787*t + 16/116;
  return { L: 116*f(Y)-16, a: 500*(f(X)-f(Y)), b: 200*(f(Y)-f(Z)) };
}
function deltaE(h1,h2) {
  const {r:r1,g:g1,b:b1} = hexToRgb(h1), {r:r2,g:g2,b:b2} = hexToRgb(h2);
  const l1 = rgbToLab(r1,g1,b1), l2 = rgbToLab(r2,g2,b2);
  return Math.sqrt((l1.L-l2.L)**2 + (l1.a-l2.a)**2 + (l1.b-l2.b)**2);
}
function tempCategory(h,s) {
  if (s < 10) return { label: "neutral", col: "#888" };
  if (h >= 330 || h < 60)  return { label: "warm", col: "#c05020" };
  if (h >= 60  && h < 90)  return { label: "warm-green", col: "#a07020" };
  if (h >= 90  && h < 150) return { label: "natural", col: "#608040" };
  if (h >= 150 && h < 270) return { label: "cool", col: "#205080" };
  return { label: "cool-purple", col: "#506090" };
}
function simulateCVD(r,g,b,type) {
  const matrices = {
    protanopia:   [[0.56667,0.43333,0],[0.55833,0.44167,0],[0,0.24167,0.75833]],
    deuteranopia: [[0.625,0.375,0],[0.7,0.3,0],[0,0.3,0.7]],
    tritanopia:   [[0.95,0.05,0],[0,0.43333,0.56667],[0,0.475,0.525]],
  };
  const m = matrices[type];
  return rgbToHex(
    m[0][0]*r + m[0][1]*g + m[0][2]*b,
    m[1][0]*r + m[1][1]*g + m[1][2]*b,
    m[2][0]*r + m[2][1]*g + m[2][2]*b
  );
}

// Image Extraction ──────────────────────────────────────────
function colorDist3(a,b) {
  return Math.sqrt((a[0]-b[0])**2 + (a[1]-b[1])**2 + (a[2]-b[2])**2);
}
function kMeansPlusPlus(pixels, k) {
  const centers = [pixels[Math.floor(Math.random()*pixels.length)]];
  while (centers.length < k) {
    const dists = pixels.map(p => Math.min(...centers.map(c => colorDist3(p,c)**2)));
    const sum = dists.reduce((a,b) => a+b, 0);
    let r = Math.random() * sum, cum = 0;
    for (let i=0; i<dists.length; i++) {
      cum += dists[i];
      if (cum >= r) { centers.push(pixels[i]); break; }
    }
  }
  return centers;
}
function kMeans(pixels, k, iters=20) {
  let centers = kMeansPlusPlus(pixels, k);
  let asgn = new Int32Array(pixels.length);
  for (let it=0; it<iters; it++) {
    for (let i=0; i<pixels.length; i++) {
      let mn=Infinity, mc=0;
      for (let c=0; c<centers.length; c++) {
        const d = colorDist3(pixels[i], centers[c]);
        if (d < mn) { mn=d; mc=c; }
      }
      asgn[i] = mc;
    }
    const s = Array.from({length:k}, () => [0,0,0,0]);
    for (let i=0; i<pixels.length; i++) {
      const c = asgn[i];
      s[c][0]+=pixels[i][0]; s[c][1]+=pixels[i][1];
      s[c][2]+=pixels[i][2]; s[c][3]++;
    }
    centers = s.map((x,i) => x[3]>0 ? [x[0]/x[3],x[1]/x[3],x[2]/x[3]] : centers[i]);
  }
  const cnt = new Array(k).fill(0);
  for (let i=0; i<asgn.length; i++) cnt[asgn[i]]++;
  return centers.map((c,i) => ({rgb:c, count:cnt[i]})).sort((a,b) => b.count - a.count);
}

function extractColorsFromImage(file, numColors=8) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.onload = evt => {
      const img = new Image();
      img.onerror = () => reject(new Error("Image failed to load"));
      img.onload = () => {
        try {
          const size = 200;
          const canvas = document.createElement("canvas");
          canvas.width = size; canvas.height = size;
          const ctx = canvas.getContext("2d");
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const data = ctx.getImageData(0, 0, size, size).data;
          // Detect dominant background colour
          const buckets = {};
          for (let i=0; i<data.length; i+=4) {
            const [r,g,b,a] = [data[i],data[i+1],data[i+2],data[i+3]];
            if (a < 80) continue;
            const k = `${Math.round(r/32)*32},${Math.round(g/32)*32},${Math.round(b/32)*32}`;
            buckets[k] = (buckets[k]||0) + 1;
          }
          const total = Object.values(buckets).reduce((a,b) => a+b, 0);
          const top = Object.entries(buckets).sort((a,b) => b[1]-a[1])[0];
          const [dr,dg,db] = top ? top[0].split(",").map(Number) : [0,0,0];
          const isBg = top && top[1]/total > 0.25;
          // Collect usable pixels
          let pixels = [];
          for (let i=0; i<data.length; i+=4) {
            const [r,g,b,a] = [data[i],data[i+1],data[i+2],data[i+3]];
            if (a < 80) continue;
            if (r>238 && g>238 && b>238) continue;
            if (r<18  && g<18  && b<18)  continue;
            if (isBg && Math.abs(r-dr)<32 && Math.abs(g-dg)<32 && Math.abs(b-db)<32) continue;
            pixels.push([r,g,b]);
          }
          // Fallback if too aggressive
          if (pixels.length < 100) {
            pixels = [];
            for (let i=0; i<data.length; i+=4) {
              if (data[i+3] < 80) continue;
              pixels.push([data[i], data[i+1], data[i+2]]);
            }
          }
          if (pixels.length < 30) { resolve([]); return; }
          const sampled = pixels.length > 6000
            ? pixels.filter((_,i) => i % Math.floor(pixels.length/6000) === 0)
            : pixels;
          const clusters = kMeans(sampled, numColors);
          const hexColors = [];
          for (const cl of clusters) {
            if (cl.count < 3) continue;
            const h = rgbToHex(cl.rgb[0], cl.rgb[1], cl.rgb[2]);
            if (!hexColors.some(e => deltaE(e,h) < 10)) hexColors.push(h);
            if (hexColors.length >= 6) break;
          }
          resolve(hexColors);
        } catch(e) { reject(e); }
      };
      img.src = evt.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// Diagnostics ───────────────────────────────────────────────
function buildIssue(type, code, title, plain, brand, fix) {
  return { type, code, title, plain, brand, fix: fix || null };
}
function buildFixedIssue(type, code, title, plain, brand, i, j, fix) {
  return { type, code, title, plain, brand, i, j, fix: fix || null };
}

function diagnose(colors) {
  if (colors.length < 2) return [];
  const data = colors.map(hex => {
    const {r,g,b} = hexToRgb(hex);
    return { ...rgbToHsl(r,g,b), hex, lum: luminance(r,g,b) };
  });
  const issues = [];
  const heroIdx = data.reduce((m,c,i) => c.s > data[m].s ? i : m, 0);

  // Vibration hazard
  for (let i=0; i<data.length; i++) {
    for (let j=i+1; j<data.length; j++) {
      const ratio = contrastRatio(data[i].hex, data[j].hex);
      const hDiff = Math.min(
        Math.abs(data[i].h - data[j].h),
        360 - Math.abs(data[i].h - data[j].h)
      );
      if (ratio < 1.5 && data[i].s > 75 && data[j].s > 75 && hDiff > 140) {
        const ji = j;
        issues.push(buildFixedIssue(
          "critical", "VIBRATION",
          "These two colours vibrate when placed next to each other",
          "When these colours touch in a design, their edges appear to glow or shimmer. "
            + "It is uncomfortable to look at for more than a second. This happens when "
            + "two opposite colours share almost the same brightness level.",
          "Your audience will find designs using these colours together hard to look at, "
            + "and it signals inexperience to designers and clients.",
          i, j,
          {
            label: "Fix the brightness difference",
            fn: (cols) => cols.map((h, idx) => {
              if (idx !== ji) return h;
              const {r,g,b} = hexToRgb(h);
              const hsl = rgbToHsl(r,g,b);
              return hslToHex(hsl.h, hsl.s, Math.min(hsl.l + 22, 90));
            })
          }
        ));
      }
    }
  }

  // No neutral
  if (!data.some(c => c.s < 15)) {
    issues.push(buildIssue(
      "warning", "NO_NEUTRAL",
      "You are missing a background colour",
      "Every design needs at least one calm, quiet colour that text can sit on and "
        + "gives the eye a place to rest. Right now all your colours are bold and "
        + "saturated, which means every element competes for attention at once.",
      "Without a neutral, your website, flyers and social posts will feel overwhelming "
        + "and hard to read. Customers will feel stressed rather than welcomed.",
      {
        label: "Add a background colour",
        fn: (cols) => {
          const neutral = hslToHex(data[heroIdx].h, Math.min(data[heroIdx].s * 0.08, 6), 96);
          return cols.length < 8 ? [...cols, neutral] : cols;
        }
      }
    ));
  }

  // No accent
  if (Math.max(...data.map(c => c.s)) < 30) {
    issues.push(buildIssue(
      "warning", "NO_ACCENT",
      "Nothing stands out as your main brand colour",
      "A strong brand palette has one colour that does the heavy lifting. It appears "
        + "on your logo, buttons, and key moments. Right now everything is equally muted, "
        + "so there is no clear star of the show.",
      "When customers visit your website or see your flyer, nothing will draw their "
        + "eye to the most important element -- your call to action or your logo.",
      {
        label: "Add a standout colour",
        fn: (cols) => {
          const accent = hslToHex(
            (data[heroIdx].h + 180) % 360,
            Math.min(data[heroIdx].s * 0.85, 72),
            Math.max(data[heroIdx].l * 0.85, 40)
          );
          return cols.length < 8 ? [...cols, accent] : cols;
        }
      }
    ));
  }

  // Over-saturation
  const overSat = data.filter(c => c.s > 95);
  if (overSat.length) {
    issues.push(buildIssue(
      "warning", "OVER_SAT",
      overSat.length > 1
        ? "Some colours are too intense -- like a neon sign"
        : "A colour is too intense -- like a neon sign",
      "One or more colours are turned up to maximum intensity. On a screen, this "
        + "creates a glowing edge effect that makes text hard to read and causes eye "
        + "strain after a few minutes. It also leaves no room for a hover effect on "
        + "buttons without the colour looking broken.",
      "Overly saturated colours signal inexperience. Toning them down by just 5-10% "
        + "makes a huge difference in how premium and professional the palette feels.",
      {
        label: "Tone them down automatically",
        fn: (cols) => cols.map(hex => {
          const {r,g,b} = hexToRgb(hex);
          const hsl = rgbToHsl(r,g,b);
          return hsl.s > 95 ? hslToHex(hsl.h, 87, hsl.l) : hex;
        })
      }
    ));
  }

  // Too many accents
  const vibrants = data.filter(c => c.s > 60);
  if (vibrants.length > 2) {
    issues.push(buildIssue(
      "warning", "VISUAL_OVERLOAD",
      "Too many bright colours are fighting for attention",
      "You have " + vibrants.length + " bold, vibrant colours. The rule of thumb "
        + "for professional design is that your most vivid colour should make up about "
        + "10% of any design -- just enough to catch the eye. When everything is vivid, "
        + "nothing stands out.",
      "Your designs will feel chaotic and hard to navigate. Users will not know where "
        + "to look first, and they are more likely to ignore your call to action.",
      {
        label: "Calm the secondary colours",
        fn: (cols) => cols.map((h, i) => {
          if (i === heroIdx) return h;
          const {r,g,b} = hexToRgb(h);
          const hsl = rgbToHsl(r,g,b);
          return hsl.s > 60 ? hslToHex(hsl.h, Math.min(hsl.s, 52), hsl.l) : h;
        })
      }
    ));
  }

  // Corporate grey
  const midZone = data.filter(c => c.l >= 40 && c.l <= 60).length;
  if (midZone / data.length >= 0.7 && data.length >= 3) {
    issues.push(buildIssue(
      "warning", "CORPORATE_GREY",
      "Everything is a similar brightness -- the palette looks flat",
      "A good palette needs some light colours for backgrounds and cards and some dark "
        + "colours for text and depth. Right now all your colours sit in the middle -- "
        + "not light enough to be a background, not dark enough for text. The result is "
        + "a palette that feels lifeless.",
      "Designs made with this palette will look like generic stock templates. Adding "
        + "proper light and dark tones instantly makes everything feel more considered "
        + "and professional.",
      {
        label: "Add light and dark tones",
        fn: (cols) => {
          const next = [...cols];
          if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 6, 95));
          if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 10, 9));
          return next;
        }
      }
    ));
  }

  // Dissonant neutrals
  const neutrals = data.filter(c => c.s < 10);
  if (neutrals.length >= 2) {
    const maxDiff = neutrals.reduce((mx, n1) =>
      Math.max(mx, neutrals.reduce((m, n2) =>
        Math.max(m, Math.min(
          Math.abs(n1.h - n2.h),
          360 - Math.abs(n1.h - n2.h)
        )), 0)
      ), 0);
    if (maxDiff > 90) {
      issues.push(buildIssue(
        "warning", "DISSONANT_NEUTRAL",
        "Your neutral/grey colours do not belong to the same family",
        "Some of your neutral colours feel warm (like cream or warm grey) while others "
          + "feel cool (like blue-grey or silver). Mixing them makes designs feel slightly "
          + "off -- even people who cannot explain why will sense that something does not "
          + "look right.",
        "Your brand will feel inconsistent and unpolished, as though different designers "
          + "made different parts of it. Harmonising your neutrals gives everything a "
          + "unified feel.",
        {
          label: "Harmonise all neutrals",
          fn: (cols) => cols.map(hex => {
            const {r,g,b} = hexToRgb(hex);
            const hsl = rgbToHsl(r,g,b);
            if (hsl.s >= 10) return hex;
            return hslToHex(data[heroIdx].h, Math.min(hsl.s, 8), hsl.l);
          })
        }
      ));
    }
  }

  // Delta E duplicates
  for (let i=0; i<colors.length; i++) {
    for (let j=i+1; j<colors.length; j++) {
      const dE = deltaE(colors[i], colors[j]);
      const ji = j;
      if (dE < 2) {
        issues.push(buildFixedIssue(
          "warning", "DUPLICATE",
          "Colours " + (i+1) + " and " + (j+1) + " are virtually identical",
          "These two colours are so close that the human eye cannot reliably tell them "
            + "apart. One of them is taking up space in your palette without adding "
            + "anything new -- it is invisible duplication.",
          "Having duplicate colours makes your brand system confusing to use and harder "
            + "to maintain consistently across different materials.",
          i, j,
          {
            label: "Remove colour " + (j+1),
            fn: (cols) => cols.filter((_,idx) => idx !== ji)
          }
        ));
      } else if (dE < 5) {
        issues.push(buildFixedIssue(
          "info", "TOO_SIMILAR",
          "Colours " + (i+1) + " and " + (j+1) + " are very similar",
          "These colours are different enough to tell apart side by side, but close "
            + "enough that they could be confused on smaller screens, in print, or by "
            + "people with slightly reduced colour vision.",
          "Using these as separate brand colours may not give you the variety you "
            + "are hoping for.",
          i, j,
          null
        ));
      }
    }
  }

  // Narrow lightness range
  const lVals = data.map(c => c.l);
  if (Math.max(...lVals) - Math.min(...lVals) < 22) {
    issues.push(buildIssue(
      "warning", "NARROW_L",
      "No light or dark tones -- text will be hard to read",
      "For text to be comfortably readable, there needs to be a clear difference in "
        + "brightness between the text and what is behind it. Right now your colours are "
        + "all similar in brightness, which means nothing will be clearly legible when "
        + "combined.",
      "Any design made with this palette will struggle with readability, especially on "
        + "websites and printed materials. Customers will squint, give up, or miss your "
        + "message entirely.",
      {
        label: "Add light and dark tones",
        fn: (cols) => {
          const next = [...cols];
          if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 6, 94));
          if (next.length < 8) next.push(hslToHex(data[heroIdx].h, 10, 9));
          return next;
        }
      }
    ));
  }

  // Too many colours
  if (colors.length > 6) {
    issues.push(buildIssue(
      "info", "TOO_MANY",
      "Your palette has more colours than most brands use",
      "Most successful brand palettes use 3 to 5 colours. More than that makes it "
        + "harder to apply consistently -- different materials end up looking like they "
        + "belong to different brands.",
      "Streamline your palette and your brand will feel more intentional, more "
        + "memorable, and easier to apply across everything from social media to "
        + "business cards.",
      null
    ));
  }

  // Pure black/white
  if (colors.some(h => ["#000000","#ffffff"].includes(h.toLowerCase()))) {
    issues.push(buildIssue(
      "info", "PURE_BW",
      "Pure black or white can cause eye strain",
      "Reading pure black text on a pure white background for extended periods is "
        + "tiring for the eyes -- there is too much contrast. A very dark grey and a "
        + "soft off-white look almost identical but are noticeably more comfortable.",
      "Slightly tinting your neutrals also makes the palette feel warmer and more "
        + "considered -- a detail that separates amateur palettes from professional ones.",
      {
        label: "Soften the extremes",
        fn: (cols) => cols.map(h => {
          if (h.toLowerCase() === "#000000") return "#1a1a2e";
          if (h.toLowerCase() === "#ffffff") return "#f8f6f2";
          return h;
        })
      }
    ));
  }

  // Red + green CVD
  const reds   = data.filter(c => (c.h < 20 || c.h > 340) && c.s > 40);
  const greens = data.filter(c => c.h > 80 && c.h < 160 && c.s > 40);
  if (reds.length && greens.length) {
    const lDiff = Math.abs(reds[0].l - greens[0].l);
    const ri = data.indexOf(reds[0]);
    const gi = data.indexOf(greens[0]);
    if (lDiff < 20) {
      issues.push(buildFixedIssue(
        "warning", "CVD_RG",
        "People with colour blindness cannot tell your red and green apart",
        "About 1 in 12 men have difficulty distinguishing red from green. Your red "
          + "and green are only " + Math.round(lDiff) + "% different in brightness -- "
          + "not enough for someone with colour blindness to tell them apart as "
          + "different shades.",
        "If you use these colours to signal yes/no or available/unavailable, a "
          + "significant portion of your audience will miss it entirely.",
        ri, gi,
        {
          label: "Adjust brightness to help",
          fn: (cols) => {
            const heroL = data[ri].l;
            return cols.map((h, idx) => {
              if (idx !== gi) return h;
              const {r,g,b} = hexToRgb(h);
              const hsl = rgbToHsl(r,g,b);
              const newL = heroL > 50
                ? Math.max(hsl.l - 25, 15)
                : Math.min(hsl.l + 25, 85);
              return hslToHex(hsl.h, hsl.s, newL);
            });
          }
        }
      ));
    } else {
      issues.push(buildFixedIssue(
        "info", "CVD_RG_OK",
        "Red and green present -- partially accessible",
        "Your red and green are " + Math.round(lDiff) + "% different in brightness, "
          + "which helps. But always remember: never use colour as the only way to "
          + "convey meaning. Add an icon, label, or pattern alongside the colour.",
        "This is good practice for inclusive design -- your brand communicates clearly "
          + "to everyone.",
        ri, gi,
        null
      ));
    }
  }

  // No accessible pair
  const hasPair = colors.some((h1,i) =>
    colors.slice(i+1).some(h2 => contrastRatio(h1,h2) >= 4.5)
  );
  if (!hasPair && colors.length >= 2) {
    issues.push(buildIssue(
      "warning", "NO_ACCESS",
      "No colour combination is readable as body text",
      "For text to be comfortable to read on a screen and meet web accessibility "
        + "standards, the text must contrast sufficiently against its background. "
        + "Right now, no combination of your colours meets this minimum standard.",
      "A website built with this palette will likely fail accessibility requirements. "
        + "Beyond legal risk, it simply means some customers genuinely cannot read "
        + "your content.",
      {
        label: "Add a readable dark colour",
        fn: (cols) => {
          const dark = hslToHex(data[heroIdx].h, data[heroIdx].s * 0.25, 8);
          return cols.length < 8 ? [...cols, dark] : cols;
        }
      }
    ));
  }

  return issues;
}

function healthScore(issues) {
  let score = 100;
  for (const i of issues) {
    if (i.type === "critical") score -= 20;
    else if (i.type === "warning") score -= 12;
    else if (i.type === "info") score -= 3;
  }
  return Math.max(0, score);
}

// Suggestions ───────────────────────────────────────────────
function makeSuggestions(colors) {
  if (!colors.length) return [];
  const data = colors.map(hex => {
    const {r,g,b} = hexToRgb(hex);
    return { ...rgbToHsl(r,g,b), hex };
  });
  const hi = data.reduce((m,c,i) => c.s > data[m].s ? i : m, 0);
  const hh = data[hi];
  return [
    {
      hex: hslToHex(hh.h, Math.min(hh.s * 0.08, 6), 96),
      label: "Light Neutral",
      badge: "Background",
      reason: "A calm off-white background tinted toward your brand colour. Use for page backgrounds and large sections."
    },
    {
      hex: hslToHex(hh.h, Math.min(hh.s * 0.15, 9), 11),
      label: "Dark Neutral",
      badge: "Text colour",
      reason: "A deep, tinted near-black for body text. Softer than pure black but just as readable."
    },
    {
      hex: hslToHex((hh.h + 180) % 360, Math.min(hh.s * 0.8, 72), Math.max(hh.l * 0.85, 38)),
      label: "Complement",
      badge: "CTA / Button",
      reason: "The opposite colour on the wheel -- creates maximum contrast. Great for buttons and calls-to-action."
    },
    {
      hex: hslToHex((hh.h + 30) % 360, hh.s * 0.8, hh.l),
      label: "Analogous",
      badge: "Supporting",
      reason: "A close neighbour on the colour wheel -- harmonious and easy to live with alongside your main colour."
    },
    {
      hex: hslToHex((hh.h + 150) % 360, hh.s * 0.65, Math.min(hh.l + 8, 80)),
      label: "Split Complement",
      badge: "Accent",
      reason: "A lively, distinct colour that still feels connected to your palette."
    },
    {
      hex: hslToHex(hh.h, hh.s * 0.45, Math.min(hh.l + 28, 90)),
      label: "Soft Tint",
      badge: "Hover / Card",
      reason: "A lighter, quieter version of your main colour -- useful for card backgrounds and hover states."
    },
  ];
}

// Constants ─────────────────────────────────────────────────
// ── Auto role assignment ─────────────────────────────────────
// Scores each colour for each role and picks the best non-conflicting assignment
function autoAssignRoles(colors) {
  if (colors.length < 2) return { roles: {}, reasons: {} };

  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    const hsl = rgbToHsl(r, g, b);
    const lum = luminance(r, g, b);
    return { hex, ...hsl, lum };
  });

  const assigned = {}; // hex -> role
  const reasons  = {}; // hex -> plain English reason
  const usedRoles = new Set();

  // Score functions — each returns 0-100, higher = better fit for that role
  const scoreBackground = c =>
    (c.l > 80 ? 40 : c.l > 65 ? 20 : 0) +
    (c.s < 15 ? 30 : c.s < 30 ? 15 : 0) +
    (c.lum > 0.4 ? 20 : 0);

  const scoreText = c =>
    (c.l < 25 ? 40 : c.l < 40 ? 20 : 0) +
    (c.lum < 0.15 ? 30 : c.lum < 0.3 ? 15 : 0) +
    (c.s < 30 ? 20 : 0);

  const scoreHero = c =>
    (c.s > 50 ? 35 : c.s > 30 ? 18 : 0) +
    (c.l > 25 && c.l < 75 ? 30 : 0) +
    (c.s > 70 ? 15 : 0);

  const scoreAccent = c =>
    (c.s > 55 ? 30 : c.s > 35 ? 15 : 0) +
    (c.l > 30 && c.l < 80 ? 25 : 0) +
    (c.lum > 0.05 && c.lum < 0.55 ? 20 : 0);

  const scoreNeutral = c =>
    (c.s >= 8  && c.s < 40 ? 35 : 0) +
    (c.l >= 20 && c.l < 80 ? 25 : 0) +
    (c.s < 55 ? 20 : 0);

  const scoreFns = {
    Background: scoreBackground,
    Text:       scoreText,
    Hero:       scoreHero,
    Accent:     scoreAccent,
    Neutral:    scoreNeutral,
  };

  // Priority order — most distinctive roles first
  const roleOrder = ["Background", "Text", "Hero", "Accent", "Neutral"];

  for (const role of roleOrder) {
    if (colors.length <= Object.keys(assigned).length) break;
    const candidates = data
      .filter(c => !assigned[c.hex])
      .map(c => ({ ...c, score: scoreFns[role](c) }))
      .sort((a, b) => b.score - a.score);

    if (!candidates.length || candidates[0].score < 5) continue;

    // Extra guard: Background and Text must contrast well with each other
    if (role === "Text") {
      const bgHex = Object.keys(assigned).find(k => assigned[k] === "Background");
      if (bgHex) {
        const contrasting = candidates.find(c => contrastRatio(c.hex, bgHex) >= 4.5);
        if (contrasting) {
          assigned[contrasting.hex] = role;
          const cr = contrastRatio(contrasting.hex, bgHex).toFixed(1);
          reasons[contrasting.hex] = `Darkest colour — ${cr}:1 contrast against your background, which meets the AA readability standard for body text.`;
          usedRoles.add(role);
          continue;
        }
      }
    }

    // Hero and Accent should ideally use different hues
    if (role === "Accent") {
      const heroHex = Object.keys(assigned).find(k => assigned[k] === "Hero");
      if (heroHex) {
        const heroHsl = data.find(c => c.hex === heroHex);
        const distinct = candidates.find(c => {
          const hDiff = Math.min(Math.abs(c.h - heroHsl.h), 360 - Math.abs(c.h - heroHsl.h));
          return hDiff > 30;
        });
        if (distinct) {
          assigned[distinct.hex] = role;
          reasons[distinct.hex] = `Vivid and distinct from your hero colour — good for buttons and calls-to-action where you need something to stand out.`;
          usedRoles.add(role);
          continue;
        }
      }
    }

    const winner = candidates[0];
    assigned[winner.hex] = role;
    usedRoles.add(role);

    // Generate a plain-English reason for each role
    if (role === "Background") {
      reasons[winner.hex] = `Lightest colour in your palette (L=${Math.round(winner.l)}%) — ideal as a calm base for page backgrounds and large surface areas.`;
    } else if (role === "Hero") {
      reasons[winner.hex] = `Most vibrant colour (S=${Math.round(winner.s)}%) — this is your signature brand colour. It should appear on your logo and in key brand moments.`;
    } else if (role === "Neutral") {
      reasons[winner.hex] = `Mid-tone, low saturation — a quiet supporting colour for borders, dividers, and secondary text. Keeps things from looking too flat or too loud.`;
    } else if (role === "Text") {
      reasons[winner.hex] = `Darkest colour — works as body text when placed on lighter backgrounds. Aim to keep it at 4.5:1 contrast or above for comfortable reading.`;
    }
  }

  return { roles: assigned, reasons };
}

const ROLES = ["Hero","Accent","Neutral","Background","Text"];
const ROLE_COL = {
  Hero: "#b8703a", Accent: "#2a7a7a",
  Neutral: "#777", Background: "#8a7a6a", Text: "#3a3a5a"
};
const ROLE_DESC = {
  Hero:       "Your main brand colour -- used in the logo and key moments",
  Accent:     "Used sparingly (10%) for buttons and calls-to-action",
  Neutral:    "Borders, dividers, secondary text",
  Background: "Light base for large surface areas and page backgrounds",
  Text:       "Dark, readable -- must contrast well against Background"
};
const DEFAULTS = ["#2D4A6B","#E8734A","#F5E6C8","#1A1A2E"];
const TABS = [
  { key: "issues",      label: "Issues & Fixes" },
  { key: "readability", label: "Readability" },
  { key: "addcolours",  label: "Add Colours" },
  { key: "colourblind", label: "Colour Blindness" },
  { key: "roles",       label: "Colour Jobs" },
  { key: "templates",   label: "Brand Templates" },
  { key: "typography",  label: "Typography" },
  { key: "scales",     label: "Colour Scales" },
  { key: "tokens",     label: "Export Tokens" },
  { key: "guide",      label: "Brand Guide" },
  { key: "competitor", label: "Competitor Analysis" },
  { key: "editor",     label: "Edit Mockups" },
];
const CVD_TYPES = [
  { key: "protanopia",   label: "Red-blind",   note: "Protanopia -- ~1% of men" },
  { key: "deuteranopia", label: "Green-blind",  note: "Deuteranopia -- ~1% of men" },
  { key: "tritanopia",   label: "Blue-blind",   note: "Tritanopia -- rare" },
];

// Typography Pairing Engine ─────────────────────────────────
const FONT_PAIRS = [
  {
    name: "Editorial",
    heading: "'Playfair Display', serif",
    body: "'Source Sans 3', sans-serif",
    mood: "Classic editorial elegance — refined, authoritative, and timeless",
    vibes: ["warm", "neutral"],
    satRange: [15, 70],
  },
  {
    name: "Geometric Modern",
    heading: "'DM Sans', sans-serif",
    body: "'IBM Plex Sans', sans-serif",
    mood: "Clean tech-forward minimalism — precise, trustworthy, and modern",
    vibes: ["cool", "neutral"],
    satRange: [10, 55],
  },
  {
    name: "Humanist Warmth",
    heading: "'Nunito', sans-serif",
    body: "'Lora', serif",
    mood: "Friendly and approachable — warm, inviting, and personal",
    vibes: ["warm", "neutral"],
    satRange: [20, 65],
  },
  {
    name: "Bold Statement",
    heading: "'Space Grotesk', sans-serif",
    body: "'JetBrains Mono', monospace",
    mood: "Technical confidence — bold, structured, and unapologetic",
    vibes: ["cool", "neutral"],
    satRange: [30, 90],
  },
  {
    name: "Organic & Natural",
    heading: "'Fraunces', serif",
    body: "'Outfit', sans-serif",
    mood: "Earthy and artisanal — organic, grounded, and authentic",
    vibes: ["warm"],
    satRange: [10, 50],
  },
  {
    name: "Quiet Luxury",
    heading: "'Cormorant Garamond', serif",
    body: "'Karla', sans-serif",
    mood: "Understated sophistication — luxurious, calm, and considered",
    vibes: ["neutral", "cool"],
    satRange: [5, 40],
  },
];

function scoreFontPair(pair, colors) {
  if (!colors.length) return 50;
  const data = colors.map(hex => {
    const { r, g, b } = hexToRgb(hex);
    return rgbToHsl(r, g, b);
  });
  // Dominant hue = most saturated colour
  const dominant = data.reduce((best, c) => c.s > best.s ? c : best, data[0]);
  const avgSat = data.reduce((sum, c) => sum + c.s, 0) / data.length;
  // Temperature classification
  const hue = dominant.h;
  const isWarm = (hue >= 330 || hue < 90);
  const isCool = (hue >= 150 && hue < 330);
  const tempLabel = dominant.s < 10 ? "neutral" : isWarm ? "warm" : isCool ? "cool" : "neutral";
  // Vibe match score (0-40)
  let vibeScore = 0;
  if (pair.vibes.includes(tempLabel)) vibeScore = 40;
  else if (pair.vibes.includes("neutral") || tempLabel === "neutral") vibeScore = 25;
  else vibeScore = 8;
  // Saturation range match (0-40)
  let satScore = 0;
  if (avgSat >= pair.satRange[0] && avgSat <= pair.satRange[1]) {
    satScore = 40;
  } else {
    const dist = avgSat < pair.satRange[0]
      ? pair.satRange[0] - avgSat
      : avgSat - pair.satRange[1];
    satScore = Math.max(0, 40 - dist * 1.2);
  }
  // Base aesthetic bonus (0-20) — slight variety
  const baseBonus = 15 + Math.round(Math.sin(hue * 0.0174 + pair.satRange[0]) * 5);
  return Math.round(Math.min(100, vibeScore + satScore + baseBonus));
}

// Sub-components ────────────────────────────────────────────
function ScoreRing({ score }) {
  const r = 36, circ = 2 * Math.PI * r;
  const col = score >= 80 ? "#3a8a3a" : score >= 60 ? "#b8703a" : "#c03030";
  const msg = score >= 90
    ? "Looking great!"
    : score >= 75 ? "A couple of things to fix"
    : score >= 55 ? "Some work needed"
    : "Needs attention";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:16 }}>
      <svg width={90} height={90} style={{ flexShrink:0 }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="#f0ece8" strokeWidth={7}/>
        <circle cx={45} cy={45} r={r} fill="none" stroke={col} strokeWidth={7}
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - score/100)}
          strokeLinecap="round"
          transform="rotate(-90 45 45)"
          style={{ transition:"stroke-dashoffset .6s ease" }}
        />
        <text x={45} y={49} textAnchor="middle" fontSize={20} fontWeight={600}
          fill={col} fontFamily="'DM Mono',monospace">{score}</text>
        <text x={45} y={62} textAnchor="middle" fontSize={8}
          fill="#bbb" fontFamily="'DM Mono',monospace">/100</text>
      </svg>
      <div>
        <div style={{
          fontSize:15, fontWeight:500, color:col,
          fontFamily:"'Playfair Display',serif", marginBottom:4
        }}>{msg}</div>
        <div style={{ fontSize:10, color:"#999", lineHeight:1.6 }}>
          {score === 100
            ? "Your palette passes all checks."
            : "Fix the items below to improve your score."
          }
        </div>
      </div>
    </div>
  );
}

function IssueCard({ issue, onFix, fixApplied }) {
  const [open, setOpen] = useState(false);
  const col = issue.type === "critical" ? "#c00020"
    : issue.type === "warning" ? "#b06010"
    : "#2a6a8a";
  const bg = issue.type === "critical" ? "#fff5f5"
    : issue.type === "warning" ? "#fffcf4"
    : "#f5f9fc";
  const badge = issue.type === "critical" ? "Critical"
    : issue.type === "warning" ? "Fix this"
    : "Note";
  return (
    <div style={{
      border: `1px solid ${col}30`,
      borderLeft: `4px solid ${col}`,
      borderRadius: "0 6px 6px 0",
      background: bg,
      marginBottom: 10,
      overflow: "hidden"
    }}>
      <div style={{ padding:"14px 16px" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:10, flexWrap:"wrap" }}>
          <div style={{
            fontSize:8, letterSpacing:".12em", textTransform:"uppercase",
            color: col, marginTop:3, flexShrink:0,
            background: `${col}15`, borderRadius:10, padding:"2px 8px"
          }}>{badge}</div>
          <div style={{ flex:1, minWidth:200 }}>
            <div style={{
              fontSize:13, fontWeight:500, color:"#1a1510",
              marginBottom:6, lineHeight:1.4,
              fontFamily:"'Playfair Display',serif"
            }}>{issue.title}</div>
            <div style={{ fontSize:10, color:"#777", lineHeight:1.7 }}>{issue.plain}</div>
          </div>
          <div style={{
            display:"flex", flexDirection:"column", gap:6,
            alignItems:"flex-end", flexShrink:0
          }}>
            {issue.fix && (
              <button
                onClick={() => onFix(issue)}
                disabled={fixApplied}
                style={{
                  background: fixApplied ? "#e8f5e8" : col,
                  color: "#fff",
                  border: "none",
                  cursor: fixApplied ? "default" : "pointer",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: 9,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                  padding: "8px 14px",
                  borderRadius: 4,
                  whiteSpace: "nowrap",
                  transition: "background .2s",
                  opacity: fixApplied ? 0.7 : 1
                }}
              >
                {fixApplied ? "Fixed" : "Fix it"}
              </button>
            )}
            {!issue.fix && issue.type !== "success" && (
              <span style={{ fontSize:9, color:"#bbb", letterSpacing:".06em", fontStyle:"italic" }}>
                Manual fix needed
              </span>
            )}
            <button
              onClick={() => setOpen(o => !o)}
              style={{
                background:"none", border:"none", cursor:"pointer",
                fontSize:9, color:"#bbb", letterSpacing:".08em",
                textDecoration:"underline"
              }}
            >
              {open ? "Less detail" : "What does this mean for my brand?"}
            </button>
          </div>
        </div>
        {open && (
          <div style={{
            marginTop:12, paddingTop:12,
            borderTop: `1px solid ${col}20`
          }}>
            <div style={{
              fontSize:9, letterSpacing:".12em", textTransform:"uppercase",
              color: col, marginBottom:5
            }}>Impact on your brand</div>
            <div style={{ fontSize:10, color:"#777", lineHeight:1.75 }}>{issue.brand}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ImageExtractor({ onAddColors, diagnoseColors, onNavigate }) {
  const [dragging, setDragging] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extracted, setExtracted] = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [error, setError] = useState(null);
  const fileRef = useRef();

  // Run a quick diagnosis on the extracted colours so we can preview issues
  const previewIssues = extracted.length >= 2 ? diagnoseColors([...selected]) : [];
  const previewWarnCount = previewIssues.filter(i => i.type === "warning" || i.type === "critical").length;

  const processFile = useCallback(async (file) => {
    if (!file || !file.type.startsWith("image/")) {
      setError("Please upload an image file -- PNG, JPG, WebP, SVG or GIF");
      return;
    }
    setError(null); setExtracting(true); setExtracted([]); setSelected(new Set());
    const url = URL.createObjectURL(file);
    setPreview(url);
    try {
      const cols = await extractColorsFromImage(file, 10);
      if (cols.length === 0) {
        setError("No distinct colours found. Try a logo or photo with more colour variety.");
      } else {
        setExtracted(cols);
        setSelected(new Set(cols));
      }
    } catch(e) {
      setError("Could not read the image. Try saving it as a PNG or JPG first.");
    } finally {
      setExtracting(false);
    }
  }, []);

  const handleDrop = useCallback(e => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }, [processFile]);

  const reset = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null); setExtracted([]); setSelected(new Set()); setError(null);
  };

  return (
    <div style={{
      background:"#fff", border:"1px solid #e4ddd4",
      borderRadius:8, padding:"18px 20px", marginBottom:14
    }}>
      <div style={{
        display:"flex", alignItems:"center", justifyContent:"space-between",
        marginBottom:10, flexWrap:"wrap", gap:8
      }}>
        <div>
          <div style={{
            fontSize:12, fontWeight:500, color:"#444",
            fontFamily:"'Playfair Display',serif", marginBottom:2
          }}>Step 1 -- Upload your logo or brand image</div>
          <div style={{ fontSize:10, color:"#bbb" }}>
            We will automatically pull the main colours out for you
          </div>
        </div>
        {(preview || extracted.length > 0) && (
          <button onClick={reset} style={{
            background:"none", border:"1px solid #ddd", color:"#aaa",
            cursor:"pointer", fontSize:9, letterSpacing:".08em", padding:"5px 10px",
            borderRadius:3
          }}>Start over x</button>
        )}
      </div>

      {!preview && !extracting && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          style={{
            border: `2px dashed ${dragging ? "#b8703a" : "#e0d8cc"}`,
            borderRadius:6, padding:"24px", textAlign:"center",
            cursor:"pointer", background: dragging ? "#fff8f0" : "#faf8f5",
            transition:"all .18s"
          }}
        >
          <div style={{ fontSize:22, marginBottom:6, opacity:.4 }}>^</div>
          <div style={{ fontSize:11, color: dragging ? "#b8703a" : "#aaa", marginBottom:3 }}>
            {dragging ? "Drop it here!" : "Drag your logo here, or click to browse"}
          </div>
          <div style={{ fontSize:9, color:"#ccc" }}>
            Works with PNG, JPG, WebP, SVG, GIF
          </div>
          <input
            ref={fileRef} type="file" accept="image/*"
            style={{ display:"none" }}
            onChange={e => { const f = e.target.files?.[0]; if (f) processFile(f); e.target.value=""; }}
          />
        </div>
      )}

      {extracting && (
        <div style={{ textAlign:"center", padding:"24px 0" }}>
          <style>{`@keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}`}</style>
          <div style={{
            fontSize:10, color:"#b8703a", letterSpacing:".15em",
            textTransform:"uppercase", animation:"pulse 1.2s infinite", marginBottom:6
          }}>Scanning colours...</div>
          <div style={{ fontSize:9, color:"#ccc" }}>
            Sampling pixels and running colour clustering
          </div>
        </div>
      )}

      {error && (
        <div style={{
          fontSize:10, color:"#c04040", padding:"10px 14px",
          background:"#fff0f0", borderRadius:4, marginTop:8, lineHeight:1.6
        }}>{error}</div>
      )}

      {extracted.length > 0 && (
        <div style={{ display:"flex", gap:14, alignItems:"flex-start", flexWrap:"wrap" }}>
          {preview && (
            <img src={preview} alt="Uploaded" style={{
              width:76, height:76, objectFit:"contain", borderRadius:4,
              border:"1px solid #e4ddd4", flexShrink:0,
              background:"repeating-conic-gradient(#f0ece8 0% 25%,#fff 0% 50%) 0 0/10px 10px"
            }}/>
          )}
          <div style={{ flex:1 }}>
            <div style={{
              fontSize:9, color:"#bbb", letterSpacing:".12em",
              textTransform:"uppercase", marginBottom:10
            }}>
              {extracted.length} colours found — click to select which ones to add
            </div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
              {extracted.map((hex, i) => {
                const sel = selected.has(hex);
                return (
                  <div
                    key={i}
                    onClick={() => setSelected(p => {
                      const n = new Set(p);
                      n.has(hex) ? n.delete(hex) : n.add(hex);
                      return n;
                    })}
                    style={{
                      display:"flex", flexDirection:"column",
                      alignItems:"center", gap:3, cursor:"pointer",
                      opacity: sel ? 1 : 0.35,
                      transition:"all .15s",
                      transform: sel ? "translateY(-2px)" : "none"
                    }}
                  >
                    <div style={{
                      width:50, height:50, borderRadius:5, background:hex,
                      border: sel ? "2px solid #b8703a" : "2px solid transparent",
                      boxShadow: sel ? "0 4px 14px rgba(0,0,0,.2)" : "0 1px 4px rgba(0,0,0,.1)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      transition:"all .15s"
                    }}>
                      {sel && (
                        <span style={{ fontSize:14, color:textOn(hex), fontWeight:"bold" }}>✓</span>
                      )}
                    </div>
                    <div style={{ fontSize:7, color:"#999" }}>{hex.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>

            {/* ── Inline issue preview ── */}
            {selected.size >= 2 && (
              <div style={{
                marginBottom:14, padding:"12px 14px",
                background: previewWarnCount > 0 ? "#fffcf4" : "#f2faf2",
                border: `1px solid ${previewWarnCount > 0 ? "#f0c060" : "#90c090"}`,
                borderRadius:5
              }}>
                <div style={{
                  fontSize:10, fontWeight:500,
                  color: previewWarnCount > 0 ? "#8a5000" : "#2a6a2a",
                  marginBottom: previewWarnCount > 0 ? 8 : 0,
                  display:"flex", alignItems:"center", gap:6
                }}>
                  {previewWarnCount > 0
                    ? `⚠ We spotted ${previewWarnCount} issue${previewWarnCount !== 1 ? "s" : ""} with these colours — add them and we'll show you how to fix each one`
                    : "✓ These colours look pretty good — no major issues spotted"
                  }
                </div>
                {previewWarnCount > 0 && (
                  <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
                    {previewIssues
                      .filter(i => i.type === "warning" || i.type === "critical")
                      .slice(0, 3)
                      .map((issue, i) => (
                        <div key={i} style={{
                          fontSize:9, color:"#8a5000",
                          display:"flex", alignItems:"flex-start", gap:6
                        }}>
                          <span style={{ flexShrink:0, marginTop:1 }}>
                            {issue.type === "critical" ? "🔴" : "⚠️"}
                          </span>
                          <span style={{ lineHeight:1.5 }}>{issue.title}</span>
                        </div>
                      ))
                    }
                    {previewWarnCount > 3 && (
                      <div style={{ fontSize:9, color:"#bbb", fontStyle:"italic" }}>
                        + {previewWarnCount - 3} more issue{previewWarnCount - 3 !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
              <button
                onClick={() => {
                  onAddColors([...selected], true);
                  onNavigate("issues");
                }}
                disabled={selected.size === 0}
                style={{
                  background: selected.size > 0 ? "#b8703a" : "#ddd",
                  color: "#fff", border:"none",
                  cursor: selected.size > 0 ? "pointer" : "not-allowed",
                  fontFamily:"'DM Mono',monospace", fontSize:10,
                  letterSpacing:".1em", padding:"8px 18px", borderRadius:3
                }}
              >
                {previewWarnCount > 0
                  ? `Add colours & see fixes →`
                  : `Add ${selected.size} colour${selected.size !== 1 ? "s" : ""} to palette →`
                }
              </button>
              <button
                onClick={() => setSelected(new Set(extracted))}
                style={{
                  background:"none", border:"1px solid #ddd", color:"#aaa",
                  cursor:"pointer", fontFamily:"'DM Mono',monospace",
                  fontSize:9, padding:"7px 12px", borderRadius:3
                }}
              >Select all</button>
              <button
                onClick={() => setSelected(new Set())}
                style={{
                  background:"none", border:"1px solid #ddd", color:"#aaa",
                  cursor:"pointer", fontFamily:"'DM Mono',monospace",
                  fontSize:9, padding:"7px 12px", borderRadius:3
                }}
              >None</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main App ──────────────────────────────────────────────────
export default function PaletteFixer() {
  const [colors, setColors]   = useState(DEFAULTS);
  const [roles, setRoles]     = useState({});
  const [autoReasons, setAutoReasons] = useState({});
  const [tab, setTab]         = useState("issues");
  const [picker, setPicker]   = useState("#888888");
  const [cvdType, setCvdType] = useState("protanopia");
  const [fixedCodes, setFixedCodes] = useState(new Set());
  const [fromImage, setFromImage] = useState(false);
  const [locked, setLocked]         = useState(new Set());
  const [generating, setGenerating] = useState(false);
  const [selectedFont, setSelectedFont] = useState(null);

  // New state for feature tabs
  const [companyName, setCompanyName] = useState("YourBrand");
  const [tagline, setTagline] = useState("Build Something Beautiful");
  const [personName, setPersonName] = useState("Jane Doe");
  const [personTitle, setPersonTitle] = useState("Creative Director");
  const [email, setEmail] = useState("hello@yourbrand.com");
  const [phone, setPhone] = useState("+1 (555) 123-4567");
  const [competitorColors, setCompetitorColors] = useState([]);
  const [competitorImage, setCompetitorImage] = useState(null);
  const [tokenFormat, setTokenFormat] = useState("css");
  const [copyConfirm, setCopyConfirm] = useState("");
  const [compDragging, setCompDragging] = useState(false);
  const [compExtracting, setCompExtracting] = useState(false);
  const compFileRef = useRef();

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyConfirm(key);
      setTimeout(() => setCopyConfirm(""), 2000);
    }).catch(() => {
      setCopyConfirm(key + "-fail");
      setTimeout(() => setCopyConfirm(""), 2000);
    });
  };

  const issues   = useMemo(() => diagnose(colors), [colors]);
  const score    = useMemo(() => healthScore(issues), [issues]);
  const suggs    = useMemo(() => makeSuggestions(colors), [colors]);
  const warnCount = issues.filter(i => i.type === "warning" || i.type === "critical").length;

  const addColor  = hex => { if (colors.length < 8 && !colors.includes(hex)) setColors(c => [...c, hex]); };
  const addColors = (list, isFromImage = false) => {
    setColors(prev => {
      let n = [...prev];
      for (const h of list) if (n.length < 8 && !n.includes(h)) n.push(h);
      return n;
    });
    if (isFromImage) { setFromImage(true); setFixedCodes(new Set()); setLocked(new Set()); }
  };
  const removeColor = i => {
    setColors(c => c.filter((_,idx) => idx !== i));
    setLocked(prev => {
      const n = new Set();
      for (const li of prev) {
        if (li < i) n.add(li);
        else if (li > i) n.add(li - 1);
      }
      return n;
    });
  };
  const updateColor  = (i,hex) => setColors(c => { const n=[...c]; n[i]=hex; return n; });
  const setRole = (hex, role) => setRoles(prev => {
    const n = {...prev};
    Object.keys(n).forEach(k => { if (n[k] === role) delete n[k]; });
    if (n[hex] === role) delete n[hex]; else n[hex] = role;
    return n;
  });

  const applyFix = (issue) => {
    if (!issue.fix) return;
    const newColors = issue.fix.fn(colors);
    setColors(newColors);
    const key = issue.code + (issue.i ?? "") + (issue.j ?? "");
    setFixedCodes(p => new Set([...p, key]));
  };

  const chooseForMe = () => {
    const { roles: suggested, reasons } = autoAssignRoles(colors);
    setRoles(suggested);
    setAutoReasons(reasons);
  };

  const clearRoles = () => {
    setRoles({});
    setAutoReasons({});
  };

  const toggleLock = i => setLocked(prev => {
    const n = new Set(prev);
    n.has(i) ? n.delete(i) : n.add(i);
    return n;
  });

  const generatePalette = useCallback(() => {
    const lockedHexes = [...locked].map(i => colors[i]).filter(Boolean);
    if (locked.size >= colors.length) return;
    // Derive anchor hue from most-saturated locked colour, or pick a random hue
    let anchorHue;
    if (lockedHexes.length > 0) {
      const best = lockedHexes.reduce((acc, hex) => {
        const {r:cr,g:cg,b:cb} = hexToRgb(hex);
        const {s} = rgbToHsl(cr,cg,cb);
        const {r:ar,g:ag,b:ab} = hexToRgb(acc);
        const {s:as} = rgbToHsl(ar,ag,ab);
        return s > as ? hex : acc;
      }, lockedHexes[0]);
      const {r:br,g:bg,b:bb} = hexToRgb(best);
      anchorHue = rgbToHsl(br,bg,bb).h;
    } else {
      anchorHue = Math.random() * 360;
    }
    const hueOffsets = [0, 30, 60, 120, 150, 180, 210, 240, 270, 300];
    const presets = [
      [72, 52],  // vivid mid-tone
      [12, 90],  // light neutral
      [18, 14],  // deep dark
      [38, 68],  // soft mid
      [88, 48],  // bold accent
      [28, 58],  // muted supporting
      [6,  95],  // near-white
      [22, 22],  // deep shade
    ];
    const neededCount = colors.length - locked.size;
    const accepted = [];
    let attempts = 0;
    while (accepted.length < neededCount && attempts < 600) {
      attempts++;
      const hOffset = hueOffsets[Math.floor(Math.random() * hueOffsets.length)];
      const h = (anchorHue + hOffset) % 360;
      const [s, l] = presets[Math.floor(Math.random() * presets.length)];
      const jH = (h + (Math.random() - 0.5) * 20 + 360) % 360;
      const jS = Math.max(3, Math.min(97, s + (Math.random() - 0.5) * 12));
      const jL = Math.max(5, Math.min(95, l + (Math.random() - 0.5) * 12));
      const candidate = hslToHex(jH, jS, jL);
      const allExisting = [...lockedHexes, ...accepted];
      if (!allExisting.some(ex => deltaE(ex, candidate) < 14)) accepted.push(candidate);
    }
    const newColors = colors.map((hex, i) => locked.has(i) ? hex : null);
    let ai = 0;
    for (let i = 0; i < newColors.length; i++) {
      if (newColors[i] === null) newColors[i] = accepted[ai++] || colors[i];
    }
    setColors(newColors);
    setFixedCodes(new Set());
    setGenerating(true);
    setTimeout(() => setGenerating(false), 380);
  }, [locked, colors]);

  useEffect(() => {
    const onKey = e => {
      const tag = document.activeElement?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.code === "Space") { e.preventDefault(); generatePalette(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [generatePalette]);

  return (
    <div style={{
      fontFamily:"'DM Mono','Courier New',monospace",
      background:"#f5f2ed", minHeight:"100vh", color:"#2a2420"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,400;0,600;1,400&family=Source+Sans+3:wght@300;400;600;700&family=DM+Sans:wght@400;500;700&family=IBM+Plex+Sans:wght@300;400;500;600&family=Nunito:wght@400;600;700&family=Lora:ital,wght@0,400;0,600;1,400&family=Space+Grotesk:wght@400;500;700&family=JetBrains+Mono:wght@400;500;700&family=Fraunces:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;600;700&family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=Karla:wght@400;500;700&display=swap');
        * { box-sizing:border-box; margin:0; padding:0; }
        .sw { transition:transform .18s, box-shadow .18s; }
        .sw:hover { transform:translateY(-4px); box-shadow:0 12px 28px rgba(0,0,0,.18); }
        .tb { background:none; border:none; border-bottom:2px solid transparent;
              cursor:pointer; font-family:'DM Mono',monospace; font-size:10px;
              letter-spacing:.1em; text-transform:uppercase; padding:10px 16px;
              transition:all .18s; color:#aaa; white-space:nowrap; }
        .tb.on { border-bottom-color:#b8703a; color:#b8703a; }
        .tb:not(.on):hover { color:#555; }
        .addbtn { background:none; border:1px solid #ccc; color:#999; cursor:pointer;
                  font-family:'DM Mono',monospace; font-size:10px; padding:7px 14px;
                  transition:all .18s; border-radius:2px; }
        .addbtn:hover { border-color:#b8703a; color:#b8703a; }
        .rm { background:rgba(0,0,0,.1); border:none; color:rgba(0,0,0,.4);
              cursor:pointer; width:20px; height:20px; border-radius:50%;
              font-size:13px; display:flex; align-items:center;
              justify-content:center; transition:all .15s;
              position:absolute; top:4px; right:4px; }
        .rm:hover { background:rgba(0,0,0,.4); color:#fff; }
        .hx { background:#fff; border:1px solid #ddd; color:#555;
              font-family:'DM Mono',monospace; font-size:10px; padding:4px 7px;
              width:82px; letter-spacing:.04em; outline:none;
              transition:border-color .18s; border-radius:2px; }
        .hx:focus { border-color:#b8703a; }
        .card { background:#fff; border:1px solid #e4ddd4;
                border-radius:6px; padding:16px 20px; margin-bottom:12px; }
        .sg { border:1px solid #ddd; padding:12px; cursor:pointer;
              transition:all .2s; background:#fff; border-radius:5px; }
        .sg:hover { border-color:#b8703a; box-shadow:0 4px 14px rgba(0,0,0,.09);
                    transform:translateY(-2px); }
        .sg.added { opacity:.35; cursor:default; pointer-events:none; }
        .rp { font-family:'DM Mono',monospace; font-size:9px; letter-spacing:.1em;
              text-transform:uppercase; padding:4px 10px; border-radius:20px;
              border:1px solid; cursor:pointer; transition:all .15s; background:none; }
        input[type="color"] { -webkit-appearance:none; border:none;
                               padding:0; cursor:pointer; border-radius:4px; }
        input[type="color"]::-webkit-color-swatch-wrapper { padding:0; }
        input[type="color"]::-webkit-color-swatch { border:none; border-radius:4px; }
        .lbl { font-size:9px; letter-spacing:.16em; color:#bbb;
               text-transform:uppercase; margin-bottom:10px; }
        .lkbtn { position:absolute; bottom:4px; left:4px; width:22px; height:22px;
                 border:none; border-radius:50%; cursor:pointer; font-size:11px;
                 display:flex; align-items:center; justify-content:center;
                 transition:all .15s; }
        .lkbtn.locked { background:rgba(0,0,0,.55); color:#fff; opacity:1; }
        .lkbtn.unlocked { background:rgba(255,255,255,.55); color:rgba(0,0,0,.5);
                          opacity:0; }
        .sw:hover .lkbtn.unlocked { opacity:1; }
        .genbtn { background:#1b4332; color:#95d5b2; border:none; cursor:pointer;
                  font-family:'DM Mono',monospace; font-size:10px; letter-spacing:.1em;
                  padding:8px 14px; border-radius:4px; display:flex;
                  align-items:center; gap:6px; transition:background .18s; }
        .genbtn:hover { background:#143326; }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        .genbtn.spinning svg { animation:spin .38s ease; }
      `}</style>

      {/* Header */}
      <div style={{
        borderBottom:"1px solid #e4ddd4", padding:"16px 28px",
        background:"#fff"
      }}>
        <div style={{
          maxWidth:960, margin:"0 auto",
          display:"flex", alignItems:"center",
          justifyContent:"space-between", flexWrap:"wrap", gap:12
        }}>
          <div>
            <h1 style={{
              fontFamily:"'Playfair Display',serif",
              fontSize:24, fontWeight:400, color:"#1a1510"
            }}>Palette Studio</h1>
            <p style={{ fontSize:9, color:"#ccc", letterSpacing:".1em", marginTop:2 }}>
              Diagnose – fix – assign roles – preview templates – pick typography
            </p>
          </div>
          <ScoreRing score={score} />
        </div>
      </div>

      <div style={{ maxWidth:960, margin:"0 auto", padding:"16px 28px" }}>

        {/* Image extractor */}
        <ImageExtractor onAddColors={addColors} diagnoseColors={diagnose} onNavigate={setTab} />

        {/* Palette strip */}
        <div className="card">
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            marginBottom:12, flexWrap:"wrap", gap:8
          }}>
            <div>
              <div style={{
                fontSize:12, fontWeight:500, color:"#444",
                fontFamily:"'Playfair Display',serif", marginBottom:2
              }}>Step 2 -- Your Colours</div>
              <div style={{ fontSize:10, color:"#bbb" }}>
                {locked.size > 0
                  ? <><span style={{ color:"#2d6a4f", fontWeight:500 }}>{locked.size} locked — </span>lock colours you love, then generate to find ones that work with them</>
                  : `${colors.length}/8 colours — click a swatch to edit — type a hex code below`
                }
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
              {warnCount > 0 && (
                <div style={{
                  fontSize:10, color:"#8a5000", background:"#fff7ed",
                  border:"1px solid #f0c060", borderRadius:20, padding:"5px 12px"
                }}>
                  {warnCount} issue{warnCount !== 1 ? "s" : ""} to fix below
                </div>
              )}
              <button
                className={`genbtn${generating ? " spinning" : ""}`}
                onClick={generatePalette}
                title="Generate new colours (or press spacebar)"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                </svg>
                Generate
                <span style={{ opacity:.45, fontSize:9 }}>[space]</span>
              </button>
            </div>
          </div>
          <div style={{ display:"flex", gap:10, flexWrap:"wrap", alignItems:"flex-end" }}>
            {colors.map((hex, i) => {
              const {r,g,b} = hexToRgb(hex);
              const hsl = rgbToHsl(r,g,b);
              const tc  = tempCategory(hsl.h, hsl.s);
              const isLocked = locked.has(i);
              const dimmed   = locked.size > 0 && !isLocked;
              return (
                <div key={i} className="sw" style={{
                  display:"flex", flexDirection:"column",
                  alignItems:"center", gap:4,
                  opacity: dimmed ? 0.72 : 1,
                  transition:"opacity .18s"
                }}>
                  <div style={{ position:"relative" }}>
                    <input
                      type="color" value={hex}
                      onChange={e => updateColor(i, e.target.value)}
                      style={{
                        width:64, height:74, display:"block",
                        boxShadow: isLocked
                          ? "0 0 0 2px #2d6a4f, 0 0 0 5px #52b78880"
                          : "0 2px 8px rgba(0,0,0,.12)"
                      }}
                    />
                    <button className="rm" onClick={() => removeColor(i)}>x</button>
                    <button
                      className={`lkbtn ${isLocked ? "locked" : "unlocked"}`}
                      onClick={() => toggleLock(i)}
                      title={isLocked ? "Unlock this colour" : "Lock this colour to keep it when generating"}
                    >{isLocked ? "🔒" : "🔓"}</button>
                    {roles[hex] && (
                      <div style={{
                        position:"absolute", bottom:4, left:"50%",
                        transform:"translateX(-50%)",
                        background:"rgba(255,255,255,.93)", borderRadius:10,
                        padding:"2px 6px", fontSize:7, letterSpacing:".1em",
                        color: ROLE_COL[roles[hex]], whiteSpace:"nowrap",
                        textTransform:"uppercase",
                        border: `1px solid ${ROLE_COL[roles[hex]]}50`
                      }}>{roles[hex]}</div>
                    )}
                  </div>
                  <input
                    className="hx" value={hex}
                    onChange={e => {
                      if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value))
                        updateColor(i, e.target.value);
                    }}
                    maxLength={7}
                  />
                  <div style={{ fontSize:7, color:tc.col }}>{tc.label}</div>
                </div>
              );
            })}
            {colors.length < 8 && (
              <div style={{ display:"flex", flexDirection:"column", gap:4, alignItems:"center" }}>
                <input
                  type="color" value={picker}
                  onChange={e => setPicker(e.target.value)}
                  style={{ width:64, height:74, opacity:.35,
                           boxShadow:"0 2px 8px rgba(0,0,0,.08)" }}
                />
                <button className="addbtn" onClick={() => addColor(picker)}>+ Add</button>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div style={{
          borderBottom:"1px solid #e4ddd4", marginBottom:16,
          position:"relative", borderRadius:"6px 6px 0 0", background:"#fff"
        }}>
          <div style={{
            position:"absolute", right:0, top:0, bottom:0, width:32, zIndex:2,
            pointerEvents:"none", borderRadius:"0 6px 0 0",
            background:"linear-gradient(90deg, transparent, #fff 80%)"
          }} />
        <div style={{
          display:"flex",
          padding:"0 6px", overflowX:"auto",
          scrollbarWidth:"none", msOverflowStyle:"none"
        }}>
          {TABS.map(t => (
            <button key={t.key} className={`tb ${tab === t.key ? "on" : ""}`}
              onClick={() => setTab(t.key)}>
              {t.label}
              {t.key === "issues" && warnCount > 0 && (
                <span style={{
                  marginLeft:6, background:"#b8703a", color:"#fff",
                  borderRadius:10, fontSize:8, padding:"1px 6px"
                }}>{warnCount}</span>
              )}
            </button>
          ))}
        </div>
        </div>

        {/* Issues & Fixes tab */}
        {tab === "issues" && (
          <div>
            {/* Context banner — shown when palette came from an image */}
            {fromImage && warnCount > 0 && (
              <div style={{
                marginBottom:14, padding:"14px 18px",
                background:"linear-gradient(135deg,#fff8f0,#fff4e8)",
                border:"1px solid #f0c060", borderRadius:6,
                display:"flex", gap:12, alignItems:"flex-start"
              }}>
                <span style={{ fontSize:22, flexShrink:0 }}>🎨</span>
                <div>
                  <div style={{
                    fontSize:12, fontWeight:500, color:"#8a5000",
                    fontFamily:"'Playfair Display',serif", marginBottom:4
                  }}>
                    Your logo colours are a great starting point — but they need work before they become a brand palette
                  </div>
                  <div style={{ fontSize:10, color:"#aa7020", lineHeight:1.75 }}>
                    A logo is designed to look good as a single image. A brand palette has a different job: it needs to work as text, backgrounds, buttons, and print materials too. We've found <strong>{warnCount} thing{warnCount !== 1 ? "s" : ""}</strong> to improve below. Each one has a plain-English explanation and a one-click fix where possible.
                  </div>
                </div>
              </div>
            )}

            {fromImage && warnCount === 0 && (
              <div style={{
                marginBottom:14, padding:"14px 18px",
                background:"#f2faf2", border:"1px solid #90c090", borderRadius:6,
                display:"flex", gap:12, alignItems:"center"
              }}>
                <span style={{ fontSize:22 }}>✨</span>
                <div>
                  <div style={{ fontSize:12, fontWeight:500, color:"#2a6a2a", fontFamily:"'Playfair Display',serif", marginBottom:3 }}>
                    Your logo colours translate well into a brand palette
                  </div>
                  <div style={{ fontSize:10, color:"#5a8a5a", lineHeight:1.7 }}>
                    No major issues found. Head to <strong>Colour Jobs</strong> to assign each colour a role and complete your system.
                  </div>
                </div>
              </div>
            )}

            <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
              <strong style={{ color:"#555" }}>How to use this tab:</strong>
              {" "}Each issue below is explained in plain English. Where a fix is available, click{" "}
              <strong style={{ color:"#b8703a" }}>Fix it →</strong>
              {" "}and the palette updates automatically. Click{" "}
              <em>What does this mean for my brand?</em> on any issue to understand the real-world impact.
            </div>

            {issues.length === 0 && colors.length < 2 && (
              <div style={{ textAlign:"center", padding:"40px 20px", color:"#bbb", fontSize:11 }}>
                Add at least 2 colours above to run a full diagnosis.
              </div>
            )}

            {issues.map((issue, i) => {
              const key = issue.code + (issue.i ?? "") + (issue.j ?? "");
              return (
                <IssueCard
                  key={i}
                  issue={issue}
                  onFix={applyFix}
                  fixApplied={fixedCodes.has(key)}
                />
              );
            })}

            {issues.length > 0 && warnCount === 0 && (
              <div style={{
                textAlign:"center", padding:"24px",
                background:"#f2faf2", border:"1px solid #90c090",
                borderRadius:6, marginTop:8
              }}>
                <div style={{ fontSize:16, marginBottom:4 }}>OK</div>
                <div style={{
                  fontSize:13, color:"#2a6a2a",
                  fontFamily:"'Playfair Display',serif", marginBottom:4
                }}>Your palette is looking great!</div>
                <div style={{ fontSize:10, color:"#5a8a5a" }}>
                  Head to the Colour Jobs tab to assign each colour a role.
                </div>
              </div>
            )}

            <details style={{ marginTop:16 }}>
              <summary style={{
                fontSize:9, color:"#bbb", letterSpacing:".12em",
                textTransform:"uppercase", cursor:"pointer", padding:"8px 0"
              }}>Technical colour data</summary>
              <div className="card" style={{ marginTop:8 }}>
                {colors.map((hex, i) => {
                  const {r,g,b} = hexToRgb(hex);
                  const hsl = rgbToHsl(r,g,b);
                  const tc  = tempCategory(hsl.h, hsl.s);
                  const tier = hsl.s > 85 ? "Vivid Accent"
                    : hsl.s > 50 ? "Mid-tone Brand"
                    : hsl.s > 15 ? "Muted/Pastel"
                    : "Surface Neutral";
                  return (
                    <div key={i} style={{
                      display:"flex", alignItems:"center",
                      gap:10, marginBottom:8, flexWrap:"wrap"
                    }}>
                      <div style={{
                        width:20, height:20, borderRadius:3, background:hex,
                        flexShrink:0, boxShadow:"0 1px 4px rgba(0,0,0,.15)"
                      }}/>
                      <span style={{ color:"#555", width:70, fontSize:10, fontWeight:500 }}>
                        {hex.toUpperCase()}
                      </span>
                      <span style={{ color:"#bbb", fontSize:9 }}>
                        H {Math.round(hsl.h)} S {Math.round(hsl.s)}% L {Math.round(hsl.l)}%
                      </span>
                      <span style={{
                        fontSize:8, color:tc.col,
                        border:`1px solid ${tc.col}40`,
                        borderRadius:10, padding:"2px 7px"
                      }}>{tc.label}</span>
                      <span style={{
                        fontSize:8, color:"#aaa", border:"1px solid #e4ddd4",
                        borderRadius:10, padding:"2px 7px"
                      }}>{tier}</span>
                    </div>
                  );
                })}
              </div>
            </details>
          </div>
        )}

        {/* Readability tab */}
        {tab === "readability" && (
          <div>
            <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
              <strong style={{ color:"#555" }}>Readability check</strong>
              {" "}-- this shows how readable each pair of colours is as text on a background.
              For a website to be accessible, body text should score AA or higher.
              <div style={{ display:"flex", gap:8, marginTop:10, flexWrap:"wrap" }}>
                {[
                  ["AAA -- excellent","#e8f5e8","#2a6a2a"],
                  ["AA -- good (body text)","#fff8e0","#7a6000"],
                  ["AA large -- OK for headings","#fff3d0","#8a5000"],
                  ["Fail -- avoid for text","#fdecea","#8a2020"],
                ].map(([l,bg,col]) => (
                  <div key={l} style={{
                    background:bg, color:col, fontSize:9, padding:"4px 12px",
                    borderRadius:4, border:`1px solid ${col}25`
                  }}>{l}</div>
                ))}
              </div>
            </div>
            <div style={{
              overflowX:"auto", background:"#fff",
              borderRadius:6, border:"1px solid #e4ddd4", marginBottom:18
            }}>
              <table style={{ borderCollapse:"collapse", width:"100%" }}>
                <thead>
                  <tr>
                    <td style={{ padding:10 }}/>
                    {colors.map((hex, i) => (
                      <td key={i} style={{ padding:"10px 8px", textAlign:"center" }}>
                        <div style={{
                          width:26, height:26, borderRadius:4, background:hex,
                          margin:"0 auto 4px", boxShadow:"0 1px 4px rgba(0,0,0,.15)"
                        }}/>
                        <div style={{ fontSize:8, color:"#bbb" }}>{hex.slice(1).toUpperCase()}</div>
                      </td>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {colors.map((h1, i) => (
                    <tr key={i} style={{ borderTop:"1px solid #f0ece8" }}>
                      <td style={{ padding:"10px 14px" }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                          <div style={{
                            width:20, height:20, borderRadius:3, background:h1, flexShrink:0
                          }}/>
                          <span style={{ fontSize:8, color:"#bbb" }}>{h1.slice(1).toUpperCase()}</span>
                        </div>
                      </td>
                      {colors.map((h2, j) => {
                        if (i === j) return (
                          <td key={j} style={{
                            background:"#f7f4ef", textAlign:"center", padding:10
                          }}>
                            <span style={{ color:"#ddd", fontSize:16 }}>--</span>
                          </td>
                        );
                        const r = contrastRatio(h1, h2);
                        const [bg, col] = r >= 7   ? ["#e8f5e8","#2a6a2a"]
                          : r >= 4.5 ? ["#fff8e0","#7a6000"]
                          : r >= 3   ? ["#fff3d0","#8a5000"]
                          :            ["#fdecea","#8a2020"];
                        return (
                          <td key={j} style={{ background:bg, padding:"10px 8px", textAlign:"center" }}>
                            <div style={{ fontSize:12, fontWeight:500, color:col }}>
                              {r.toFixed(1)}
                            </div>
                            <div style={{ fontSize:8, color:col, opacity:.85, marginTop:2 }}>
                              {r >= 7 ? "AAA" : r >= 4.5 ? "AA" : r >= 3 ? "AA lg" : "Fail"}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="lbl">Preview -- how text actually looks on each background</div>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap" }}>
              {colors.flatMap((h1,i) =>
                colors.slice(i+1).map((h2,j) => {
                  const r = contrastRatio(h1,h2);
                  if (r < 3) return null;
                  return (
                    <div key={`${i}${j}`} style={{
                      background:h1, borderRadius:6, padding:"14px 16px",
                      flex:"1 0 130px", maxWidth:190,
                      boxShadow:"0 2px 8px rgba(0,0,0,.1)"
                    }}>
                      <div style={{
                        fontFamily:"'Playfair Display',serif",
                        fontSize:15, color:h2, marginBottom:3
                      }}>Aa Bb Cc</div>
                      <div style={{ fontSize:9, color:h2, opacity:.85 }}>The quick brown fox</div>
                      <div style={{ fontSize:8, color:h2, opacity:.6, marginTop:3 }}>
                        {r.toFixed(1)}:1 -- {r >= 7 ? "AAA" : r >= 4.5 ? "AA" : "AA lg"}
                      </div>
                    </div>
                  );
                })
              ).filter(Boolean)}
              {!colors.some((h1,i) => colors.slice(i+1).some(h2 => contrastRatio(h1,h2) >= 3)) && (
                <div style={{
                  fontSize:11, color:"#bbb", fontStyle:"italic", padding:"20px 0"
                }}>
                  No readable pairs yet -- try adding a dark colour or a light neutral.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Add Colours tab */}
        {tab === "addcolours" && (
          <div>
            <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
              <strong style={{ color:"#555" }}>Need more colours?</strong>
              {" "}These suggestions are calculated from your existing palette using colour wheel
              relationships. Each one is designed to fill a specific role. Click any card to add it.
            </div>
            <div style={{
              display:"grid",
              gridTemplateColumns:"repeat(auto-fill, minmax(155px, 1fr))",
              gap:11, marginBottom:20
            }}>
              {suggs.map((s, i) => {
                const added = colors.includes(s.hex);
                return (
                  <div
                    key={i}
                    className={`sg${added ? " added" : ""}`}
                    onClick={() => !added && addColor(s.hex)}
                  >
                    <div style={{
                      height:52, borderRadius:4, background:s.hex, marginBottom:9,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:9, color:textOn(s.hex), letterSpacing:".1em",
                      textTransform:"uppercase", boxShadow:"0 2px 6px rgba(0,0,0,.12)"
                    }}>
                      {added ? "Added" : "+ Add"}
                    </div>
                    <div style={{
                      fontSize:8, letterSpacing:".1em", color:"#b8703a",
                      textTransform:"uppercase", marginBottom:2
                    }}>{s.label}</div>
                    <div style={{
                      fontSize:8, background:"#f0ece8", color:"#aaa",
                      borderRadius:10, padding:"1px 7px",
                      display:"inline-block", marginBottom:6
                    }}>{s.badge}</div>
                    <div style={{ fontSize:9, color:"#888", lineHeight:1.6 }}>{s.reason}</div>
                  </div>
                );
              })}
            </div>
            <div className="card">
              <div className="lbl">The 60-30-10 rule</div>
              <div style={{
                display:"flex", height:42, borderRadius:4,
                overflow:"hidden", marginBottom:12
              }}>
                <div style={{
                  flex:6, background:"#e8e0d4",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, color:"#888"
                }}>60% Background / Neutral</div>
                <div style={{
                  flex:3, background:"#7a9ab8",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, color:"#fff"
                }}>30% Secondary</div>
                <div style={{
                  flex:1, background:"#c07040",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, color:"#fff"
                }}>10%</div>
              </div>
              <p style={{ fontSize:10, color:"#999", lineHeight:1.8 }}>
                Think of colour like seasoning. Your neutral is the main ingredient -- it
                takes up the most space and sets the tone. Your secondary adds flavour and
                structure. Your accent is the spice -- used sparingly, it is what makes
                everything pop. Luxury brands like Apple use even less accent (5%). High-energy
                brands like Spotify use a bit more (20%).
              </p>
            </div>
          </div>
        )}

        {/* Colour Blindness tab */}
        {tab === "colourblind" && (
          <div>
            <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
              <strong style={{ color:"#555" }}>
                Colour blindness affects more people than you might think
              </strong>
              {" "}-- about 1 in 12 men and 1 in 200 women have some form of it.
              This tab shows you how your palette looks to people with different types
              of colour vision. The most important rule: never use colour as the only way
              to communicate meaning. Always add a label, icon, or pattern alongside colour.
            </div>
            <div style={{ display:"flex", gap:8, marginBottom:18, flexWrap:"wrap" }}>
              {CVD_TYPES.map(t => (
                <button
                  key={t.key}
                  onClick={() => setCvdType(t.key)}
                  style={{
                    background: cvdType === t.key ? "#b8703a" : "#fff",
                    color: cvdType === t.key ? "#fff" : "#888",
                    border: `1px solid ${cvdType === t.key ? "#b8703a" : "#ddd"}`,
                    cursor:"pointer", fontFamily:"'DM Mono',monospace",
                    fontSize:10, padding:"8px 14px", borderRadius:4,
                    textAlign:"left", transition:"all .15s"
                  }}
                >
                  <div style={{ fontWeight: cvdType === t.key ? 500 : 400 }}>{t.label}</div>
                  <div style={{ fontSize:8, opacity:.7, marginTop:2 }}>{t.note}</div>
                </button>
              ))}
            </div>
            <div className="card">
              <div className="lbl">
                Normal vision vs {CVD_TYPES.find(t => t.key === cvdType)?.label}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
                {[
                  { label: "What most people see", fn: null },
                  { label: `What someone with ${CVD_TYPES.find(t => t.key === cvdType)?.label} sees`, fn: cvdType }
                ].map(({ label, fn }) => (
                  <div key={label}>
                    <div style={{
                      fontSize:9, color:"#bbb", textTransform:"uppercase",
                      letterSpacing:".1em", marginBottom:10
                    }}>{label}</div>
                    <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                      {colors.map((hex, i) => {
                        const {r,g,b} = hexToRgb(hex);
                        const sh = fn ? simulateCVD(r,g,b,fn) : hex;
                        return (
                          <div key={i} style={{
                            display:"flex", flexDirection:"column",
                            alignItems:"center", gap:3
                          }}>
                            <div style={{
                              width:50, height:50, borderRadius:4, background:sh,
                              boxShadow:"0 2px 8px rgba(0,0,0,.1)"
                            }}/>
                            <div style={{ fontSize:7, color:"#aaa" }}>{sh.slice(1)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="lbl">Pairs that become hard to distinguish</div>
              {(() => {
                const pairs = [];
                for (let i=0; i<colors.length; i++) {
                  for (let j=i+1; j<colors.length; j++) {
                    const {r:r1,g:g1,b:b1} = hexToRgb(colors[i]);
                    const {r:r2,g:g2,b:b2} = hexToRgb(colors[j]);
                    const s1 = simulateCVD(r1,g1,b1,cvdType);
                    const s2 = simulateCVD(r2,g2,b2,cvdType);
                    const orig = deltaE(colors[i], colors[j]);
                    const sim  = deltaE(s1, s2);
                    if (sim < orig * 0.5 && orig > 10)
                      pairs.push({ i, j, orig, sim, s1, s2 });
                  }
                }
                if (!pairs.length) return (
                  <p style={{ fontSize:10, color:"#aaa", fontStyle:"italic" }}>
                    Good news -- no major confusion pairs detected for this type
                    of colour blindness.
                  </p>
                );
                return pairs.map((p, idx) => (
                  <div key={idx} style={{
                    display:"flex", alignItems:"center", gap:10, marginBottom:8,
                    padding:"10px 12px", background:"#fff7ed",
                    borderRadius:4, border:"1px solid #f0c060", flexWrap:"wrap"
                  }}>
                    <div style={{ display:"flex", gap:4 }}>
                      <div style={{ width:28, height:28, borderRadius:3, background:colors[p.i] }}/>
                      <div style={{ width:28, height:28, borderRadius:3, background:colors[p.j] }}/>
                    </div>
                    <span style={{ fontSize:9, color:"#ccc" }}>becomes</span>
                    <div style={{ display:"flex", gap:4 }}>
                      <div style={{ width:28, height:28, borderRadius:3, background:p.s1 }}/>
                      <div style={{ width:28, height:28, borderRadius:3, background:p.s2 }}/>
                    </div>
                    <div style={{ fontSize:10, color:"#8a5000", lineHeight:1.6 }}>
                      Colours {p.i+1} and {p.j+1} become hard to distinguish.
                      Never use these alone to show a difference in meaning.
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* Colour Jobs tab */}
        {tab === "roles" && (
          <div>
            {/* Header card with Choose for me button */}
            <div className="card" style={{ marginBottom:14 }}>
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:16, flexWrap:"wrap" }}>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:"#444", fontFamily:"'Playfair Display',serif", marginBottom:6 }}>
                    Give each colour a job
                  </div>
                  <div style={{ fontSize:11, color:"#888", lineHeight:1.75 }}>
                    Every colour in a professional brand palette has a specific role — it's not just about what looks nice, it's about what each colour <em>does</em>. A <strong style={{color:"#555"}}>Hero</strong> colour anchors your brand. A <strong style={{color:"#555"}}>Background</strong> gives the eye somewhere to rest. An <strong style={{color:"#555"}}>Accent</strong> draws attention to buttons and calls-to-action. Get this right and every design you make will feel consistent and intentional.
                  </div>
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end", flexShrink:0 }}>
                  <button
                    onClick={chooseForMe}
                    style={{
                      background: "linear-gradient(135deg, #b8703a, #d4924e)",
                      color: "#fff", border:"none", cursor:"pointer",
                      fontFamily:"'DM Mono',monospace", fontSize:11,
                      letterSpacing:".08em", padding:"11px 22px",
                      borderRadius:6, boxShadow:"0 3px 12px rgba(184,112,58,.35)",
                      transition:"all .2s", whiteSpace:"nowrap",
                      display:"flex", alignItems:"center", gap:8,
                    }}
                    onMouseOver={e => e.currentTarget.style.transform="translateY(-1px)"}
                    onMouseOut={e => e.currentTarget.style.transform="none"}
                  >
                    <span style={{ fontSize:16 }}>✨</span>
                    Choose for me
                  </button>
                  {Object.keys(roles).length > 0 && (
                    <button onClick={clearRoles} style={{
                      background:"none", border:"1px solid #ddd", color:"#bbb",
                      cursor:"pointer", fontFamily:"'DM Mono',monospace",
                      fontSize:9, padding:"6px 12px", borderRadius:4, letterSpacing:".08em"
                    }}>
                      Clear all roles
                    </button>
                  )}
                </div>
              </div>

              {/* Auto-assignment summary banner */}
              {Object.keys(autoReasons).length > 0 && (
                <div style={{
                  marginTop:14, padding:"12px 14px",
                  background:"linear-gradient(135deg,#fff8f0,#fff4e8)",
                  border:"1px solid #f0c060", borderRadius:5,
                  fontSize:10, color:"#8a5000", lineHeight:1.7
                }}>
                  <strong>Here's how we chose:</strong> We analysed each colour's brightness, saturation, and contrast to find the best role for it. You can override any assignment by clicking a different role button on the right. Scroll down to see the live preview.
                </div>
              )}
            </div>

            {/* Role rows */}
            <div style={{ display:"grid", gap:8, marginBottom:18 }}>
              {colors.map((hex, i) => {
                const assignedRole = roles[hex];
                const reason = autoReasons[hex];
                return (
                  <div key={i} style={{
                    background:"#fff", border:`1px solid ${assignedRole ? `${ROLE_COL[assignedRole]}40` : "#e4ddd4"}`,
                    borderRadius:6, overflow:"hidden",
                    transition:"border-color .2s",
                    boxShadow: assignedRole ? `0 2px 8px ${ROLE_COL[assignedRole]}18` : "none"
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 16px" }}>
                      {/* Colour swatch */}
                      <div style={{
                        width:44, height:44, borderRadius:6, background:hex,
                        flexShrink:0, boxShadow:"0 2px 8px rgba(0,0,0,.15)",
                        position:"relative"
                      }}>
                        {assignedRole && (
                          <div style={{
                            position:"absolute", inset:0, borderRadius:6,
                            border:`2px solid ${ROLE_COL[assignedRole]}`,
                          }}/>
                        )}
                      </div>

                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3, flexWrap:"wrap" }}>
                          <span style={{ fontSize:10, color:"#888", fontWeight:500 }}>{hex.toUpperCase()}</span>
                          {assignedRole && (
                            <span style={{
                              fontSize:8, letterSpacing:".12em", textTransform:"uppercase",
                              color: ROLE_COL[assignedRole],
                              background:`${ROLE_COL[assignedRole]}15`,
                              border:`1px solid ${ROLE_COL[assignedRole]}40`,
                              borderRadius:10, padding:"2px 8px"
                            }}>{assignedRole}</span>
                          )}
                        </div>
                        {assignedRole && reason ? (
                          <div style={{ fontSize:9, color:"#aaa", lineHeight:1.6 }}>{reason}</div>
                        ) : assignedRole ? (
                          <div style={{ fontSize:9, color:"#aaa" }}>{ROLE_DESC[assignedRole]}</div>
                        ) : (
                          <div style={{ fontSize:9, color:"#ddd" }}>No role assigned — pick one, or use "Choose for me" above</div>
                        )}
                      </div>

                      {/* Role pills */}
                      <div style={{ display:"flex", gap:5, flexWrap:"wrap", justifyContent:"flex-end", flexShrink:0 }}>
                        {ROLES.map(role => {
                          const on = roles[hex] === role;
                          return (
                            <button key={role} className="rp"
                              onClick={() => {
                                setRole(hex, role);
                                // Clear the auto-reason for this hex if manually overridden
                                setAutoReasons(prev => {
                                  const n = { ...prev };
                                  if (n[hex]) { n[hex] = null; }
                                  return n;
                                });
                              }}
                              style={{
                                borderColor: on ? ROLE_COL[role] : "#ddd",
                                color:       on ? ROLE_COL[role] : "#bbb",
                                background:  on ? `${ROLE_COL[role]}12` : "none",
                                fontWeight:  on ? 500 : 400
                              }}
                            >{role}</button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Role reference guide */}
            <details style={{ marginBottom:18 }}>
              <summary style={{ fontSize:9, color:"#bbb", letterSpacing:".14em", textTransform:"uppercase", cursor:"pointer", padding:"8px 0" }}>
                What do the roles mean? ▾
              </summary>
              <div className="card" style={{ marginTop:8 }}>
                {[
                  ["Hero",       "#b8703a", "Your main brand colour — the one that defines you. It appears in your logo, your main headline treatment, and your most important design moments. Should be distinctive and memorable. Mid-range saturation (not too neon, not too washed out)."],
                  ["Accent",     "#2a7a7a", "Your call-to-action colour — used sparingly (roughly 10% of any design) on buttons, links, icons, and highlights. It works because it's rare. If you use it everywhere, it stops working. Should contrast clearly against your background."],
                  ["Neutral",    "#777",    "A quiet supporting colour for borders, dividers, secondary text, and subtle backgrounds on cards. Not as light as your Background, not as dark as your Text. It's the glue that holds everything together without shouting."],
                  ["Background", "#8a7a6a", "The quiet majority of your design — the 60% zone. Light, calm, and low saturation. Used for page backgrounds, card surfaces, and anywhere that needs to fade into the background so other elements can shine."],
                  ["Text",       "#3a3a5a", "Your readable dark — used for body text, headings, and anything that needs to be clearly legible on your Background. Must achieve at least 4.5:1 contrast ratio against Background to meet accessibility standards. Slightly tinted dark grey looks warmer and more intentional than pure black."],
                ].map(([role, col, desc]) => (
                  <div key={role} style={{ display:"flex", gap:12, marginBottom:12, alignItems:"flex-start" }}>
                    <span style={{
                      fontSize:8, color:col, border:`1px solid ${col}50`, borderRadius:10,
                      padding:"3px 10px", letterSpacing:".1em", textTransform:"uppercase",
                      whiteSpace:"nowrap", marginTop:2, flexShrink:0
                    }}>{role}</span>
                    <span style={{ fontSize:10, color:"#888", lineHeight:1.75 }}>{desc}</span>
                  </div>
                ))}
              </div>
            </details>

            {/* Brand preview — unchanged */}
            {Object.keys(roles).length >= 2 && (() => {
              const bg      = Object.keys(roles).find(k => roles[k] === "Background");
              const hero    = Object.keys(roles).find(k => roles[k] === "Hero");
              const accent  = Object.keys(roles).find(k => roles[k] === "Accent");
              const textCol = Object.keys(roles).find(k => roles[k] === "Text");
              const neutral = Object.keys(roles).find(k => roles[k] === "Neutral");
              const cr = textCol && bg ? contrastRatio(textCol, bg) : null;
              return (
                <div>
                  <div className="lbl">Brand preview — how it all works together</div>
                  <div style={{ display:"flex", gap:14, flexWrap:"wrap" }}>
                    <div style={{
                      background: bg || "#f5f0e8",
                      borderRadius:8, padding:"22px 26px", maxWidth:310,
                      border: `1px solid ${neutral || "#e0d8cc"}`,
                      flex:"1 0 250px", boxShadow:"0 4px 20px rgba(0,0,0,.08)"
                    }}>
                      {hero && <div style={{ width:32, height:4, background:hero, borderRadius:3, marginBottom:14 }}/>}
                      <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color: textCol || "#1a1510", marginBottom:7, fontWeight:400 }}>Your Brand Name</div>
                      <div style={{ fontSize:11, color: textCol ? `${textCol}bb` : "#777", lineHeight:1.8, marginBottom:14 }}>
                        This is what your text looks like on your background colour. Every colour used here comes from your assigned palette roles.
                      </div>
                      {neutral && <div style={{ height:1, background:neutral, opacity:.25, marginBottom:14 }}/>}
                      {accent && (
                        <div style={{ display:"inline-block", background:accent, padding:"8px 18px", borderRadius:4, fontSize:10, color:textOn(accent), letterSpacing:".1em", textTransform:"uppercase" }}>
                          Book Now
                        </div>
                      )}
                    </div>
                    <div style={{ flex:"0 0 auto" }}>
                      <div style={{ fontSize:9, letterSpacing:".1em", color:"#ccc", textTransform:"uppercase", marginBottom:8 }}>Colour strip</div>
                      <div style={{ display:"flex", height:50, borderRadius:5, overflow:"hidden", minWidth:160, marginBottom:10 }}>
                        {ROLES.map(role => {
                          const h = Object.keys(roles).find(k => roles[k] === role);
                          if (!h) return null;
                          return (
                            <div key={role} style={{ flex:1, background:h, display:"flex", alignItems:"flex-end", padding:"5px 6px" }}>
                              <span style={{ fontSize:7, color:textOn(h), letterSpacing:".08em", textTransform:"uppercase" }}>{role}</span>
                            </div>
                          );
                        })}
                      </div>
                      {cr && (
                        <div style={{
                          fontSize:10,
                          color: cr >= 4.5 ? "#3a8a3a" : "#c06020",
                          padding:"8px 12px",
                          background: cr >= 4.5 ? "#f2faf2" : "#fff7ed",
                          borderRadius:4,
                          border: `1px solid ${cr >= 4.5 ? "#90c090" : "#f0c060"}`
                        }}>
                          {cr >= 4.5 ? "✓ Text is readable on your background" : "⚠ Text may be hard to read on your background"}
                          <br/>
                          <span style={{ fontSize:9, opacity:.75 }}>
                            Contrast: {cr.toFixed(1)}:1 {cr >= 4.5 ? "· Passes AA standard" : "· Below AA minimum (4.5:1)"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Typography tab */}
        {tab === "typography" && (() => {
          const ranked = FONT_PAIRS
            .map(p => ({ ...p, score: scoreFontPair(p, colors) }))
            .sort((a, b) => b.score - a.score);
          const activePair = selectedFont || ranked[0];
          // Derive preview colours from roles or palette
          const data = colors.map(hex => { const {r,g,b} = hexToRgb(hex); return { hex, ...rgbToHsl(r,g,b), lum: luminance(r,g,b) }; });
          const bgHex = Object.keys(roles).find(k => roles[k] === "Background")
            || (data.length ? data.reduce((b,c) => c.l > b.l ? c : b, data[0]).hex : "#f5f0e8");
          const txtHex = Object.keys(roles).find(k => roles[k] === "Text")
            || (data.length ? data.reduce((b,c) => c.l < b.l ? c : b, data[0]).hex : "#1a1a2e");
          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Typography Pairing</strong>
                {" "}— We've scored 6 curated font pairings against your palette's colour temperature and saturation.
                Click any pair to select it for your Brand Templates.
              </div>
              <div style={{ display:"grid", gap:10 }}>
                {ranked.map((pair, i) => {
                  const isSelected = activePair.name === pair.name;
                  return (
                    <div key={pair.name}
                      onClick={() => setSelectedFont(pair)}
                      style={{
                        background: "#fff",
                        border: isSelected ? "2px solid #b8703a" : "1px solid #e4ddd4",
                        borderRadius: 8,
                        padding: "16px 20px",
                        cursor: "pointer",
                        transition: "all .18s",
                        boxShadow: isSelected ? "0 4px 16px rgba(184,112,58,.18)" : "0 1px 4px rgba(0,0,0,.05)",
                      }}
                    >
                      <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", gap:14, flexWrap:"wrap" }}>
                        <div style={{ flex:1, minWidth:200 }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                            <span style={{
                              fontSize:9, color:"#b8703a", letterSpacing:".12em",
                              textTransform:"uppercase", fontFamily:"'DM Mono',monospace"
                            }}>#{i+1}</span>
                            <span style={{
                              fontFamily: pair.heading, fontSize:18, color:"#333", fontWeight:600
                            }}>{pair.name}</span>
                            <span style={{
                              fontSize:9, background: pair.score >= 70 ? "#e8f5e8" : pair.score >= 45 ? "#fff8e0" : "#fdecea",
                              color: pair.score >= 70 ? "#2a6a2a" : pair.score >= 45 ? "#7a6000" : "#8a2020",
                              borderRadius:10, padding:"2px 8px", fontFamily:"'DM Mono',monospace"
                            }}>{pair.score}%</span>
                            {isSelected && (
                              <span style={{
                                fontSize:8, background:"#b8703a", color:"#fff",
                                borderRadius:10, padding:"2px 8px", letterSpacing:".1em",
                                textTransform:"uppercase"
                              }}>Selected</span>
                            )}
                          </div>
                          <div style={{ fontSize:10, color:"#999", marginBottom:8, lineHeight:1.6 }}>{pair.mood}</div>
                          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:6 }}>
                            {pair.vibes.map(v => (
                              <span key={v} style={{
                                fontSize:8, color:"#aaa", border:"1px solid #e4ddd4",
                                borderRadius:10, padding:"2px 7px"
                              }}>{v}</span>
                            ))}
                            <span style={{
                              fontSize:8, color:"#aaa", border:"1px solid #e4ddd4",
                              borderRadius:10, padding:"2px 7px"
                            }}>sat {pair.satRange[0]}–{pair.satRange[1]}%</span>
                          </div>
                          <div style={{ fontSize:9, color:"#bbb" }}>
                            Heading: <span style={{ color:"#888" }}>{pair.heading.split(",")[0].replace(/'/g,"")}</span>
                            {" "}· Body: <span style={{ color:"#888" }}>{pair.body.split(",")[0].replace(/'/g,"")}</span>
                          </div>
                        </div>
                        {/* Live preview */}
                        <div style={{
                          background: bgHex, borderRadius:6, padding:"16px 20px",
                          minWidth:220, flex:"0 0 auto",
                          border: `1px solid ${txtHex}15`
                        }}>
                          <div style={{
                            fontFamily: pair.heading, fontSize:20, color: txtHex,
                            marginBottom:6, fontWeight:600, lineHeight:1.3
                          }}>The Quick Brown Fox</div>
                          <div style={{
                            fontFamily: pair.body, fontSize:12, color: txtHex,
                            opacity:.8, lineHeight:1.7
                          }}>Jumps over the lazy dog. This is how your body text will look with this pairing on your palette colours.</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Brand Templates tab */}
        {/* Colour Scales tab */}
        {tab === "scales" && (() => {
          const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];
          const STEP_LIGHTNESS = [97, 93, 86, 76, 64, 50, 38, 26, 16, 10];

          const generateScale = (hex) => {
            const { r, g, b } = hexToRgb(hex);
            const { h, s } = rgbToHsl(r, g, b);
            return STEPS.map((step, i) => {
              const targetL = STEP_LIGHTNESS[i];
              // Gently reduce saturation toward extremes to avoid neon tints / muddy shades
              const distFromMid = Math.abs(i - 4.5) / 4.5; // 0 at centre, 1 at edges
              const adjS = Math.max(0, s * (1 - distFromMid * 0.35));
              const stepHex = hslToHex(h, adjS, targetL);
              return { step, hex: stepHex };
            });
          };

          const findClosestStep = (scale, originalHex) => {
            let minDist = Infinity, closest = 500;
            for (const s of scale) {
              const d = deltaE(s.hex, originalHex);
              if (d < minDist) { minDist = d; closest = s.step; }
            }
            return closest;
          };

          const scales = colors.map((hex, idx) => {
            const roleName = roles[hex] || `color-${idx + 1}`;
            const scale = generateScale(hex);
            const closestStep = findClosestStep(scale, hex);
            return { hex, roleName, scale, closestStep };
          });

          const slugify = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

          const copyCss = () => {
            const lines = scales.flatMap(({ roleName, scale }) =>
              scale.map(s => `  --${slugify(roleName)}-${s.step}: ${s.hex};`)
            );
            const css = `:root {\n${lines.join("\n")}\n}`;
            copyToClipboard(css, "css-scales");
          };

          const copyTailwind = () => {
            const obj = {};
            for (const { roleName, scale } of scales) {
              const key = slugify(roleName);
              obj[key] = {};
              for (const s of scale) obj[key][s.step] = s.hex;
            }
            const tw = `// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n      colors: ${JSON.stringify(obj, null, 8).replace(/^/gm, "      ").trim()}\n    }\n  }\n}`;
            copyToClipboard(tw, "tw-scales");
          };

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Colour Scales</strong>
                {" "}— A 10-step tint/shade ramp for each colour in your palette. Lightness is perceptually
                spaced from near-white (step 50) to near-black (step 900), with saturation gently
                reduced at the extremes to keep tints clean and shades rich.
              </div>

              <div style={{ display:"flex", gap:8, marginBottom:16 }}>
                <button className="tb on" style={{ fontSize:10, padding:"6px 14px", cursor:"pointer" }}
                  onClick={copyCss}>
                  {copyConfirm === "css-scales" ? "Copied!" : copyConfirm === "css-scales-fail" ? "Failed!" : "Copy all as CSS"}
                </button>
                <button className="tb on" style={{ fontSize:10, padding:"6px 14px", cursor:"pointer" }}
                  onClick={copyTailwind}>
                  {copyConfirm === "tw-scales" ? "Copied!" : copyConfirm === "tw-scales-fail" ? "Failed!" : "Copy as Tailwind"}
                </button>
              </div>

              {scales.map(({ hex, roleName, scale, closestStep }, idx) => (
                <div key={idx} className="card" style={{ marginBottom:14, padding:16 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
                    <div style={{ width:20, height:20, borderRadius:4, background:hex, border:"1px solid #e4ddd4" }} />
                    <strong style={{ fontFamily:"'DM Mono', monospace", fontSize:12, color:"#555" }}>
                      {roleName}
                    </strong>
                    <span style={{ fontFamily:"'DM Mono', monospace", fontSize:10, color:"#aaa" }}>{hex}</span>
                  </div>
                  <div style={{ display:"flex", gap:0, borderRadius:6, overflow:"hidden" }}>
                    {scale.map(s => {
                      const isClosest = s.step === closestStep;
                      return (
                        <div key={s.step} style={{
                          flex:1, textAlign:"center", position:"relative",
                          background: s.hex, padding:"22px 0 8px",
                          outline: isClosest ? "2px solid #b8703a" : "none",
                          outlineOffset: isClosest ? -2 : 0,
                          zIndex: isClosest ? 1 : 0,
                          borderRadius: isClosest ? 3 : 0,
                        }}>
                          <div style={{
                            fontFamily:"'DM Mono', monospace", fontSize:8, fontWeight:600,
                            color: textOn(s.hex), marginBottom:2
                          }}>{s.step}</div>
                          <div style={{
                            fontFamily:"'DM Mono', monospace", fontSize:7,
                            color: textOn(s.hex), opacity:0.75
                          }}>{s.hex}</div>
                          {isClosest && (
                            <div style={{
                              position:"absolute", top:3, left:"50%", transform:"translateX(-50%)",
                              fontSize:6, fontFamily:"'DM Mono', monospace", color: textOn(s.hex),
                              background:"rgba(0,0,0,.15)", padding:"1px 4px", borderRadius:3,
                              whiteSpace:"nowrap"
                            }}>closest</div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* Export Tokens tab */}
        {tab === "tokens" && (() => {
          const rolesAssigned = Object.keys(roles).length >= 2;
          const activePair = selectedFont || FONT_PAIRS[0];
          const slugify = (name) => name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

          // Build primitive tokens from palette
          const primitives = colors.map((hex, idx) => {
            const role = roles[hex];
            const name = role ? `brand-${slugify(role)}` : `brand-color-${idx + 1}`;
            return { name, hex };
          });

          // Build semantic tokens (only if roles assigned)
          const findByRole = (r) => Object.keys(roles).find(k => roles[k] === r);
          const heroVar = findByRole("Hero") ? `var(--brand-${slugify("Hero")})` : primitives[0] ? `var(--${primitives[0].name})` : "#000";
          const accentVar = findByRole("Accent") ? `var(--brand-${slugify("Accent")})` : primitives.length > 1 ? `var(--${primitives[1].name})` : heroVar;
          const bgVar = findByRole("Background") ? `var(--brand-${slugify("Background")})` : primitives.length > 2 ? `var(--${primitives[2].name})` : "#fff";
          const textVar = findByRole("Text") ? `var(--brand-${slugify("Text")})` : primitives.length > 3 ? `var(--${primitives[3].name})` : "#1a1a1a";
          const neutralVar = findByRole("Neutral") ? `var(--brand-${slugify("Neutral")})` : primitives.length > 4 ? `var(--${primitives[4].name})` : "#888";

          const semantics = [
            { name: "color-action-primary", value: accentVar },
            { name: "color-action-hover", value: heroVar },
            { name: "color-surface", value: bgVar },
            { name: "color-text-primary", value: textVar },
            { name: "color-text-inverse", value: bgVar },
            { name: "color-border", value: neutralVar },
          ];

          const components = [
            { name: "button-primary-bg", value: "var(--color-action-primary)" },
            { name: "button-primary-text", value: "var(--color-text-inverse)" },
            { name: "button-primary-hover", value: "var(--color-action-hover)" },
            { name: "card-bg", value: "var(--color-surface)" },
            { name: "card-border", value: "var(--color-border)" },
            { name: "card-text", value: "var(--color-text-primary)" },
          ];

          const typoTokens = [
            { name: "font-heading", value: activePair.heading },
            { name: "font-body", value: activePair.body },
          ];

          const generateCSS = () => {
            let out = "/* Primitive tokens */\n:root {\n";
            out += primitives.map(t => `  --${t.name}: ${t.hex};`).join("\n");
            out += "\n\n  /* Typography */\n";
            out += typoTokens.map(t => `  --${t.name}: ${t.value};`).join("\n");
            out += "\n\n  /* Semantic tokens */\n";
            out += semantics.map(t => `  --${t.name}: ${t.value};`).join("\n");
            out += "\n\n  /* Component tokens */\n";
            out += components.map(t => `  --${t.name}: ${t.value};`).join("\n");
            out += "\n}";
            return out;
          };

          const generateTailwind = () => {
            const colorsObj = {};
            for (const t of primitives) colorsObj[t.name] = t.hex;
            let out = "// tailwind.config.js\nmodule.exports = {\n  theme: {\n    extend: {\n";
            out += "      colors: " + JSON.stringify(colorsObj, null, 8).replace(/^/gm, "      ").trim() + ",\n";
            out += `      fontFamily: {\n        heading: [${activePair.heading}],\n        body: [${activePair.body}],\n      }\n`;
            out += "    }\n  }\n}";
            return out;
          };

          const generateJSON = () => {
            const obj = {
              primitive: {},
              semantic: {},
              component: {},
              typography: {},
            };
            for (const t of primitives) obj.primitive[t.name] = { value: t.hex, type: "color" };
            for (const t of semantics) obj.semantic[t.name] = { value: t.value, type: "color" };
            for (const t of components) obj.component[t.name] = { value: t.value, type: "color" };
            obj.typography["font-heading"] = { value: activePair.heading, type: "fontFamily" };
            obj.typography["font-body"] = { value: activePair.body, type: "fontFamily" };
            return JSON.stringify(obj, null, 2);
          };

          const generateFigma = () => {
            const tokens = {};
            for (const t of primitives) tokens[t.name] = { value: t.hex, type: "color" };
            for (const t of semantics) tokens[t.name] = { value: t.value, type: "color" };
            for (const t of components) tokens[t.name] = { value: t.value, type: "color" };
            tokens["font-heading"] = { value: activePair.heading, type: "fontFamilies" };
            tokens["font-body"] = { value: activePair.body, type: "fontFamilies" };
            return JSON.stringify({ "brand-tokens": tokens }, null, 2);
          };

          const formats = [
            { key: "css", label: "CSS Custom Properties", gen: generateCSS },
            { key: "tailwind", label: "Tailwind Config", gen: generateTailwind },
            { key: "json", label: "JSON Tokens", gen: generateJSON },
            { key: "figma", label: "Figma Tokens", gen: generateFigma },
          ];

          const activeFormat = formats.find(f => f.key === tokenFormat) || formats[0];
          const code = activeFormat.gen();

          const syntaxHighlight = (text) => {
            // Safe React-element syntax colouring — no dangerouslySetInnerHTML needed
            const colorize = (line) => {
              const tokens = [];
              const regex = /(--[\w-]+)|(#[0-9a-fA-F]{3,8})|("[\w-]+")\s*:|(\/\/.*$|\/\*.*?\*\/)|\b(var)\(|\b(module\.exports|:root)\b/g;
              let last = 0, m;
              while ((m = regex.exec(line)) !== null) {
                if (m.index > last) tokens.push({ text: line.slice(last, m.index), col: null });
                if (m[1]) tokens.push({ text: m[1], col: "#b8703a" });
                else if (m[2]) tokens.push({ text: m[2], col: "#2a7a7a" });
                else if (m[3]) tokens.push({ text: m[3] + ":", col: "#b8703a" });
                else if (m[4]) tokens.push({ text: m[4], col: "#aaa" });
                else if (m[5]) tokens.push({ text: "var(", col: "#606aa0" });
                else if (m[6]) tokens.push({ text: m[6], col: "#606aa0" });
                last = regex.lastIndex;
              }
              if (last < line.length) tokens.push({ text: line.slice(last), col: null });
              return tokens;
            };
            return text.split("\n").map((line, i) => ({
              key: i,
              tokens: colorize(line)
            }));
          };

          const handleCopy = () => copyToClipboard(code, "tokens-copied");

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Export Tokens</strong>
                {" "}— Design tokens in a three-tier architecture: primitives (raw values),
                semantic (purpose-mapped), and component (UI-specific). Select a format and
                copy to use in your project.
              </div>

              {!rolesAssigned && (
                <div style={{
                  marginBottom:14, padding:"12px 16px",
                  background:"#fff8f0", border:"1px solid #f0c060",
                  borderRadius:6, fontSize:10, color:"#8a5000", lineHeight:1.6
                }}>
                  <strong>Tip:</strong> Assign colour roles in the <strong>Colour Jobs</strong> tab for more
                  meaningful token names. We're using positional names (color-1, color-2…) for now.
                </div>
              )}

              {/* Format selector */}
              <div style={{ display:"flex", gap:4, marginBottom:12, flexWrap:"wrap" }}>
                {formats.map(f => (
                  <button key={f.key}
                    className={`tb ${tokenFormat === f.key ? "on" : ""}`}
                    style={{ fontSize:10, padding:"6px 14px", cursor:"pointer" }}
                    onClick={() => setTokenFormat(f.key)}>
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Code block */}
              <div style={{ position:"relative" }}>
                <button onClick={handleCopy} style={{
                  position:"absolute", top:10, right:10, fontSize:9,
                  padding:"4px 12px", background: copyConfirm === "tokens-copied" ? "#2a7a7a" : copyConfirm === "tokens-copied-fail" ? "#c04040" : "#f5f0e8",
                  border:"1px solid #e4ddd4",
                  borderRadius:4, cursor:"pointer", fontFamily:"'DM Mono', monospace",
                  color: copyConfirm === "tokens-copied" || copyConfirm === "tokens-copied-fail" ? "#fff" : "#888",
                  transition:"all .18s"
                }}>
                  {copyConfirm === "tokens-copied" ? "Copied!" : copyConfirm === "tokens-copied-fail" ? "Failed!" : "Copy"}
                </button>
                <pre style={{
                  background:"#1a1a2e", color:"#e8e0d4", padding:"20px 18px",
                  borderRadius:8, fontSize:10, lineHeight:1.7, overflowX:"auto",
                  fontFamily:"'DM Mono', monospace", margin:0
                }}>
                  {syntaxHighlight(code).map(line => (
                    <div key={line.key}>
                      {line.tokens.map((t, j) =>
                        t.col ? <span key={j} style={{ color: t.col }}>{t.text}</span> : t.text
                      )}
                    </div>
                  ))}
                </pre>
              </div>
            </div>
          );
        })()}

        {/* Brand Guide tab */}
        {tab === "guide" && (() => {
          const activePair = selectedFont || FONT_PAIRS[0];
          const headingFont = activePair.heading;
          const bodyFont = activePair.body;
          const data = colors.map(hex => { const {r,g,b} = hexToRgb(hex); return { hex, ...rgbToHsl(r,g,b), lum: luminance(r,g,b) }; });

          // Derive role colours
          const findByRole = (r) => Object.keys(roles).find(k => roles[k] === r);
          const bgCol = findByRole("Background") || (data.length ? data.reduce((b,c) => c.l > b.l ? c : b, data[0]).hex : "#f5f0e8");
          const heroCol = findByRole("Hero") || (data.length ? data.reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#b8703a");
          const accentCol = findByRole("Accent") || (data.length > 1 ? data.filter(c => c.hex !== heroCol).reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#2a7a7a");
          const txtCol = findByRole("Text") || (data.length ? data.reduce((b,c) => c.l < b.l ? c : b, data[0]).hex : "#1a1a2e");
          const neutralCol = findByRole("Neutral") || (data.length ? data.reduce((b,c) => { const sc = Math.abs(c.l-50)+(100-c.s); const sb = Math.abs(b.l-50)+(100-b.s); return sc<sb?c:b; }, data[0]).hex : "#888");

          // Section styling
          const sectionTitle = (text) => (
            <div style={{ fontFamily:headingFont, fontSize:20, color:txtCol, fontWeight:700, marginBottom:14, marginTop:28, borderBottom:`2px solid ${heroCol}`, paddingBottom:8 }}>{text}</div>
          );

          // Generate do/don't rules from contrast ratios
          const generateRules = () => {
            const rules = [];
            const pairs = [
              { a: "Text", aHex: txtCol, b: "Background", bHex: bgCol },
              { a: "Hero", aHex: heroCol, b: "Background", bHex: bgCol },
              { a: "Hero", aHex: heroCol, b: "Accent", bHex: accentCol },
              { a: "Text", aHex: txtCol, b: "Hero", bHex: heroCol },
              { a: "Accent", aHex: accentCol, b: "Background", bHex: bgCol },
            ];
            for (const p of pairs) {
              const cr = contrastRatio(p.aHex, p.bHex);
              if (cr >= 4.5) {
                rules.push({ type: "do", text: `Use ${p.a} on ${p.b} for body copy (contrast ${cr.toFixed(1)}:1).` });
              } else if (cr >= 3) {
                rules.push({ type: "caution", text: `${p.a} on ${p.b} is OK for large text only (contrast ${cr.toFixed(1)}:1).` });
              } else {
                rules.push({ type: "dont", text: `Never place ${p.a} directly on ${p.b} (contrast ${cr.toFixed(1)}:1 — fails WCAG).` });
              }
              if (rules.length >= 4) break;
            }
            return rules;
          };
          const usageRules = generateRules();

          // 60-30-10 mapping
          const proportionMap = [
            { role: "Background", pct: 60, col: bgCol },
            { role: "Hero / Accent", pct: 30, col: heroCol },
            { role: "Pop / CTA", pct: 10, col: accentCol },
          ];

          // Contrast matrix
          const contrastPairs = [];
          for (let i = 0; i < colors.length; i++) {
            for (let j = i + 1; j < colors.length; j++) {
              contrastPairs.push({ a: colors[i], b: colors[j], ratio: contrastRatio(colors[i], colors[j]) });
            }
          }

          const guideId = "brand-guide-content";

          const handlePrint = () => {
            // Inject print styles if not already present
            if (!document.getElementById("brand-guide-print-style")) {
              const style = document.createElement("style");
              style.id = "brand-guide-print-style";
              style.textContent = `@media print { body > * { display: none !important; } #${guideId} { display: block !important; } #${guideId} * { break-inside: avoid; } }`;
              document.head.appendChild(style);
            }
            window.print();
          };

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Brand Guide</strong>
                {" "}— A complete brand guidelines document generated from your palette,
                roles, and typography. Print or save as PDF for client delivery.
              </div>

              <div style={{ marginBottom:14 }}>
                <button className="tb on" style={{ fontSize:10, padding:"6px 14px", cursor:"pointer" }} onClick={handlePrint}>
                  Print / Save as PDF
                </button>
              </div>

              <div id={guideId} style={{
                background:"#fff", border:"1px solid #e4ddd4", borderRadius:8,
                padding:"40px 36px", maxWidth:720, margin:"0 auto",
                fontFamily:bodyFont, color:txtCol, lineHeight:1.8
              }}>
                {/* Header */}
                <div style={{ textAlign:"center", marginBottom:36 }}>
                  <div style={{ fontFamily:headingFont, fontSize:32, fontWeight:700, color:heroCol, marginBottom:6 }}>Brand Guidelines</div>
                  <div style={{ fontSize:12, color:neutralCol }}>Generated from Palette Studio</div>
                </div>

                {/* 1. Brand Colour Palette */}
                {sectionTitle("1. Brand Colour Palette")}
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))", gap:12, marginBottom:8 }}>
                  {colors.map((hex, idx) => {
                    const {r,g,b} = hexToRgb(hex);
                    const hsl = rgbToHsl(r,g,b);
                    const role = roles[hex];
                    return (
                      <div key={idx} style={{ background:"#faf8f5", border:"1px solid #e4ddd4", borderRadius:6, overflow:"hidden" }}>
                        <div style={{ height:48, background:hex }} />
                        <div style={{ padding:"10px 12px" }}>
                          {role && <div style={{ fontSize:10, fontWeight:600, color:heroCol, marginBottom:4 }}>{role}</div>}
                          <div style={{ fontFamily:"'DM Mono', monospace", fontSize:9, color:"#555", lineHeight:1.8 }}>
                            HEX: {hex}<br/>
                            RGB: {r}, {g}, {b}<br/>
                            HSL: {Math.round(hsl.h)}°, {Math.round(hsl.s)}%, {Math.round(hsl.l)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* 2. Colour Usage Rules */}
                {sectionTitle("2. Colour Usage Rules")}
                <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:8 }}>
                  {usageRules.map((rule, i) => (
                    <div key={i} style={{
                      padding:"10px 14px", borderRadius:6, fontSize:11, lineHeight:1.6,
                      background: rule.type === "do" ? "#f0f8f0" : rule.type === "caution" ? "#fff8f0" : "#fdf0f0",
                      border: `1px solid ${rule.type === "do" ? "#a0d0a0" : rule.type === "caution" ? "#f0c060" : "#e0a0a0"}`,
                      color: rule.type === "do" ? "#2a6a2a" : rule.type === "caution" ? "#8a5000" : "#8a2020",
                    }}>
                      <strong>{rule.type === "do" ? "DO" : rule.type === "caution" ? "CAUTION" : "DON'T"}:</strong> {rule.text}
                    </div>
                  ))}
                </div>

                {/* 3. Typography */}
                {sectionTitle("3. Typography")}
                <div style={{ marginBottom:8 }}>
                  <div style={{ marginBottom:16 }}>
                    <div style={{ fontSize:9, color:neutralCol, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Heading — {activePair.heading.replace(/'/g, "")}</div>
                    <div style={{ fontFamily:headingFont, fontSize:28, fontWeight:700, marginBottom:4 }}>Heading One</div>
                    <div style={{ fontFamily:headingFont, fontSize:22, fontWeight:600, marginBottom:4 }}>Heading Two</div>
                    <div style={{ fontFamily:headingFont, fontSize:16, fontWeight:600, marginBottom:4 }}>Subheading</div>
                  </div>
                  <div>
                    <div style={{ fontSize:9, color:neutralCol, textTransform:"uppercase", letterSpacing:".1em", marginBottom:6 }}>Body — {activePair.body.replace(/'/g, "")}</div>
                    <div style={{ fontFamily:bodyFont, fontSize:14, marginBottom:4 }}>Body text — The quick brown fox jumps over the lazy dog.</div>
                    <div style={{ fontFamily:bodyFont, fontSize:11, opacity:0.7, marginBottom:4 }}>Caption text — Secondary information and fine print details.</div>
                  </div>
                </div>

                {/* 4. Spacing & Proportion */}
                {sectionTitle("4. Spacing & Proportion")}
                <div style={{ fontSize:11, marginBottom:12, opacity:0.7 }}>
                  The 60-30-10 rule ensures visual hierarchy. Dominant colour covers 60%, secondary 30%, accent 10%.
                </div>
                <div style={{ display:"flex", gap:0, borderRadius:6, overflow:"hidden", height:48, marginBottom:8 }}>
                  {proportionMap.map((p, i) => (
                    <div key={i} style={{
                      flex: p.pct, background: p.col, display:"flex", alignItems:"center",
                      justifyContent:"center", color: textOn(p.col),
                      fontFamily:"'DM Mono', monospace", fontSize:9
                    }}>
                      {p.pct}% — {p.role}
                    </div>
                  ))}
                </div>

                {/* 5. Accessibility */}
                {sectionTitle("5. Accessibility")}
                <div style={{ fontSize:11, marginBottom:12, opacity:0.7 }}>
                  Contrast matrix — WCAG AA requires 4.5:1 for normal text, 3:1 for large text.
                </div>

                {/* Contrast matrix table */}
                <div style={{ overflowX:"auto", marginBottom:16 }}>
                  <table style={{ borderCollapse:"collapse", width:"100%", fontSize:9, fontFamily:"'DM Mono', monospace" }}>
                    <thead>
                      <tr>
                        <th style={{ padding:"6px 8px", borderBottom:"1px solid #e4ddd4" }}></th>
                        {colors.map((hex, i) => (
                          <th key={i} style={{ padding:"6px 4px", borderBottom:"1px solid #e4ddd4", textAlign:"center" }}>
                            <div style={{ width:16, height:16, borderRadius:3, background:hex, margin:"0 auto 2px", border:"1px solid #e4ddd4" }} />
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((hex1, i) => (
                        <tr key={i}>
                          <td style={{ padding:"4px 8px", borderBottom:"1px solid #f0ece8" }}>
                            <div style={{ width:16, height:16, borderRadius:3, background:hex1, border:"1px solid #e4ddd4" }} />
                          </td>
                          {colors.map((hex2, j) => {
                            if (i === j) return <td key={j} style={{ padding:"4px", borderBottom:"1px solid #f0ece8", textAlign:"center", color:"#ccc" }}>—</td>;
                            const cr = contrastRatio(hex1, hex2);
                            const pass = cr >= 4.5;
                            const large = cr >= 3;
                            return (
                              <td key={j} style={{
                                padding:"4px", borderBottom:"1px solid #f0ece8", textAlign:"center",
                                color: pass ? "#2a6a2a" : large ? "#8a5000" : "#c04040",
                                fontWeight: pass ? 600 : 400,
                              }}>
                                {cr.toFixed(1)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* CVD simulation thumbnails */}
                <div style={{ fontSize:11, marginBottom:8, opacity:0.7 }}>Colour-vision deficiency simulation:</div>
                <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
                  {CVD_TYPES.map(cvd => (
                    <div key={cvd.key} style={{ textAlign:"center" }}>
                      <div style={{ fontSize:9, color:neutralCol, marginBottom:4 }}>{cvd.label}</div>
                      <div style={{ display:"flex", borderRadius:4, overflow:"hidden" }}>
                        {colors.map((hex, i) => {
                          const {r,g,b} = hexToRgb(hex);
                          return <div key={i} style={{ width:24, height:24, background: simulateCVD(r,g,b,cvd.key) }} />;
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}

        {/* Competitor Analysis tab */}
        {tab === "competitor" && (() => {
          const processCompFile = async (file) => {
            if (!file || !file.type.startsWith("image/")) return;
            setCompExtracting(true);
            if (competitorImage) URL.revokeObjectURL(competitorImage);
            setCompetitorImage(URL.createObjectURL(file));
            try {
              const cols = await extractColorsFromImage(file, 10);
              setCompetitorColors(cols.slice(0, 6));
            } catch(e) {
              setCompetitorColors([]);
            } finally {
              setCompExtracting(false);
            }
          };

          const handleCompDrop = (e) => {
            e.preventDefault(); setCompDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) processCompFile(f);
          };

          const analyzeColors = (cols) => {
            const d = cols.map(hex => { const {r,g,b} = hexToRgb(hex); return { hex, ...rgbToHsl(r,g,b), lum: luminance(r,g,b) }; });
            const avgSat = d.length ? d.reduce((a,c) => a+c.s, 0) / d.length : 0;
            const avgLight = d.length ? d.reduce((a,c) => a+c.l, 0) / d.length : 0;
            const hues = d.map(c => c.h);
            const warm = d.filter(c => { const t = tempCategory(c.h, c.s); return t.label === "warm" || t.label === "warm-green"; }).length;
            const cool = d.filter(c => { const t = tempCategory(c.h, c.s); return t.label === "cool" || t.label === "cool-purple"; }).length;
            const neutral = d.filter(c => { const t = tempCategory(c.h, c.s); return t.label === "neutral" || t.label === "natural"; }).length;
            const total = d.length || 1;
            const issues = d.length >= 2 ? diagnose(cols) : [];
            const score = healthScore(issues);
            return { d, avgSat, avgLight, hues, warm: Math.round(warm/total*100), cool: Math.round(cool/total*100), neutral: Math.round(neutral/total*100), score };
          };

          const yours = analyzeColors(colors);
          const theirs = competitorColors.length ? analyzeColors(competitorColors) : null;

          // Generate insights
          const insights = [];
          if (theirs) {
            if (yours.avgSat - theirs.avgSat > 15) insights.push("Your palette is significantly more saturated, giving it more energy and visual punch.");
            else if (theirs.avgSat - yours.avgSat > 15) insights.push("The competitor uses more saturated colours — consider boosting vibrancy to compete for attention.");
            else insights.push("Both palettes have similar saturation levels, competing on equal visual energy.");

            if (yours.avgLight - theirs.avgLight > 15) insights.push("Your palette runs lighter, projecting an airy, open feel vs their darker, heavier tone.");
            else if (theirs.avgLight - yours.avgLight > 15) insights.push("The competitor uses a lighter palette — yours feels more grounded and authoritative.");

            if (Math.abs(yours.warm - theirs.warm) > 25) insights.push(yours.warm > theirs.warm ? "Your palette skews warmer, feeling more inviting and energetic." : "The competitor leans warmer — your cooler tones convey calm professionalism.");

            if (Math.abs(yours.score - theirs.score) > 15) insights.push(yours.score > theirs.score ? `Your health score (${yours.score}) beats theirs (${theirs.score}) — better technical quality.` : `Their health score (${theirs.score}) edges yours (${yours.score}) — review the Issues tab for fixes.`);

            // Hue spread
            const hueSpread = (hues) => { if (hues.length < 2) return 0; const sorted = [...hues].sort((a,b)=>a-b); let maxGap = 0; for (let i=1;i<sorted.length;i++) maxGap = Math.max(maxGap, sorted[i]-sorted[i-1]); maxGap = Math.max(maxGap, 360 - sorted[sorted.length-1] + sorted[0]); return 360 - maxGap; };
            const yourSpread = hueSpread(yours.hues);
            const theirSpread = hueSpread(theirs.hues);
            if (yourSpread - theirSpread > 60) insights.push("Your hue range is broader — more versatile but risks feeling scattered. Consider tightening.");
            else if (theirSpread - yourSpread > 60) insights.push("The competitor uses a wider hue range. Your tighter palette feels more cohesive and focused.");

            if (insights.length < 3) insights.push("Both palettes occupy a similar colour space — differentiation will come from usage and proportion.");
          }

          // SVG hue wheel renderer
          const HueWheel = ({ analysisData, size = 100 }) => {
            const cx = size/2, cy = size/2, r = size/2 - 8;
            return (
              <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e4ddd4" strokeWidth={1}/>
                {analysisData.d.map((c, i) => {
                  const angle = (c.h - 90) * Math.PI / 180;
                  const dotR = 4 + (c.s / 100) * 4;
                  const dist = r * 0.85;
                  return <circle key={i} cx={cx + Math.cos(angle)*dist} cy={cy + Math.sin(angle)*dist} r={dotR} fill={c.hex} stroke="#fff" strokeWidth={1.5}/>;
                })}
              </svg>
            );
          };

          // SVG scatter plot (S vs L)
          const ScatterPlot = ({ analysisData, size = 120 }) => (
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
              <rect x={0} y={0} width={size} height={size} fill="#faf8f5" rx={4}/>
              <line x1={10} y1={size-10} x2={size-10} y2={size-10} stroke="#e4ddd4" strokeWidth={1}/>
              <line x1={10} y1={10} x2={10} y2={size-10} stroke="#e4ddd4" strokeWidth={1}/>
              <text x={size/2} y={size-1} textAnchor="middle" fontSize={7} fill="#aaa">Saturation</text>
              <text x={2} y={size/2} textAnchor="middle" fontSize={7} fill="#aaa" transform={`rotate(-90,2,${size/2})`}>Lightness</text>
              {analysisData.d.map((c, i) => {
                const x = 10 + (c.s / 100) * (size - 20);
                const y = size - 10 - (c.l / 100) * (size - 20);
                return <circle key={i} cx={x} cy={y} r={5} fill={c.hex} stroke="#fff" strokeWidth={1.5}/>;
              })}
            </svg>
          );

          const TempBar = ({ warm, cool, neutral }) => (
            <div style={{ display:"flex", height:12, borderRadius:6, overflow:"hidden", width:"100%" }}>
              {warm > 0 && <div style={{ flex: warm, background:"#c05020" }}/>}
              {neutral > 0 && <div style={{ flex: neutral, background:"#888" }}/>}
              {cool > 0 && <div style={{ flex: cool, background:"#205080" }}/>}
            </div>
          );

          const PaletteColumn = ({ label, cols, analysis }) => (
            <div style={{ flex:1, minWidth:240 }}>
              <div style={{ fontFamily:"'Playfair Display', serif", fontSize:14, fontWeight:600, color:"#444", marginBottom:12 }}>{label}</div>

              {/* Swatches */}
              <div style={{ display:"flex", gap:0, borderRadius:6, overflow:"hidden", marginBottom:14 }}>
                {cols.map((hex, i) => <div key={i} style={{ flex:1, height:36, background:hex }}/>)}
              </div>

              {/* Hue wheel */}
              <div style={{ textAlign:"center", marginBottom:10 }}>
                <div style={{ fontSize:9, color:"#aaa", marginBottom:4 }}>Hue Distribution</div>
                <HueWheel analysisData={analysis} />
              </div>

              {/* Scatter */}
              <div style={{ textAlign:"center", marginBottom:10 }}>
                <div style={{ fontSize:9, color:"#aaa", marginBottom:4 }}>Saturation / Lightness</div>
                <ScatterPlot analysisData={analysis} />
              </div>

              {/* Temperature */}
              <div style={{ marginBottom:10 }}>
                <div style={{ fontSize:9, color:"#aaa", marginBottom:4 }}>Temperature</div>
                <TempBar warm={analysis.warm} cool={analysis.cool} neutral={analysis.neutral} />
                <div style={{ display:"flex", justifyContent:"space-between", fontSize:8, color:"#aaa", marginTop:2 }}>
                  <span>Warm {analysis.warm}%</span><span>Neutral {analysis.neutral}%</span><span>Cool {analysis.cool}%</span>
                </div>
              </div>

              {/* Health */}
              <div style={{ fontSize:10, color:"#555" }}>
                Health Score: <strong style={{ color: analysis.score >= 70 ? "#2a6a2a" : analysis.score >= 40 ? "#8a5000" : "#c04040" }}>{analysis.score}/100</strong>
              </div>
            </div>
          );

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Competitor Analysis</strong>
                {" "}— Upload a competitor's logo or screenshot to extract their palette
                and compare it side-by-side with yours across hue, saturation, lightness,
                temperature, and overall health.
              </div>

              {/* Upload zone */}
              {!competitorImage && (
                <div className="card" style={{ marginBottom:14, padding:0 }}>
                  <div
                    onDragOver={e => { e.preventDefault(); setCompDragging(true); }}
                    onDragLeave={() => setCompDragging(false)}
                    onDrop={handleCompDrop}
                    onClick={() => compFileRef.current?.click()}
                    style={{
                      border: `2px dashed ${compDragging ? "#b8703a" : "#e0d8cc"}`,
                      borderRadius:6, padding:"24px", textAlign:"center",
                      cursor:"pointer", background: compDragging ? "#fff8f0" : "#faf8f5",
                      transition:"all .18s"
                    }}
                  >
                    <div style={{ fontSize:22, marginBottom:6, opacity:.4 }}>^</div>
                    <div style={{ fontSize:11, color: compDragging ? "#b8703a" : "#aaa", marginBottom:3 }}>
                      {compDragging ? "Drop it here!" : "Upload a competitor's logo or screenshot"}
                    </div>
                    <div style={{ fontSize:9, color:"#ccc" }}>Drag & drop or click to browse — PNG, JPG, WebP, SVG, GIF</div>
                    <input ref={compFileRef} type="file" accept="image/*" style={{ display:"none" }}
                      onChange={e => { const f = e.target.files?.[0]; if (f) processCompFile(f); e.target.value=""; }}
                    />
                  </div>
                </div>
              )}

              {compExtracting && (
                <div style={{ textAlign:"center", padding:"24px 0" }}>
                  <div style={{ fontSize:10, color:"#b8703a", letterSpacing:".15em", textTransform:"uppercase" }}>Scanning colours...</div>
                </div>
              )}

              {competitorImage && competitorColors.length > 0 && (
                <div>
                  {/* Reset */}
                  <div style={{ marginBottom:14, textAlign:"right" }}>
                    <button onClick={() => { setCompetitorColors([]); setCompetitorImage(null); }} style={{
                      fontSize:9, color:"#b8703a", background:"none", border:"none", cursor:"pointer", textDecoration:"underline"
                    }}>Upload a different image</button>
                  </div>

                  {/* Side by side */}
                  <div className="card" style={{ marginBottom:14, display:"flex", gap:24, flexWrap:"wrap" }}>
                    <PaletteColumn label="Your Brand" cols={colors} analysis={yours} />
                    <div style={{ width:1, background:"#e4ddd4", alignSelf:"stretch" }}/>
                    <PaletteColumn label="Competitor" cols={competitorColors} analysis={theirs} />
                  </div>

                  {/* Insights */}
                  <div className="card" style={{ marginBottom:14 }}>
                    <div style={{ fontFamily:"'Playfair Display', serif", fontSize:14, fontWeight:600, color:"#444", marginBottom:10 }}>Insights</div>
                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                      {insights.map((text, i) => (
                        <div key={i} style={{
                          fontSize:11, lineHeight:1.6, padding:"8px 12px",
                          background:"#faf8f5", border:"1px solid #e4ddd4", borderRadius:6, color:"#555"
                        }}>
                          {text}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Edit Mockups tab */}
        {tab === "editor" && (() => {
          const activePair = selectedFont || FONT_PAIRS[0];
          const headingFont = activePair.heading;
          const bodyFont = activePair.body;
          const data = colors.map(hex => { const {r,g,b} = hexToRgb(hex); return { hex, ...rgbToHsl(r,g,b), lum: luminance(r,g,b) }; });

          const bgCol = Object.keys(roles).find(k => roles[k] === "Background")
            || (data.length ? data.reduce((b,c) => c.l > b.l ? c : b, data[0]).hex : "#f5f0e8");
          const heroCol = Object.keys(roles).find(k => roles[k] === "Hero")
            || (data.length ? data.reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#b8703a");
          const accentCol = Object.keys(roles).find(k => roles[k] === "Accent")
            || (data.length && data.length > 1 ? data.filter(c => c.hex !== heroCol).reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#2a7a7a");
          const txtCol = Object.keys(roles).find(k => roles[k] === "Text")
            || (data.length ? data.reduce((b,c) => c.l < b.l ? c : b, data[0]).hex : "#1a1a2e");
          const neutralCol = Object.keys(roles).find(k => roles[k] === "Neutral")
            || (data.length ? data.reduce((b,c) => { const sc = Math.abs(c.l-50)+(100-c.s); const sb = Math.abs(b.l-50)+(100-b.s); return sc<sb?c:b; }, data[0]).hex : "#888888");

          const resetDefaults = () => {
            setCompanyName("YourBrand"); setTagline("Build Something Beautiful");
            setPersonName("Jane Doe"); setPersonTitle("Creative Director");
            setEmail("hello@yourbrand.com"); setPhone("+1 (555) 123-4567");
          };

          const templateCardStyle = {
            background:"#fff", border:"1px solid #e4ddd4",
            borderRadius:8, overflow:"hidden", marginBottom:14
          };
          const descStyle = {
            padding:"14px 18px", fontSize:10, color:"#888",
            lineHeight:1.7, borderTop:"1px solid #f0ece8"
          };
          const inputStyle = {
            fontFamily:"'DM Mono', monospace", fontSize:11, padding:"6px 10px",
            border:"1px solid #e4ddd4", borderRadius:4, background:"#faf8f5",
            color:"#444", width:"100%", outline:"none"
          };

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Edit Mockups</strong>
                {" "}— Customise the text in every template mockup. Type your real brand details
                and watch all templates update live.
              </div>

              {/* Editable fields card */}
              <div className="card" style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                  <div style={{ fontFamily:"'Playfair Display', serif", fontSize:13, fontWeight:600, color:"#444" }}>Brand Details</div>
                  <button onClick={resetDefaults} style={{
                    fontSize:9, color:"#b8703a", background:"none", border:"none", cursor:"pointer", textDecoration:"underline"
                  }}>Reset to defaults</button>
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(200px, 1fr))", gap:10 }}>
                  {[
                    { label: "Company Name", value: companyName, set: setCompanyName },
                    { label: "Tagline", value: tagline, set: setTagline },
                    { label: "Person Name", value: personName, set: setPersonName },
                    { label: "Title / Role", value: personTitle, set: setPersonTitle },
                    { label: "Email", value: email, set: setEmail },
                    { label: "Phone", value: phone, set: setPhone },
                  ].map(f => (
                    <div key={f.label}>
                      <div style={{ fontSize:9, color:"#aaa", marginBottom:3, textTransform:"uppercase", letterSpacing:".08em" }}>{f.label}</div>
                      <input style={inputStyle} value={f.value} onChange={e => f.set(e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Templates grid */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))", gap:14 }}>

                {/* Business Card */}
                <div style={templateCardStyle}>
                  <div style={{
                    padding:"28px 32px", background:bgCol,
                    display:"flex", flexDirection:"column", justifyContent:"space-between",
                    minHeight:200, position:"relative"
                  }}>
                    <div style={{ width:36, height:4, background:heroCol, borderRadius:2, marginBottom:16 }}/>
                    <div>
                      <div style={{ fontFamily:headingFont, fontSize:20, color:txtCol, marginBottom:4, fontWeight:600 }}>{personName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:11, color:txtCol, opacity:.7, marginBottom:14 }}>{personTitle}</div>
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}40`, paddingTop:12 }}>
                      <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.6, lineHeight:1.8 }}>
                        {email}<br/>{phone}<br/>www.{companyName.toLowerCase().replace(/\s+/g, "")}.com
                      </div>
                    </div>
                    <div style={{ position:"absolute", top:0, right:0, width:48, height:"100%", background:heroCol }}/>
                  </div>
                  <div style={descStyle}><strong>Business Card</strong></div>
                </div>

                {/* Social Post */}
                <div style={templateCardStyle}>
                  <div style={{
                    width:"100%", aspectRatio:"1/1", background:heroCol,
                    display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", padding:"32px 28px", position:"relative", maxHeight:380
                  }}>
                    <div style={{
                      fontFamily:headingFont, fontSize:28, color:textOn(heroCol),
                      textAlign:"center", fontWeight:700, marginBottom:12, lineHeight:1.3
                    }}>{tagline}</div>
                    <div style={{
                      fontFamily:bodyFont, fontSize:12, color:textOn(heroCol),
                      textAlign:"center", opacity:.85, marginBottom:20, lineHeight:1.6, maxWidth:260
                    }}>Something exciting is coming. Stay tuned for updates and be the first to know.</div>
                    <div style={{
                      background:accentCol, color:textOn(accentCol),
                      fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                      textTransform:"uppercase", padding:"10px 24px", borderRadius:4,
                      boxShadow:"0 2px 8px rgba(0,0,0,.15)"
                    }}>Learn More</div>
                    <div style={{
                      position:"absolute", bottom:16, fontFamily:bodyFont,
                      fontSize:9, color:textOn(heroCol), opacity:.5
                    }}>@{companyName.toLowerCase().replace(/\s+/g, "")}</div>
                  </div>
                  <div style={descStyle}><strong>Social Post</strong></div>
                </div>

                {/* Website Hero */}
                <div style={templateCardStyle}>
                  <div style={{ background:bgCol, minHeight:280 }}>
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"12px 24px", borderBottom:`1px solid ${neutralCol}30`
                    }}>
                      <div style={{ fontFamily:headingFont, fontSize:14, color:txtCol, fontWeight:600 }}>{companyName}</div>
                      <div style={{ display:"flex", gap:16 }}>
                        {["About","Services","Contact"].map(item => (
                          <span key={item} style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, cursor:"default" }}>{item}</span>
                        ))}
                        <span style={{
                          fontFamily:bodyFont, fontSize:9, color:textOn(accentCol),
                          background:accentCol, padding:"4px 12px", borderRadius:3,
                          letterSpacing:".08em", textTransform:"uppercase"
                        }}>Get Started</span>
                      </div>
                    </div>
                    <div style={{ padding:"40px 24px 32px", textAlign:"center" }}>
                      <div style={{
                        fontFamily:headingFont, fontSize:28, color:txtCol,
                        fontWeight:700, marginBottom:10, lineHeight:1.3
                      }}>{tagline}</div>
                      <div style={{
                        fontFamily:bodyFont, fontSize:12, color:txtCol,
                        opacity:.65, lineHeight:1.7, maxWidth:400, margin:"0 auto 20px"
                      }}>We help brands stand out with thoughtful design and strategic thinking. Let us bring your vision to life.</div>
                      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                        <div style={{
                          background:heroCol, color:textOn(heroCol),
                          fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                          textTransform:"uppercase", padding:"10px 22px", borderRadius:4,
                          boxShadow:"0 2px 8px rgba(0,0,0,.12)"
                        }}>Get Started</div>
                        <div style={{
                          background:"transparent", color:txtCol,
                          fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                          textTransform:"uppercase", padding:"10px 22px", borderRadius:4,
                          border:`1px solid ${neutralCol}`
                        }}>Learn More</div>
                      </div>
                    </div>
                  </div>
                  <div style={descStyle}><strong>Website Hero</strong></div>
                </div>

                {/* Email Signature */}
                <div style={templateCardStyle}>
                  <div style={{ padding:"24px 28px", background:bgCol }}>
                    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                      <div style={{
                        width:56, height:56, borderRadius:"50%", background:heroCol,
                        flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:"0 2px 8px rgba(0,0,0,.1)"
                      }}>
                        <span style={{ fontFamily:headingFont, fontSize:22, color:textOn(heroCol), fontWeight:600 }}>{personName.charAt(0)}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily:headingFont, fontSize:16, color:txtCol, fontWeight:600, marginBottom:2 }}>{personName}</div>
                        <div style={{ fontFamily:bodyFont, fontSize:10, color:accentCol, marginBottom:8 }}>{personTitle} at {companyName}</div>
                        <div style={{ width:32, height:2, background:heroCol, borderRadius:1, marginBottom:8 }}/>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.6, lineHeight:1.8 }}>
                          {phone} · {email}
                        </div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, marginTop:2 }}>
                          www.{companyName.toLowerCase().replace(/\s+/g, "")}.com
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={descStyle}><strong>Email Signature</strong></div>
                </div>

                {/* Invoice */}
                <div style={templateCardStyle}>
                  <div style={{ background:bgCol, padding:"24px 28px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                      <div>
                        <div style={{ fontFamily:headingFont, fontSize:18, color:txtCol, fontWeight:600 }}>INVOICE</div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, marginTop:4 }}>#INV-2024-0042</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:headingFont, fontSize:12, color:heroCol, fontWeight:600 }}>{companyName}</div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, lineHeight:1.6 }}>123 Design Street<br/>New York, NY 10001</div>
                      </div>
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}40`, marginBottom:12 }}/>
                    <div style={{ marginBottom:12 }}>
                      {[
                        ["Brand Strategy Workshop", "2", "$950.00", "$1,900.00"],
                        ["Logo Design Package", "1", "$2,400.00", "$2,400.00"],
                        ["Brand Guidelines Document", "1", "$800.00", "$800.00"],
                      ].map(([desc, qty, rate, total], idx) => (
                        <div key={idx} style={{
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"8px 0", borderBottom:`1px solid ${neutralCol}20`,
                          fontFamily:bodyFont, fontSize:10, color:txtCol
                        }}>
                          <span style={{ flex:2 }}>{desc}</span>
                          <span style={{ flex:.5, textAlign:"center", opacity:.6 }}>{qty}</span>
                          <span style={{ flex:1, textAlign:"right", opacity:.6 }}>{rate}</span>
                          <span style={{ flex:1, textAlign:"right", fontWeight:500 }}>{total}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{ display:"flex", justifyContent:"flex-end", alignItems:"center", gap:20, padding:"10px 0" }}>
                      <span style={{ fontFamily:bodyFont, fontSize:11, color:txtCol, opacity:.6 }}>Total Due</span>
                      <span style={{ fontFamily:headingFont, fontSize:20, color:heroCol, fontWeight:700 }}>$5,100.00</span>
                    </div>
                    <div style={{
                      marginTop:12, padding:"8px 14px", background:`${accentCol}15`,
                      borderRadius:4, fontFamily:bodyFont, fontSize:9,
                      color:accentCol, textAlign:"center"
                    }}>Payment due within 30 days · Thank you for your business</div>
                  </div>
                  <div style={descStyle}><strong>Invoice</strong></div>
                </div>

                {/* Letterhead */}
                <div style={templateCardStyle}>
                  <div style={{
                    background:bgCol, padding:"28px 32px", minHeight:320,
                    display:"flex", flexDirection:"column", position:"relative"
                  }}>
                    <div style={{
                      position:"absolute", top:0, left:0, width:"100%", height:5,
                      background:`linear-gradient(90deg, ${heroCol}, ${accentCol})`
                    }}/>
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      marginBottom:28, paddingTop:8
                    }}>
                      <div style={{ fontFamily:headingFont, fontSize:16, color:txtCol, fontWeight:600 }}>{companyName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:8, color:txtCol, opacity:.5, textAlign:"right", lineHeight:1.6 }}>
                        123 Design Street · New York, NY 10001<br/>{email} · {phone}
                      </div>
                    </div>
                    <div style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, marginBottom:8 }}>
                      April 1, 2026
                    </div>
                    <div style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, marginBottom:16 }}>
                      Dear Valued Client,
                    </div>
                    <div style={{
                      fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.7,
                      lineHeight:1.85, marginBottom:20, flex:1
                    }}>
                      Thank you for choosing {companyName}. We are thrilled to partner with you on this
                      exciting project. Our team is committed to delivering exceptional results that
                      exceed your expectations and elevate your brand presence.
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}30`, paddingTop:14, marginTop:"auto" }}>
                      <div style={{ fontFamily:headingFont, fontSize:11, color:heroCol, fontWeight:600, marginBottom:2 }}>{personName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5 }}>{personTitle}</div>
                    </div>
                  </div>
                  <div style={descStyle}><strong>Letterhead</strong></div>
                </div>

              </div>
            </div>
          );
        })()}

        {tab === "templates" && (() => {
          const activePair = selectedFont || FONT_PAIRS[0];
          const headingFont = activePair.heading;
          const bodyFont = activePair.body;
          // Derive colours from roles, falling back to palette best-guesses
          const data = colors.map(hex => { const {r,g,b} = hexToRgb(hex); return { hex, ...rgbToHsl(r,g,b), lum: luminance(r,g,b) }; });
          const rolesAssigned = Object.keys(roles).length >= 2;
          const bgCol = Object.keys(roles).find(k => roles[k] === "Background")
            || (data.length ? data.reduce((b,c) => c.l > b.l ? c : b, data[0]).hex : "#f5f0e8");
          const heroCol = Object.keys(roles).find(k => roles[k] === "Hero")
            || (data.length ? data.reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#b8703a");
          const accentCol = Object.keys(roles).find(k => roles[k] === "Accent")
            || (data.length && data.length > 1 ? data.filter(c => c.hex !== heroCol).reduce((b,c) => c.s > b.s ? c : b, data[0]).hex : "#2a7a7a");
          const txtCol = Object.keys(roles).find(k => roles[k] === "Text")
            || (data.length ? data.reduce((b,c) => c.l < b.l ? c : b, data[0]).hex : "#1a1a2e");
          const neutralCol = Object.keys(roles).find(k => roles[k] === "Neutral")
            || (data.length ? data.reduce((b,c) => { const sc = Math.abs(c.l - 50) + (100 - c.s); const sb = Math.abs(b.l - 50) + (100 - b.s); return sc < sb ? c : b; }, data[0]).hex : "#888888");

          const tipBanner = !rolesAssigned && (
            <div style={{
              marginBottom:14, padding:"12px 16px",
              background:"#fff8f0", border:"1px solid #f0c060",
              borderRadius:6, fontSize:10, color:"#8a5000", lineHeight:1.6
            }}>
              <strong>Tip:</strong> Assign colour roles in the <strong>Colour Jobs</strong> tab for best results.
              We're using our best guess from your palette for now.
            </div>
          );

          const templateCardStyle = {
            background:"#fff", border:"1px solid #e4ddd4",
            borderRadius:8, overflow:"hidden", marginBottom:14
          };
          const descStyle = {
            padding:"14px 18px", fontSize:10, color:"#888",
            lineHeight:1.7, borderTop:"1px solid #f0ece8"
          };

          return (
            <div>
              <div className="card" style={{ marginBottom:14, fontSize:11, color:"#888", lineHeight:1.75 }}>
                <strong style={{ color:"#555" }}>Brand Templates</strong>
                {" "}— Live mockups using your palette colours and selected typography.
                Change colours, fix issues, reassign roles, or switch fonts — everything updates instantly.
                {selectedFont && (
                  <span style={{ color:"#b8703a" }}> Using <strong>{selectedFont.name}</strong> font pair.</span>
                )}
              </div>
              {tipBanner}

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(380px, 1fr))", gap:14 }}>

                {/* Business Card */}
                <div style={templateCardStyle}>
                  <div style={{
                    padding:"28px 32px", background:bgCol,
                    display:"flex", flexDirection:"column", justifyContent:"space-between",
                    minHeight:200, position:"relative"
                  }}>
                    <div style={{ width:36, height:4, background:heroCol, borderRadius:2, marginBottom:16 }}/>
                    <div>
                      <div style={{ fontFamily:headingFont, fontSize:20, color:txtCol, marginBottom:4, fontWeight:600 }}>{personName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:11, color:txtCol, opacity:.7, marginBottom:14 }}>{personTitle}</div>
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}40`, paddingTop:12 }}>
                      <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.6, lineHeight:1.8 }}>
                        {email}<br/>
                        {phone}<br/>
                        www.{companyName.toLowerCase().replace(/\s+/g, "")}.com
                      </div>
                    </div>
                    <div style={{
                      position:"absolute", top:0, right:0, width:48, height:"100%",
                      background:heroCol, borderRadius:"0"
                    }}/>
                  </div>
                  <div style={descStyle}>
                    <strong>Business Card</strong> — Background uses <em>bg</em>, stripe uses <em>hero</em>, text uses <em>text</em>, divider uses <em>neutral</em>.
                  </div>
                </div>

                {/* Social Post */}
                <div style={templateCardStyle}>
                  <div style={{
                    width:"100%", aspectRatio:"1/1", background:heroCol,
                    display:"flex", flexDirection:"column", alignItems:"center",
                    justifyContent:"center", padding:"32px 28px", position:"relative",
                    maxHeight: 380,
                  }}>
                    <div style={{
                      fontFamily:headingFont, fontSize:28, color:textOn(heroCol),
                      textAlign:"center", fontWeight:700, marginBottom:12, lineHeight:1.3
                    }}>{tagline}</div>
                    <div style={{
                      fontFamily:bodyFont, fontSize:12, color:textOn(heroCol),
                      textAlign:"center", opacity:.85, marginBottom:20, lineHeight:1.6, maxWidth:260
                    }}>Something exciting is coming. Stay tuned for updates and be the first to know.</div>
                    <div style={{
                      background:accentCol, color:textOn(accentCol),
                      fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                      textTransform:"uppercase", padding:"10px 24px", borderRadius:4,
                      boxShadow:"0 2px 8px rgba(0,0,0,.15)"
                    }}>Learn More</div>
                    <div style={{
                      position:"absolute", bottom:16, fontFamily:bodyFont,
                      fontSize:9, color:textOn(heroCol), opacity:.5
                    }}>@{companyName.toLowerCase().replace(/\s+/g, "")}</div>
                  </div>
                  <div style={descStyle}>
                    <strong>Social Post</strong> — Instagram square format. Background uses <em>hero</em>, CTA button uses <em>accent</em>.
                  </div>
                </div>

                {/* Website Hero */}
                <div style={templateCardStyle}>
                  <div style={{ background:bgCol, minHeight:280 }}>
                    {/* Nav */}
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      padding:"12px 24px", borderBottom:`1px solid ${neutralCol}30`
                    }}>
                      <div style={{ fontFamily:headingFont, fontSize:14, color:txtCol, fontWeight:600 }}>{companyName}</div>
                      <div style={{ display:"flex", gap:16 }}>
                        {["About","Services","Contact"].map(item => (
                          <span key={item} style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, cursor:"default" }}>{item}</span>
                        ))}
                        <span style={{
                          fontFamily:bodyFont, fontSize:9, color:textOn(accentCol),
                          background:accentCol, padding:"4px 12px", borderRadius:3,
                          letterSpacing:".08em", textTransform:"uppercase"
                        }}>Get Started</span>
                      </div>
                    </div>
                    {/* Hero section */}
                    <div style={{ padding:"40px 24px 32px", textAlign:"center" }}>
                      <div style={{
                        fontFamily:headingFont, fontSize:28, color:txtCol,
                        fontWeight:700, marginBottom:10, lineHeight:1.3
                      }}>{tagline}</div>
                      <div style={{
                        fontFamily:bodyFont, fontSize:12, color:txtCol,
                        opacity:.65, lineHeight:1.7, maxWidth:400, margin:"0 auto 20px"
                      }}>We help brands stand out with thoughtful design and strategic thinking. Let us bring your vision to life.</div>
                      <div style={{ display:"flex", gap:10, justifyContent:"center" }}>
                        <div style={{
                          background:heroCol, color:textOn(heroCol),
                          fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                          textTransform:"uppercase", padding:"10px 22px", borderRadius:4,
                          boxShadow:"0 2px 8px rgba(0,0,0,.12)"
                        }}>Get Started</div>
                        <div style={{
                          background:"transparent", color:txtCol,
                          fontFamily:bodyFont, fontSize:10, letterSpacing:".1em",
                          textTransform:"uppercase", padding:"10px 22px", borderRadius:4,
                          border:`1px solid ${neutralCol}`
                        }}>Learn More</div>
                      </div>
                    </div>
                  </div>
                  <div style={descStyle}>
                    <strong>Website Hero</strong> — Nav bar + hero section. Primary CTA uses <em>hero</em>, secondary uses <em>neutral</em> border, nav CTA uses <em>accent</em>.
                  </div>
                </div>

                {/* Email Signature */}
                <div style={templateCardStyle}>
                  <div style={{ padding:"24px 28px", background:bgCol }}>
                    <div style={{ display:"flex", gap:16, alignItems:"flex-start" }}>
                      <div style={{
                        width:56, height:56, borderRadius:"50%", background:heroCol,
                        flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center",
                        boxShadow:"0 2px 8px rgba(0,0,0,.1)"
                      }}>
                        <span style={{ fontFamily:headingFont, fontSize:22, color:textOn(heroCol), fontWeight:600 }}>{personName.charAt(0)}</span>
                      </div>
                      <div>
                        <div style={{ fontFamily:headingFont, fontSize:16, color:txtCol, fontWeight:600, marginBottom:2 }}>{personName}</div>
                        <div style={{ fontFamily:bodyFont, fontSize:10, color:accentCol, marginBottom:8 }}>{personTitle} at {companyName}</div>
                        <div style={{ width:32, height:2, background:heroCol, borderRadius:1, marginBottom:8 }}/>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.6, lineHeight:1.8 }}>
                          {phone} · {email}
                        </div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, marginTop:2 }}>
                          www.{companyName.toLowerCase().replace(/\s+/g, "")}.com
                        </div>
                      </div>
                    </div>
                  </div>
                  <div style={descStyle}>
                    <strong>Email Signature</strong> — Avatar uses <em>hero</em>, title uses <em>accent</em>, text on <em>bg</em> background.
                  </div>
                </div>

                {/* Invoice */}
                <div style={templateCardStyle}>
                  <div style={{ background:bgCol, padding:"24px 28px" }}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:20 }}>
                      <div>
                        <div style={{ fontFamily:headingFont, fontSize:18, color:txtCol, fontWeight:600 }}>INVOICE</div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, marginTop:4 }}>#INV-2024-0042</div>
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontFamily:headingFont, fontSize:12, color:heroCol, fontWeight:600 }}>{companyName}</div>
                        <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5, lineHeight:1.6 }}>123 Design Street<br/>New York, NY 10001</div>
                      </div>
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}40`, marginBottom:12 }}/>
                    {/* Line items */}
                    <div style={{ marginBottom:12 }}>
                      {[
                        ["Brand Strategy Workshop", "2", "$950.00", "$1,900.00"],
                        ["Logo Design Package", "1", "$2,400.00", "$2,400.00"],
                        ["Brand Guidelines Document", "1", "$800.00", "$800.00"],
                      ].map(([desc, qty, rate, total], idx) => (
                        <div key={idx} style={{
                          display:"flex", justifyContent:"space-between", alignItems:"center",
                          padding:"8px 0", borderBottom:`1px solid ${neutralCol}20`,
                          fontFamily:bodyFont, fontSize:10, color:txtCol
                        }}>
                          <span style={{ flex:2 }}>{desc}</span>
                          <span style={{ flex:.5, textAlign:"center", opacity:.6 }}>{qty}</span>
                          <span style={{ flex:1, textAlign:"right", opacity:.6 }}>{rate}</span>
                          <span style={{ flex:1, textAlign:"right", fontWeight:500 }}>{total}</span>
                        </div>
                      ))}
                    </div>
                    <div style={{
                      display:"flex", justifyContent:"flex-end", alignItems:"center",
                      gap:20, padding:"10px 0"
                    }}>
                      <span style={{ fontFamily:bodyFont, fontSize:11, color:txtCol, opacity:.6 }}>Total Due</span>
                      <span style={{ fontFamily:headingFont, fontSize:20, color:heroCol, fontWeight:700 }}>$5,100.00</span>
                    </div>
                    <div style={{
                      marginTop:12, padding:"8px 14px", background:`${accentCol}15`,
                      borderRadius:4, fontFamily:bodyFont, fontSize:9,
                      color:accentCol, textAlign:"center"
                    }}>Payment due within 30 days · Thank you for your business</div>
                  </div>
                  <div style={descStyle}>
                    <strong>Invoice</strong> — Header and totals use <em>hero</em>, line dividers use <em>neutral</em>, payment note uses <em>accent</em>.
                  </div>
                </div>

                {/* Letterhead */}
                <div style={templateCardStyle}>
                  <div style={{
                    background:bgCol, padding:"28px 32px", minHeight:320,
                    display:"flex", flexDirection:"column", position:"relative"
                  }}>
                    <div style={{
                      position:"absolute", top:0, left:0, width:"100%", height:5,
                      background:`linear-gradient(90deg, ${heroCol}, ${accentCol})`
                    }}/>
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      marginBottom:28, paddingTop:8
                    }}>
                      <div style={{ fontFamily:headingFont, fontSize:16, color:txtCol, fontWeight:600 }}>{companyName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:8, color:txtCol, opacity:.5, textAlign:"right", lineHeight:1.6 }}>
                        123 Design Street · New York, NY 10001<br/>{email} · {phone}
                      </div>
                    </div>
                    <div style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, marginBottom:8 }}>
                      April 1, 2026
                    </div>
                    <div style={{ fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.6, marginBottom:16 }}>
                      Dear Valued Client,
                    </div>
                    <div style={{
                      fontFamily:bodyFont, fontSize:10, color:txtCol, opacity:.7,
                      lineHeight:1.85, marginBottom:20, flex:1
                    }}>
                      Thank you for choosing {companyName}. We are thrilled to partner with you on this
                      exciting project. Our team is committed to delivering exceptional results that
                      exceed your expectations and elevate your brand presence.
                    </div>
                    <div style={{ borderTop:`1px solid ${neutralCol}30`, paddingTop:14, marginTop:"auto" }}>
                      <div style={{ fontFamily:headingFont, fontSize:11, color:heroCol, fontWeight:600, marginBottom:2 }}>{personName}</div>
                      <div style={{ fontFamily:bodyFont, fontSize:9, color:txtCol, opacity:.5 }}>{personTitle}</div>
                    </div>
                  </div>
                  <div style={descStyle}>
                    <strong>Letterhead</strong> — Top gradient uses <em>hero</em> to <em>accent</em>, body on <em>bg</em>, signature in <em>hero</em> colour.
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

      </div>
    </div>
  );
}
