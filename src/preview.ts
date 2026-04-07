import type { DesignAnalysis } from "./types.js";

function ensurePx(v: number | string): string {
  const n = typeof v === "number" ? v : parseFloat(String(v)) || 0;
  return `${n}px`;
}

export function buildPreviewHtml(
  analysis: DesignAnalysis,
  sourceUrl: string,
): string {
  const { colors, typography, components } = analysis;

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

  // Returns readable text color for a given background
  const onColor = (hex: string) => lightText(hex) ? "#ffffff" : "#1a1a1a";
  // Readable muted text color for a given background
  const onColorMuted = (hex: string) => lightText(hex) ? "#aaaaaa" : "#666666";

  // Pre-compute surface text colors
  const surfaceText = onColor(colors.surface);
  const surfaceTextMuted = onColorMuted(colors.surface);

  // Extract base font for Google Fonts
  const baseFontName = typography.fontFamily.split(",")[0].trim().replace(/['"]/g, "");
  const skip = ["arial","helvetica","times new roman","georgia","verdana","system-ui","sans-serif","serif","monospace","pingfang sc","hiragino sans gb","microsoft yahei","segoe ui","sf pro"];
  const fontLink = skip.includes(baseFontName.toLowerCase()) ? ""
    : `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(baseFontName)}:wght@400;500;600;700&display=swap" rel="stylesheet">`;

  const allColors = [
    { name: "Primary", hex: colors.primary, role: "Actions & links" },
    { name: "Secondary", hex: colors.secondary, role: "Supporting" },
    { name: "Accent", hex: colors.accent, role: "Highlights" },
    { name: "Background", hex: colors.background, role: "Page background" },
    { name: "Surface", hex: colors.surface, role: "Cards" },
    { name: "Text", hex: colors.textPrimary, role: "Headings & body" },
    { name: "Text Secondary", hex: colors.textSecondary, role: "Captions" },
    { name: "Error", hex: colors.error, role: "Error states" },
    { name: "Success", hex: colors.success, role: "Success states" },
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design Preview — ${hostname}</title>
${fontLink}
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${colors.background};color:${colors.textPrimary};font-family:${typography.fontFamily};line-height:1.6;-webkit-font-smoothing:antialiased}
  .wrap{max-width:960px;margin:0 auto;padding:0 32px}

  /* Hero */
  header{padding:80px 0 64px;text-align:center}
  header h1{font-size:48px;font-weight:700;line-height:1.1;margin-bottom:12px}
  header h1 span{color:${colors.primary}}
  header p{color:${colors.textSecondary};font-size:17px;max-width:560px;margin:0 auto 8px}
  header a{color:${colors.primary};font-size:13px;text-decoration:none}
  header a:hover{text-decoration:underline}

  hr{border:none;border-top:1px solid ${colors.textSecondary}15;margin:0}

  /* Section */
  section{padding:56px 0}
  .label{font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:2px;color:${colors.primary};margin-bottom:24px}
  section h2{font-size:28px;font-weight:600;margin-bottom:36px}

  /* Colors */
  .colors{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:12px}
  .swatch{border-radius:${components.cardRadius};overflow:hidden;border:1px solid ${colors.textSecondary}15}
  .swatch-block{height:64px;display:flex;align-items:flex-end;padding:8px 10px}
  .swatch-block span{font-family:monospace;font-size:11px}
  .swatch-info{padding:10px;background:${colors.surface};color:${surfaceText}}
  .swatch-info strong{font-size:13px;display:block;margin-bottom:2px}
  .swatch-info small{font-size:11px;color:${surfaceTextMuted}}

  /* Typography */
  .type-list{display:flex;flex-direction:column;gap:24px}
  .type-item{padding-bottom:24px;border-bottom:1px solid ${colors.textSecondary}10}
  .type-item:last-child{border-bottom:none;padding-bottom:0}
  .type-meta{font-family:monospace;font-size:11px;color:${colors.textSecondary};margin-top:6px}

  /* Buttons */
  .btns{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
  .btns button{font-family:${typography.fontFamily};font-size:15px;font-weight:600;padding:10px 22px;border:none;cursor:pointer;border-radius:${components.buttonRadius};transition:opacity .15s}
  .btns button:hover{opacity:.85}

  /* Cards */
  .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:20px}
  .card{background:${colors.surface};border-radius:${components.cardRadius};padding:24px;color:${surfaceText}}
  .card h3{font-size:18px;font-weight:600;margin-bottom:8px}
  .card p{font-size:14px;color:${surfaceTextMuted};line-height:1.55}

  @media(max-width:640px){
    header h1{font-size:32px}
    section h2{font-size:22px}
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
  <p>${analysis.theme}</p>
  <a href="${sourceUrl}" target="_blank">${sourceUrl}</a>
</header>

<hr>

<!-- Colors -->
<section>
  <div class="label">Colors</div>
  <div class="colors">
${allColors.map(c => `    <div class="swatch">
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
      <div style="font-size:${typography.h1.size};font-weight:${typography.h1.weight};line-height:1.1">Heading One</div>
      <div class="type-meta">H1 — ${typography.h1.size} / ${typography.h1.weight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${typography.h2.size};font-weight:${typography.h2.weight};line-height:1.2">Heading Two</div>
      <div class="type-meta">H2 — ${typography.h2.size} / ${typography.h2.weight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${typography.h3.size};font-weight:${typography.h3.weight};line-height:1.3">Heading Three</div>
      <div class="type-meta">H3 — ${typography.h3.size} / ${typography.h3.weight}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${typography.body.size};font-weight:${typography.body.weight};line-height:1.6;color:${colors.textSecondary}">Body text for paragraphs and general content. This shows the standard reading size used across the interface.</div>
      <div class="type-meta">Body — ${typography.body.size} / ${typography.body.weight} — ${typography.fontFamily}</div>
    </div>
    <div class="type-item">
      <div style="font-size:${typography.caption.size};font-weight:${typography.caption.weight};color:${colors.textSecondary}">Caption for metadata and timestamps</div>
      <div class="type-meta">Caption — ${typography.caption.size} / ${typography.caption.weight}</div>
    </div>
  </div>
</section>

<hr>

<!-- Buttons -->
<section>
  <div class="label">Buttons</div>
  <div class="btns">
    <button style="background:${colors.primary};color:${onColor(colors.primary)}">Primary</button>
    <button style="background:${colors.secondary};color:${onColor(colors.secondary)}">Secondary</button>
    <button style="background:transparent;color:${colors.primary};border:2px solid ${colors.primary}">Outlined</button>
    <button style="background:${colors.surface};color:${surfaceText};border:${components.inputBorder}">Surface</button>
    <button style="background:${colors.error};color:${onColor(colors.error)}">Destructive</button>
  </div>
</section>

<hr>

<!-- Cards -->
<section>
  <div class="label">Cards</div>
  <div class="cards">
    <div class="card" style="border:1px solid ${colors.textSecondary}18">
      <h3>Standard</h3>
      <p>Default card with subtle border and ${components.cardRadius} radius.</p>
    </div>
    <div class="card" style="box-shadow:${components.cardShadow}">
      <h3>Elevated</h3>
      <p>Card with shadow for featured content.</p>
    </div>
    <div class="card" style="border:2px solid ${colors.primary}">
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
