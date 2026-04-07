import type { DesignAnalysis } from "./types.js";

// Convert "- **Buttons**: ..." style text into proper HTML list
function mdListToHtml(text: string): string {
  return text
    .split(/(?=- \*\*)/)
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => `<li>${s.replace(/^- /, "")}</li>`)
    .join("\n");
}

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

  // Derive key colors — search in priority order to avoid wrong matches
  const find = (patterns: RegExp[]) => {
    for (const p of patterns) {
      const match = analysis.colors.find(c => p.test(c.name));
      if (match) return match.hex;
    }
    return null;
  };

  const primary = find([/primary/i]) ?? analysis.colors[0]?.hex ?? "#333333";
  const bg = find([/^background\s*light/i, /^background/i, /^surface\s*light/i]) ?? "#ffffff";
  const surface = find([/^surface/i, /^background\s*light/i]) ?? bg;
  const textColor = find([/^neutral\s*dark/i, /dark.*text/i, /text.*primary/i]) ?? onColor(bg);
  const textMuted = find([/^neutral\s*medium/i, /muted/i, /secondary/i]) ?? "#888888";

  const surfaceText = onColor(surface);
  const surfaceTextMuted = lightText(surface) ? "#aaaaaa" : "#666666";

  const componentsHtml = mdListToHtml(analysis.components);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Design Preview — ${hostname}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:${bg};color:${textColor};font-family:system-ui,-apple-system,sans-serif;font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased}
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
  .colors{display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px}
  .swatch{border-radius:8px;overflow:hidden;border:1px solid ${textMuted}15}
  .swatch-block{height:64px;display:flex;align-items:flex-end;padding:8px 10px}
  .swatch-block span{font-family:monospace;font-size:11px}
  .swatch-info{padding:10px;background:${surface};color:${surfaceText}}
  .swatch-info strong{font-size:13px;display:block;margin-bottom:2px}
  .swatch-info small{font-size:11px;color:${surfaceTextMuted}}

  /* Text sections */
  .prose{font-size:15px;line-height:1.8;color:${textMuted};max-width:720px}

  /* Component list */
  .comp-list{list-style:none;display:flex;flex-direction:column;gap:16px;max-width:720px}
  .comp-list li{font-size:15px;line-height:1.7;color:${textMuted};padding:16px 20px;background:${surface};color:${surfaceText};border-radius:8px;border:1px solid ${textMuted}12}
  .comp-list li strong{color:${surfaceText}}

  @media(max-width:640px){
    header h1{font-size:32px}
    .colors{grid-template-columns:repeat(auto-fill,minmax(120px,1fr))}
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

<section>
  <div class="label">Typography</div>
  <div class="prose">${analysis.typography}</div>
</section>

<hr>

<section>
  <div class="label">Components</div>
  <ul class="comp-list">
${componentsHtml}
  </ul>
</section>

<div style="height:64px"></div>
</div>
</body>
</html>
`;
}
