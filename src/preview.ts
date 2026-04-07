import type { DesignAnalysis } from "./types.js";

// Parse a value that might be a number or a string like "8px" into a pure number
function parseNumeric(v: number | string): number {
  if (typeof v === "number") return v;
  return parseFloat(String(v)) || 0;
}

// Ensure a value has "px" suffix exactly once
function ensurePx(v: number | string): string {
  const n = parseNumeric(v);
  return `${n}px`;
}

export function buildPreviewHtml(
  analysis: DesignAnalysis,
  sourceUrl: string,
): string {
  const { colors, typography, spacing, layout, components } = analysis;

  // Extract base font name for Google Fonts loading
  const baseFontName = typography.fontFamily
    .split(",")[0]
    .trim()
    .replace(/['"]/g, "");
  // Only load from Google Fonts if it looks like a web font (not system fonts)
  const systemFonts = [
    "arial", "helvetica", "times new roman", "georgia", "verdana",
    "courier new", "system-ui", "sans-serif", "serif", "monospace",
    "pingfang sc", "hiragino sans gb", "microsoft yahei", "segoe ui",
    "sf pro", "roboto", // Roboto is on most systems but also on Google Fonts
  ];
  const shouldLoadFont = !systemFonts.includes(baseFontName.toLowerCase());
  const fontLink = shouldLoadFont
    ? `<link href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(baseFontName)}:wght@400;500;600;700&display=swap" rel="stylesheet">`
    : "";

  const hostname = (() => {
    try { return new URL(sourceUrl).hostname; }
    catch { return sourceUrl; }
  })();

  const needsDarkText = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 128;
  };

  const borderForLight = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 > 200
      ? `border-bottom: 1px solid ${colors.textSecondary}22;`
      : "";
  };

  const colorSwatches = [
    { group: "Primary & Brand", items: [
      { name: "Primary", hex: colors.primary, role: "Primary actions, links, focus states" },
      { name: "Secondary", hex: colors.secondary, role: "Secondary actions, supporting elements" },
      { name: "Accent", hex: colors.accent, role: "Highlights, badges, callouts" },
    ]},
    { group: "Surface & Background", items: [
      { name: "Background", hex: colors.background, role: "Primary page background" },
      { name: "Surface", hex: colors.surface, role: "Cards, elevated containers" },
    ]},
    { group: "Text", items: [
      { name: "Text Primary", hex: colors.textPrimary, role: "Headings, body text" },
      { name: "Text Secondary", hex: colors.textSecondary, role: "Captions, placeholders, metadata" },
    ]},
    { group: "Semantic", items: [
      { name: "Error", hex: colors.error, role: "Error states, destructive actions" },
      { name: "Success", hex: colors.success, role: "Success states, confirmations" },
    ]},
  ];

  const typeSamples = [
    { label: "Display / Hero", size: typography.h1.size, weight: typography.h1.weight, lineHeight: "1.10", text: "Display Hero Heading", color: "var(--color-text-primary)" },
    { label: "Section Heading", size: typography.h2.size, weight: typography.h2.weight, lineHeight: "1.20", text: "Section Heading", color: "var(--color-text-primary)" },
    { label: "Sub-heading", size: typography.h3.size, weight: typography.h3.weight, lineHeight: "1.30", text: "Sub-heading Title", color: "var(--color-text-primary)" },
    { label: "Body Large", size: `${Math.max(parseInt(typography.body.size), 16) + 2}px`, weight: typography.body.weight, lineHeight: "1.60", text: "Body large text for introductory paragraphs and prominent descriptions.", color: "var(--color-text-secondary)" },
    { label: "Body Standard", size: typography.body.size, weight: typography.body.weight, lineHeight: "1.60", text: "Standard body text for UI copy, navigation, and general content. This demonstrates the reading size and weight used throughout the interface for paragraphs and descriptions.", color: "var(--color-text-secondary)" },
    { label: "Caption", size: typography.caption.size, weight: typography.caption.weight, lineHeight: "1.43", text: "Caption text for metadata, timestamps, and supplementary information", color: "var(--color-text-secondary)" },
    { label: "Label", size: `${Math.max(parseInt(typography.caption.size) - 2, 10)}px`, weight: 500, lineHeight: "1.60", text: "LABEL TEXT", color: "var(--color-text-secondary)", letterSpacing: "0.12px", transform: "uppercase" },
    { label: "Code", size: `${Math.max(parseInt(typography.body.size) - 1, 13)}px`, weight: 400, lineHeight: "1.60", text: "const result = await fetchDesign(url);", color: "var(--color-text-primary)", mono: true, letterSpacing: "-0.32px" },
  ];

  const spacingBoxes = spacing.values.map(v => {
    const n = parseNumeric(v);
    const scale = Math.max(n / 1.5, 10);
    return `      <div class="spacing-item"><div class="spacing-box" style="width: ${scale}px; height: ${scale}px;"></div><div class="spacing-label">${n}px</div></div>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design System Preview: ${hostname}</title>
${fontLink}
<style>
  :root {
    /* Primary */
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    /* Surface & Background */
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    /* Text */
    --color-text-primary: ${colors.textPrimary};
    --color-text-secondary: ${colors.textSecondary};
    /* Semantic */
    --color-error: ${colors.error};
    --color-success: ${colors.success};
    /* Fonts */
    --font-primary: ${typography.fontFamily};
    --font-mono: SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace;
    /* Spacing */
    --spacing-base: ${spacing.baseUnit};
    /* Radius */
    --radius-button: ${components.buttonRadius};
    --radius-card: ${components.cardRadius};
    /* Shadow */
    --shadow-card: ${components.cardShadow};
    /* Border */
    --border-input: ${components.inputBorder};
    /* Derived */
    --border-subtle: ${colors.textSecondary}18;
    --border-medium: ${colors.textSecondary}30;
    --section-label-color: var(--color-primary);
    --bg-nav: ${colors.background}ee;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--color-background);
    color: var(--color-text-primary);
    font-family: var(--font-primary);
    font-size: 16px;
    line-height: 1.60;
    -webkit-font-smoothing: antialiased;
  }

  /* ─── NAV ─── */
  .nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; justify-content: space-between;
    padding: 16px 40px;
    background: var(--bg-nav);
    backdrop-filter: blur(12px);
    border-bottom: 1px solid var(--border-subtle);
  }
  .nav-brand {
    font-family: var(--font-primary);
    font-size: 20px; font-weight: 600;
    color: var(--color-text-primary);
    display: flex; align-items: center; gap: 10px;
  }
  .nav-brand .logo-mark {
    display: inline-flex; align-items: center; justify-content: center;
    width: 28px; height: 28px;
    background: var(--color-primary);
    border-radius: var(--radius-button);
    color: ${needsDarkText(colors.primary) ? colors.textPrimary : colors.background};
    font-size: 14px; font-weight: 700;
  }
  .nav-links { display: flex; gap: 32px; align-items: center; }
  .nav-links a {
    color: var(--color-text-secondary);
    text-decoration: none; font-size: 15px; font-weight: 400;
    font-family: var(--font-primary);
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--color-text-primary); }
  .nav-cta {
    background: var(--color-primary);
    color: ${needsDarkText(colors.primary) ? colors.textPrimary : colors.background};
    padding: 8px 20px; border: none;
    border-radius: var(--radius-button);
    font-size: 15px; font-family: var(--font-primary); font-weight: 500;
    cursor: pointer;
  }

  /* ─── HERO ─── */
  .hero {
    position: relative; text-align: center;
    padding: 120px 40px 100px;
    overflow: hidden;
  }
  .hero::before {
    content: '';
    position: absolute; top: 50%; left: 50%;
    width: 700px; height: 700px;
    transform: translate(-50%, -50%);
    background: radial-gradient(circle, ${colors.primary}0f 0%, ${colors.primary}06 40%, transparent 70%);
    pointer-events: none;
  }
  .hero h1 {
    font-family: var(--font-primary);
    font-size: 56px; font-weight: 700;
    line-height: 1.10; letter-spacing: -0.02em;
    margin-bottom: 20px;
    position: relative;
  }
  .hero h1 span { color: var(--color-primary); }
  .hero .theme-desc {
    color: var(--color-text-secondary);
    font-family: var(--font-primary);
    font-size: 20px; line-height: 1.60;
    max-width: 700px; margin: 0 auto 16px;
    position: relative;
  }
  .hero .source-link {
    color: var(--color-primary);
    font-size: 14px; text-decoration: none;
    position: relative;
  }
  .hero .source-link:hover { text-decoration: underline; }

  /* ─── SECTIONS ─── */
  .section {
    max-width: 1200px; margin: 0 auto;
    padding: 80px 40px;
  }
  .section-title {
    font-family: var(--font-primary);
    font-size: 14px; font-weight: 500;
    text-transform: uppercase; letter-spacing: 2.5px;
    color: var(--section-label-color);
    margin-bottom: 12px;
  }
  .section-heading {
    font-family: var(--font-primary);
    font-size: 36px; font-weight: 600;
    line-height: 1.20;
    margin-bottom: 48px;
    color: var(--color-text-primary);
  }
  .section-divider {
    border: none;
    border-top: 1px solid var(--border-subtle);
    max-width: 1200px;
    margin: 0 auto;
  }

  /* ─── COLOR PALETTE ─── */
  .color-group { margin-bottom: 40px; }
  .color-group-title {
    font-family: var(--font-primary);
    font-size: 20px; font-weight: 500;
    line-height: 1.2; margin-bottom: 20px;
    color: var(--color-text-secondary);
  }
  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  .color-swatch {
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-card); overflow: hidden;
  }
  .color-swatch-block { height: 80px; }
  .color-swatch-info { padding: 12px; background: var(--color-surface); }
  .color-swatch-name { font-family: var(--font-primary); font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .color-swatch-hex { font-family: var(--font-mono); font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
  .color-swatch-role { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }

  /* ─── TYPOGRAPHY ─── */
  .type-sample { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--border-subtle); }
  .type-sample:last-child { border-bottom: none; }
  .type-sample-text { margin-bottom: 8px; }
  .type-sample-label {
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  /* ─── BUTTONS ─── */
  .button-row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  .button-demo { text-align: center; }
  .button-demo-label {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--color-text-secondary);
    margin-top: 10px; text-transform: uppercase; letter-spacing: 0.55px;
  }

  /* ─── CARDS ─── */
  .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
  .card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: 28px;
  }
  .card-standard { border: 1px solid var(--border-subtle); }
  .card-shadow { border: 1px solid var(--border-subtle); box-shadow: var(--shadow-card); }
  .card-accent { border: 2px solid var(--color-primary); }
  .card-label {
    font-family: var(--font-primary);
    font-size: 11px; text-transform: uppercase;
    letter-spacing: 0.55px; color: var(--color-primary);
    margin-bottom: 16px; font-weight: 500;
  }
  .card h3 {
    font-family: var(--font-primary);
    font-size: 22px; font-weight: 600;
    line-height: 1.20; margin-bottom: 12px;
    color: var(--color-text-primary);
  }
  .card p { color: var(--color-text-secondary); font-size: 15px; line-height: 1.60; }

  /* ─── INPUTS ─── */
  .input-row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  .input-demo { display: flex; flex-direction: column; gap: 6px; }
  .input-demo-label {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--color-text-secondary);
    text-transform: uppercase; letter-spacing: 0.55px;
  }
  .input-demo input, .input-demo textarea {
    font-family: var(--font-primary);
    font-size: 16px; color: var(--color-text-primary);
    background: var(--color-surface);
    border: var(--border-input);
    border-radius: var(--radius-button);
    padding: 10px 14px;
    outline: none; transition: border-color 0.2s;
  }
  .input-demo input:focus, .input-demo textarea:focus {
    border-color: var(--color-primary);
    box-shadow: 0 0 0 3px ${colors.primary}22;
  }
  .input-demo textarea { resize: vertical; min-height: 80px; }

  /* ─── SPACING ─── */
  .spacing-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
  .spacing-item { text-align: center; }
  .spacing-box {
    background: ${colors.primary}15;
    border: 1px solid ${colors.primary}35;
    border-radius: 4px; margin-bottom: 8px;
  }
  .spacing-label { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary); }

  /* ─── RADIUS ─── */
  .radius-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
  .radius-item { text-align: center; }
  .radius-box {
    width: 80px; height: 80px;
    background: var(--color-surface);
    border: 1px solid var(--border-medium);
    margin-bottom: 8px;
  }
  .radius-label { font-family: var(--font-mono); font-size: 11px; color: var(--color-text-secondary); }
  .radius-context { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }

  /* ─── ELEVATION ─── */
  .elevation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
  .elevation-card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: 24px; min-height: 140px;
    display: flex; flex-direction: column; justify-content: space-between;
  }
  .elevation-flat { border: none; background: var(--color-background); }
  .elevation-contained { border: 1px solid var(--border-subtle); }
  .elevation-shadow { border: 1px solid var(--border-subtle); box-shadow: var(--shadow-card); }
  .elevation-heavy { box-shadow: 0 8px 32px ${colors.textPrimary}20; }
  .elevation-name { font-family: var(--font-primary); font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .elevation-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
  .elevation-level {
    font-family: var(--font-mono);
    font-size: 11px; color: var(--color-primary);
    text-transform: uppercase; letter-spacing: 0.55px; margin-top: 12px;
  }

  /* ─── RESPONSIVE ─── */
  @media (max-width: 768px) {
    .nav { padding: 12px 20px; }
    .nav-links a:not(.nav-cta) { display: none; }
    .hero { padding: 80px 20px 60px; }
    .hero h1 { font-size: 36px; }
    .section { padding: 60px 20px; }
    .section-heading { font-size: 28px; }
    .color-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
    .card-grid { grid-template-columns: 1fr; }
    .hero .theme-desc { font-size: 17px; }
    .button-row { flex-direction: column; align-items: flex-start; }
    .input-row { flex-direction: column; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-brand"><span class="logo-mark">D</span> ${hostname}</div>
  <div class="nav-links">
    <a href="#colors">Colors</a>
    <a href="#typography">Typography</a>
    <a href="#buttons">Buttons</a>
    <a href="#cards">Cards</a>
    <a href="#spacing">Spacing</a>
    <a href="#elevation">Elevation</a>
    <button class="nav-cta">View Source</button>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <h1>Design System Preview:<br><span>${hostname}</span></h1>
  <p class="theme-desc">${analysis.theme}</p>
  <a class="source-link" href="${sourceUrl}" target="_blank">${sourceUrl}</a>
</section>

<hr class="section-divider">

<!-- COLORS -->
<section class="section" id="colors">
  <div class="section-title">01 / Color Palette</div>
  <h2 class="section-heading">Color Palette & Roles</h2>

${colorSwatches.map(group => `  <div class="color-group">
    <h3 class="color-group-title">${group.group}</h3>
    <div class="color-grid">
${group.items.map(c => `      <div class="color-swatch">
        <div class="color-swatch-block" style="background: ${c.hex}; ${borderForLight(c.hex)}"></div>
        <div class="color-swatch-info">
          <div class="color-swatch-name">${c.name}</div>
          <div class="color-swatch-hex">${c.hex}</div>
          <div class="color-swatch-role">${c.role}</div>
        </div>
      </div>`).join("\n")}
    </div>
  </div>`).join("\n\n")}
</section>

<hr class="section-divider">

<!-- TYPOGRAPHY -->
<section class="section" id="typography">
  <div class="section-title">02 / Typography Scale</div>
  <h2 class="section-heading">Typography Rules</h2>

${typeSamples.map(t => {
  const ff = t.mono ? "var(--font-mono)" : `var(--font-primary)`;
  const ls = t.letterSpacing ? `letter-spacing: ${t.letterSpacing};` : "";
  const tt = t.transform ? `text-transform: ${t.transform};` : "";
  return `  <div class="type-sample">
    <div class="type-sample-text" style="font-family: ${ff}; font-size: ${t.size}; font-weight: ${t.weight}; line-height: ${t.lineHeight}; color: ${t.color}; ${ls} ${tt}">${t.text}</div>
    <div class="type-sample-label">${t.label} &mdash; ${t.size} / ${t.weight} / ${t.lineHeight}${t.letterSpacing ? ` / ${t.letterSpacing}` : ""} &mdash; ${t.mono ? "Monospace" : typography.fontFamily}</div>
  </div>`;
}).join("\n\n")}
</section>

<hr class="section-divider">

<!-- BUTTONS -->
<section class="section" id="buttons">
  <div class="section-title">03 / Button Variants</div>
  <h2 class="section-heading">Buttons</h2>

  <div class="button-row">
    <div class="button-demo">
      <button style="background: var(--color-primary); color: ${needsDarkText(colors.primary) ? "var(--color-text-primary)" : "var(--color-background)"}; padding: 12px 24px; border: none; border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 600; cursor: pointer;">Primary Action</button>
      <div class="button-demo-label">Primary</div>
    </div>
    <div class="button-demo">
      <button style="background: var(--color-secondary); color: ${needsDarkText(colors.secondary) ? "var(--color-text-primary)" : "var(--color-background)"}; padding: 12px 24px; border: none; border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 600; cursor: pointer;">Secondary</button>
      <div class="button-demo-label">Secondary</div>
    </div>
    <div class="button-demo">
      <button style="background: transparent; color: var(--color-primary); padding: 12px 24px; border: 2px solid var(--color-primary); border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 600; cursor: pointer;">Outlined</button>
      <div class="button-demo-label">Outlined</div>
    </div>
    <div class="button-demo">
      <button style="background: var(--color-surface); color: var(--color-text-primary); padding: 12px 24px; border: var(--border-input); border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 500; cursor: pointer;">Surface</button>
      <div class="button-demo-label">Surface</div>
    </div>
    <div class="button-demo">
      <button style="background: var(--color-error); color: ${needsDarkText(colors.error) ? "var(--color-text-primary)" : "#ffffff"}; padding: 12px 24px; border: none; border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 600; cursor: pointer;">Destructive</button>
      <div class="button-demo-label">Destructive</div>
    </div>
    <div class="button-demo">
      <button style="background: var(--color-accent); color: ${needsDarkText(colors.accent) ? "var(--color-text-primary)" : "#ffffff"}; padding: 12px 24px; border: none; border-radius: var(--radius-button); font-size: 16px; font-family: var(--font-primary); font-weight: 600; cursor: pointer;">Accent</button>
      <div class="button-demo-label">Accent</div>
    </div>
  </div>
</section>

<hr class="section-divider">

<!-- CARDS -->
<section class="section" id="cards">
  <div class="section-title">04 / Card Examples</div>
  <h2 class="section-heading">Cards & Containers</h2>

  <div class="card-grid">
    <div class="card card-standard">
      <div class="card-label">Standard Card</div>
      <h3>Bordered Container</h3>
      <p>Standard content card with subtle border and ${components.cardRadius} radius. The default container for features and content sections.</p>
    </div>
    <div class="card card-shadow">
      <div class="card-label">Elevated Card</div>
      <h3>Shadow Elevated</h3>
      <p>Elevated card using ${components.cardShadow}. For featured content, product screenshots, and components that need visual prominence.</p>
    </div>
    <div class="card card-accent">
      <div class="card-label">Accent Card</div>
      <h3>Primary Border</h3>
      <p>Accent card with primary color border. For highlighted states, selected items, and important callouts.</p>
    </div>
  </div>
</section>

<hr class="section-divider">

<!-- INPUTS -->
<section class="section">
  <div class="section-title">05 / Form Elements</div>
  <h2 class="section-heading">Inputs & Forms</h2>

  <div class="input-row">
    <div class="input-demo">
      <div class="input-demo-label">Text Input</div>
      <input type="text" placeholder="Enter text..." style="width: 280px;">
    </div>
    <div class="input-demo">
      <div class="input-demo-label">Search</div>
      <input type="search" placeholder="Search..." style="width: 280px;">
    </div>
    <div class="input-demo">
      <div class="input-demo-label">Textarea</div>
      <textarea placeholder="Write something..." style="width: 280px;"></textarea>
    </div>
  </div>
</section>

<hr class="section-divider">

<!-- SPACING -->
<section class="section" id="spacing">
  <div class="section-title">06 / Spacing Scale</div>
  <h2 class="section-heading">Spacing System</h2>
  <p style="color: var(--color-text-secondary); margin-bottom: 32px; font-family: var(--font-primary);">Base unit: ${ensurePx(spacing.baseUnit)}. Scale: ${spacing.values.map(v => ensurePx(v)).join(", ")}.</p>

  <div class="spacing-row">
${spacingBoxes}
  </div>
</section>

<hr class="section-divider">

<!-- BORDER RADIUS -->
<section class="section">
  <div class="section-title">07 / Border Radius Scale</div>
  <h2 class="section-heading">Border Radius</h2>

  <div class="radius-row">
    <div class="radius-item"><div class="radius-box" style="border-radius: ${components.buttonRadius};"></div><div class="radius-label">${components.buttonRadius}</div><div class="radius-context">Buttons</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius: ${components.cardRadius};"></div><div class="radius-label">${components.cardRadius}</div><div class="radius-context">Cards</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius: ${Math.max(parseInt(components.cardRadius), 12) + 4}px;"></div><div class="radius-label">${Math.max(parseInt(components.cardRadius), 12) + 4}px</div><div class="radius-context">Featured</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius: 50%;"></div><div class="radius-label">50%</div><div class="radius-context">Avatars</div></div>
  </div>
</section>

<hr class="section-divider">

<!-- ELEVATION -->
<section class="section" id="elevation">
  <div class="section-title">08 / Elevation & Depth</div>
  <h2 class="section-heading">Depth & Elevation</h2>

  <div class="elevation-grid">
    <div class="elevation-card elevation-flat">
      <div><div class="elevation-name">Flat</div><div class="elevation-desc">No shadow, no border. Background-level content and inline text.</div></div>
      <div class="elevation-level">Level 0</div>
    </div>
    <div class="elevation-card elevation-contained">
      <div><div class="elevation-name">Contained</div><div class="elevation-desc">Subtle border containment. Standard cards, sections, and list items.</div></div>
      <div class="elevation-level">Level 1</div>
    </div>
    <div class="elevation-card elevation-shadow">
      <div><div class="elevation-name">Elevated</div><div class="elevation-desc">${components.cardShadow}. Featured cards, dropdowns, popovers.</div></div>
      <div class="elevation-level">Level 2</div>
    </div>
    <div class="elevation-card elevation-heavy">
      <div><div class="elevation-name">Prominent</div><div class="elevation-desc">Deep shadow for modals, dialogs, toast notifications, and overlay content.</div></div>
      <div class="elevation-level">Level 3</div>
    </div>
  </div>
</section>

<!-- LAYOUT INFO -->
<section class="section">
  <div class="section-title">09 / Layout</div>
  <h2 class="section-heading">Layout & Grid</h2>

  <div class="card card-standard" style="max-width: 600px;">
    <p style="margin-bottom: 12px;"><strong>Max Width:</strong> ${layout.maxWidth}</p>
    <p style="margin-bottom: 12px;"><strong>Grid:</strong> ${layout.columns} columns</p>
    <p style="margin-bottom: 12px;"><strong>Base Spacing:</strong> ${spacing.baseUnit}</p>
    <p><strong>Structure:</strong> ${layout.description}</p>
  </div>
</section>

<div style="height: 80px;"></div>

</body>
</html>
`;
}
