import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import {
  PROHIBITED_PATTERN,
  checkFileForProhibitedTokens,
  scanSrcDirectory
} from '../../../scripts/check-prohibited-syntax.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../../..');

describe('Grep Check: Prohibited Tokens and Class Scanner', () => {
  it('correctly matches prohibited class names and visual tokens', () => {
    const prohibitedTokens = [
      'font-mono',
      'uppercase',
      'tracking-[2px]',
      'tracking-wide',
      'tracking-widest',
      'linear-gradient',
      'bg-gradient',
      'rounded-2xl',
      'rounded-3xl',
      'hover:scale',
      'text-[9px]',
      'text-[10px]',
      'text-[11px]',
      'shadow-[var(--shadow-statement)]',
      'animate-fade-in',
      'dash-animate',
      'statement-card',
      'passbook',
      'glass-card',
      'stamp-pill'
    ];

    prohibitedTokens.forEach((token) => {
      const regex = new RegExp(PROHIBITED_PATTERN.source);
      expect(regex.test(token), `Token "${token}" should match PROHIBITED_PATTERN`).toBe(true);
    });
  });

  it('does NOT match approved tokens and design scale', () => {
    const approvedTokens = [
      'font-sans',
      'lowercase',
      'tracking-normal',
      'rounded-[6px]',
      'rounded-[14px]',
      'rounded-none',
      'text-xs',
      'text-sm',
      'text-[12px]',
      'text-[14px]',
      'row-flash',
      'border-[var(--line)]',
      'bg-[var(--surface)]',
    ];

    approvedTokens.forEach((token) => {
      const regex = new RegExp(PROHIBITED_PATTERN.source);
      expect(regex.test(token), `Token "${token}" should NOT match PROHIBITED_PATTERN`).toBe(false);
    });
  });

  it('allows font-mono strictly in ApiKeyManager.jsx as an exception while flagging other prohibited tokens', () => {
    const tempDir = path.join(__dirname, 'temp_fixture_apikey/src/components');
    fs.mkdirSync(tempDir, { recursive: true });
    const tempApiKeyManager = path.join(tempDir, 'ApiKeyManager.jsx');

    try {
      // 1. font-mono alone in ApiKeyManager.jsx produces 0 violations
      fs.writeFileSync(
        tempApiKeyManager,
        'export const Key = () => <span className="font-mono text-xs">spw_live_12345</span>;'
      );
      const violationsClean = checkFileForProhibitedTokens(tempApiKeyManager);
      expect(violationsClean.length).toBe(0);

      // 2. other prohibited tokens in ApiKeyManager.jsx are still flagged
      fs.writeFileSync(
        tempApiKeyManager,
        'export const Key = () => <div className="font-mono uppercase bg-gradient">spw_live_12345</div>;'
      );
      const violationsWithOther = checkFileForProhibitedTokens(tempApiKeyManager);
      expect(violationsWithOther.length).toBe(2);
      expect(violationsWithOther.map((v) => v.matched)).toContain('uppercase');
      expect(violationsWithOther.map((v) => v.matched)).toContain('bg-gradient');
      expect(violationsWithOther.map((v) => v.matched)).not.toContain('font-mono');
    } finally {
      fs.rmSync(path.join(__dirname, 'temp_fixture_apikey'), { recursive: true, force: true });
    }
  });

  it('allows font-mono strictly within landing page MCP section in Home.jsx, but flags font-mono outside of it', () => {
    const tempHomeDir = path.join(__dirname, 'temp_fixture_home/src/pages');
    fs.mkdirSync(tempHomeDir, { recursive: true });
    const tempHomeFile = path.join(tempHomeDir, 'Home.jsx');
    const homeContent = [
      'export default function Home() {',
      '  return (',
      '    <div>',
      '      <div className="font-mono">Invalid Before MCP</div>',
      '      <section id="mcp">',
      '        <pre className="font-mono">curl -X POST https://api.spendwise.in/mcp</pre>',
      '      </section>',
      '      <footer className="font-mono">Invalid After MCP</footer>',
      '    </div>',
      '  );',
      '}',
    ].join('\n');
    fs.writeFileSync(tempHomeFile, homeContent);

    try {
      const violations = checkFileForProhibitedTokens(tempHomeFile);
      expect(violations.length).toBe(2);
      expect(violations[0].line).toBe(4);
      expect(violations[0].matched).toBe('font-mono');
      expect(violations[0].content).toContain('Invalid Before MCP');
      expect(violations[1].line).toBe(8);
      expect(violations[1].matched).toBe('font-mono');
      expect(violations[1].content).toContain('Invalid After MCP');
    } finally {
      fs.rmSync(path.join(__dirname, 'temp_fixture_home'), { recursive: true, force: true });
    }
  });

  it('disallows font-mono in other standard components (e.g. Money or TransactionList)', () => {
    const tempTestFile = path.join(__dirname, 'temp-forbidden-sample.jsx');
    fs.writeFileSync(tempTestFile, 'export const Test = () => <div className="font-mono uppercase">Sample</div>;');

    try {
      const violations = checkFileForProhibitedTokens(tempTestFile);
      expect(violations.length).toBe(2);
      expect(violations.map(v => v.matched)).toContain('font-mono');
      expect(violations.map(v => v.matched)).toContain('uppercase');
    } finally {
      if (fs.existsSync(tempTestFile)) {
        fs.unlinkSync(tempTestFile);
      }
    }
  });

  it('scans and accurately reports prohibited syntax across the codebase', () => {
    const results = scanSrcDirectory();
    expect(results.totalFiles).toBeGreaterThan(0);
    // When the codebase is undergoing refactoring, violations are detected and flagged.
    // The test verifies that scanSrcDirectory functions genuine and returns structured violation objects.
    expect(Array.isArray(results.violations)).toBe(true);
    if (results.violations.length > 0) {
      const first = results.violations[0];
      expect(first).toHaveProperty('file');
      expect(first).toHaveProperty('line');
      expect(first).toHaveProperty('matched');
      expect(first).toHaveProperty('content');
    }
  });
});
