const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const DEFAULT_MODEL = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
let keyCursor = 0;

function getGroqKeys() {
  return (process.env.GROQ_API_KEY || '')
    .split(',')
    .map((key) => key.trim())
    .filter(Boolean);
}

function extractJson(rawText) {
  if (!rawText) {
    throw new Error('Empty AI response.');
  }

  const trimmed = rawText.trim();
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  const fencedMatch = trimmed.match(/```json\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    return JSON.parse(fencedMatch[1]);
  }

  const firstBrace = trimmed.indexOf('{');
  const lastBrace = trimmed.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
  }

  throw new Error('Could not parse JSON from AI response.');
}

function buildSystemPrompt() {
  return `
You are SpendWise AI, a warm finance copilot inside a personal expense tracker.
You must answer using ONLY the provided context from Firebase-backed records.
Be friendly, concise, analytical, and practical.

Return strict JSON with this shape:
{
  "reply": "string",
  "highlights": ["string"],
  "followUps": ["string"],
  "actions": [
    {
      "type": "add_transaction" | "update_transaction" | "delete_transaction" | "set_budget" | "adjust_balance",
      "transactionId": "string when needed",
      "transaction": {
        "type": "expense or income",
        "amount": 0,
        "category": "string",
        "description": "string",
        "date": "YYYY-MM-DD",
        "paymentMethod": "online or cash or owed",
        "affectCurrentBalance": true
      },
      "updates": {},
      "monthlyLimit": 0,
      "onlineDelta": 0,
      "cashDelta": 0,
      "reason": "string"
    }
  ]
}

Rules:
- Never invent data. If context is missing, say that clearly.
- For analytics questions, include concrete numbers in INR and mention whether you used all-time or current-month data.
- Use descriptions and categories semantically. For example, "non veg" or "sugar cane juice" may come from free-text descriptions, not only categories.
- Only create update/delete actions when the target record is unambiguous from the provided transactionReference or recentTransactions.
- If the user asks to delete or edit a record but the match is ambiguous, ask a follow-up question instead of taking action.
- For add_transaction, only create one when the user clearly specified amount, category or description, date if relevant, and payment method if relevant. Otherwise ask a follow-up.
- Keep highlights and followUps short. Use at most 3 each.
- reply must be plain text, not markdown code fences.
`.trim();
}

async function callGroq(payload, apiKey) {
  const response = await fetch(GROQ_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const error = new Error(`Groq request failed with ${response.status}: ${errorText}`);
    error.status = response.status;
    throw error;
  }

  return response.json();
}

async function requestAssistantCompletion(messages) {
  const keys = getGroqKeys();
  if (!keys.length) {
    throw new Error('Missing GROQ_API_KEY environment variable.');
  }

  let lastError = null;

  for (let attempt = 0; attempt < keys.length; attempt += 1) {
    const index = (keyCursor + attempt) % keys.length;
    const apiKey = keys[index];

    try {
      const response = await callGroq(
        {
          model: DEFAULT_MODEL,
          temperature: 0.25,
          response_format: { type: 'json_object' },
          messages,
        },
        apiKey,
      );

      keyCursor = (index + 1) % keys.length;
      return response;
    } catch (error) {
      lastError = error;
      if (![401, 403, 429].includes(error.status)) {
        break;
      }
    }
  }

  throw lastError || new Error('Unable to reach Groq.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  try {
    const { message, conversation = [], context } = req.body || {};

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required.' });
    }

    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      ...conversation.slice(-4).map((item) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: item.content,
      })),
      {
        role: 'user',
        content: JSON.stringify({
          userMessage: message,
          financeContext: context,
        }),
      },
    ];

    const completion = await requestAssistantCompletion(messages);
    const content = completion?.choices?.[0]?.message?.content;
    const parsed = extractJson(content);

    return res.status(200).json({
      reply: parsed.reply || 'I reviewed your SpendWise data.',
      highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 3) : [],
      followUps: Array.isArray(parsed.followUps) ? parsed.followUps.slice(0, 3) : [],
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
      model: completion?.model || DEFAULT_MODEL,
    });
  } catch (error) {
    console.error('AI chat error:', error);
    return res.status(500).json({
      error: 'SpendWise AI could not complete the request right now.',
      details: error.message,
    });
  }
}
