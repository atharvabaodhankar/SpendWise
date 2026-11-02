/**
 * SpendWise API Key & MCP Utilities
 * Generates secure API keys, SHA-256 hashes for storage, and client configuration templates.
 */

export function generateApiKey() {
  const bytes = new Uint8Array(24);
  window.crypto.getRandomValues(bytes);
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `spw_live_${hex}`;
}

export async function hashApiKey(key) {
  const encoder = new TextEncoder();
  const data = encoder.encode(key);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function formatKeyPrefix(key) {
  if (!key || key.length < 16) return key || '';
  const head = key.slice(0, 12);
  const tail = key.slice(-4);
  return `${head}••••${tail}`;
}

export function getEffectiveApiUrl() {
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://spendwise.app';
}

export function getClaudeDesktopConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          url: `${apiUrl}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function getClaudeDesktopStdioConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          command: 'npx',
          args: ['-y', 'spendwise-mcp'],
          env: {
            SPENDWISE_API_KEY: apiKey,
            SPENDWISE_API_URL: apiUrl,
          },
        },
      },
    },
    null,
    2
  );
}

export function getCursorConfig(apiKey, apiUrl = getEffectiveApiUrl()) {
  return JSON.stringify(
    {
      mcpServers: {
        spendwise: {
          url: `${apiUrl}/api/mcp`,
          headers: {
            Authorization: `Bearer ${apiKey}`,
          },
        },
      },
    },
    null,
    2
  );
}

export function getCurlSnippet(apiKey, apiUrl = getEffectiveApiUrl()) {
  return `curl -X POST "${apiUrl}/api/mcp" \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "tools/list",
    "params": {}
  }'`;
}
