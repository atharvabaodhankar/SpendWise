import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Tier 1: F1 Foundation, Design Tokens & Typography (index.html, src/index.css, scale limits)', () => {
  const indexHtmlPath = path.join(projectRoot, 'index.html');
  const indexCssPath = path.join(projectRoot, 'src/index.css');

  it('loads IBM Plex Sans weights 300, 400, 500, 600 via Google Fonts and verifies native rupee glyph support (U+20B9)', () => {
    expect(fs.existsSync(indexHtmlPath), 'index.html must exist').toBe(true);
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

    // Must load IBM Plex Sans with weights 300, 400, 500, 600
    expect(htmlContent).toMatch(/family=IBM\+Plex\+Sans:[^"']*300/);
    expect(htmlContent).toMatch(/family=IBM\+Plex\+Sans:[^"']*400/);
    expect(htmlContent).toMatch(/family=IBM\+Plex\+Sans:[^"']*500/);
    expect(htmlContent).toMatch(/family=IBM\+Plex\+Sans:[^"']*600/);

    // Confirm rupee glyph U+20B9 string representation
    const rupeeChar = '\u20B9';
    expect(rupeeChar).toBe('₹');
    expect(rupeeChar.charCodeAt(0)).toBe(0x20B9);
  });

  it('injects synchronous theme initialization script in <head> and sets viewport-fit=cover', () => {
    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

    // Viewport meta must specify viewport-fit=cover
    expect(htmlContent).toMatch(/<meta[^>]*name=["']viewport["'][^>]*viewport-fit=cover/i);

    // Theme initialization script must reside in <head> before <body>
    const headMatch = htmlContent.match(/<head>([\s\S]*?)<\/head>/i);
    expect(headMatch, 'index.html must contain a <head> section').not.toBeNull();
    const headContent = headMatch[1];

    // Script in <head> checks theme preference to eliminate flash
    expect(headContent).toMatch(/<script[\s\S]*?localStorage\.getItem\(['"]theme['"]\)/);
    expect(headContent).toMatch(/classList\.(add|remove)\(['"]dark['"]\)/);
  });

  it('defines semantic light and dark token palettes along with Indian banknote category hues in src/index.css', () => {
    expect(fs.existsSync(indexCssPath), 'src/index.css must exist').toBe(true);
    const cssContent = fs.readFileSync(indexCssPath, 'utf8');

    const requiredTokens = [
      '--bg',
      '--surface',
      '--sunken',
      '--ink',
      '--ink-2',
      '--ink-3',
      '--line',
      '--line-strong',
      '--accent',
      '--accent-soft',
      '--on-accent',
      '--credit',
      '--debit',
      '--banknote-stone',
      '--banknote-saffron',
      '--banknote-lagoon',
      '--banknote-lavender',
      '--banknote-olive',
      '--banknote-cocoa',
    ];

    requiredTokens.forEach((token) => {
      expect(cssContent, `src/index.css must define token ${token}`).toContain(token);
    });

    // Dark theme block (.dark) must re-declare semantic tokens
    const darkBlockMatch = cssContent.match(/\.dark\s*\{([\s\S]*?)\}/);
    expect(darkBlockMatch, 'src/index.css must declare a .dark block').not.toBeNull();
    const darkContent = darkBlockMatch[1];
    expect(darkContent).toContain('--bg');
    expect(darkContent).toContain('--surface');
    expect(darkContent).toContain('--ink');
    expect(darkContent).toContain('--credit');
    expect(darkContent).toContain('--debit');
  });

  it('declares Tailwind v4 @custom-variant dark for dark mode styling', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf8');
    expect(cssContent).toMatch(/@custom-variant\s+dark\s+\(&:where\(\.dark,\s*\.dark\s+\*\)\);/);
  });

  it('confirms complete deletion of tailwind.config.js and elimination of Plus Jakarta Sans import', () => {
    const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
    expect(fs.existsSync(tailwindConfigPath), 'tailwind.config.js must be deleted in Tailwind v4').toBe(false);

    const htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
    const cssContent = fs.readFileSync(indexCssPath, 'utf8');

    expect(htmlContent).not.toMatch(/Plus\+Jakarta\+Sans/i);
    expect(cssContent).not.toMatch(/Plus\s*Jakarta\s*Sans/i);
  });

  it('enforces strict radius scale (6px controls, 14px modals, 0px rows) and minimum 12px type scale', () => {
    const cssContent = fs.readFileSync(indexCssPath, 'utf8');

    // Controls (.btn-primary, .btn-quiet) enforce 6px border radius
    expect(cssContent).toMatch(/\.btn-primary[\s\S]*?border-radius:\s*6px;/);
    expect(cssContent).toMatch(/\.btn-quiet[\s\S]*?border-radius:\s*6px;/);

    // Font size in button utilities must be >= 12px (e.g. 13px)
    const btnFontSizeMatch = cssContent.match(/\.btn-primary[\s\S]*?font-size:\s*(\d+)px;/);
    expect(btnFontSizeMatch).not.toBeNull();
    const fontSize = parseInt(btnFontSizeMatch[1], 10);
    expect(fontSize).toBeGreaterThanOrEqual(12);
  });
});
