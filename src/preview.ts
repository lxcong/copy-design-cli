import type { DesignAnalysis } from "./types.js";

export function buildPreviewHtml(
  analysis: DesignAnalysis,
  sourceUrl: string,
): string {
  const hostname = (() => {
    try { return new URL(sourceUrl).hostname; }
    catch { return sourceUrl; }
  })();

  const lightText = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 <= 128;
  };
  const onColor = (hex: string) => lightText(hex) ? "#ffffff" : "#1a1a1a";

  // Derive key colors
  const find = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const m = analysis.colors.find(c => p.test(c.name));
      if (m) return m.hex;
    }
    return null;
  };

  const primary = find([/primary/i]) ?? analysis.colors[0]?.hex ?? "#333";
  const secondary = find([/secondary/i]) ?? analysis.colors[1]?.hex ?? "#666";
  const bg = find([/^background\s*light/i, /^background/i, /^surface\s*light/i]) ?? "#ffffff";
  const surface = find([/^surface/i, /^background\s*light/i]) ?? bg;
  const textColor = find([/^neutral\s*dark/i, /dark.*text/i, /text.*primary/i]) ?? onColor(bg);
  const textMuted = find([/^neutral\s*medium/i, /muted/i, /text.*secondary/i]) ?? "#888";
  const errorColor = find([/error|danger|destructive/i]) ?? "#ef4444";

  const surfaceText = onColor(surface);
  const surfaceTextMuted = lightText(surface) ? "#aaa" : "#666";

  const p = analysis.preview;
  const ff = p.fontFamily;
  const shadow = p.cardShadow === "none" ? "none" : p.cardShadow;

  // Google Fonts
  const baseName = ff.split(",")[0].trim().replace(/['"]/g, "");
  const skip = ["arial","helvetica","georgia","verdana","system-ui","sans-serif","serif","monospace","pingfang sc","segoe ui","sf pro"];
  const fontLink = skip.includes(baseName.toLowerCase()) ? ""
    : `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(baseName)}:wght@400;500;600;700;800&display=swap" rel="stylesheet">`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design Preview — ${hostname}</title>
${fontLink}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${bg};color:${textColor};font-family:${ff};font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:960px;margin:0 auto;padding:0 32px}

  header{padding:80px 0 64px;text-align:center}
  header h1{font-size:48px;font-weight:700;line-height:1.1;margin-bottom:12px}
  header h1 span{color:${primary}}
  header p{color:${textMuted};font-size:17px;max-width:560px;margin:0 auto 8px}
  header a{color:${primary};font-size:13px;text-decoration:none}
  header a:hover{text-decoration:underline}

  hr{border:none;border-top:1px solid ${textMuted}15;margin:0}
  section{padding:56px 0}
  .label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${primary};margin-bottom:24px}

  /* Colors */
  .colors{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
  .swatch{border-radius:${p.cardRadius};overflow:hidden;border:1px solid ${textMuted}15}
  .swatch-block{height:64px;display:flex;align-items:flex-end;padding:8px 10px}
  .swatch-block span{font-family:monospace;font-size:11px}
  .swatch-info{padding:10px;background:${surface};color:${surfaceText}}
  .swatch-info strong{font-size:13px;display:block;margin-bottom:2px}
  .swatch-info small{font-size:11px;color:${surfaceTextMuted}}

  /* Typography */
  .type-list{display:flex;flex-direction:column;gap:20px}
  .type-item{padding-bottom:20px;border-bottom:1px solid ${textMuted}10}
  .type-item:last-child{border-bottom:none;padding-bottom:0}
  .type-meta{font-family:monospace;font-size:11px;color:${textMuted};margin-top:4px}

  /* Buttons */
  .btns{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
  .btns button{font-family:${ff};font-size:15px;font-weight:600;padding:10px 22px;border:none;cursor:pointer;transition:opacity .15s}
  .btns button:hover{opacity:.85}

  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
  .card{background:${surface};padding:24px;color:${surfaceText}}
  .card h3{font-size:18px;font-weight:600;margin-bottom:8px}
  .card p{font-size:14px;color:${surfaceTextMuted};line-height:1.55}

  @media(max-width:640px){
    header h1{font-size:32px}
    .colors{grid-template-columns:repeat(auto-fill,minmax(110px,1fr))}
    .cards{grid-template-columns:1fr}
    .btns{flex-direction:column;align-items:flex-start}
  }
</style>
</head>
<body>
<div class="wrap">

<header>
  <h1>Design Preview:<br><span>${hostname}</span></h1>
  <p>${analysis.overview}</p>
  <a href="${sourceUrl}" target="_blank">${sourceUrl}</a>
</header>

<hr>

<!-- Colors -->
<section>
  <div class="label">Colors</div>
  <div class="colors">
${analysis.colors.map(c => `    <div class="swatch">
      <div class="swatch-block" style="background:${c.hex}"><span style="color:${onColor(c.hex)}">${c.hex}</span></div>
      <div class="swatch-info"><strong>${c.name}</strong><small>${c.role}</small></div>
    </div>`).join("\n")}
  </div>
</section>

<hr>

<!-- Typography -->
<section>
  <div class="label">Typography</div>
  <div class="type-list">
    <div class="type-item">
      <div style="font-size:${p.headingSizes.h1};font-weight:${p.headingWeight};line-height:1.1">Heading One</div>
      <div class="type-meta">H1 — ${p.headingSizes.h1} / ${p.headingWeight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${p.headingSizes.h2};font-weight:${p.headingWeight};line-height:1.2">Heading Two</div>
      <div class="type-meta">H2 — ${p.headingSizes.h2} / ${p.headingWeight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${p.headingSizes.h3};font-weight:${p.headingWeight};line-height:1.3">Heading Three</div>
      <div class="type-meta">H3 — ${p.headingSizes.h3} / ${p.headingWeight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${p.bodySize};font-weight:400;line-height:1.6;color:${textMuted}">Body text for paragraphs and general content. This shows the standard reading size used across the interface.</div>
      <div class="type-meta">Body — ${p.bodySize} / 400 — ${ff}</div>
    </div>
  </div>
</section>

<hr>

<!-- Buttons -->
<section>
  <div class="label">Buttons</div>
  <div class="btns">
    <button style="background:${primary};color:${onColor(primary)};border-radius:${p.buttonRadius}">Primary</button>
    <button style="background:${secondary};color:${onColor(secondary)};border-radius:${p.buttonRadius}">Secondary</button>
    <button style="background:transparent;color:${primary};border:2px solid ${primary};border-radius:${p.buttonRadius}">Outlined</button>
    <button style="background:${surface};color:${surfaceText};border:1px solid ${textMuted}30;border-radius:${p.buttonRadius}">Surface</button>
    <button style="background:${errorColor};color:${onColor(errorColor)};border-radius:${p.buttonRadius}">Destructive</button>
  </div>
</section>

<hr>

<!-- Cards -->
<section>
  <div class="label">Cards</div>
  <div class="cards">
    <div class="card" style="border-radius:${p.cardRadius};border:1px solid ${textMuted}18">
      <h3>Standard</h3>
      <p>Default card with subtle border and ${p.cardRadius} radius.</p>
    </div>
    <div class="card" style="border-radius:${p.cardRadius};box-shadow:${shadow}">
      <h3>Elevated</h3>
      <p>Card with shadow for featured content.</p>
    </div>
    <div class="card" style="border-radius:${p.cardRadius};border:2px solid ${primary}">
      <h3>Accent</h3>
      <p>Highlighted card with primary color border.</p>
    </div>
  </div>
</section>

<div style="height:64px"></div>
</div>
</body>
</html>
`;
}
