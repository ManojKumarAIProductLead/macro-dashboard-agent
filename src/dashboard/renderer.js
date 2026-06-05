/**
 * Dashboard renderer — generates polished HTML from signal run data
 */

function statusColor(status) {
  return status === "GREEN" ? "#00B37E" : status === "AMBER" ? "#E6A817" : status === "RED" ? "#E54D2E" : "#888";
}

function statusBg(status) {
  return status === "GREEN" ? "#E6FAF3" : status === "AMBER" ? "#FFF8E7" : status === "RED" ? "#FFF0EE" : "#F5F5F5";
}

function statusDot(status) {
  return `<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${statusColor(status)};margin-right:7px;flex-shrink:0;margin-top:4px"></span>`;
}

function postureColor(posture) {
  return posture === "FULL_DEPLOY" ? "#00B37E" : posture === "PARTIAL_DEPLOY" ? "#E6A817" : "#E54D2E";
}

function historySparkline(score, prev) {
  if (!prev || prev.length < 2) return "";
  const points = prev.slice(-30);
  const max = 12, min = 0;
  const w = 120, h = 30;
  const xs = points.map((_, i) => (i / (points.length - 1)) * w);
  const ys = points.map(p => h - ((p.score - min) / (max - min)) * h);
  const d = xs.map((x, i) => `${i === 0 ? "M" : "L"}${x},${ys[i]}`).join(" ");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="overflow:visible">
    <path d="${d}" fill="none" stroke="#00B37E" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${xs[xs.length-1]}" cy="${ys[ys.length-1]}" r="3" fill="#00B37E"/>
  </svg>`;
}

function render(runData) {
  const { timestamp, provider, score: scoreData, signals, scenarios } = runData;
  const date = new Date(timestamp).toLocaleDateString("en-IN", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // Load history for sparkline
  let history = [];
  try {
    const fs = require("fs"), path = require("path");
    const hPath = path.join(__dirname, "../../data/history.json");
    if (fs.existsSync(hPath)) history = JSON.parse(fs.readFileSync(hPath, "utf8"));
  } catch {}

  const signalRows = signals.map(s => `
    <div style="display:flex;align-items:flex-start;gap:12px;padding:10px 0;border-bottom:1px solid #f0f0f0;">
      ${statusDot(s.status)}
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:4px;">
          <span style="font-size:13px;font-weight:500;color:#1a1a1a;">${s.name}</span>
          <span style="font-size:12px;font-weight:600;color:${statusColor(s.status)};background:${statusBg(s.status)};padding:2px 8px;border-radius:4px;">${s.status}</span>
        </div>
        <div style="font-size:13px;color:#555;margin-top:2px;">${s.value}</div>
        <div style="font-size:12px;color:#888;margin-top:2px;">${s.explanation}</div>
      </div>
    </div>`).join("");

  const bull = scenarios.bull || {};
  const base = scenarios.base || {};
  const bear = scenarios.bear || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Macro Rebalancing Signal Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'DM Sans', sans-serif;
      background: #F6F6F3;
      color: #1a1a1a;
      min-height: 100vh;
      padding: 24px 16px;
    }
    .container { max-width: 860px; margin: 0 auto; }
    .header { margin-bottom: 24px; }
    .title { font-size: 22px; font-weight: 600; letter-spacing: -0.3px; }
    .subtitle { font-size: 13px; color: #888; margin-top: 4px; font-family: 'DM Mono', monospace; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .card { background: #fff; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    .card-label { font-size: 11px; font-weight: 500; color: #999; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 8px; }
    .score-num { font-size: 52px; font-weight: 300; font-family: 'DM Mono', monospace; line-height: 1; }
    .score-denom { font-size: 24px; color: #bbb; font-family: 'DM Mono', monospace; }
    .posture-label { font-size: 13px; font-weight: 600; margin-top: 8px; }
    .action-text { font-size: 13px; color: #555; margin-top: 6px; line-height: 1.5; }
    .provider-badge { font-size: 11px; font-family: 'DM Mono', monospace; background: #F0F0F0; padding: 3px 8px; border-radius: 4px; color: #666; }
    .sc-prob { font-size: 32px; font-weight: 300; font-family: 'DM Mono', monospace; }
    .sc-label { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .sc-detail { font-size: 11px; color: #666; margin-top: 4px; line-height: 1.4; }
    .signal-section { background: #fff; border-radius: 12px; padding: 18px 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.06); margin-bottom: 14px; }
    .risks-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
    .tag { display: inline-block; font-size: 11px; padding: 2px 8px; border-radius: 4px; font-weight: 500; margin: 3px 4px 3px 0; }
    .tag-risk { background: #FFF0EE; color: #C0392B; }
    .tag-tw { background: #E6FAF3; color: #0B5E38; }
    .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 24px; font-family: 'DM Mono', monospace; }
    .refresh-btn { background: #1a1a1a; color: #fff; border: none; border-radius: 8px; padding: 10px 20px; font-size: 13px; font-family: 'DM Sans', sans-serif; font-weight: 500; cursor: pointer; margin-top: 8px; }
    .refresh-btn:hover { background: #333; }
    .breakdown-row { display: flex; gap: 16px; margin-top: 12px; flex-wrap: wrap; }
    .breakdown-item { font-size: 12px; display: flex; align-items: center; gap: 5px; }
    @media (max-width: 600px) {
      .grid-2, .grid-3, .risks-grid { grid-template-columns: 1fr; }
      .score-num { font-size: 40px; }
    }
  </style>
</head>
<body>
<div class="container">
  <div class="header">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:8px;">
      <div>
        <h1 class="title">Macro Signal Dashboard</h1>
        <p class="subtitle">India Portfolio Rebalancing Framework · 12 Signals · Updated ${date}</p>
      </div>
      <span class="provider-badge">via ${provider.toUpperCase()}</span>
    </div>
  </div>

  <!-- Score + Posture -->
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Signal Score</div>
      <div style="display:flex;align-items:flex-end;gap:4px;">
        <span class="score-num" style="color:${postureColor(scoreData.posture)}">${scoreData.score}</span>
        <span class="score-denom">/12</span>
        <div style="margin-left:auto;padding-bottom:4px;">${historySparkline(scoreData.score, history)}</div>
      </div>
      <div class="breakdown-row">
        <div class="breakdown-item"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#00B37E;"></span>${scoreData.breakdown.GREEN.length} Green</div>
        <div class="breakdown-item"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E6A817;"></span>${scoreData.breakdown.AMBER.length} Amber</div>
        <div class="breakdown-item"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#E54D2E;"></span>${scoreData.breakdown.RED.length} Red</div>
      </div>
    </div>
    <div class="card">
      <div class="card-label">Portfolio Posture</div>
      <div class="posture-label" style="color:${postureColor(scoreData.posture)};font-size:15px;">${scoreData.postureLabel}</div>
      <div class="action-text">${scoreData.action}</div>
      <div style="margin-top:12px;font-size:11px;color:#aaa;">Rotate at 6/12 (50%) · Full deploy at 9/12</div>
    </div>
  </div>

  <!-- Scenarios -->
  <p style="font-size:11px;font-weight:500;color:#999;text-transform:uppercase;letter-spacing:0.06em;margin-bottom:10px;">Scenario Probabilities</p>
  <div class="grid-3">
    <div class="card" style="border-top:3px solid #00B37E;">
      <div class="sc-label" style="color:#0B5E38;">🟢 Bull Case</div>
      <div class="sc-prob">${bull.probability || 15}%</div>
      <div class="sc-detail">Brent: ${bull.brent || "$72–82"}<br>Nifty Dec: ${bull.niftyDec || "27,500–29,000"}</div>
      <div style="font-size:11px;color:#888;margin-top:8px;">${bull.rationale || "Full resolution, Hormuz reopens"}</div>
    </div>
    <div class="card" style="border-top:3px solid #E6A817;">
      <div class="sc-label" style="color:#7D5A00;">🟡 Base Case</div>
      <div class="sc-prob">${base.probability || 52}%</div>
      <div class="sc-detail">Brent: ${base.brent || "$88–100"}<br>Nifty Dec: ${base.niftyDec || "24,000–26,500"}</div>
      <div style="font-size:11px;color:#888;margin-top:8px;">${base.rationale || "Managed standoff continues"}</div>
    </div>
    <div class="card" style="border-top:3px solid #E54D2E;">
      <div class="sc-label" style="color:#7B241C;">🔴 Bear Case</div>
      <div class="sc-prob">${bear.probability || 33}%</div>
      <div class="sc-detail">Brent: ${bear.brent || "$115–140"}<br>Nifty Dec: ${bear.niftyDec || "20,000–22,500"}</div>
      <div style="font-size:11px;color:#888;margin-top:8px;">${bear.rationale || "Escalation, long standoff"}</div>
    </div>
  </div>

  <!-- Signal Detail -->
  <div class="signal-section">
    <div class="card-label" style="margin-bottom:4px;">Signal Detail — All 12 Indicators</div>
    ${signalRows}
  </div>

  <!-- Risks & Tailwinds -->
  ${(scenarios.keyRisks?.length || scenarios.keyTailwinds?.length) ? `
  <div class="risks-grid">
    <div class="card">
      <div class="card-label">Key Risks</div>
      <div>${(scenarios.keyRisks || []).map(r => `<span class="tag tag-risk">${r}</span>`).join("")}</div>
    </div>
    <div class="card">
      <div class="card-label">Key Tailwinds</div>
      <div>${(scenarios.keyTailwinds || []).map(t => `<span class="tag tag-tw">${t}</span>`).join("")}</div>
    </div>
  </div>` : ""}

  <div class="footer">
    <p>macro-dashboard-agent · Not financial advice · Refresh daily for accurate signals</p>
  </div>
</div>
</body>
</html>`;
}

module.exports = { render };
