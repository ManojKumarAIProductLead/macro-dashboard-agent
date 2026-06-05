# SIGNAL_SKILL.md — Macro Rebalancing Signal Scoring Framework

## Purpose
This skill encodes the 12-signal macro rebalancing framework for an India-focused equity portfolio during the 2026 Middle East war / Strait of Hormuz crisis. AI agents use this to evaluate whether conditions are appropriate for deploying lump sum equity.

## Core Rule
**Never deploy lump sum equity below 6/12 signals green. Run SIPs continuously at any score.**

---

## The 12 Signals

### Category: Energy & Geopolitical (signals 1–4)
These are the primary gatekeepers. Equity deployment is almost never appropriate when these are RED.

| Signal | GREEN Threshold | AMBER | RED |
|--------|----------------|-------|-----|
| 1. Brent Crude | < $85/bbl | $85–$95 | > $95 |
| 2. Hormuz Traffic | > 60% of normal | 20–60% | < 20% |
| 3. NOLA Urea | < $450/mt | $450–$550 | > $550 |
| 4. Dual Blockade | Both resolved | One resolved | Both active |

**Why these matter:**
- Brent is the single most watched number. $85 = oil market normalising. $75 = bull case opens. $105+ sustained = bear case confirmed.
- Hormuz is structural. 20% of global oil trade. India crude basket runs $5–8 above Brent when Hormuz is restricted.
- Urea feeds into Kharif planting (June start). Above $550 = food CPI shock incoming in Oct–Nov.
- Dual blockade = both the US naval blockade on Iranian ports AND Iran's closure of Hormuz. Both must resolve for true normalisation.

### Category: Monetary Policy (signals 5–6)
| Signal | GREEN | AMBER | RED |
|--------|-------|-------|-----|
| 5. RBI Stance | Rate cut / easing bias | Neutral hold | Hike / hawkish |
| 6. Fed Pivot | Rate cut / neutral | Neutral hold | Hawkish hold |

**Why these matter:**
- RBI cutting = domestic liquidity improving, equity risk premium falls.
- Fed pivot = FII flows return to EM. Each 25bps Fed cut typically brings $1–2bn FII into India.
- With WPI at 8.3%+ (Jun 2026), RBI is constrained. Watch for inflation trajectory monthly.

### Category: External Stability (signals 7–8)
| Signal | GREEN | AMBER | RED |
|--------|-------|-------|-----|
| 7. RBI Forex Reserves | Stable / growing | Declining slowly | Falling sharply |
| 8. FII Net Buying | 3+ weeks net buying | Mixed | Consistent sellers |

**Why these matter:**
- Forex reserves = RBI's capacity to intervene on INR. Below $580bn = concern.
- FII sustained buying is both a cause and effect of market recovery. Watch weekly NSE data.

### Category: Domestic Strength (signals 9–12)
| Signal | GREEN | AMBER | RED |
|--------|-------|-------|-----|
| 9. Yield Curve (10yr–3yr) | > 60bps | 30–60bps | < 30bps |
| 10. Nifty EPS Revisions | 2+ months upward | Flat / mixed | Consecutive cuts |
| 11. GST Collections | > ₹1.8L crore | ₹1.6–1.8L crore | < ₹1.6L crore |
| 12. Manufacturing PMI | > 54 for 2 months | > 50, below 54 | < 50 or sustained < 54 |

**Why these matter:**
- Signals 11–12 are India's "domestic insulation" indicators. Even in a global shock, India can decouple if domestic demand is strong.
- GST ₹2L+ crore = strong formal economy. ₹1.8L = minimum acceptable.
- PMI > 54 for 2 consecutive months = manufacturing expansion confirmed, not a blip.

---

## Scoring Rules

```
Score = count of GREEN signals (0–12)
AMBER signals = 0 points (they are "watch" status, not triggers)

Score 0–5  → DEFENSIVE: SIPs only. No lump sum equity. Park cash in arbitrage funds.
Score 6–8  → PARTIAL DEPLOY: Rotate 50% of arbitrage/short FI into Indian equity lump sum.
Score 9–12 → FULL DEPLOY: Rotate remaining 50%. Full equity deployment authorised.
```

## Portfolio Actions by Score

### At any score (always):
- Run SIPs without pause — never stop SIPs based on macro
- Like-for-like equity switches permitted (e.g. active → passive in same category)
- Collect marketplace bond coupons → Tata Arbitrage Fund

### Score 0–5 (DEFENSIVE):
- Idle cash above 6-month expense float → Tata Arbitrage Fund (T+1 liquidity)
- Await dashboard signal before lump sum equity
- Sector rotation: if forced to switch equity, rotate into pharma / defence / renewables

### Score 6–8 (PARTIAL DEPLOY):
- Move 50% of arbitrage/short-duration debt into Indian equity via lump sum
- Preferred vehicles: PPFAS Flexi Cap, MO Nifty 50 Index, Nippon India Pharma
- Optional: initiate Taiwan/China tranche via Nippon Taiwan Fund + Mirae Hang Seng

### Score 9–12 (FULL DEPLOY):
- Move remaining 50% into equity
- Consider adding WMT ESOP divestment proceeds to equity rotation
- Review REIT positions (Nexus Select Trust, Mindspace)

---

## Broken Playbooks (Do NOT follow)
1. "Gold always rallies in war" — FALSE in 2026. Dollar strength + no rate cuts neutralised gold.
2. "Buy the dip — markets V-recover" — FALSE. FII outflows ₹60K+ crore. War hits India supply chains directly.
3. "Central banks will cut to stimulate" — FALSE when CPI is heading to 5–6%.
4. "OPEC+ will pump more and fix oil" — FALSE. OPEC+ ships also transit Hormuz.
5. "Stagflation is 6–12 months" — Historical evidence: 1973–1982 = 8–9 years. Plan for duration.

---

## Watch List (Daily / Weekly)
| Frequency | Indicator | Source |
|-----------|-----------|--------|
| Daily | Brent crude spot | Any finance site |
| Weekly (Friday) | RBI forex reserves | rbi.org.in |
| Weekly | NSE FII/DII net flows | nseindia.com |
| Monthly (1st) | Manufacturing PMI | S&P Global / HSBC |
| Monthly (1st) | GST collections | gst.gov.in |
| On MPC dates | RBI repo rate + stance | rbi.org.in |

---

## Asset Allocation Targets (Defensive Mode — score < 6)
| Asset | Target % | Vehicle |
|-------|----------|---------|
| Indian equity (SIP only) | 35% | PPFAS + MO Nifty 50 + Midcap 150 |
| Short-duration FI + Arbitrage | 40% | Tata Arbitrage + ICICI ST + AB Banking PSU |
| Gold | 10–12% | SGB (hold, buy trigger ₹1.30L/10g) |
| REIT | 8–10% | Nexus Select Trust → Mindspace |
| Cash (operational only) | 3–5% | 1–2 savings accounts, max 6 months expenses |
| US equity (WMT reducing) | Reduce to 10% | LTCG systematic sell calendar |

---

*This skill is maintained as part of the macro-dashboard-agent project.*
*Framework designed for a specific PERMA-V life goal-aligned portfolio. Not generic financial advice.*
