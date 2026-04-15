# UI_SYSTEM.md — Production UI Design Standard

> This document is the **law** for every UI screen this developer builds.
> AI agents must read this entirely before writing a single line of UI code.
> The goal: UI that feels like it was designed by Google's Material team, Vercel's design team,
> or the team behind Linear — intentional, system-driven, zero AI slop.
>
> **If user provides screen code/files:** Use those exact screens as design truth.
> Extract tokens, patterns, and aesthetic from them. Do not invent new styles.
> Apply the production-grade practices in this document ON TOP of those screens.

---

## ⚠️ CRITICAL — Tailwind Version & Setup

> **This project uses Tailwind CSS v4.2 or higher with Vite.**
> Read this section before writing a single class name or config file.
> Using v3 syntax in a v4 project causes silent failures, broken styles, and
> config files that get completely ignored. This is the #1 source of broken UIs.

### What Changed: v3 → v4

Tailwind v4 is a ground-up rewrite. The config system is completely different.

```
v3 (OLD — DO NOT USE)         v4 (CORRECT — USE THIS)
─────────────────────────────────────────────────────────
tailwind.config.js            No config file needed
module.exports = { theme: {} }@theme { } block in CSS
@tailwind base;               @import "tailwindcss";
@tailwind components;         (single import replaces all three)
@tailwind utilities;
plugins: [require("...")]     @plugin "..."; in CSS
content: ["./src/**/*"]       @source "../src/**/*"; in CSS
darkMode: "class"             @custom-variant dark in CSS
theme.extend.colors.primary   --color-primary in @theme { }
theme.extend.fontFamily       --font-* in @theme { }
theme.extend.borderRadius     --radius-* in @theme { }
theme.extend.boxShadow        --shadow-* in @theme { }
theme.extend.keyframes        --animate-* in @theme { }
```

### Vite Setup (Required)

```bash
# Install
npm install tailwindcss@^4.2 @tailwindcss/vite@^4.2
```

```javascript
// vite.config.js — NO PostCSS config needed, NO postcss.config.js
import { defineConfig } from "vite";
import react            from "@vitejs/plugin-react";
import tailwindcss      from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),   // ← replaces PostCSS integration entirely
  ],
});
```

```
❌ Do NOT create postcss.config.js for Tailwind in v4 Vite projects
❌ Do NOT install tailwindcss-cli or run npx tailwindcss commands
❌ Do NOT add tailwindcss to postcss.config.js plugins
✅ The @tailwindcss/vite plugin handles everything
```

### How Tokens Work in v4

In v4, all design tokens live in a `@theme {}` block inside your CSS file.
Token names map to Tailwind utility classes automatically:

```css
@theme {
  --color-primary: #ff8d8a;
  /* → enables: bg-primary, text-primary, border-primary, ring-primary */
  /* → opacity modifiers work: bg-primary/10, text-primary/60 */

  --font-headline: "Plus Jakarta Sans", system-ui, sans-serif;
  /* → enables: font-headline */

  --radius-lg: 2rem;
  /* → enables: rounded-lg */

  --shadow-primary: 0 12px 24px rgba(255,141,138,0.25);
  /* → enables: shadow-primary */
}
```

### Dark Mode in v4

```css
/* In your CSS file — replaces darkMode: "class" from tailwind.config.js */
@custom-variant dark (&:where(.dark, .dark *));
```

### What Still Works (Unchanged from v3)

```
✅ All utility class names: bg-*, text-*, p-*, m-*, flex, grid, etc.
✅ Arbitrary values: w-[340px], text-[10px], tracking-[0.2em]
✅ Responsive prefixes: sm:, md:, lg:, xl:
✅ State variants: hover:, focus:, active:, disabled:
✅ Opacity modifier syntax: bg-primary/10, text-white/60
✅ @layer base, @layer components, @layer utilities
✅ @apply directive inside @layer blocks
```

---

## The Prime Directive

> "Does this look like it was made by a startup that raised $50M,
>  or does it look like an AI generated it in 3 seconds?"

Every decision must answer that question. If you feel uncertain about a choice,
make it MORE intentional, MORE specific, MORE purposeful — never more generic.

**What separates production UI from AI slop:**
- AI slop: Purple gradient on white, Inter everywhere, `rounded-xl` on everything, shadows that don't make physical sense, 8-color palettes with no hierarchy
- Production UI: One dominant color, clear role hierarchy, shadows tied to elevation, typography with optical sizing, spacing with mathematical rhythm, every color has a *job*

---

## Part 1 — Design Token System

### 1.1 How Tokens Work

Never hardcode colors, spacing, or typography values.
Everything references a token. Tokens live in one place — CSS variables or a Tailwind config object.

**Token Naming Convention (Material Design 3 inspired):**
```
[role]-[variant]-[state]
surface           → base layer
surface-container → elevated layer
on-surface        → text/icons on surface
primary           → brand action color
on-primary        → content on primary color
primary-dim       → reduced-emphasis primary
```

### 1.2 Color System Architecture

A production color system has exactly **4 roles** with variants:

```
PRIMARY    → The brand. One color. Actions, CTAs, active states.
SECONDARY  → Supporting. Chips, tags, secondary actions.
TERTIARY   → Accent. Warnings, special highlights, decorative.
NEUTRAL    → Everything else. Surface, text, borders, dividers.
```

**RULE: No color is decorative. Every color has a job.**

```css
/* ── Global CSS Variables ── */
:root {
  /* ── Surfaces (Elevation System) ── */
  --surface-dim:              #0e0e13;  /* Lowest — dimmed/recessed */
  --surface:                  #0e0e13;  /* Base background */
  --surface-container-low:    #131319;  /* Slightly raised */
  --surface-container:        #19191f;  /* Default container */
  --surface-container-high:   #1f1f26;  /* Elevated container */
  --surface-container-highest:#25252d;  /* Most elevated */
  --surface-bright:           #2c2b33;  /* Brightest surface */

  /* ── On-Surface (Text/Icon on surfaces) ── */
  --on-surface:               #f9f5fd;  /* Primary text */
  --on-surface-variant:       #acaab1;  /* Secondary text, icons */
  --outline:                  #76747b;  /* Dividers, borders */
  --outline-variant:          #48474d;  /* Subtle dividers */

  /* ── Primary ── */
  --primary:                  #ff8d8a;  /* Main brand color */
  --primary-dim:              #ff706f;  /* Reduced emphasis */
  --primary-fixed:            #ff7574;  /* Fixed accent */
  --primary-fixed-dim:        #f56364;  /* Fixed accent reduced */
  --primary-container:        #ff7574;  /* Filled container */
  --on-primary:               #64000e;  /* Text on primary */
  --on-primary-fixed:         #000000;  /* Text on primary-fixed */
  --on-primary-container:     #4e0009;  /* Text on primary container */

  /* ── Secondary ── */
  --secondary:                #a88cfb;  /* Supporting color */
  --secondary-dim:            #a88cfb;  /* Reduced */
  --secondary-fixed:          #d8caff;
  --secondary-fixed-dim:      #ccbaff;
  --secondary-container:      #4f319c;
  --on-secondary:             #260069;
  --on-secondary-fixed:       #3c1989;
  --on-secondary-container:   #d7c8ff;

  /* ── Tertiary (Accent/Warning) ── */
  --tertiary:                 #ff794b;
  --tertiary-dim:             #ff7344;
  --tertiary-fixed:           #ff9471;
  --tertiary-fixed-dim:       #ff7d52;
  --tertiary-container:       #fa622c;
  --on-tertiary:              #461000;
  --on-tertiary-fixed:        #330900;
  --on-tertiary-container:    #2b0700;

  /* ── Error ── */
  --error:                    #ff7351;
  --error-dim:                #d53d18;
  --error-container:          #b92902;
  --on-error:                 #450900;
  --on-error-container:       #ffd2c8;

  /* ── Inverse ── */
  --inverse-surface:          #fcf8ff;
  --inverse-on-surface:       #55545b;
  --inverse-primary:          #ae3035;

  /* ── Background ── */
  --background:               #0e0e13;
  --on-background:            #f9f5fd;

  /* ── Signature Gradients ── */
  --gradient-primary: linear-gradient(135deg, #ff8d8a 0%, #ff794b 100%);
  --gradient-secondary: linear-gradient(135deg, #a88cfb 0%, #d8caff 100%);
  --gradient-surface: linear-gradient(180deg, transparent 0%, rgba(14,14,19,0.8) 100%);
}
```

### 1.3 When User Provides Screens

If files/code are provided, extract tokens like this:
1. Find all unique color values → map to the token naming system above
2. Find the primary action color (CTA buttons) → `--primary`
3. Find the headline font → `--font-headline`
4. Find all rounded corner values → build the radius scale
5. Do NOT add new colors. Work strictly within what's there.

---

## Part 2 — Typography System

### 2.1 Font Pairing Rules

**Only two typefaces in any product. Three maximum with strong justification.**

```
HEADLINE FONT → Plus Jakarta Sans (weight: 600–800)
               Used for: h1, h2, h3, CTA labels, nav labels, card titles
               Why: High x-height, geometric, premium feel at large sizes

BODY FONT    → Inter (weight: 400–600)
               Used for: body text, captions, labels, form inputs, metadata
               Why: Optical sizing, neutral, maximally readable at small sizes
```

```css
:root {
  --font-headline: 'Plus Jakarta Sans', system-ui, sans-serif;
  --font-body:     'Inter', system-ui, sans-serif;
  --font-label:    'Inter', system-ui, sans-serif;

  /* ── Type Scale ── */
  --text-xs:   0.625rem;   /* 10px — tracking-widest — ALL CAPS labels */
  --text-sm:   0.75rem;    /* 12px — caption, legal, metadata */
  --text-base: 0.875rem;   /* 14px — body, secondary */
  --text-md:   1rem;       /* 16px — primary body */
  --text-lg:   1.125rem;   /* 18px — card titles, subheadings */
  --text-xl:   1.25rem;    /* 20px — section headings */
  --text-2xl:  1.5rem;     /* 24px — page title */
  --text-3xl:  1.875rem;   /* 30px — hero section */
  --text-4xl:  2.25rem;    /* 36px — welcome screens */
  --text-5xl:  3rem;       /* 48px — landing displays */

  /* ── Line Heights ── */
  --leading-tight:  1.2;
  --leading-snug:   1.35;
  --leading-normal: 1.5;
  --leading-relaxed:1.65;

  /* ── Letter Spacing ── */
  --tracking-tight:  -0.025em;
  --tracking-normal:  0em;
  --tracking-wide:    0.05em;
  --tracking-wider:   0.1em;
  --tracking-widest:  0.2em;   /* For ALL CAPS micro-labels */
}
```

### 2.2 Typography Rules — No Exceptions

```
RULE 1: Headlines use --font-headline. Always. No exceptions.
RULE 2: Body text, inputs, captions use --font-body.
RULE 3: ALL CAPS text gets --tracking-widest (0.2em). Always.
RULE 4: Hero text (h1 on a landing/welcome screen) gets --tracking-tight and font-weight: 800.
RULE 5: Never use font-weight: 300 (light) on dark backgrounds. Use 400 minimum.
RULE 6: Metadata/timestamps/secondary labels: --on-surface-variant, --text-sm, weight 500.
RULE 7: Never center-align body paragraphs longer than 2 lines.
RULE 8: Card titles: --font-headline, weight 600-700, --text-lg or --text-xl.
```

### 2.3 Tailwind Typography Classes

```javascript
// tailwind.config — always include this
theme: {
  extend: {
    fontFamily: {
      headline: ["Plus Jakarta Sans", "system-ui", "sans-serif"],
      body:     ["Inter", "system-ui", "sans-serif"],
      label:    ["Inter", "system-ui", "sans-serif"],
    }
  }
}

// Usage in components:
// <h1 className="font-headline text-4xl font-extrabold tracking-tight">
// <p  className="font-body text-base text-on-surface-variant">
// <span className="font-label text-[10px] font-bold tracking-[0.2em] uppercase">
```

---

## Part 3 — Spacing System

### 3.1 Base Unit

**Everything is a multiple of 4px.** No arbitrary values.

```
4px  → 0.25rem  → micro gap (icon-text spacing)
8px  → 0.5rem   → tight internal padding
12px → 0.75rem  → small component padding
16px → 1rem     → default padding
20px → 1.25rem  → card internal padding (compact)
24px → 1.5rem   → card internal padding (comfortable)
32px → 2rem     → section gap (mobile)
40px → 2.5rem   → section gap (desktop)
48px → 3rem     → hero vertical padding
64px → 4rem     → large section separation
```

**RULE: Padding and gap values must come from this scale.**
Never write `padding: 13px` or `gap: 7px`. It breaks rhythm.

### 3.2 Layout Widths

```css
:root {
  --max-content: 42rem;    /* 672px — readable content */
  --max-card:    28rem;    /* 448px — single card max */
  --max-layout:  72rem;    /* 1152px — full layout */
  --page-gutter: 1.5rem;   /* 24px mobile side padding */
  --page-gutter-md: 2rem;  /* 32px tablet */
  --page-gutter-lg: 3rem;  /* 48px desktop */
}
```

---

## Part 4 — Border Radius System

### 4.1 The Scale

```css
:root {
  --radius-sm:   0.5rem;    /* 8px  — chips, tags, small badges */
  --radius:      1rem;      /* 16px — cards, inputs, buttons (default) */
  --radius-lg:   2rem;      /* 32px — large cards, modal bottoms */
  --radius-xl:   3rem;      /* 48px — FABs, hero sections, bottom nav */
  --radius-full: 9999px;    /* Pills — CTAs, status pills, avatars */
}
```

**Tailwind config:**
```javascript
borderRadius: {
  sm:      "0.5rem",
  DEFAULT: "1rem",
  lg:      "2rem",
  xl:      "3rem",
  full:    "9999px",
}
```

### 4.2 Radius Rules

```
Cards → rounded-lg (1rem default) or rounded-xl (2rem) for large cards
Buttons (primary CTA) → rounded-full (pill shape always)
Buttons (secondary) → rounded-full or rounded-lg (match primary)
Inputs → rounded-lg (1rem)
Avatars → rounded-full
Tags / Chips / Badges → rounded-full
Bottom sheet / Modal → rounded-t-xl on top-two corners only
Icons within containers → match parent radius / 4
```

**RULE: Never mix radius scales in the same component family.**
If cards are `rounded-lg`, all cards are `rounded-lg`.

---

## Part 5 — Glass Card System

### 5.1 The Standard Glass Card

This is the workhorse component. Used for: content cards, info panels, form fields, list items.

```css
.glass-card {
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  /* No box-shadow on glass cards — they float via transparency */
}
```

```javascript
// Tailwind — define in CSS layer
// @layer components {
//   .glass-card { ... }
// }

// Or inline:
className="bg-white/[0.06] backdrop-blur-xl border border-white/[0.08]"
```

### 5.2 Glass Card Variants

```css
/* Subtle — background tonal sections */
.glass-subtle {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
}

/* Elevated — modals, sheets, critical panels */
.glass-elevated {
  background: rgba(255, 255, 255, 0.09);
  backdrop-filter: blur(40px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
}

/* Tonal — uses surface color, not transparency */
.card-tonal {
  background: var(--surface-container);
  border: 1px solid rgba(255, 255, 255, 0.05);
}
```

### 5.3 Card Content Hierarchy

Every card has max three levels of information density:

```
PRIMARY   → Card title, key value, main action     font-headline, font-semibold+, --on-surface
SECONDARY → Supporting detail, subtitle, metadata  font-body, font-medium, --on-surface-variant
TERTIARY  → Timestamps, byte counts, sub-labels    font-label, text-xs, --outline, uppercase+tracking-widest
```

---

## Part 6 — Gradient System

### 6.1 Defined Gradients

```css
:root {
  /* Signature — primary to tertiary. Used for: CTAs, hero elements, active states */
  --gradient-signature: linear-gradient(135deg, #ff8d8a 0%, #ff794b 100%);

  /* Lavender — secondary color range. Used for: feature pills, secondary CTAs */
  --gradient-lavender:  linear-gradient(135deg, #a88cfb 0%, #d8caff 100%);

  /* Surface fade — for bottom sheets, overlay gradient */
  --gradient-surface-fade: linear-gradient(180deg, transparent 0%, rgba(14,14,19,0.95) 100%);

  /* Ambient blobs — background decoration only */
  --gradient-blob-primary:   radial-gradient(circle, rgba(255,141,138,0.10) 0%, transparent 70%);
  --gradient-blob-secondary: radial-gradient(circle, rgba(168,140,251,0.08) 0%, transparent 70%);
}
```

### 6.2 Gradient Rules

```
RULE 1: One gradient-signature element per screen. It draws the eye. Two = neither gets attention.
RULE 2: Gradient text is decoration only. Never on interactive body copy.
RULE 3: Background blobs are fixed-position, pointer-events-none, z-index below content (-z-10).
RULE 4: Gradient buttons always have matching glow shadows:
         shadow-[0_12px_24px_rgba(255,141,138,0.25)] (primary)
         shadow-[0_10px_20px_rgba(168,140,251,0.20)] (secondary)
RULE 5: Do NOT apply gradient to icons. Solid color only.
```

---

## Part 7 — Shadow & Elevation

### 7.1 Elevation Scale

Shadows communicate elevation. Every shadow is directional (below the element, never above).

```css
:root {
  --shadow-none:    none;
  --shadow-sm:      0 1px 4px rgba(0,0,0,0.3);
  --shadow:         0 4px 12px rgba(0,0,0,0.4);
  --shadow-md:      0 8px 24px rgba(0,0,0,0.5);
  --shadow-lg:      0 16px 40px rgba(0,0,0,0.55);
  --shadow-xl:      0 24px 60px rgba(0,0,0,0.6);

  /* Colored glow shadows — ONLY on gradient/colored elements */
  --shadow-primary:   0 12px 24px rgba(255,141,138,0.25);
  --shadow-secondary: 0 10px 20px rgba(168,140,251,0.20);
  --shadow-tertiary:  0 10px 20px rgba(255,121,75,0.20);
  --shadow-error:     0 0 40px rgba(213,61,24,0.4);
}
```

### 7.2 Shadow Rules

```
Flat surfaces (glass cards)   → no shadow — transparency handles depth
Floating panels (bottom sheet)→ shadow-xl + border-t border-white/10
Modal overlays                → shadow-xl + backdrop blur backdrop-blur-md on bg
Primary CTA buttons           → shadow-primary (colored, matches button color)
FAB / SOS button              → shadow-error or shadow-primary (dramatic, intentional)
Ambient blob decorations      → blur() only, no box-shadow
```

---

## Part 8 — Component Patterns

### 8.1 Primary CTA Button

The most important interactive element. Perfect execution required.

```jsx
// ✅ Production Grade CTA
<button className="
  w-full py-5
  bg-gradient-to-br from-primary to-tertiary
  rounded-full
  font-headline font-bold text-lg text-on-primary-fixed
  shadow-[0_12px_24px_rgba(255,141,138,0.25)]
  transition-transform duration-200
  active:scale-95
  hover:opacity-90
">
  Get Started
</button>

// CSS version
.btn-primary {
  width: 100%;
  padding: 1.25rem 2rem;
  background: var(--gradient-signature);
  border-radius: var(--radius-full);
  font-family: var(--font-headline);
  font-weight: 700;
  font-size: 1.125rem;
  color: var(--on-primary-fixed);
  box-shadow: var(--shadow-primary);
  transition: transform 200ms ease, opacity 200ms ease;
  border: none;
  cursor: pointer;
}
.btn-primary:active { transform: scale(0.95); }
.btn-primary:hover  { opacity: 0.9; }
```

### 8.2 Secondary Button

```jsx
<button className="
  w-full py-5
  rounded-full
  border-2 border-primary/20 bg-surface-container/40
  backdrop-blur-sm
  font-headline font-bold text-lg text-primary
  transition-all duration-200
  hover:bg-surface-container/60
  active:scale-95
">
  Change Route
</button>
```

### 8.3 Ghost / Icon Button

```jsx
<button className="
  w-12 h-12
  flex items-center justify-center
  rounded-full
  bg-white/5 backdrop-blur-xl
  border border-white/10
  text-on-surface-variant
  hover:text-on-surface hover:bg-white/10
  transition-all duration-200
  active:scale-95
">
  <span className="material-symbols-outlined">arrow_back</span>
</button>
```

### 8.4 Status Pill / Badge

```jsx
// Active status
<span className="
  px-3 py-1
  bg-primary/10 border border-primary/20
  text-primary text-[10px] font-bold
  rounded-full
  uppercase tracking-[0.15em]
">
  ACTIVE
</span>

// Pending status
<span className="
  px-3 py-1
  bg-surface-container-highest border border-outline-variant/15
  text-on-surface-variant text-[10px] font-bold
  rounded-full
  uppercase tracking-[0.15em]
">
  PENDING
</span>
```

### 8.5 Input Field

```jsx
<div className="
  relative group
  glass-card rounded-lg
  border border-outline-variant/15
  focus-within:ring-2 focus-within:ring-secondary/40
  focus-within:border-secondary/60
  transition-all duration-200
">
  <input
    className="
      w-full h-[72px] px-6
      bg-transparent border-none
      font-headline text-lg font-medium text-on-surface
      placeholder:text-on-surface-variant/40
      focus:outline-none focus:ring-0
    "
    placeholder="Your name"
  />
</div>
```

### 8.6 List Item / Contact Row

```jsx
<div className="
  glass-card rounded-xl p-4
  flex items-center justify-between
  group hover:bg-white/5
  border border-white/[0.05]
  transition-colors duration-200
  cursor-pointer
">
  {/* Avatar */}
  <div className="flex items-center gap-4">
    <div className="
      w-12 h-12 rounded-full
      bg-surface-container-highest
      flex items-center justify-center
      font-headline font-semibold text-secondary
      border border-outline-variant/15
    ">
      SK
    </div>
    <div>
      <h4 className="font-headline font-medium text-on-surface">Sarah K.</h4>
      <p className="text-on-surface-variant text-xs font-body">Best Friend</p>
    </div>
  </div>

  {/* Action */}
  <span className="
    material-symbols-outlined
    text-on-surface-variant
    group-hover:text-primary
    transition-colors duration-200
  ">
    send
  </span>
</div>
```

### 8.7 Bottom Navigation Bar

```jsx
<nav className="
  fixed bottom-0 left-0 w-full z-50
  flex justify-around items-center
  px-6 pb-safe-or-6 pt-3
  bg-[#0e0e13]/80 backdrop-blur-2xl
  rounded-t-xl
  border-t border-white/[0.05]
  shadow-[0_-8px_40px_rgba(255,141,138,0.06)]
">
  {/* Active tab */}
  <div className="
    flex flex-col items-center justify-center
    bg-gradient-to-br from-primary to-tertiary
    rounded-full px-6 py-2
    shadow-[0_0_20px_rgba(255,141,138,0.3)]
    -translate-y-[2px]
    transition-transform duration-300
  ">
    <span className="material-symbols-outlined text-xl mb-0.5 text-on-primary-fixed"
      style={{ fontVariationSettings: "'FILL' 1" }}>shield</span>
    <span className="font-headline text-[10px] font-semibold tracking-wide uppercase text-on-primary-fixed">
      Home
    </span>
  </div>

  {/* Inactive tab */}
  <div className="
    flex flex-col items-center justify-center
    text-on-surface-variant opacity-50
    hover:text-on-surface hover:opacity-100
    transition-all duration-200 cursor-pointer
  ">
    <span className="material-symbols-outlined text-2xl mb-0.5">group</span>
    <span className="font-headline text-[10px] font-semibold tracking-wide uppercase">
      Contacts
    </span>
  </div>
</nav>
```

### 8.8 Section Label / Micro-heading

```jsx
// RULE: ALL CAPS section labels always use tracking-[0.2em] and text-[10px]
<div className="flex items-center gap-2">
  <span className="material-symbols-outlined text-primary text-sm"
    style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
  <span className="
    font-label text-[10px] font-extrabold
    tracking-[0.2em] text-primary uppercase
  ">
    Priority
  </span>
</div>
```

---

## Part 9 — Background Decoration System

### 9.1 Ambient Blob Pattern

Every screen has 2–3 ambient blobs. They are:
- `position: fixed`
- `pointer-events: none`
- `z-index: -10` (below all content)
- `blur-[80px]` to `blur-[140px]`
- Opacity: 5%–12% max

```jsx
{/* Standard two-blob setup */}
<div className="fixed -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
<div className="fixed bottom-[-5%] left-[-10%] w-[400px] h-[400px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

{/* Subtle one-blob setup */}
<div className="fixed top-1/2 -right-24 w-80 h-80 bg-secondary/5 rounded-full blur-[80px] pointer-events-none -z-10" />
```

### 9.2 Blob Rules

```
RULE 1: Maximum 3 blobs per screen.
RULE 2: Blobs must be positioned at screen edges, partially off-screen.
         Never floating centered in the middle of the screen.
RULE 3: Primary blob → primary/10 opacity. Always corner placement.
RULE 4: Secondary blob → secondary/5 opacity. Opposite corner from primary.
RULE 5: Never use blob colors that don't exist in the token system.
RULE 6: On map/full-bleed screens, reduce blob opacity to /5 or omit entirely.
```

### 9.3 Grid/Noise Texture (Optional)

```jsx
{/* Subtle noise overlay — use sparingly, only on hero screens */}
<div
  className="fixed inset-0 pointer-events-none opacity-[0.03] -z-10"
  style={{
    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`
  }}
/>
```

---

## Part 10 — Animation System

### 10.1 Core Principles

```
PRINCIPLE 1: Animate properties the GPU can handle: transform, opacity. Nothing else.
              Never animate: width, height, padding, margin, top, left.

PRINCIPLE 2: Duration ladder:
              50ms  → state change (active/focus)
              150ms → micro-interaction (button press)
              200ms → transition (hover state change)
              300ms → component enter/exit
              500ms → page transition
              Never exceed 600ms for UI motion.

PRINCIPLE 3: Easing:
              ease-out → elements entering the screen (decelerate)
              ease-in  → elements leaving the screen (accelerate)
              ease-in-out → elements that stay but move

PRINCIPLE 4: Stagger reveals on lists: 50ms delay between items.
              Never animate more than 6 items in a stagger.

PRINCIPLE 5: The pulsing dot / ping animation signals real-time/live status.
              Never use animate-ping on static content.
```

### 10.2 Standard Animations (Tailwind)

```css
/* ── Button press ── */
.btn: active:scale-95 transition-transform duration-150

/* ── List item hover ── */
.list-item: hover:bg-white/5 transition-colors duration-200

/* ── Page content reveal ── */
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-reveal {
  animation: fadeSlideUp 400ms ease-out forwards;
}

/* ── Staggered list ── */
.stagger-1 { animation-delay: 50ms; }
.stagger-2 { animation-delay: 100ms; }
.stagger-3 { animation-delay: 150ms; }
.stagger-4 { animation-delay: 200ms; }

/* ── Floating ambient pulse (background element) ── */
/* Uses Tailwind: animate-pulse — only on bg decoration */

/* ── Live status ping ── */
/* Uses Tailwind: animate-ping — only on status indicators */

/* ── Float animation (logo / feature icon) ── */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

### 10.3 React / Framer Motion Patterns

```jsx
// Page enter
const pageVariants = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};
const pageTransition = { duration: 0.4, ease: "easeOut" };

// Staggered list
const containerVariants = {
  visible: { transition: { staggerChildren: 0.05 } }
};
const itemVariants = {
  hidden:  { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
};

// Usage:
<motion.div variants={containerVariants} initial="hidden" animate="visible">
  {items.map(item => (
    <motion.div key={item.id} variants={itemVariants}>
      <Card item={item} />
    </motion.div>
  ))}
</motion.div>

// Scale press (replaces Tailwind active:scale-95 for more control)
<motion.button
  whileTap={{ scale: 0.95 }}
  whileHover={{ opacity: 0.9 }}
  transition={{ duration: 0.15 }}
>
  Get Started
</motion.button>
```

---

## Part 11 — Icon System

### 11.1 Material Symbols — Standard Usage

```jsx
// Always set font-variation-settings explicitly

// Outlined (default — for inactive/secondary)
<span className="material-symbols-outlined text-on-surface-variant">
  shield
</span>

// Filled (for active states, primary emphasis)
<span
  className="material-symbols-outlined text-primary"
  style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
>
  shield
</span>
```

### 11.2 Icon Size Scale

```
text-sm   → 20px — inline icons in text, metadata
text-base → 24px — default icon size in buttons/lists
text-lg   → 28px — section icons, feature pills
text-2xl  → 32px — card feature icons
text-3xl  → 36px — hero icons, large containers
text-4xl  → 40px — welcome/onboarding icons
```

### 11.3 Icon + Text Spacing

```
Icon left of text → gap-2 (8px) for small, gap-3 (12px) for medium, gap-4 (16px) for large
Icon in a button  → gap-2 or gap-3 max
Icon standalone in a container → centered, no gap needed
```

---

## Part 12 — Responsive System

### 12.1 Breakpoints

```javascript
// Tailwind defaults — use these, don't invent new ones
// sm:  640px   — large phone landscape
// md:  768px   — tablet portrait
// lg:  1024px  — tablet landscape / small desktop
// xl:  1280px  — desktop
// 2xl: 1536px  — large desktop
```

### 12.2 Mobile-First Layout Rules

```
MOBILE (default — no prefix):
  - Single column
  - Full-width components
  - px-6 (24px) horizontal gutter
  - Stack everything vertically
  - Bottom nav (fixed)
  - Large touch targets: min 48x48px

TABLET (md:):
  - 2-column grid for cards
  - max-w-lg centered container
  - Keep bottom nav or switch to sidebar

DESKTOP (lg:):
  - 3–4 column grid
  - Sidebar navigation
  - max-w-6xl centered
  - Hover states become meaningful
```

### 12.3 Safe Area (Mobile)

```jsx
// Always account for device notch / home indicator
className="pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)]"

// Bottom nav: always add safe area bottom padding
className="pb-[max(1.5rem,env(safe-area-inset-bottom))]"
```

---

## Part 13 — Screen Layout Patterns

### 13.1 Standard Full-Screen Layout

```jsx
<div className="min-h-screen bg-surface overflow-x-hidden relative">
  {/* Ambient blobs — always first */}
  <div className="fixed -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
  <div className="fixed bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-[100px] pointer-events-none -z-10" />

  {/* Header */}
  <header className="fixed top-0 left-0 right-0 z-50 bg-surface/60 backdrop-blur-xl border-b border-white/5">
    {/* ... */}
  </header>

  {/* Main scrollable content */}
  <main className="pt-[72px] pb-24 px-6 max-w-lg mx-auto">
    {/* ... */}
  </main>

  {/* Bottom navigation */}
  <nav className="fixed bottom-0 left-0 right-0 z-50">
    {/* ... */}
  </nav>
</div>
```

### 13.2 Onboarding / Welcome Screen

```jsx
<main className="min-h-screen bg-surface flex flex-col items-center justify-between px-8 py-16">
  {/* Logo + title — top 1/3 */}
  <div className="flex flex-col items-center space-y-6 mt-12">
    {/* Logo icon */}
    {/* H1 app name */}
    {/* Subtitle */}
  </div>

  {/* Feature pills — center */}
  <div className="w-full space-y-4 max-w-sm">
    {/* 3 feature rows */}
  </div>

  {/* CTA + legal — bottom */}
  <div className="w-full max-w-sm flex flex-col items-center space-y-8">
    {/* Primary CTA button */}
    {/* Legal micro-text */}
  </div>
</main>
```

### 13.3 Map / Full-Bleed Screen

```jsx
<div className="min-h-screen relative overflow-hidden">
  {/* Map fills entire background */}
  <div className="fixed inset-0 z-0">
    <img className="w-full h-full object-cover brightness-[0.4]" src={mapImg} />
    {/* Route SVG overlay */}
  </div>

  {/* Floating top bar */}
  <div className="fixed top-0 left-0 right-0 p-6 z-50 flex items-center justify-between">
    {/* Back + ETA pill + status */}
  </div>

  {/* Bottom sheet */}
  <div className="fixed bottom-0 left-0 right-0 z-50
    bg-surface-container-low/60 backdrop-blur-[40px]
    rounded-t-xl border-t border-white/10
    shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
    {/* Drag handle + content */}
  </div>
</div>
```

---

## Part 14 — States & Interaction

### 14.1 Interactive State Rules

Every interactive element must have all four states defined:

```
DEFAULT  → The resting state
HOVER    → Desktop: color shift, opacity change
ACTIVE   → scale(0.95) — the "pressed" feeling
FOCUS    → ring-2 ring-secondary/40 — keyboard nav, never remove this
DISABLED → opacity-50 cursor-not-allowed — no hover/active effects
```

```jsx
// Complete interactive element
<button className="
  /* Default */
  bg-surface-container text-on-surface border border-outline-variant/20
  /* Hover */
  hover:bg-surface-container-high hover:border-outline-variant/40
  /* Active */
  active:scale-95
  /* Focus */
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/40
  /* Disabled */
  disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
  /* Transition */
  transition-all duration-200
">
```

### 14.2 Loading States

```jsx
// Skeleton — for content that's loading
<div className="animate-pulse bg-surface-container-highest rounded-lg h-16" />

// Spinner — for actions in progress
<div className="w-5 h-5 rounded-full border-2 border-white/20 border-t-white animate-spin" />

// Button loading state
<button disabled className="opacity-70 cursor-not-allowed ...">
  <div className="flex items-center justify-center gap-3">
    <div className="w-5 h-5 rounded-full border-2 border-on-primary-fixed/30 border-t-on-primary-fixed animate-spin" />
    <span>Loading...</span>
  </div>
</button>
```

---

## Part 15 — What Makes It NOT Feel Like AI

### 15.1 The Anti-Patterns List

These patterns immediately signal AI-generated UI. Never use them:

```
❌ Purple gradient hero on white background
❌ "Glassmorphism" cards with no depth hierarchy between them
❌ Every button the same width, same height, same shape
❌ 6+ colors all used at equal visual weight
❌ Rounded corners: border-radius: 12px on literally everything
❌ Helvetica Neue / System font + gray everything
❌ Grid: 3 equal columns with identical card heights
❌ "Hero" text with gradient stroke on every heading
❌ Box shadows that go in all directions equally (0 0 20px)
❌ Placeholder icons (rocket ship, star, check) with no specific meaning
❌ "Lorem ipsum" left in
❌ Hover: just darken the background 10% on everything
❌ Animations that have no directional logic (fade only, always)
❌ Navigation that doesn't communicate what page you're on
```

### 15.2 The Production Signals List

These signals communicate intentional, production-grade design:

```
✅ Typography with optical size adjustments (icons 20–40px, tuned per context)
✅ Colors from a single hue family with 3 tonal stops
✅ Shadows that only go DOWN (elevation is always above)
✅ One dominant action per screen — every other action is visually subordinate
✅ Font weight variation creates hierarchy (not just size)
✅ Spacing that follows a strict mathematical rhythm
✅ Active navigation item uses filled icons, inactive uses outlined
✅ Animations that have directional logic (enter from bottom, exit to top)
✅ Micro-copy that's genuinely useful ("Hold for 1.5 seconds" vs "Submit")
✅ Empty states that have soul — not just "No content found"
✅ Status indicators that are semantic (color + icon + text, not just color)
✅ All-caps labels with tracking-[0.2em] (spaced out) — never normal tracking
✅ Pill-shaped CTAs — rounded-full, not rounded-xl
✅ Card left-border accent for priority/featured items (border-l-4 border-primary)
✅ Touch targets that are always 48x48px minimum
```

### 15.3 Information Hierarchy Check

Before finalizing any screen, verify:

```
1. Is there ONE thing the user's eye goes to first?    (Primary — gradient CTA or main content)
2. Is there a clear secondary action?                  (Less prominent, same area)
3. Is navigation never competing with content?          (Fixed, blurred, below content visually)
4. Does the typography scale create rhythm?             (Not all text looks the same size/weight)
5. Is white space intentional?                         (Crowded sections vs breathing room sections)
6. Does every color serve a role?                      (No decoration-only colors)
7. Is there exactly one "loud" animation?              (One pulsing element, one gradient glow)
```

---

## Part 16 — Tailwind v4 Token Setup

> **v4 has no `tailwind.config.js`.** All tokens live in your CSS file inside `@theme {}`.
> Do NOT create a `tailwind.config.js`. Do NOT use `module.exports`. Do NOT use `@tailwind base`.
> The entire token system below goes into one CSS file and is picked up automatically by Vite.

### 16.1 Full Token CSS (paste into your globals.css)

```css
/* ─── globals.css ─────────────────────────────────────────────────────────── */

/* 1. Import Tailwind v4 (replaces @tailwind base/components/utilities) */
@import "tailwindcss";

/* 2. Fonts */
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&display=swap');
@import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap');

/* 3. Source paths — tells v4 which files to scan for class names */
@source "../src/**/*.{js,jsx,ts,tsx,html}";

/* 4. Dark mode variant */
@custom-variant dark (&:where(.dark, .dark *));

/* 5. Design tokens — everything in one @theme block */
@theme {

  /* ── Fonts ─────────────────────────────────────────── */
  --font-headline: "Plus Jakarta Sans", system-ui, sans-serif;
  --font-body:     "Inter", system-ui, sans-serif;
  --font-label:    "Inter", system-ui, sans-serif;

  /* ── Border Radius ─────────────────────────────────── */
  --radius-sm:   0.5rem;
  --radius:      1rem;
  --radius-lg:   2rem;
  --radius-xl:   3rem;
  --radius-full: 9999px;

  /* ── Shadows ───────────────────────────────────────── */
  --shadow-primary:   0 12px 24px rgba(255,141,138,0.25);
  --shadow-secondary: 0 10px 20px rgba(168,140,251,0.20);
  --shadow-tertiary:  0 10px 20px rgba(255,121,75,0.20);
  --shadow-error:     0 0 40px rgba(213,61,24,0.40);
  --shadow-sos:       0 0 50px rgba(255,141,138,0.40);

  /* ── Keyframes & Animations ────────────────────────── */
  --animate-float:   float 3s ease-in-out infinite;
  --animate-reveal:  fadeSlideUp 400ms ease-out forwards;
  --animate-fade-in: fadeIn 300ms ease-out forwards;

  /* ── Neutral Surfaces ──────────────────────────────── */
  --color-surface-dim:               #0e0e13;
  --color-surface:                   #0e0e13;
  --color-surface-container-low:     #131319;
  --color-surface-container:         #19191f;
  --color-surface-container-high:    #1f1f26;
  --color-surface-container-highest: #25252d;
  --color-surface-bright:            #2c2b33;
  --color-background:                #0e0e13;
  --color-on-surface:                #f9f5fd;
  --color-on-background:             #f9f5fd;
  --color-on-surface-variant:        #acaab1;
  --color-outline:                   #76747b;
  --color-outline-variant:           #48474d;

  /* ── Primary ───────────────────────────────────────── */
  --color-primary:                   #ff8d8a;
  --color-primary-dim:               #ff706f;
  --color-primary-fixed:             #ff7574;
  --color-primary-fixed-dim:         #f56364;
  --color-primary-container:         #ff7574;
  --color-on-primary:                #64000e;
  --color-on-primary-fixed:          #000000;
  --color-on-primary-container:      #4e0009;
  --color-on-primary-fixed-variant:  #60000d;
  --color-surface-tint:              #ff8d8a;

  /* ── Secondary ─────────────────────────────────────── */
  --color-secondary:                  #a88cfb;
  --color-secondary-dim:              #a88cfb;
  --color-secondary-fixed:            #d8caff;
  --color-secondary-fixed-dim:        #ccbaff;
  --color-secondary-container:        #4f319c;
  --color-on-secondary:               #260069;
  --color-on-secondary-fixed:         #3c1989;
  --color-on-secondary-container:     #d7c8ff;
  --color-on-secondary-fixed-variant: #593ca6;

  /* ── Tertiary ──────────────────────────────────────── */
  --color-tertiary:                   #ff794b;
  --color-tertiary-dim:               #ff7344;
  --color-tertiary-fixed:             #ff9471;
  --color-tertiary-fixed-dim:         #ff7d52;
  --color-tertiary-container:         #fa622c;
  --color-on-tertiary:                #461000;
  --color-on-tertiary-fixed:          #330900;
  --color-on-tertiary-container:      #2b0700;
  --color-on-tertiary-fixed-variant:  #6d1d00;

  /* ── Error ─────────────────────────────────────────── */
  --color-error:                      #ff7351;
  --color-error-dim:                  #d53d18;
  --color-error-container:            #b92902;
  --color-on-error:                   #450900;
  --color-on-error-container:         #ffd2c8;

  /* ── Inverse ───────────────────────────────────────── */
  --color-inverse-surface:            #fcf8ff;
  --color-inverse-on-surface:         #55545b;
  --color-inverse-primary:            #ae3035;
}

/* 6. Keyframe definitions (outside @theme — same as always) */
@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50%       { transform: translateY(-8px); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes fadeIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}

/* 7. Plugin (replaces require("@tailwindcss/forms") in config) */
@plugin "@tailwindcss/forms";

/* 8. Base layer — global resets */
@layer base {
  * {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }
  html { background-color: #0e0e13; }
  body {
    font-family: var(--font-body);
    color: #f9f5fd;
    min-height: 100dvh;
  }
  ::selection {
    background: rgba(255, 141, 138, 0.3);
    color: #f9f5fd;
  }
  ::-webkit-scrollbar { width: 0; }
  .material-symbols-outlined {
    font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
  }
}

/* 9. Component layer — reusable class utilities */
@layer components {
  .glass-card {
    background: rgba(255, 255, 255, 0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.08);
  }
  .glass-subtle {
    background: rgba(255, 255, 255, 0.03);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }
  .glass-elevated {
    background: rgba(255, 255, 255, 0.09);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
  }
  .signature-gradient {
    background: linear-gradient(135deg, #ff8d8a 0%, #ff794b 100%);
  }
  .lavender-gradient {
    background: linear-gradient(135deg, #a88cfb 0%, #d8caff 100%);
  }
  .btn-primary {
    @apply w-full py-5 rounded-full font-headline font-bold text-lg
           text-on-primary-fixed signature-gradient
           shadow-primary active:scale-95 hover:opacity-90
           transition-all duration-200 border-none cursor-pointer;
  }
  .section-label {
    @apply font-label text-[10px] font-extrabold tracking-[0.2em]
           text-on-surface-variant uppercase;
  }
  .page-container {
    @apply max-w-lg mx-auto w-full px-6;
  }
}
```

### 16.2 How Token Classes Work in v4

```
@theme token name              → Tailwind class generated
──────────────────────────────────────────────────────────
--color-primary: #ff8d8a      → bg-primary, text-primary,
                                 border-primary, ring-primary,
                                 + opacity: bg-primary/10, text-primary/60
--color-surface-container      → bg-surface-container, text-surface-container
--font-headline                → font-headline
--radius-lg                    → rounded-lg
--shadow-primary               → shadow-primary
--animate-reveal               → animate-reveal
```

### 16.3 package.json — Required Dependencies

```json
{
  "dependencies": {
    "react":          "^19.0.0",
    "react-dom":      "^19.0.0"
  },
  "devDependencies": {
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/vite":  "^4.2.0",
    "@vitejs/plugin-react":"^4.0.0",
    "tailwindcss":         "^4.2.0",
    "vite":                "^6.0.0"
  }
}
```

```
❌ Do NOT install: autoprefixer, postcss, tailwindcss-cli
   (v4 with Vite plugin needs none of these)
```

---

## Part 17 — Quick Reference: Agent Decision Tree

When asked to build any UI screen, follow this order:

```
1. TOKENS FIRST
   → Are tokens already defined (user provided screens)? Extract and use them.
   → New project? Use the globals.css token setup from Part 16.

2. LAYOUT PATTERN
   → Which layout template does this screen need? (Part 13)
   → Mobile-first, then scale up.

3. BACKGROUND DECORATION
   → Add 2 ambient blobs (Part 9.1). Fixed, z-10, pointer-events-none.
   → Only if screen has no full-bleed map/image.

4. TYPOGRAPHY HIERARCHY
   → Primary content: font-headline, large, extrabold, tracking-tight
   → Secondary: font-body, on-surface-variant
   → Labels: font-label, text-[10px], ALL CAPS, tracking-[0.2em]

5. COMPONENTS
   → Use exact patterns from Part 8. No improvisation on component structure.
   → Glass cards for content containers.
   → Rounded-full CTAs with signature-gradient and shadow-primary.

6. INTERACTIONS
   → active:scale-95 on ALL interactive elements.
   → hover:bg-white/5 or hover:opacity-90 on all hover states.
   → focus-visible:ring-2 on all inputs and buttons.

7. ANIMATION CHECK
   → Is there ONE prominent animated element? (blob pulse, live status ping)
   → Are list items staggered? (50ms delay each)
   → Do page reveals use fadeSlideUp?

8. HIERARCHY CHECK (Part 15.3)
   → Run the 7-question check before finishing.
   → Would a Google designer approve this?
```

---

*This document defines the standard. Every screen built by this developer or their AI agents
must comply with every rule in this document. There are no exceptions for "quick builds"
or "hackathon speed" — the token system makes speed and quality coexist.*
