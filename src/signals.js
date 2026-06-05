/**
 * macro-dashboard-agent — Signal Definitions
 * 12-signal macro rebalancing framework
 * Each signal has: name, threshold logic, search query, and scoring rules
 */

const SIGNALS = [
  {
    id: "brent_crude",
    name: "Brent Crude Oil",
    category: "energy",
    threshold: "< $85/bbl",
    greenCondition: "Brent spot price below $85",
    amberCondition: "Brent spot price $85–$95",
    redCondition: "Brent spot price above $95",
    searchQuery: "Brent crude oil spot price today USD per barrel",
    extractInstruction: "Extract the current Brent crude spot price in USD per barrel. Return a JSON object: { value: '$XXX', numericValue: XXX, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if below $85, AMBER if $85-$95, RED if above $95.",
    importance: "Primary trigger indicator. Single most important signal.",
    unit: "$/bbl"
  },
  {
    id: "hormuz_traffic",
    name: "Strait of Hormuz Traffic",
    category: "geopolitical",
    threshold: "> 60% of normal",
    greenCondition: "Hormuz traffic above 60% of pre-war normal",
    amberCondition: "Hormuz traffic 20–60% of normal",
    redCondition: "Hormuz traffic below 20% of normal",
    searchQuery: "Strait of Hormuz shipping traffic percentage normal 2026",
    extractInstruction: "Find the current shipping traffic through the Strait of Hormuz as a percentage of normal pre-war levels. Return JSON: { value: 'X%', numericValue: X, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if above 60%, AMBER if 20-60%, RED if below 20%.",
    importance: "Structural supply signal. Controls 20% of global oil trade.",
    unit: "% of normal"
  },
  {
    id: "urea_price",
    name: "NOLA Urea Price",
    category: "commodity",
    threshold: "< $450/metric ton",
    greenCondition: "NOLA urea below $450/mt",
    amberCondition: "NOLA urea $450–$550/mt",
    redCondition: "NOLA urea above $550/mt",
    searchQuery: "NOLA urea price per metric ton 2026 current spot",
    extractInstruction: "Find current NOLA (New Orleans) urea spot price in USD per metric ton. Return JSON: { value: '$XXX/mt', numericValue: XXX, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if below $450, AMBER if $450-$550, RED if above $550.",
    importance: "Food inflation leading indicator. Kharif season impact.",
    unit: "$/mt"
  },
  {
    id: "dual_blockade",
    name: "Dual Blockade Resolution",
    category: "geopolitical",
    threshold: "Both US naval blockade and Iran Hormuz closure resolved",
    greenCondition: "Both blockades fully lifted, Hormuz open",
    amberCondition: "One blockade lifted or partial resolution",
    redCondition: "Both blockades active",
    searchQuery: "Iran US naval blockade Strait of Hormuz status 2026 resolved",
    extractInstruction: "Assess the current status of: (1) US naval blockade on Iran, (2) Iran's closure of Strait of Hormuz. Return JSON: { value: 'Descriptive status', numericValue: null, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if both resolved, AMBER if one resolved or partial progress, RED if both active.",
    importance: "Structural resolution signal. Needed before oil normalises.",
    unit: "qualitative"
  },
  {
    id: "rbi_stance",
    name: "RBI Monetary Stance",
    category: "monetary",
    threshold: "Neutral or accommodative language from RBI MPC",
    greenCondition: "RBI cuts rates or explicitly signals cuts ahead",
    amberCondition: "RBI holds with neutral stance, no hawkish signal",
    redCondition: "RBI hikes or signals hikes / hawkish inflation language",
    searchQuery: "RBI MPC repo rate decision June 2026 monetary policy stance",
    extractInstruction: "Find the latest RBI MPC decision: repo rate, stance, and tone. Return JSON: { value: 'X.XX% + stance', numericValue: X.XX, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if cutting rates. AMBER if holding neutral. RED if hiking or hawkish.",
    importance: "Domestic liquidity signal. Drives equity risk premium.",
    unit: "%"
  },
  {
    id: "fed_pivot",
    name: "US Federal Reserve Pivot",
    category: "monetary",
    threshold: "Fed drops 'upside inflation risks' language",
    greenCondition: "Fed cuts rates or pivots to easing bias",
    amberCondition: "Fed holds with neutral language",
    redCondition: "Fed holds or hikes with inflation hawkishness",
    searchQuery: "Federal Reserve FOMC meeting rate decision June 2026 inflation language",
    extractInstruction: "Find the latest FOMC decision and language on inflation risks. Return JSON: { value: 'Rate + language summary', numericValue: null, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if cutting. AMBER if neutral hold. RED if hawkish hold.",
    importance: "Global risk-on/off signal. Drives FII flows to EM.",
    unit: "qualitative"
  },
  {
    id: "rbi_forex",
    name: "RBI Forex Reserves",
    category: "macro",
    threshold: "Stable or rising reserves",
    greenCondition: "Forex reserves stable or growing, INR stable",
    amberCondition: "Reserves declining slowly, RBI intervening actively",
    redCondition: "Reserves falling sharply, INR under severe pressure",
    searchQuery: "India RBI forex reserves latest 2026 USD billion INR exchange rate",
    extractInstruction: "Find current India forex reserves in USD billions and USD/INR rate. Return JSON: { value: '$XXXbn / ₹XX.XX', numericValue: null, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if reserves stable/rising. AMBER if declining but manageable. RED if crisis-level decline.",
    importance: "Currency stability signal. RBI intervention capacity.",
    unit: "USD bn"
  },
  {
    id: "fii_flows",
    name: "FII Net Buying (3 weeks)",
    category: "flows",
    threshold: "3 consecutive weeks of net FII buying",
    greenCondition: "FIIs net buyers for 3+ consecutive weeks",
    amberCondition: "FIIs mixed — one week buying, others selling",
    redCondition: "FIIs net sellers consistently",
    searchQuery: "India FII DII net flows NSE buying selling June 2026",
    extractInstruction: "Find recent FII (Foreign Institutional Investor) net flows in Indian equity markets. Return JSON: { value: 'Net ₹XX cr (X weeks)', numericValue: null, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if 3+ weeks consecutive net buyers. AMBER if mixed. RED if consistent sellers.",
    importance: "Foreign sentiment signal. Leading indicator of Nifty direction.",
    unit: "₹ crore"
  },
  {
    id: "yield_curve",
    name: "India Yield Curve Spread",
    category: "macro",
    threshold: "10yr–3yr spread > 60bps",
    greenCondition: "10yr–3yr spread above 60bps",
    amberCondition: "Spread 30–60bps",
    redCondition: "Spread below 30bps or inverted",
    searchQuery: "India 10 year government bond yield 3 year yield spread 2026",
    extractInstruction: "Find India 10-year and 3-year government bond yields and calculate the spread. Return JSON: { value: '10yr X% / 3yr X% / spread Xbps', numericValue: spread_in_bps, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if spread above 60bps. AMBER if 30-60bps. RED if below 30bps.",
    importance: "Credit/growth signal. Wider = economy expects recovery.",
    unit: "bps"
  },
  {
    id: "nifty_eps",
    name: "Nifty EPS Revisions",
    category: "equity",
    threshold: "2+ consecutive months of upward EPS revisions",
    greenCondition: "Nifty EPS being revised upward for 2+ months",
    amberCondition: "EPS revisions mixed or flat",
    redCondition: "EPS revisions consistently downward",
    searchQuery: "Nifty 50 EPS earnings estimate revision FY27 brokers 2026",
    extractInstruction: "Find the trend in Nifty 50 EPS (earnings per share) revisions from brokers. Return JSON: { value: 'FY27E ₹XXX (direction)', numericValue: null, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if 2+ months upward revisions. AMBER if flat/mixed. RED if cuts.",
    importance: "Equity fundamental signal. P/E expansion requires EPS confidence.",
    unit: "qualitative"
  },
  {
    id: "gst_collections",
    name: "GST Collections",
    category: "macro",
    threshold: "> ₹1.8 lakh crore / month",
    greenCondition: "Monthly GST above ₹1.8 lakh crore",
    amberCondition: "Monthly GST ₹1.6–1.8 lakh crore",
    redCondition: "Monthly GST below ₹1.6 lakh crore",
    searchQuery: "India GST collection latest month 2026 lakh crore",
    extractInstruction: "Find the latest monthly GST collection figure for India. Return JSON: { value: '₹X.XX lakh crore (Month)', numericValue: X.XX, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if above 1.8. AMBER if 1.6-1.8. RED if below 1.6.",
    importance: "Domestic demand proxy. Confirms India's consumption resilience.",
    unit: "₹ lakh crore"
  },
  {
    id: "manufacturing_pmi",
    name: "India Manufacturing PMI",
    category: "macro",
    threshold: "> 54 for 2 consecutive months",
    greenCondition: "Manufacturing PMI above 54 for 2+ consecutive months",
    amberCondition: "PMI above 50 but below 54, or only 1 month above 54",
    redCondition: "PMI below 50 (contraction) or below 54 for 2+ months",
    searchQuery: "India HSBC manufacturing PMI latest month 2026",
    extractInstruction: "Find the latest India Manufacturing PMI reading. Return JSON: { value: 'XX.X (Month)', numericValue: XX.X, status: 'RED'|'AMBER'|'GREEN', explanation: '...' }. GREEN if above 54 for 2+ months. AMBER if 50-54. RED if below 50 or sustained below 54.",
    importance: "Real economy signal. Confirms domestic activity vs external shock.",
    unit: "index"
  }
];

const ROTATION_RULES = {
  firstRotation: {
    threshold: 6,
    action: "Rotate 50% of arbitrage/short-duration FI into Indian equity lump sum",
    description: "First deployment tranche"
  },
  secondRotation: {
    threshold: 9,
    action: "Rotate remaining 50% of arbitrage/short-duration FI into Indian equity",
    description: "Full deployment"
  },
  sipRule: "Run SIPs continuously regardless of signal score. Never pause.",
  likeForLikeRule: "Like-for-like equity switches permitted at any score. Sector rotation should be defensive below 6/12."
};

const SCENARIO_DEFINITIONS = {
  bull: {
    label: "Bull — Deal & Hormuz reopens",
    brentRange: "$72–$82",
    niftyDec2026: "27,500–29,000",
    description: "Full ceasefire, Hormuz reopens, RBI cuts 50–75bps, FII return"
  },
  base: {
    label: "Base — Managed standoff",
    brentRange: "$88–$100",
    niftyDec2026: "24,000–26,500",
    description: "Ceasefire holds, Hormuz partial, inflation elevated, slow recovery"
  },
  bear: {
    label: "Bear — Escalation / long standoff",
    brentRange: "$115–$140",
    niftyDec2026: "20,000–22,500",
    description: "Lebanon re-escalates, Hormuz stays closed, stagflation deepens"
  }
};

module.exports = { SIGNALS, ROTATION_RULES, SCENARIO_DEFINITIONS };
