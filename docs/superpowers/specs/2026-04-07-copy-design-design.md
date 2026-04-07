# copy-design: 从任意网页 URL 导出 DESIGN.md

## 概述

一个 Node.js/TypeScript CLI 工具，输入任意网页 URL，通过 AI 分析 + Google Stitch 复刻，输出符合 Stitch DESIGN.md 标准格式的设计文档（含设计 token + 完整 HTML/CSS 代码）。

## CLI 用法

```bash
npx copy-design https://example.com
# → 在当前目录输出 DESIGN.md
```

可选参数：
- `-o, --output <path>` — 指定输出文件路径（默认 `./DESIGN.md`）
- `-d, --device <type>` — 设备类型：`DESKTOP`（默认）、`MOBILE`、`TABLET`

## 架构

```
输入: URL
  ↓
[1. 网页截图] Puppeteer 无头浏览器截取全页截图
  ↓
[2. AI 分析] Gemini 2.5 Flash 视觉模型分析截图，输出结构化设计描述 (JSON)
  ↓
[3. Stitch 复刻] Stitch SDK generate() 基于描述生成匹配 UI 屏幕
  ↓
[4. 设计提取] getHtml() 获取完整 HTML/CSS + getImage() 获取截图
  ↓
[5. 组装输出] 设计 token (来自 AI 分析) + HTML 代码 → DESIGN.md
  ↓
输出: DESIGN.md
```

## 技术栈

- **语言：** TypeScript, Node.js
- **构建：** tsup (轻量打包)
- **CLI 框架：** commander
- **网页截图：** puppeteer
- **AI 分析：** @google/generative-ai (Gemini 2.5 Flash)
- **设计生成：** @google/stitch-sdk

## 认证

需要两个环境变量：
- `GEMINI_API_KEY` — Google Gemini API 密钥（用于截图分析）
- `STITCH_API_KEY` — Google Stitch API 密钥（用于屏幕生成）

## 详细步骤设计

### Step 1：网页截图

使用 Puppeteer 无头浏览器：
- 视口 1440×900（桌面标准），MOBILE 模式 390×844
- `waitUntil: 'networkidle0'` 确保页面完全加载
- 截取全页截图（fullPage: true），保存为临时 PNG
- 流程结束后删除临时文件

### Step 2：AI 分析截图

调用 Gemini 2.5 Flash 视觉模型，传入截图，要求输出 JSON 格式的结构化设计分析：

```json
{
  "theme": "dark/light, 风格基调描述",
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex",
    "background": "#hex",
    "surface": "#hex",
    "textPrimary": "#hex",
    "textSecondary": "#hex",
    "error": "#hex",
    "success": "#hex"
  },
  "typography": {
    "fontFamily": "Inter, sans-serif",
    "h1": { "size": "32px", "weight": 700 },
    "h2": { "size": "24px", "weight": 600 },
    "h3": { "size": "20px", "weight": 600 },
    "body": { "size": "16px", "weight": 400 },
    "caption": { "size": "12px", "weight": 400 }
  },
  "spacing": {
    "baseUnit": "8px",
    "values": [4, 8, 16, 24, 32, 48, 64]
  },
  "layout": {
    "description": "页面结构描述",
    "maxWidth": "1200px",
    "columns": 12
  },
  "components": {
    "buttonRadius": "8px",
    "cardRadius": "12px",
    "cardShadow": "0 1px 3px rgba(0,0,0,0.12)",
    "inputBorder": "1px solid #DADCE0"
  },
  "designPrompt": "用于传给 Stitch 的详细设计描述文本"
}
```

`designPrompt` 字段是 AI 基于分析结果生成的、适合传给 Stitch 的自然语言描述。

### Step 3：Stitch 复刻

```typescript
const stitch = new Stitch({ apiKey: STITCH_API_KEY });
const project = stitch.project(projectId);
// 或先创建项目: await stitch.callTool("create_project", { title: "copy-design-..." })
const screen = await project.generate(designPrompt, deviceType);
```

如果用户未指定 project ID，自动创建一个新项目。

### Step 4：设计提取

```typescript
const htmlUrl = await screen.getHtml();   // 下载 URL
const imageUrl = await screen.getImage(); // 截图 URL
// fetch htmlUrl 获取实际 HTML 内容
```

### Step 5：组装 DESIGN.md

输出格式遵循 Stitch DESIGN.md 标准 9 段式结构：

```markdown
# DESIGN.md

## Visual Theme & Atmosphere
{theme 描述}

## Color Palette & Roles
| Token | Value | Usage |
|-------|-------|-------|
| Primary | #hex | 主要操作、链接 |
| Secondary | #hex | 辅助元素 |
| ... | ... | ... |

## Typography Rules
- Font Family: {fontFamily}
- H1: {size}, {weight}
- H2: {size}, {weight}
- Body: {size}, {weight}
- Caption: {size}, {weight}

## Spacing & Layout
- Base unit: {baseUnit}
- Scale: {values}
- Max width: {maxWidth}
- Grid: {columns} columns

## Component Styles
- Button border-radius: {buttonRadius}
- Card border-radius: {cardRadius}
- Card shadow: {cardShadow}
- Input border: {inputBorder}

## Depth & Elevation
{shadow 和层级描述}

## Do's and Don'ts
{基于分析的设计规范建议}

## Responsive Behavior
{断点和响应式规则}

## Agent Prompt Guide
{快速参考色板 + 可复用 prompt}

---

## Source Code

```html
{Stitch 生成的完整 HTML/CSS 代码}
```
```

## 项目结构

```
copy-design/
├── src/
│   ├── index.ts          # CLI 入口 (commander)
│   ├── screenshot.ts     # Puppeteer 截图模块
│   ├── analyze.ts        # Gemini 视觉分析模块
│   ├── stitch.ts         # Stitch SDK 生成模块
│   └── output.ts         # DESIGN.md 组装输出模块
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## 错误处理

- URL 无效或无法访问 → 提示用户检查 URL
- 截图失败（JS 渲染超时）→ 降级使用 `waitUntil: 'domcontentloaded'` 重试
- Gemini API 失败 → 提示检查 GEMINI_API_KEY
- Stitch API 失败 → 提示检查 STITCH_API_KEY
- 所有步骤在 CLI 中显示进度 spinner（使用 ora）

## 限制

- 需要登录墙/验证码的页面无法截图
- AI 分析的色值是近似值，非精确 CSS 提取
- Stitch 免费额度为每月 350 次生成
