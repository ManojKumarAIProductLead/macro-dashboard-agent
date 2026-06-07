/**
 * Claude API provider — Sonnet + batch processing
 *
 * Rate limit fix:
 *  Sonnet TPM limit = 30,000 tokens/min. Web search returns 5,000-10,000 tokens
 *  per call, so max ~3-4 calls per minute safely.
 *
 *  Strategy: process signals in batches of 3, pause 65s between batches.
 *  This guarantees the 1-minute window fully resets before the next batch.
 *  12 signals = 4 batches = ~3.5 minutes total. Zero 429s.
 *
 *  On any 429: pause the ENTIRE pipeline for 70s (not just skip the signal),
 *  then retry. This prevents the cascade failure where one 429 kills all subsequent calls.
 */

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const CLAUDE_API_URL  = "https://api.anthropic.com/v1/messages";
const SIGNAL_MODEL    = "claude-sonnet-4-20250514";
const ANALYSIS_MODEL  = "claude-sonnet-4-20250514";

const BATCH_SIZE      = 3;      // signals per batch
const BATCH_PAUSE_MS  = 65000;  // 65s between batches — full TPM window reset
const RETRY_PAUSE_MS  = 70000;  // 70s global pause on any 429
const MAX_RETRIES     = 2;      // per-signal retries after global pause

const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Global 429 handler — pauses the entire pipeline, not just one call */
let globalPauseUntil = 0;

async function waitIfThrottled() {
  const now = Date.now();
  if (globalPauseUntil > now) {
    const wait = globalPauseUntil - now;
    console.log(`\n  [THROTTLE] Global pause active. Waiting ${Math.round(wait / 1000)}s...`);
    await sleep(wait);
  }
}

function triggerGlobalPause(extraMs = 0) {
  globalPauseUntil = Date.now() + RETRY_PAUSE_MS + extraMs;
  console.warn(`\n  [429] Rate limit hit. Pausing all calls for ${Math.round((RETRY_PAUSE_MS + extraMs) / 1000)}s...`);
}

/**
 * Single signal evaluation with retry on 429
 */
async function evaluateSignal(signal, apiKey) {
  const systemPrompt = `Macro analyst for Indian markets. Search web for latest data. Reply ONLY with valid JSON, no markdown, no explanation.`;

  const userPrompt = `Signal: ${signal.name}
Search: ${signal.searchQuery}
GREEN if: ${signal.greenCondition}
AMBER if: ${signal.amberCondition}
RED if: ${signal.redCondition}

Return ONLY this JSON object, nothing else:
{"id":"${signal.id}","name":"${signal.name}","value":"current value string","numericValue":null,"status":"RED","explanation":"max 2 sentences","source":"source name","fetchedAt":"${new Date().toISOString()}"}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    await waitIfThrottled();

    const res = await fetch(CLAUDE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "web-search-2025-03-05"
      },
      body: JSON.stringify({
        model: SIGNAL_MODEL,
        max_tokens: 400,
        system: systemPrompt,
        tools: [{ type: "web_search_20250305", name: "web_search" }],
        messages: [{ role: "user", content: userPrompt }]
      })
    });

    if (res.status === 429) {
      const body = await res.text();
      // Check Retry-After header first
      const retryAfter = res.headers?.get?.("retry-after");
      const extraMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 0;
      triggerGlobalPause(extraMs);

      if (attempt === MAX_RETRIES) {
        throw new Error(`Rate limit after ${MAX_RETRIES} retries. Run again in a few minutes.`);
      }
      continue; // retry after global pause
    }

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const textBlock = data.content?.find(b => b.type === "text");
    if (!textBlock) throw new Error(`No text in response for ${signal.id}`);

    const raw = textBlock.text.replace(/```json|```/g, "").trim();
    return JSON.parse(raw);
  }
}

/**
 * Evaluate all 12 signals in batches of 3 with 65s pause between batches
 */
async function evaluateAllSignals(signals, apiKey, onProgress = null) {
  const results = [];
  const batches = [];

  // Split into batches
  for (let i = 0; i < signals.length; i += BATCH_SIZE) {
    batches.push(signals.slice(i, i + BATCH_SIZE));
  }

  console.log(`  Model: ${SIGNAL_MODEL}`);
  console.log(`  Strategy: ${batches.length} batches of ${BATCH_SIZE} | ${BATCH_PAUSE_MS / 1000}s pause between batches`);
  console.log(`  Estimated time: ~${Math.round((batches.length * BATCH_PAUSE_MS) / 60000)} minutes\n`);

  for (let b = 0; b < batches.length; b++) {
    const batch = batches[b];

    console.log(`  --- Batch ${b + 1}/${batches.length} ---`);

    for (let i = 0; i < batch.length; i++) {
      const signal = batch[i];
      const globalIdx = b * BATCH_SIZE + i + 1;
      if (onProgress) onProgress(globalIdx, signals.length, signal.name);

      try {
        const result = await evaluateSignal(signal, apiKey);
        results.push(result);
        const icon = result.status === "GREEN" ? "GREEN" : result.status === "AMBER" ? "AMBER" : "RED ";
        console.log(`  [${icon}] ${signal.name}: ${result.value}`);
      } catch (err) {
        console.error(`  [ERR ] ${signal.name}: ${err.message}`);
        results.push({
          id: signal.id,
          name: signal.name,
          value: "Fetch failed",
          numericValue: null,
          status: "ERROR",
          explanation: err.message,
          source: "N/A",
          fetchedAt: new Date().toISOString()
        });
      }

      // Small gap between calls within a batch (2s)
      if (i < batch.length - 1) await sleep(2000);
    }

    // Pause between batches — skip after last batch
    if (b < batches.length - 1) {
      console.log(`\n  Batch ${b + 1} done. Pausing ${BATCH_PAUSE_MS / 1000}s for rate limit reset...\n`);
      await sleep(BATCH_PAUSE_MS);
    }
  }

  return results;
}

/**
 * Scenario analysis — single Sonnet call, no web search
 */
async function generateScenarioAnalysis(signalResults, apiKey) {
  await waitIfThrottled();

  const signalSummary = signalResults
    .filter(s => s.status !== "ERROR")
    .map(s => `${s.name}: ${s.status} | ${s.value}`)
    .join("\n");

  const res = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: ANALYSIS_MODEL,
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `India portfolio signals (2026 Middle East war):\n${signalSummary}\n\nReturn ONLY JSON:\n{"bull":{"probability":15,"brent":"$72-82","niftyDec":"27500-29000","rationale":"..."},"base":{"probability":52,"brent":"$88-100","niftyDec":"24000-26500","rationale":"..."},"bear":{"probability":33,"brent":"$115-140","niftyDec":"20000-22500","rationale":"..."},"keyRisks":["r1","r2","r3"],"keyTailwinds":["t1","t2"],"portfolioAction":"one sentence"}`
      }]
    })
  });

  if (!res.ok) throw new Error(`Scenario API error ${res.status}`);
  const data = await res.json();
  const textBlock = data.content?.find(b => b.type === "text");
  const raw = textBlock.text.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

module.exports = { evaluateAllSignals, generateScenarioAnalysis };
