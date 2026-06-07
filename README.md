# 📊 Macro Signal Dashboard Agent

An AI-powered agent that evaluates **12 macro signals** daily and determines whether conditions are right to deploy lump sum equity into Indian markets — or stay defensive.

Works with **Claude** (Anthropic) or **OpenAI** API keys. Publishes a live dashboard to GitHub Pages automatically every morning.

---

## What It Does

The agent searches the web for real-time data across 12 macro indicators, scores each as 🟢 GREEN / 🟡 AMBER / 🔴 RED, computes a total score (0–12), and recommends a portfolio posture:

| Score | Posture | Action |
|-------|---------|--------|
| 0–5 | 🔴 Defensive | SIPs only. No lump sum equity. |
| 6–8 | 🟡 Partial Deploy | Rotate 50% of FI → equity |
| 9–12 | 🟢 Full Deploy | Full equity deployment |

### The 12 Signals

| # | Signal | Threshold (GREEN) | Category |
|---|--------|-------------------|----------|
| 1 | Brent Crude | < $85/bbl | Energy |
| 2 | Hormuz Traffic | > 60% of normal | Geopolitical |
| 3 | NOLA Urea Price | < $450/mt | Commodity |
| 4 | Dual Blockade Resolved | Both blockades lifted | Geopolitical |
| 5 | RBI Monetary Stance | Rate cut / easing bias | Monetary |
| 6 | Fed Pivot Language | Easing / neutral | Monetary |
| 7 | RBI Forex Reserves | Stable or rising | External |
| 8 | FII Net Buying | 3 consecutive weeks | Flows |
| 9 | Yield Curve Spread | 10yr–3yr > 60bps | Macro |
| 10 | Nifty EPS Revisions | 2+ months upward | Equity |
| 11 | GST Collections | > ₹1.8L crore/month | Domestic |
| 12 | Manufacturing PMI | > 54 for 2 months | Domestic |

---

## Quick Start

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/macro-dashboard-agent.git
cd macro-dashboard-agent
npm install
```

### 2. Add your API key

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Pick one: claude or openai
AI_PROVIDER=claude

# Anthropic Claude (recommended — has built-in web search)
CLAUDE_API_KEY=sk-ant-...

# OR OpenAI GPT-4o
OPENAI_API_KEY=sk-...
```

### 3. Run the agent

```bash
# Using .env
npm start

# Or pass key directly
node src/agent.js --provider claude --key sk-ant-YOUR_KEY
node src/agent.js --provider openai --key sk-YOUR_KEY

# Shorthand scripts
npm run claude
npm run openai
```

### 4. View the dashboard

```bash
npm run serve
# Open http://localhost:3000
```

Or open `public/index.html` directly in your browser.

---

## Automated Daily Updates (GitHub Actions)

Set this up once — the dashboard refreshes itself every morning at 8:30 AM IST.

### Step 1: Fork or push to your GitHub repo

```bash
git remote add origin https://github.com/YOUR_USERNAME/macro-dashboard-agent.git
git push -u origin main
```

### Step 2: Add your API key as a GitHub Secret

Go to: **Your Repo → Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Value |
|-------------|-------|
| `CLAUDE_API_KEY` | `sk-ant-...` |

Or if using OpenAI:

| Secret Name | Value |
|-------------|-------|
| `OPENAI_API_KEY` | `sk-...` |

### Step 3: Set the provider variable (optional)

Go to: **Settings → Secrets and variables → Actions → Variables tab**

| Variable Name | Value |
|---------------|-------|
| `AI_PROVIDER` | `claude` or `openai` |

Default is `claude` if not set.

### Step 4: Enable GitHub Pages

Go to: **Settings → Pages → Source → GitHub Actions**

Your live dashboard will be at:
```
https://YOUR_USERNAME.github.io/macro-dashboard-agent/
```

### Step 5 (optional): Trigger manually

Go to: **Actions → Daily Macro Signal Refresh → Run workflow**

---

## Output Files

After each run, the agent produces:

| File | Description |
|------|-------------|
| `public/index.html` | Rendered dashboard (served via GitHub Pages) |
| `data/latest.json` | Full signal data from the most recent run |
| `data/history.json` | Score history (last 90 runs) for sparkline |

### `data/latest.json` structure

```json
{
  "timestamp": "2026-06-05T03:00:00.000Z",
  "provider": "claude",
  "score": {
    "score": 3,
    "total": 12,
    "posture": "DEFENSIVE",
    "postureLabel": "Defensive — SIPs Only",
    "action": "Hold defensive. Run SIPs only. No lump sum equity.",
    "breakdown": {
      "GREEN": ["gst_collections", "manufacturing_pmi"],
      "AMBER": ["rbi_stance", "rbi_forex", "yield_curve", "dual_blockade"],
      "RED": ["brent_crude", "hormuz_traffic", "urea_price", "fed_pivot", "fii_flows", "nifty_eps"]
    }
  },
  "signals": [
    {
      "id": "brent_crude",
      "name": "Brent Crude Oil",
      "value": "~$95/bbl",
      "status": "RED",
      "explanation": "Brent at $95, above the $85 green threshold. War risk premium persists.",
      "source": "TradingEconomics / Reuters",
      "fetchedAt": "2026-06-05T03:04:12.000Z"
    }
  ],
  "scenarios": {
    "bull": { "probability": 15, "brent": "$72-82", "niftyDec": "27500-29000", "rationale": "..." },
    "base": { "probability": 52, "brent": "$88-100", "niftyDec": "24000-26500", "rationale": "..." },
    "bear": { "probability": 33, "brent": "$115-140", "niftyDec": "20000-22500", "rationale": "..." }
  }
}
```

---

## Project Structure

```
macro-dashboard-agent/
├── README.md                        # This file
├── .env.example                     # API key template
├── .gitignore
├── package.json
│
├── src/
│   ├── agent.js                     # Main orchestrator (entry point)
│   ├── signals.js                   # 12 signal definitions + scoring rules
│   ├── providers/
│   │   ├── claude.js                # Claude API w/ web search
│   │   └── openai.js                # OpenAI API w/ web search
│   └── dashboard/
│       └── renderer.js              # Generates HTML dashboard from data
│
├── skills/
│   └── SIGNAL_SKILL.md              # Framework doc for AI agents
│
├── data/
│   ├── latest.json                  # Most recent signal run (auto-generated)
│   └── history.json                 # Score history (auto-generated)
│
├── public/
│   └── index.html                   # Dashboard output (auto-generated)
│
└── .github/
    └── workflows/
        └── daily-update.yml         # GitHub Actions cron (8:30 AM IST)
```

---

## Customising the Signals

The signal definitions live in `src/signals.js`. Each signal has:

```javascript
{
  id: "brent_crude",
  name: "Brent Crude Oil",
  threshold: "< $85/bbl",
  greenCondition: "...",
  amberCondition: "...",
  redCondition: "...",
  searchQuery: "Brent crude oil spot price today USD per barrel",
  extractInstruction: "Find the current Brent crude price. Return JSON: { value, status, explanation }",
  importance: "Primary trigger indicator.",
  unit: "$/bbl"
}
```

To change thresholds, update the `greenCondition`, `amberCondition`, `redCondition` fields and reflect the change in `extractInstruction`.

---

## Portfolio Framework

This dashboard implements a systematic rebalancing framework with the following rules:

### Always (regardless of score)
- **SIPs run continuously** — never pause based on macro conditions
- Like-for-like equity switches are permitted at any score
- Marketplace bond coupon → Tata Arbitrage Fund monthly

### Score < 6 (Defensive)
- Idle cash above 6-month expense float → Tata Arbitrage Fund
- Wait for signal before lump sum equity
- Sector preference: Pharma, Defence, Renewables, Electrical equipment

### Score 6–8 (Partial Deploy)
- Rotate 50% of arbitrage/short FI → Indian equity lump sum
- Vehicles: PPFAS Flexi Cap, MO Nifty 50 Index
- Begin Taiwan/China allocation (Nippon Taiwan, Mirae Hang Seng)

### Score 9–12 (Full Deploy)
- Rotate remaining 50% into equity
- Full deployment authorised

See `skills/SIGNAL_SKILL.md` for the complete framework.

---

## API Key Setup

### Claude (Recommended)

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Claude's built-in web search tool (`web_search_20250305`) is used — no additional setup needed
4. Expected cost per run: ~$0.10–0.20 (12 signals × web search calls)

### OpenAI

1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Uses GPT-4o with `web_search_preview` tool
4. Expected cost per run: ~$0.15–0.30

---

## Limitations

- Signal scoring is AI-interpreted, not rule-based — small LLM errors can occur on ambiguous data
- Web search results may have a lag of a few hours for intraday prices
- Hormuz traffic % is estimated from shipping data sources, not an official figure
- This is a portfolio decision aid, not financial advice

---

## Troubleshooting

### ❌ "Rate limit exceeded" / 429 errors on multiple signals

**Root cause:** The 12 signal calls each trigger a web search, which returns large result sets. Running them too quickly exceeds Anthropic's token-per-minute (TPM) limit for your tier.

**What the fix does (already in `claude.js`):**
- Uses `claude-haiku-4-5` for signal calls — Haiku has a 5× higher TPM limit than Sonnet
- 6-second delay between each signal call
- Exponential backoff: on a 429, waits 15s → 30s → 60s before retry (up to 3 retries)
- Respects the `Retry-After` response header if present

**If you're still hitting limits (free/low-tier API account):**

Option 1 — Add longer delays:
```bash
# In src/providers/claude.js, increase BASE_DELAY_MS
const BASE_DELAY_MS = 10000;  // 10s instead of 6s
```

Option 2 — Run signals in two batches manually:
```bash
# Edit src/agent.js temporarily to run signals 1–6, then 7–12
```

Option 3 — Upgrade your Anthropic tier:
- Go to [console.anthropic.com/settings/billing](https://console.anthropic.com/settings/billing)
- Adding $5 of credits moves you to Tier 1 (higher TPM limits)
- Adding $40 total moves you to Tier 2

**Rate limits by tier (as of 2026):**

| Tier | Haiku TPM | Sonnet TPM |
|------|-----------|------------|
| Free | 20,000 | 10,000 |
| Tier 1 | 50,000 | 40,000 |
| Tier 2 | 100,000 | 80,000 |

The agent uses Haiku for signal calls specifically because even Tier 1 Haiku (50K TPM) comfortably handles 12 calls at 6s spacing (~3–4K tokens each).

---

### ❌ "No text block in response" error

The model used tool calls but didn't produce a final text response. Fix: increase `max_tokens` in `evaluateSignal()` from 512 to 1024.

---

### ❌ JSON parse error on a signal

The model returned text that wasn't valid JSON. The agent logs the raw response — look for it in the console. Usually caused by the model adding a preamble. The compact prompt in the updated `claude.js` reduces this significantly.

---

### ⚠️ GitHub Actions failing

Check: **Actions → Daily Macro Signal Refresh → View logs**

Common causes:
- `CLAUDE_API_KEY` secret not set → add it under Settings → Secrets → Actions
- `AI_PROVIDER` variable not set → defaults to `claude` (correct)
- GitHub Pages not enabled → Settings → Pages → Source → GitHub Actions

---

## Contributing

PRs welcome for:
- Additional signals (India VIX, Credit spreads, RBI liquidity surplus)
- Better search queries for specific signals
- Alternative dashboard themes
- Telegram / Slack notification integration

---

## License

MIT — free to use, modify, and share.

---

*Built to track the 2026 Middle East war macro framework. Signals and thresholds calibrated for an India-focused equity portfolio with a 12–24 month horizon.*
