import type { DesignAnalysis } from "./types.js";

export function buildPreviewHtml(
  analysis: DesignAnalysis,
  sourceUrl: string,
): string {
  const { colors, typography, spacing, layout, components } = analysis;

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
    { label: "H1 / Hero", family: typography.fontFamily, size: typography.h1.size, weight: typography.h1.weight, text: "Hero Heading" },
    { label: "H2 / Section", family: typography.fontFamily, size: typography.h2.size, weight: typography.h2.weight, text: "Section Heading" },
    { label: "H3 / Sub-section", family: typography.fontFamily, size: typography.h3.size, weight: typography.h3.weight, text: "Sub-section Title" },
    { label: "Body", family: typography.fontFamily, size: typography.body.size, weight: typography.body.weight, text: "Body text for paragraphs, descriptions, and general content. This demonstrates the standard reading size and weight used throughout the interface." },
    { label: "Caption", family: typography.fontFamily, size: typography.caption.size, weight: typography.caption.weight, text: "Caption text for metadata, timestamps, and supplementary information" },
  ];

  const spacingBoxes = spacing.values.map(v => {
    const scale = Math.max(v / 2, 8);
    return `<div class="spacing-item"><div class="spacing-box" style="width: ${scale}px; height: ${scale}px;"></div><div class="spacing-label">${v}px</div></div>`;
  }).join("\n      ");

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

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design System Preview: ${sourceUrl}</title>
<style>
  :root {
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-accent: ${colors.accent};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-text-primary: ${colors.textPrimary};
    --color-text-secondary: ${colors.textSecondary};
    --color-error: ${colors.error};
    --color-success: ${colors.success};
    --font-family: ${typography.fontFamily};
    --radius-button: ${components.buttonRadius};
    --radius-card: ${components.cardRadius};
    --shadow-card: ${components.cardShadow};
    --border-input: ${components.inputBorder};
    --spacing-base: ${spacing.baseUnit};
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    background: var(--color-background);
    color: var(--color-text-primary);
    font-family: var(--font-family);
    font-size: 16px;
    line-height: 1.6;
    -webkit-font-smoothing: antialiased;
  }

  /* NAV */
  .nav {
    position: sticky;
    top: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 40px;
    background: ${colors.background}ee;
    backdrop-filter: blur(12px);
    border-bottom: 1px solid ${colors.textSecondary}22;
  }
  .nav-brand {
    font-size: 18px;
    font-weight: 600;
    color: var(--color-text-primary);
    display: flex;
    align-items: center;
    gap: 10px;
  }
  .nav-brand .logo-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    background: var(--color-primary);
    border-radius: ${components.buttonRadius};
    color: ${needsDarkText(colors.primary) ? colors.textPrimary : colors.background};
    font-size: 14px;
    font-weight: 700;
  }
  .nav-links { display: flex; gap: 28px; align-items: center; }
  .nav-links a {
    color: var(--color-text-secondary);
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    transition: color 0.2s;
  }
  .nav-links a:hover { color: var(--color-text-primary); }

  /* HERO */
  .hero {
    text-align: center;
    padding: 100px 40px 80px;
  }
  .hero h1 {
    font-size: ${typography.h1.size};
    font-weight: ${typography.h1.weight};
    line-height: 1.1;
    margin-bottom: 16px;
  }
  .hero h1 span { color: var(--color-primary); }
  .hero p {
    color: var(--color-text-secondary);
    font-size: 18px;
    line-height: 1.6;
    margin-bottom: 8px;
  }
  .hero .source-url {
    color: var(--color-primary);
    font-size: 14px;
    text-decoration: none;
  }
  .hero .source-url:hover { text-decoration: underline; }

  /* SECTIONS */
  .section {
    max-width: 1200px;
    margin: 0 auto;
    padding: 80px 40px;
  }
  .section-title {
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 2.5px;
    color: var(--color-primary);
    margin-bottom: 12px;
  }
  .section-heading {
    font-size: ${typography.h2.size};
    font-weight: ${typography.h2.weight};
    line-height: 1.2;
    margin-bottom: 48px;
  }
  .section-divider {
    border: none;
    border-top: 1px solid ${colors.textSecondary}18;
    max-width: 1200px;
    margin: 0 auto;
  }

  /* COLOR PALETTE */
  .color-group { margin-bottom: 40px; }
  .color-group-title {
    font-size: 18px;
    font-weight: 600;
    line-height: 1.2;
    margin-bottom: 20px;
    color: var(--color-text-secondary);
  }
  .color-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 16px;
  }
  .color-swatch {
    border: 1px solid ${colors.textSecondary}18;
    border-radius: var(--radius-card);
    overflow: hidden;
  }
  .color-swatch-block {
    height: 80px;
  }
  .color-swatch-info {
    padding: 12px;
    background: var(--color-surface);
  }
  .color-swatch-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; }
  .color-swatch-hex { font-family: monospace; font-size: 12px; color: var(--color-text-secondary); margin-bottom: 4px; }
  .color-swatch-role { font-size: 12px; color: var(--color-text-secondary); line-height: 1.4; }

  /* TYPOGRAPHY */
  .type-sample { margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid ${colors.textSecondary}12; }
  .type-sample:last-child { border-bottom: none; }
  .type-sample-text { margin-bottom: 8px; }
  .type-sample-label {
    font-family: monospace;
    font-size: 12px;
    color: var(--color-text-secondary);
  }

  /* BUTTONS */
  .button-row { display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start; }
  .button-demo { text-align: center; }
  .button-demo-label {
    font-family: monospace;
    font-size: 11px;
    color: var(--color-text-secondary);
    margin-top: 10px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* CARDS */
  .card-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
  .card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: 28px;
  }
  .card-standard { border: 1px solid ${colors.textSecondary}18; }
  .card-shadow { border: 1px solid ${colors.textSecondary}18; box-shadow: var(--shadow-card); }
  .card-accent { border: 2px solid var(--color-primary); }
  .card-label {
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--color-primary);
    margin-bottom: 16px;
    font-weight: 600;
  }
  .card h3 {
    font-size: ${typography.h3.size};
    font-weight: ${typography.h3.weight};
    line-height: 1.2;
    margin-bottom: 12px;
  }
  .card p { color: var(--color-text-secondary); font-size: 15px; line-height: 1.6; }

  /* SPACING */
  .spacing-row { display: flex; flex-wrap: wrap; gap: 12px; align-items: flex-end; }
  .spacing-item { text-align: center; }
  .spacing-box {
    background: ${colors.primary}18;
    border: 1px solid ${colors.primary}40;
    border-radius: 4px;
    margin-bottom: 8px;
  }
  .spacing-label {
    font-family: monospace;
    font-size: 11px;
    color: var(--color-text-secondary);
  }

  /* RADIUS */
  .radius-row { display: flex; flex-wrap: wrap; gap: 20px; align-items: center; }
  .radius-item { text-align: center; }
  .radius-box {
    width: 80px;
    height: 80px;
    background: var(--color-surface);
    border: 1px solid ${colors.textSecondary}30;
    margin-bottom: 8px;
  }
  .radius-label { font-family: monospace; font-size: 11px; color: var(--color-text-secondary); }
  .radius-context { font-size: 11px; color: var(--color-text-secondary); margin-top: 2px; }

  /* ELEVATION */
  .elevation-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px; }
  .elevation-card {
    background: var(--color-surface);
    border-radius: var(--radius-card);
    padding: 24px;
    min-height: 140px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  .elevation-flat { border: none; background: var(--color-background); }
  .elevation-contained { border: 1px solid ${colors.textSecondary}22; }
  .elevation-shadow { border: 1px solid ${colors.textSecondary}12; box-shadow: var(--shadow-card); }
  .elevation-heavy { box-shadow: 0 8px 32px ${colors.textPrimary}18; }
  .elevation-name { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .elevation-desc { font-size: 13px; color: var(--color-text-secondary); line-height: 1.5; }
  .elevation-level {
    font-family: monospace;
    font-size: 11px;
    color: var(--color-primary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 12px;
  }

  /* RESPONSIVE */
  @media (max-width: 768px) {
    .nav { padding: 12px 20px; }
    .nav-links a { display: none; }
    .hero { padding: 80px 20px 60px; }
    .hero h1 { font-size: 28px; }
    .section { padding: 60px 20px; }
    .color-grid { grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); }
    .card-grid { grid-template-columns: 1fr; }
    .button-row { flex-direction: column; align-items: flex-start; }
  }
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-brand"><span class="logo-mark">D</span> Design System</div>
  <div class="nav-links">
    <a href="#colors">Colors</a>
    <a href="#typography">Typography</a>
    <a href="#buttons">Buttons</a>
    <a href="#cards">Cards</a>
    <a href="#spacing">Spacing</a>
    <a href="#elevation">Elevation</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <h1>Design System Preview:<br><span>${new URL(sourceUrl).hostname}</span></h1>
  <p>Auto-generated design token catalog from DESIGN.md</p>
  <a class="source-url" href="${sourceUrl}" target="_blank">${sourceUrl}</a>
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

${typeSamples.map(t => `  <div class="type-sample">
    <div class="type-sample-text" style="font-family: ${t.family}; font-size: ${t.size}; font-weight: ${t.weight}; line-height: 1.3;">${t.text}</div>
    <div class="type-sample-label">${t.label} — ${t.size} / ${t.weight} — ${t.family}</div>
  </div>`).join("\n\n")}
</section>

<hr class="section-divider">

<!-- BUTTONS -->
<section class="section" id="buttons">
  <div class="section-title">03 / Button Variants</div>
  <h2 class="section-heading">Buttons</h2>

  <div class="button-row">
    <div class="button-demo">
      <button style="background: ${colors.primary}; color: ${needsDarkText(colors.primary) ? colors.textPrimary : colors.background}; padding: 12px 24px; border: none; border-radius: ${components.buttonRadius}; font-size: 16px; font-family: ${typography.fontFamily}; font-weight: 600; cursor: pointer;">Primary Action</button>
      <div class="button-demo-label">Primary</div>
    </div>
    <div class="button-demo">
      <button style="background: ${colors.secondary}; color: ${needsDarkText(colors.secondary) ? colors.textPrimary : colors.background}; padding: 12px 24px; border: none; border-radius: ${components.buttonRadius}; font-size: 16px; font-family: ${typography.fontFamily}; font-weight: 600; cursor: pointer;">Secondary</button>
      <div class="button-demo-label">Secondary</div>
    </div>
    <div class="button-demo">
      <button style="background: transparent; color: ${colors.primary}; padding: 12px 24px; border: 2px solid ${colors.primary}; border-radius: ${components.buttonRadius}; font-size: 16px; font-family: ${typography.fontFamily}; font-weight: 600; cursor: pointer;">Outlined</button>
      <div class="button-demo-label">Outlined</div>
    </div>
    <div class="button-demo">
      <button style="background: ${colors.surface}; color: ${colors.textPrimary}; padding: 12px 24px; border: ${components.inputBorder}; border-radius: ${components.buttonRadius}; font-size: 16px; font-family: ${typography.fontFamily}; font-weight: 500; cursor: pointer;">Surface</button>
      <div class="button-demo-label">Surface</div>
    </div>
    <div class="button-demo">
      <button style="background: ${colors.error}; color: ${needsDarkText(colors.error) ? colors.textPrimary : '#ffffff'}; padding: 12px 24px; border: none; border-radius: ${components.buttonRadius}; font-size: 16px; font-family: ${typography.fontFamily}; font-weight: 600; cursor: pointer;">Destructive</button>
      <div class="button-demo-label">Destructive</div>
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
      <p>Elevated card with shadow (${components.cardShadow}). Used for featured content that needs visual prominence.</p>
    </div>
    <div class="card card-accent">
      <div class="card-label">Accent Card</div>
      <h3>Primary Border</h3>
      <p>Accent card with primary color border. Used for highlighted or selected states and important callouts.</p>
    </div>
  </div>
</section>

<hr class="section-divider">

<!-- SPACING -->
<section class="section" id="spacing">
  <div class="section-title">05 / Spacing Scale</div>
  <h2 class="section-heading">Spacing System</h2>
  <p style="color: var(--color-text-secondary); margin-bottom: 32px;">Base unit: ${spacing.baseUnit}. Scale: ${spacing.values.map(v => v + "px").join(", ")}.</p>

  <div class="spacing-row">
    ${spacingBoxes}
  </div>
</section>

<hr class="section-divider">

<!-- BORDER RADIUS -->
<section class="section">
  <div class="section-title">06 / Border Radius</div>
  <h2 class="section-heading">Border Radius Scale</h2>

  <div class="radius-row">
    <div class="radius-item"><div class="radius-box" style="border-radius: ${components.buttonRadius};"></div><div class="radius-label">${components.buttonRadius}</div><div class="radius-context">Buttons</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius: ${components.cardRadius};"></div><div class="radius-label">${components.cardRadius}</div><div class="radius-context">Cards</div></div>
    <div class="radius-item"><div class="radius-box" style="border-radius: 50%;"></div><div class="radius-label">50%</div><div class="radius-context">Avatars</div></div>
  </div>
</section>

<hr class="section-divider">

<!-- ELEVATION -->
<section class="section" id="elevation">
  <div class="section-title">07 / Elevation & Depth</div>
  <h2 class="section-heading">Depth & Elevation</h2>

  <div class="elevation-grid">
    <div class="elevation-card elevation-flat">
      <div><div class="elevation-name">Flat</div><div class="elevation-desc">No shadow, no border. Background-level elements and inline content.</div></div>
      <div class="elevation-level">Level 0</div>
    </div>
    <div class="elevation-card elevation-contained">
      <div><div class="elevation-name">Contained</div><div class="elevation-desc">Subtle border. Standard cards, sections, and containers.</div></div>
      <div class="elevation-level">Level 1</div>
    </div>
    <div class="elevation-card elevation-shadow">
      <div><div class="elevation-name">Elevated</div><div class="elevation-desc">${components.cardShadow}. Featured content, dropdowns, popovers.</div></div>
      <div class="elevation-level">Level 2</div>
    </div>
    <div class="elevation-card elevation-heavy">
      <div><div class="elevation-name">Prominent</div><div class="elevation-desc">Deep shadow for modals, dialogs, and overlay content.</div></div>
      <div class="elevation-level">Level 3</div>
    </div>
  </div>
</section>

<div style="height: 80px;"></div>

</body>
</html>
`;
}
