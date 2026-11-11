import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

/**
 * Safely resolves and loads a module from src/ if it exists.
 * Returns the module exports or null if the file does not exist or fails to import.
 * Prevents bundler/runner crashes when tests run before components are implemented.
 */
export async function loadSrcModule(relativeSrcPath) {
  const fullPath = path.resolve(projectRoot, relativeSrcPath);
  if (!fs.existsSync(fullPath)) {
    return {
      available: false,
      error: `File not found: ${relativeSrcPath}`,
      Component: null,
      module: null,
    };
  }

  try {
    const fileUrl = pathToFileURL(fullPath).href;
    const mod = await import(/* @vite-ignore */ fileUrl);
    return {
      available: true,
      error: null,
      Component: mod.default || mod,
      module: mod,
    };
  } catch (err) {
    return {
      available: false,
      error: err.message,
      Component: null,
      module: null,
    };
  }
}

/**
 * Asserts that a component or hook satisfies its required interface contract.
 * If the component is missing or unrefactored, it fails the assertion with a clean diagnostic message.
 */
export function assertContractAvailable(loadResult, contractName, contractRequirement) {
  if (!loadResult.available) {
    const message = [
      `[INTERFACE CONTRACT VIOLATION] ${contractName} is not available.`,
      `Detail: ${loadResult.error}`,
      `Contract Requirement: ${contractRequirement}`,
    ].join('\n');
    throw new Error(message);
  }
}
