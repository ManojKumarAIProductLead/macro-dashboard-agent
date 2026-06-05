/**
 * OpenAI API provider
 * Uses gpt-4o with web search to evaluate each macro signal
 */

const fetch = (...args) => import("node-fetch").then(({ default: f }) => f(...args));

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const MODEL = "gpt-4o";

/**
 * Evaluate a single signal using OpenAI with web search
 */
async function evaluateSignal(signal, apiKey) {
  const systemPrompt = `You are a macro financial analyst specialising in Indian markets and geopolitical risk. 
Evaluate investment signal indicators to determine whether conditions are GREEN (bullish), AMBER (neutral), or RED (bearish) for Indian equity deployment.
Search for the most recent data. Respond with ONLY a valid JSON object.`;

  const userPrompt = `Evaluate this macro signal:

Signal: ${signal.name}
Threshold: ${signal.threshold}  
Context: ${signal.importance}

${signal.extractInstruction}

Return ONLY this JSON structure:
{
  "id": "${signal.id}",
  "name": "${signal.name}",
  "value": "human-readable current value",
  "numericValue": null,
  "status": "RED",
  "explanation": "1-2 sentence explanation",
  "source": "data source",
  "fetchedAt": "${new Date().toISOString()}"
}`;

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      tools: [{ type: "web_search_preview" }],
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ]
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();

  // Extract output text from OpenAI response format
  const outputText = data.output
    ?.filter(b => b.type === "message")
    ?.flatMap(b => b.content)
    ?.filter(c => c.type === "output_text")
    ?.map(c => c.text)
    ?.join("") || "";

  if (!outputText) throw new Error(`No text response for signal: ${signal.id}`);

  const raw = outputText.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

/**
 * Evaluate all signals using OpenAI
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

    if (i < signals.length - 1) {
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  return results;
}

/**
 * Generate scenario analysis using OpenAI
 */
async function generateScenarioAnalysis(signalResults, apiKey) {
  const signalSummary = signalResults
    .map(s => `${s.name}: ${s.status} — ${s.value} (${s.explanation})`)
    .join("\n");

  const response = await fetch(OPENAI_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: MODEL,
      input: [{
        role: "user",
        content: `Based on these macro signals:\n\n${signalSummary}\n\nProvide scenario probabilities. Return ONLY JSON:\n{\n  "bull": { "probability": 15, "brent": "$72-82", "niftyDec": "27500-29000", "rationale": "..." },\n  "base": { "probability": 52, "brent": "$88-100", "niftyDec": "24000-26500", "rationale": "..." },\n  "bear": { "probability": 33, "brent": "$115-140", "niftyDec": "20000-22500", "rationale": "..." },\n  "keyRisks": ["risk1", "risk2"],\n  "keyTailwinds": ["tw1", "tw2"],\n  "portfolioAction": "one sentence"\n}`
      }]
    })
  });

  const data = await response.json();
  const outputText = data.output
    ?.filter(b => b.type === "message")
    ?.flatMap(b => b.content)
    ?.filter(c => c.type === "output_text")
    ?.map(c => c.text)
    ?.join("") || "";

  const raw = outputText.replace(/```json|```/g, "").trim();
  return JSON.parse(raw);
}

module.exports = { evaluateAllSignals, generateScenarioAnalysis };
