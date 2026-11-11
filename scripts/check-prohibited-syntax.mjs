import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const srcDir = path.join(projectRoot, 'src');

/**
 * Regex matching prohibited patterns in src/
 * Prohibited patterns:
 * font-mono|uppercase|tracking-\[|tracking-wide|tracking-widest|linear-gradient|bg-gradient|rounded-(2xl|3xl)|hover:scale|text-\[(9|10|11)px\]|shadow-\[var\(--shadow-statement\)\]|animate-fade-in|dash-animate|statement-card|passbook|glass-card|stamp-pill
 */
export const PROHIBITED_PATTERN = /font-mono|uppercase|tracking-\[|tracking-widest|tracking-wide|linear-gradient|bg-gradient|rounded-(2xl|3xl)|hover:scale|text-\[(9|10|11)px\]|shadow-\[var\(--shadow-statement\)\]|animate-fade-in|dash-animate|statement-card|passbook|glass-card|stamp-pill/g;

/**
 * Helper to recursively get all files in a directory.
 */
export function getAllFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, fileList);
    } else if (entry.isFile()) {
      // only scan code/style files
      if (/\.(jsx?|tsx?|css|html)$/.test(entry.name)) {
        fileList.push(fullPath);
      }
    }
  }
  return fileList;
}

/**
 * Checks a file for prohibited tokens with allowed exceptions.
 * Exception: font-mono permitted strictly in ApiKeyManager.jsx and landing page MCP section in Home.jsx.
 */
export function checkFileForProhibitedTokens(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  const violations = [];
  const normalizedPath = filePath.replace(/\\/g, '/');
  // Skip src/utils/* backend services per prompt instruction: "Do not change src/utils/* services"
  if (normalizedPath.includes('src/utils/')) {
    return violations;
  }
  const isApiKeyManager = normalizedPath.includes('src/components/ApiKeyManager.jsx');
  const isHome = normalizedPath.includes('src/pages/Home.jsx');

  let inHomeMcpSection = false;

  lines.forEach((line, index) => {
    const lineNum = index + 1;

    // Track MCP section in Home.jsx
    if (isHome) {
      if (
        /<section[^>]*id=["'](mcp|agent-setup)["']/i.test(line) ||
        /id=["'](mcp|agent-setup)["']/i.test(line) ||
        /\/\*.*mcp.*section/i.test(line)
      ) {
        inHomeMcpSection = true;
      }
    }

    let match;
    const regex = new RegExp(PROHIBITED_PATTERN.source, 'g');
    while ((match = regex.exec(line)) !== null) {
      const matchedToken = match[0];

      // Check allowed exceptions for font-mono:
      // Allowed in ApiKeyManager.jsx
      // Allowed in Home.jsx strictly inside MCP section
      if (matchedToken === 'font-mono') {
        if (isApiKeyManager) {
          continue;
        }
        if (isHome && inHomeMcpSection) {
          continue;
        }
      }

      // Allowed exception for balance figure letter-spacing (-0.02em):
      // PROJECT.md § 4.2 explicitly mandates: "letter-spacing: -0.02em" on the balance figure.
      if (matchedToken.startsWith('tracking-[') && line.includes('tracking-[-0.02em]')) {
        continue;
      }

      violations.push({
        file: filePath,
        relativeFile: path.relative(projectRoot, filePath).replace(/\\/g, '/'),
        line: lineNum,
        matched: matchedToken,
        content: line.trim()
      });
    }

    // Reset MCP section when leaving it in Home.jsx
    if (isHome && inHomeMcpSection) {
      if (
        /<\/section>/i.test(line) ||
        /\/\*\s*end\s+mcp/i.test(line) ||
        (/<section/i.test(line) && !/mcp|agent-setup/i.test(line))
      ) {
        inHomeMcpSection = false;
      }
    }
  });

  return violations;
}

/**
 * Scans the entire src/ directory for prohibited tokens.
 */
export function scanSrcDirectory(dir = srcDir) {
  const files = getAllFiles(dir);
  const allViolations = [];

  for (const file of files) {
    const violations = checkFileForProhibitedTokens(file);
    if (violations.length > 0) {
      allViolations.push(...violations);
    }
  }

  return {
    totalFiles: files.length,
    violations: allViolations
  };
}

// CLI Execution
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const targetDir = process.argv[2] ? path.resolve(process.argv[2]) : srcDir;
  console.log('--- Prohibited Syntax & Visual Grep Check ---');
  console.log(`Scanning directory: ${targetDir}`);

  const results = scanSrcDirectory(targetDir);

  if (results.violations.length === 0) {
    console.log(`\x1b[32m[PASS] Checked ${results.totalFiles} files in src/. Zero prohibited tokens found.\x1b[0m`);
    process.exit(0);
  } else {
    console.error(`\x1b[31m[FAIL] Found ${results.violations.length} prohibited syntax occurrences in src/:\x1b[0m\n`);
    for (const v of results.violations) {
      console.error(`  \x1b[33m${v.relativeFile}:${v.line}\x1b[0m - Matched '\x1b[31m${v.matched}\x1b[0m'`);
      console.error(`    > ${v.content}\n`);
    }
    process.exit(1);
  }
}
