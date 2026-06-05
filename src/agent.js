#!/usr/bin/env node
/**
 * macro-dashboard-agent — Main Agent
 * 
 * Usage:
 *   node src/agent.js --provider claude --key YOUR_API_KEY
 *   node src/agent.js --provider openai --key YOUR_API_KEY
 *   node src/agent.js  (uses .env file)
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { SIGNALS, ROTATION_RULES, SCENARIO_DEFINITIONS } = require("./signals");

// Parse CLI args
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx !== -1 ? args[idx + 1] : null;
};

const provider = getArg("--provider") || process.env.AI_PROVIDER || "claude";
const apiKey = getArg("--key") || (
  provider === "claude" ? process.env.CLAUDE_API_KEY : process.env.OPENAI_API_KEY
);

if (!apiKey) {
  console.error(`❌ No API key found. Use --key YOUR_KEY or set ${provider === "claude" ? "CLAUDE_API_KEY" : "OPENAI_API_KEY"} in .env`);
  process.exit(1);
}

// Load provider
let providerModule;
try {
  providerModule = require(`./providers/${provider}`);
} catch {
  console.error(`❌ Unknown provider: ${provider}. Use 'claude' or 'openai'`);
  process.exit(1);
}

/**
 * Score signal results into a numeric score
 */
function scoreSignals(results) {
  let score = 0;
  const breakdown = { GREEN: [], AMBER: [], RED: [], ERROR: [] };

  results.forEach(r => {
    if (r.status === "GREEN") { score += 1; breakdown.GREEN.push(r.id); }
    else if (r.status === "AMBER") { score += 0; breakdown.AMBER.push(r.id); } // AMBER doesn't count
    else if (r.status === "RED") { score += 0; breakdown.RED.push(r.id); }
    else { breakdown.ERROR.push(r.id); }
  });

  const total = results.filter(r => r.status !== "ERROR").length;

  return {
    score,
    total: 12,
    validSignals: total,
    breakdown,
    posture: score >= 9 ? "FULL_DEPLOY" : score >= 6 ? "PARTIAL_DEPLOY" : "DEFENSIVE",
    postureLabel: score >= 9 ? "Full Deployment" : score >= 6 ? "Partial Deployment (50%)" : "Defensive — SIPs Only",
    action: score >= 9
      ? ROTATION_RULES.secondRotation.action
      : score >= 6
      ? ROTATION_RULES.firstRotation.action
      : "Hold defensive. Run SIPs only. No lump sum equity."
  };
}

/**
 * Save results to data directory
 */
function saveResults(signalResults, scoreData, scenarioData) {
  const dataDir = path.join(__dirname, "..", "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const timestamp = new Date().toISOString();
  const runData = {
    timestamp,
    provider,
    score: scoreData,
    signals: signalResults,
    scenarios: scenarioData
  };

  // Save latest
  fs.writeFileSync(
    path.join(dataDir, "latest.json"),
    JSON.stringify(runData, null, 2)
  );

  // Append to history
  const historyPath = path.join(dataDir, "history.json");
  let history = [];
  if (fs.existsSync(historyPath)) {
    try { history = JSON.parse(fs.readFileSync(historyPath, "utf8")); } catch {}
  }
  history.push({ timestamp, score: scoreData.score, posture: scoreData.posture });
  // Keep last 90 entries
  if (history.length > 90) history = history.slice(-90);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

  console.log(`✅ Data saved to data/latest.json`);
  return runData;
}

/**
 * Generate the HTML dashboard from latest data
 */
function generateDashboard(runData) {
  const renderer = require("./dashboard/renderer");
  const html = renderer.render(runData);

  const publicDir = path.join(__dirname, "..", "public");
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

  fs.writeFileSync(path.join(publicDir, "index.html"), html);
  console.log(`✅ Dashboard generated at public/index.html`);
}

/**
 * Main execution
 */
async function main() {
  console.log(`\n🔍 Macro Dashboard Agent`);
  console.log(`📡 Provider: ${provider.toUpperCase()}`);
  console.log(`⏰ Started: ${new Date().toLocaleString()}`);
  console.log(`📊 Evaluating ${SIGNALS.length} signals...\n`);

  // Evaluate all signals
  const signalResults = await providerModule.evaluateAllSignals(
    SIGNALS,
    apiKey,
    (current, total, name) => {
      process.stdout.write(`[${current}/${total}] ${name}...\r`);
    }
  );

  console.log("\n\n📈 Scoring signals...");
  const scoreData = scoreSignals(signalResults);

  console.log("🌍 Generating scenario analysis...");
  let scenarioData = {};
  try {
    scenarioData = await providerModule.generateScenarioAnalysis(signalResults, apiKey);
  } catch (err) {
    console.warn("⚠️ Scenario analysis failed:", err.message);
    scenarioData = {
      bull: { probability: 15, brent: "$72-82", niftyDec: "27,500-29,000", rationale: "N/A" },
      base: { probability: 52, brent: "$88-100", niftyDec: "24,000-26,500", rationale: "N/A" },
      bear: { probability: 33, brent: "$115-140", niftyDec: "20,000-22,500", rationale: "N/A" },
      keyRisks: [], keyTailwinds: [], portfolioAction: "Stay defensive"
    };
  }

  // Save and render
  const runData = saveResults(signalResults, scoreData, scenarioData);
  generateDashboard(runData);

  // Print summary
  console.log("\n" + "═".repeat(50));
  console.log(`📊 SIGNAL SCORE: ${scoreData.score}/12`);
  console.log(`🎯 POSTURE: ${scoreData.postureLabel}`);
  console.log(`✅ GREEN (${scoreData.breakdown.GREEN.length}): ${scoreData.breakdown.GREEN.join(", ") || "None"}`);
  console.log(`🟡 AMBER (${scoreData.breakdown.AMBER.length}): ${scoreData.breakdown.AMBER.join(", ") || "None"}`);
  console.log(`🔴 RED   (${scoreData.breakdown.RED.length}): ${scoreData.breakdown.RED.join(", ") || "None"}`);
  console.log(`📋 ACTION: ${scoreData.action}`);
  console.log("═".repeat(50) + "\n");
}

main().catch(err => {
  console.error("❌ Agent failed:", err);
  process.exit(1);
});
