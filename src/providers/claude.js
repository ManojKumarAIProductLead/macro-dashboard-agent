/**
 * Claude API provider
 * Uses claude-sonnet-4-20250514 with web_search tool to evaluate each macro signal
 */

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

/**
 * Evaluate a single signal using Claude with web search
 */
async function evaluateSignal(signal, apiKey) {
  const systemPrompt = `You are a macro financial analyst specialising in Indian markets and geopolitical risk. 
You evaluate investment signal indicators to determine whether conditions are bullish (GREEN), neutral (AMBER), or bearish (RED) for Indian equity deployment.
When you search the web, you look for the most recent data available.
You MUST respond with ONLY a valid JSON object — no markdown, no preamble, no explanation outside the JSON.`;

  const userPrompt = `Evaluate this macro signal for India portfolio management:

Signal: ${signal.name}
Threshold: ${signal.threshold}
Context: ${signal.importance}

Instructions: ${signal.extractInstruction}

Search for the latest data and return ONLY a JSON object in exactly this format:
{
  "id": "${signal.id}",
  "name": "${signal.name}",
  "value": "human-readable current value",
  "numericValue": null,
  "status": "RED",
  "explanation": "1-2 sentence explanation of why this status",
  "source": "where you found this data",
  "fetchedAt": "${new Date().toISOString()}"
}`;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  // Extract text from response (may include tool use blocks)
  const textBlock = data.content.find(b => b.type === "text");
  if (!textBlock) throw new Error(`No text response for signal: ${signal.id}`);

  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

/**
 * Evaluate all signals using Claude
 */
async function evaluateAllSignals(signals, apiKey, onProgress = null) {
  const results = [];

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    if (onProgress) onProgress(i + 1, signals.length, signal.name);

    try {
      const result = await evaluateSignal(signal, apiKey);
      results.push(result);
    } catch (err) {
      console.error(`Failed to evaluate ${signal.id}:`, err.message);
      results.push({
        id: signal.id,
        name: signal.name,
        value: "Error fetching",
        numericValue: null,
        status: "ERROR",
        explanation: err.message,
        source: "N/A",
        fetchedAt: new Date().toISOString()
      });
    }

    // Rate limiting: 1 second between calls
    if (i < signals.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

/**
 * Use Claude to generate scenario probability estimates based on signal results
 */
async function generateScenarioAnalysis(signalResults, apiKey) {
  const signalSummary = signalResults
    .map(s => `${s.name}: ${s.status} — ${s.value} (${s.explanation})`)
    .join("\n");

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      messages: [{
        role: "user",
        content: `Based on these current macro signal readings for the 2026 Middle East war / Hormuz crisis context:

${signalSummary}

Provide scenario probability estimates for the next 6 months for Indian equities (Nifty 50).

Respond with ONLY valid JSON:
{
  "bull": { "probability": 15, "brent": "$72-82", "niftyDec": "27500-29000", "rationale": "..." },
  "base": { "probability": 52, "brent": "$88-100", "niftyDec": "24000-26500", "rationale": "..." },
  "bear": { "probability": 33, "brent": "$115-140", "niftyDec": "20000-22500", "rationale": "..." },
  "keyRisks": ["risk1", "risk2", "risk3"],
  "keyTailwinds": ["tw1", "tw2"],
  "portfolioAction": "One sentence on recommended portfolio posture"
}`
      }]
    })
  });

  const data = await response.json();
  const textBlock = data.content.find(b => b.type === "text");
  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

module.exports = { evaluateAllSignals, generateScenarioAnalysis };
