/**
 * Claude API provider
 * Uses claude-sonnet-4-20250514 for all calls (signals + scenario analysis)
 *
 * Rate limit strategy:
 *  - 12s base delay between signal calls -> ~2.5 min total, stays under 30K TPM
 *  - Exponential backoff with jitter on 429 errors (up to 3 retries)
 *  - Compact prompts to minimise input tokens per call
 *  - Scenario analysis reuses same model (one call, no web search)
 */

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

// Sonnet for all calls — signal evaluation + scenario analysis
const SIGNAL_MODEL   = "claude-sonnet-4-20250514";
const ANALYSIS_MODEL = "claude-sonnet-4-20250514";

const BASE_DELAY_MS = 12000;  // 12s between signal calls (~2.5 min total for 12 signals)
const MAX_RETRIES   = 3;      // retry up to 3x on 429
const RETRY_BASE_MS = 20000;  // 20s base wait on first 429 retry (longer for Sonnet)

/** Sleep helper */
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Jitter: adds +-20% randomness to avoid thundering herd */
const jitter = ms => ms * (0.8 + Math.random() * 0.4);

/**
 * Fetch wrapper with exponential backoff on 429
 */
async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const res = await fetch(url, options);

    if (res.status === 429) {
      if (attempt === retries) {
        const body = await res.text();
        throw new Error(`Rate limit exceeded after ${retries} retries: ${body}`);
      }
      // Respect Retry-After header if present, else exponential backoff
      const retryAfter = res.headers.get("retry-after");
      const waitMs = retryAfter
        ? parseInt(retryAfter, 10) * 1000
        : jitter(RETRY_BASE_MS * Math.pow(2, attempt));

      console.warn(`\n  Waiting ${Math.round(waitMs / 1000)}s before retry ${attempt + 1}/${retries}...`);
      await sleep(waitMs);
      continue;
    }

    return res;
  }
}

/**
 * Evaluate a single signal using Sonnet + web search
 * Compact prompt to minimise input tokens per call
 */
async function evaluateSignal(signal, apiKey) {
  const systemPrompt = `Macro analyst for Indian markets. Search web for latest data. Reply ONLY with valid JSON, no markdown.`;

  const userPrompt = `Signal: ${signal.name}
Query: ${signal.searchQuery}
GREEN if: ${signal.greenCondition}
AMBER if: ${signal.amberCondition}
RED if: ${signal.redCondition}

Return ONLY this JSON (no other text):
{"id":"${signal.id}","name":"${signal.name}","value":"current value","numericValue":null,"status":"RED","explanation":"1-2 sentences","source":"data source","fetchedAt":"${new Date().toISOString()}"}`;

  const res = await fetchWithRetry(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "web-search-2025-03-05"
    },
    body: JSON.stringify({
      model: SIGNAL_MODEL,
      max_tokens: 512,
      system: systemPrompt,
      tools: [{ type: "web_search_20250305", name: "web_search" }],
      messages: [{ role: "user", content: userPrompt }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const textBlock = data.content.find(b => b.type === "text");
  if (!textBlock) throw new Error(`No text block in response for ${signal.id}`);

  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

/**
 * Evaluate all 12 signals with per-call retry + inter-call delay
 */
async function evaluateAllSignals(signals, apiKey, onProgress = null) {
  const results = [];

  console.log(`  Model: ${SIGNAL_MODEL}`);
  console.log(`  Inter-call delay: ${BASE_DELAY_MS / 1000}s | Max retries: ${MAX_RETRIES}\n`);

  for (let i = 0; i < signals.length; i++) {
    const signal = signals[i];
    if (onProgress) onProgress(i + 1, signals.length, signal.name);

    try {
      const result = await evaluateSignal(signal, apiKey);
      results.push(result);
      const icon = result.status === "GREEN" ? "GREEN" : result.status === "AMBER" ? "AMBER" : "RED";
      console.log(`  [${icon}] ${signal.name}: ${result.value}`);
    } catch (err) {
      console.error(`\n  ERROR ${signal.name}: ${err.message}`);
      results.push({
        id: signal.id,
        name: signal.name,
        value: "Fetch failed — check API key or rate limits",
        numericValue: null,
        status: "ERROR",
        explanation: err.message,
        source: "N/A",
        fetchedAt: new Date().toISOString()
      });
    }

    if (i < signals.length - 1) {
      await sleep(jitter(BASE_DELAY_MS));
    }
  }

  return results;
}

/**
 * Scenario analysis — one Sonnet call, no web search
 */
async function generateScenarioAnalysis(signalResults, apiKey) {
  const signalSummary = signalResults
    .map(s => `${s.name}: ${s.status} | ${s.value}`)
    .join("\n");

  const res = await fetchWithRetry(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      max_tokens: 800,
      messages: [{
        role: "user",
        content: `India portfolio macro signals (2026 Middle East war context):\n${signalSummary}\n\nReturn ONLY JSON:\n{"bull":{"probability":15,"brent":"$72-82","niftyDec":"27500-29000","rationale":"..."},"base":{"probability":52,"brent":"$88-100","niftyDec":"24000-26500","rationale":"..."},"bear":{"probability":33,"brent":"$115-140","niftyDec":"20000-22500","rationale":"..."},"keyRisks":["r1","r2","r3"],"keyTailwinds":["t1","t2"],"portfolioAction":"one sentence"}`
      }]
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Scenario API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const textBlock = data.content.find(b => b.type === "text");
  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

module.exports = { evaluateAllSignals, generateScenarioAnalysis };
