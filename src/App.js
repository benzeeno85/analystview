import { useState, useEffect, useCallback, useRef } from "react";

// ─── API KEYS (set via 🔑 button in app) ─────────────────────────────────────
const API_KEYS = { finnhub: "", alphavantage: "", polygon: "" };

// ─── DATA UNIVERSE ────────────────────────────────────────────────────────────
const STOCKS = {
  SP500: [
    { ticker:"AAPL",  name:"Apple Inc.",             sector:"Technology"       },
    { ticker:"MSFT",  name:"Microsoft Corp.",         sector:"Technology"       },
    { ticker:"NVDA",  name:"NVIDIA Corp.",            sector:"Technology"       },
    { ticker:"GOOGL", name:"Alphabet Inc.",           sector:"Technology"       },
    { ticker:"AMZN",  name:"Amazon.com Inc.",         sector:"Consumer Disc."   },
    { ticker:"META",  name:"Meta Platforms",          sector:"Technology"       },
    { ticker:"JPM",   name:"JPMorgan Chase",          sector:"Financials"       },
    { ticker:"V",     name:"Visa Inc.",               sector:"Financials"       },
    { ticker:"XOM",   name:"Exxon Mobil",             sector:"Energy"           },
    { ticker:"JNJ",   name:"Johnson & Johnson",       sector:"Healthcare"       },
    { ticker:"WMT",   name:"Walmart Inc.",            sector:"Consumer Staples" },
    { ticker:"UNH",   name:"UnitedHealth Group",      sector:"Healthcare"       },
    { ticker:"HD",    name:"Home Depot",              sector:"Consumer Disc."   },
    { ticker:"BAC",   name:"Bank of America",         sector:"Financials"       },
    { ticker:"PFE",   name:"Pfizer Inc.",             sector:"Healthcare"       },
  ],
  TSX: [
    { ticker:"RY.TO",   name:"Royal Bank of Canada",       sector:"Financials"       },
    { ticker:"TD.TO",   name:"Toronto-Dominion Bank",      sector:"Financials"       },
    { ticker:"CNR.TO",  name:"Canadian National Railway",  sector:"Industrials"      },
    { ticker:"ENB.TO",  name:"Enbridge Inc.",              sector:"Energy"           },
    { ticker:"BN.TO",   name:"Brookfield Corp.",           sector:"Financials"       },
    { ticker:"CP.TO",   name:"CP Kansas City",             sector:"Industrials"      },
    { ticker:"SU.TO",   name:"Suncor Energy",              sector:"Energy"           },
    { ticker:"BMO.TO",  name:"Bank of Montreal",           sector:"Financials"       },
    { ticker:"SHOP.TO", name:"Shopify Inc.",               sector:"Technology"       },
    { ticker:"ABX.TO",  name:"Barrick Gold Corp.",         sector:"Materials"        },
    { ticker:"BCE.TO",  name:"BCE Inc.",                   sector:"Telecom"          },
    { ticker:"CNQ.TO",  name:"Canadian Natural Resources", sector:"Energy"           },
  ],
};

const INDICES = [
  { symbol:"SPX",   name:"S&P 500",           region:"🇺🇸", ySymbol:"^GSPC"  },
  { symbol:"NDX",   name:"NASDAQ 100",         region:"🇺🇸", ySymbol:"^NDX"   },
  { symbol:"DJI",   name:"Dow Jones",          region:"🇺🇸", ySymbol:"^DJI"   },
  { symbol:"RUT",   name:"Russell 2000",       region:"🇺🇸", ySymbol:"^RUT"   },
  { symbol:"VIX",   name:"CBOE Volatility",    region:"🇺🇸", ySymbol:"^VIX"   },
  { symbol:"TXSC",  name:"TSX Composite",      region:"🇨🇦", ySymbol:"^GSPTSE"},
  { symbol:"TSX60", name:"TSX 60",             region:"🇨🇦", ySymbol:"^TX60"  },
  { symbol:"DXY",   name:"US Dollar Index",    region:"🌐",  ySymbol:"DX-Y.NYB"},
];

const FUTURES = [
  { symbol:"GC=F",  name:"Gold",              unit:"$/oz",   category:"Metals"       },
  { symbol:"SI=F",  name:"Silver",            unit:"$/oz",   category:"Metals"       },
  { symbol:"HG=F",  name:"Copper",            unit:"$/lb",   category:"Metals"       },
  { symbol:"CL=F",  name:"Crude Oil (WTI)",   unit:"$/bbl",  category:"Energy"       },
  { symbol:"BZ=F",  name:"Brent Crude",       unit:"$/bbl",  category:"Energy"       },
  { symbol:"NG=F",  name:"Natural Gas",       unit:"$/MMBtu",category:"Energy"       },
  { symbol:"ES=F",  name:"S&P 500 E-mini",    unit:"pts",    category:"Index Futures"},
  { symbol:"NQ=F",  name:"NASDAQ E-mini",     unit:"pts",    category:"Index Futures"},
  { symbol:"YM=F",  name:"Dow E-mini",        unit:"pts",    category:"Index Futures"},
  { symbol:"ZN=F",  name:"10-Yr T-Note",      unit:"pts",    category:"Bonds"        },
  { symbol:"ZC=F",  name:"Corn",              unit:"¢/bu",   category:"Agriculture"  },
  { symbol:"ZW=F",  name:"Wheat",             unit:"¢/bu",   category:"Agriculture"  },
];

// premium = cost per share. Contract cost = premium × 100
// moneyness: ITM=in the money, ATM=at the money, OTM=out of the money
// risk: 1=low, 2=medium, 3=high, 4=very high
// spotPrice = underlying price used to calculate moneyness
const OPTIONS_UNIVERSE = [
  // ── UNDER $50/contract ────────────────────────────────────────────────
  { underlying:"BAC",  name:"Bank of America", expiry:"2025-02-21", strike:40,  type:"CALL", iv:24.1, delta:0.38, oi:42100, vol:8200,  premium:0.45, spotPrice:38.90,  moneyness:"OTM", risk:2, sector:"Financials",    beginner:true  },
  { underlying:"BAC",  name:"Bank of America", expiry:"2025-02-21", strike:38,  type:"PUT",  iv:26.3, delta:-0.36, oi:31200, vol:5900, premium:0.38, spotPrice:38.90,  moneyness:"OTM", risk:2, sector:"Financials",    beginner:true  },
  { underlying:"PFE",  name:"Pfizer",          expiry:"2025-03-21", strike:28,  type:"CALL", iv:29.8, delta:0.40, oi:38400, vol:7100,  premium:0.32, spotPrice:27.40,  moneyness:"OTM", risk:2, sector:"Healthcare",     beginner:true  },
  { underlying:"PFE",  name:"Pfizer",          expiry:"2025-03-21", strike:27,  type:"PUT",  iv:31.4, delta:-0.42, oi:29800, vol:5200, premium:0.28, spotPrice:27.40,  moneyness:"ATM", risk:2, sector:"Healthcare",     beginner:true  },
  { underlying:"XOM",  name:"Exxon Mobil",     expiry:"2025-02-21", strike:120, type:"CALL", iv:22.6, delta:0.35, oi:28900, vol:4800,  premium:0.42, spotPrice:118.30, moneyness:"OTM", risk:2, sector:"Energy",         beginner:true  },
  { underlying:"WMT",  name:"Walmart",         expiry:"2025-02-21", strike:90,  type:"CALL", iv:18.4, delta:0.39, oi:24200, vol:4100,  premium:0.35, spotPrice:88.70,  moneyness:"OTM", risk:1, sector:"Consumer Staples",beginner:true  },
  { underlying:"WMT",  name:"Walmart",         expiry:"2025-02-21", strike:87,  type:"PUT",  iv:19.8, delta:-0.38, oi:19100, vol:3200, premium:0.29, spotPrice:88.70,  moneyness:"OTM", risk:1, sector:"Consumer Staples",beginner:true  },
  { underlying:"F",    name:"Ford Motor",      expiry:"2025-01-17", strike:12,  type:"CALL", iv:38.2, delta:0.44, oi:89200, vol:22000, premium:0.18, spotPrice:11.42,  moneyness:"OTM", risk:3, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"F",    name:"Ford Motor",      expiry:"2025-01-17", strike:11,  type:"PUT",  iv:41.6, delta:-0.46, oi:72100, vol:18000, premium:0.22, spotPrice:11.42, moneyness:"ATM", risk:3, sector:"Consumer Disc.",  beginner:true  },
  { underlying:"SNAP", name:"Snap Inc.",       expiry:"2025-02-21", strike:12,  type:"CALL", iv:64.2, delta:0.42, oi:54800, vol:16200, premium:0.48, spotPrice:11.28,  moneyness:"OTM", risk:4, sector:"Technology",     beginner:false },
  // ── UNDER $200/contract ───────────────────────────────────────────────
  { underlying:"AAPL", name:"Apple",           expiry:"2025-02-21", strike:220, type:"CALL", iv:27.4, delta:0.38, oi:48200, vol:9100,  premium:1.85, spotPrice:213.45, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"AAPL", name:"Apple",           expiry:"2025-02-21", strike:205, type:"PUT",  iv:29.8, delta:-0.39, oi:39100, vol:7200, premium:1.62, spotPrice:213.45, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"AAPL", name:"Apple",           expiry:"2025-01-17", strike:215, type:"CALL", iv:28.4, delta:0.46, oi:52100, vol:10200, premium:1.42, spotPrice:213.45, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"JPM",  name:"JPMorgan",        expiry:"2025-02-21", strike:240, type:"CALL", iv:19.8, delta:0.36, oi:24100, vol:3900,  premium:1.75, spotPrice:234.80, moneyness:"OTM", risk:1, sector:"Financials",    beginner:true  },
  { underlying:"JPM",  name:"JPMorgan",        expiry:"2025-02-21", strike:230, type:"PUT",  iv:21.4, delta:-0.40, oi:18900, vol:3100, premium:1.48, spotPrice:234.80, moneyness:"OTM", risk:1, sector:"Financials",    beginner:true  },
  { underlying:"XOM",  name:"Exxon Mobil",     expiry:"2025-03-21", strike:122, type:"CALL", iv:23.1, delta:0.34, oi:22400, vol:3800,  premium:1.22, spotPrice:118.30, moneyness:"OTM", risk:2, sector:"Energy",         beginner:true  },
  { underlying:"AMZN", name:"Amazon",          expiry:"2025-02-21", strike:200, type:"CALL", iv:32.4, delta:0.42, oi:38200, vol:8400,  premium:1.95, spotPrice:195.60, moneyness:"OTM", risk:2, sector:"Consumer Disc.", beginner:true  },
  { underlying:"AMZN", name:"Amazon",          expiry:"2025-02-21", strike:192, type:"PUT",  iv:34.8, delta:-0.41, oi:29800, vol:6100, premium:1.68, spotPrice:195.60, moneyness:"OTM", risk:2, sector:"Consumer Disc.", beginner:true  },
  { underlying:"SPY",  name:"S&P 500 ETF",     expiry:"2025-01-31", strike:480, type:"CALL", iv:15.8, delta:0.38, oi:192000,vol:44000, premium:1.12, spotPrice:485.20, moneyness:"OTM", risk:1, sector:"Index ETF",      beginner:true  },
  { underlying:"SPY",  name:"S&P 500 ETF",     expiry:"2025-01-31", strike:475, type:"PUT",  iv:17.2, delta:-0.36, oi:168000,vol:38000, premium:0.98, spotPrice:485.20, moneyness:"OTM", risk:1, sector:"Index ETF",      beginner:true  },
  { underlying:"QQQ",  name:"NASDAQ ETF",      expiry:"2025-01-31", strike:415, type:"CALL", iv:20.8, delta:0.37, oi:98000, vol:24000, premium:1.65, spotPrice:408.60, moneyness:"OTM", risk:2, sector:"Index ETF",      beginner:true  },
  { underlying:"QQQ",  name:"NASDAQ ETF",      expiry:"2025-01-31", strike:400, type:"PUT",  iv:23.4, delta:-0.38, oi:82000, vol:19000, premium:1.32, spotPrice:408.60, moneyness:"OTM", risk:2, sector:"Index ETF",      beginner:true  },
  // ── UNDER $500/contract ───────────────────────────────────────────────
  { underlying:"MSFT", name:"Microsoft",       expiry:"2025-02-21", strike:445, type:"CALL", iv:22.3, delta:0.37, oi:29800, vol:5400,  premium:3.40, spotPrice:432.10, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"MSFT", name:"Microsoft",       expiry:"2025-02-21", strike:420, type:"PUT",  iv:24.1, delta:-0.39, oi:22100, vol:4100, premium:2.85, spotPrice:432.10, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"META", name:"Meta",            expiry:"2025-02-21", strike:545, type:"CALL", iv:37.8, delta:0.38, oi:21400, vol:5200,  premium:4.20, spotPrice:522.75, moneyness:"OTM", risk:3, sector:"Technology",     beginner:false },
  { underlying:"META", name:"Meta",            expiry:"2025-02-21", strike:505, type:"PUT",  iv:40.2, delta:-0.40, oi:17600, vol:4100, premium:3.75, spotPrice:522.75, moneyness:"OTM", risk:3, sector:"Technology",     beginner:false },
  { underlying:"NVDA", name:"NVIDIA",          expiry:"2025-01-17", strike:920, type:"CALL", iv:51.4, delta:0.36, oi:64200, vol:15800, premium:4.80, spotPrice:875.20, moneyness:"OTM", risk:4, sector:"Technology",     beginner:false },
  { underlying:"NVDA", name:"NVIDIA",          expiry:"2025-01-17", strike:840, type:"PUT",  iv:54.2, delta:-0.38, oi:44800, vol:11200, premium:4.15, spotPrice:875.20, moneyness:"OTM", risk:4, sector:"Technology",     beginner:false },
  { underlying:"GOOGL",name:"Alphabet",        expiry:"2025-02-21", strike:185, type:"CALL", iv:26.8, delta:0.38, oi:32400, vol:6800,  premium:2.25, spotPrice:178.35, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  { underlying:"GOOGL",name:"Alphabet",        expiry:"2025-02-21", strike:172, type:"PUT",  iv:28.4, delta:-0.37, oi:24800, vol:5100, premium:1.92, spotPrice:178.35, moneyness:"OTM", risk:2, sector:"Technology",     beginner:true  },
  // ── HIGH RISK / SPECULATIVE ───────────────────────────────────────────
  { underlying:"AMC",  name:"AMC Entertainment",expiry:"2025-01-17",strike:5,  type:"CALL", iv:142.8,delta:0.41, oi:124000,vol:48000, premium:0.24, spotPrice:4.12,   moneyness:"OTM", risk:4, sector:"Consumer Disc.", beginner:false },
  { underlying:"GME",  name:"GameStop",        expiry:"2025-01-17", strike:22,  type:"CALL", iv:98.4, delta:0.38, oi:88200, vol:32000, premium:0.45, spotPrice:19.84,  moneyness:"OTM", risk:4, sector:"Consumer Disc.", beginner:false },
  { underlying:"PLTR", name:"Palantir",        expiry:"2025-02-21", strike:22,  type:"CALL", iv:62.4, delta:0.42, oi:74200, vol:28000, premium:0.88, spotPrice:20.14,  moneyness:"OTM", risk:4, sector:"Technology",     beginner:false },
];

const ANALYST_FIRMS = [
  "Goldman Sachs","Morgan Stanley","TD Securities","RBC Capital","Scotiabank GBM",
  "CIBC","BMO Capital","JPMorgan","UBS","Barclays","Jefferies","Piper Sandler",
  "Canaccord Genuity","Raymond James","National Bank","Desjardins",
];

const BUDGET_TIERS = [
  { id:"all",    label:"All",         max:Infinity, color:"#64748b" },
  { id:"ultra",  label:"Under $50",   max:50,       color:"#22c55e" },
  { id:"budget", label:"Under $200",  max:200,      color:"#3b82f6" },
  { id:"mid",    label:"Under $500",  max:500,      color:"#f59e0b" },
  { id:"spec",   label:"Speculative", max:Infinity, color:"#ef4444", specOnly:true },
];

const RISK_LABELS = ["","Low","Medium","High","Very High"];
const RISK_COLORS = ["","#22c55e","#f59e0b","#ef4444","#9333ea"];
const MONEYNESS_COLORS = { ITM:"#22c55e", ATM:"#f59e0b", OTM:"#64748b" };
const OPTIONS_ANALYSTS = [
  "Susquehanna","BTIG","Wedbush Options","Goldman Derivatives","Morgan Stanley Equity Derivatives",
  "Citadel Securities","Wolverine Trading","IMC Financial","Optiver","Flow Traders",
];
const CONSENSUS_ORDER = ["Strong Buy","Buy","Hold","Sell","Strong Sell"];
const SEED_PRICES = {
  AAPL:213.45,MSFT:432.10,NVDA:875.20,GOOGL:178.35,AMZN:195.60,META:522.75,
  JPM:234.80,V:298.15,XOM:118.30,JNJ:152.45,WMT:88.70,UNH:521.30,HD:388.45,BAC:38.90,PFE:27.40,
  "RY.TO":142.30,"TD.TO":78.45,"CNR.TO":168.20,"ENB.TO":57.85,"BN.TO":62.10,
  "CP.TO":112.75,"SU.TO":54.20,"BMO.TO":124.60,"SHOP.TO":128.90,"ABX.TO":22.15,
  "BCE.TO":33.45,"CNQ.TO":48.70,
};
const SEED_INDEX = {
  SPX:{price:4850.20,change:12.40,changeP:0.26},NDX:{price:16920.80,change:45.20,changeP:0.27},
  DJI:{price:38120.60,change:-85.40,changeP:-0.22},RUT:{price:2024.10,change:8.30,changeP:0.41},
  VIX:{price:14.82,change:-0.34,changeP:-2.24},TXSC:{price:21842.30,change:64.10,changeP:0.29},
  TSX60:{price:1324.80,change:3.90,changeP:0.29},DXY:{price:103.84,change:0.22,changeP:0.21},
};
const SEED_FUTURES = {
  "GC=F":{price:2028.40,change:8.20,changeP:0.41},"SI=F":{price:23.14,change:0.18,changeP:0.78},
  "HG=F":{price:3.84,change:-0.02,changeP:-0.52},"CL=F":{price:73.82,change:-0.64,changeP:-0.86},
  "BZ=F":{price:78.94,change:-0.58,changeP:-0.73},"NG=F":{price:2.64,change:0.04,changeP:1.54},
  "ES=F":{price:4862.50,change:14.25,changeP:0.29},"NQ=F":{price:16948.00,change:48.75,changeP:0.29},
  "YM=F":{price:38210.00,change:-62.00,changeP:-0.16},"ZN=F":{price:110.28,change:-0.14,changeP:-0.13},
  "ZC=F":{price:482.50,change:-3.25,changeP:-0.67},"ZW=F":{price:598.75,change:4.50,changeP:0.76},
};

// ─── DATA PROVIDERS ──────────────────────────────────────────────────────────
async function fetchYahoo(symbol) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`;
  const res = await fetch(url, { headers:{ Accept:"application/json" } });
  if (!res.ok) throw new Error("Yahoo fail");
  const json = await res.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta) throw new Error("No data");
  const price = meta.regularMarketPrice ?? meta.previousClose;
  const prev  = meta.previousClose ?? price;
  return { price, change:+(price-prev).toFixed(2), changeP:+(((price-prev)/prev)*100).toFixed(2),
           high:meta.regularMarketDayHigh, low:meta.regularMarketDayLow,
           open:meta.regularMarketOpen, volume:meta.regularMarketVolume, source:"Yahoo Finance" };
}
async function fetchFinnhub(symbol) {
  if (!API_KEYS.finnhub) throw new Error("No key");
  const s = symbol.includes(".TO") ? "TSX:"+symbol.replace(".TO","") : symbol;
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${s}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  if (!d.c) throw new Error("Empty");
  return { price:d.c, change:+(d.c-d.pc).toFixed(2), changeP:+d.dp.toFixed(2), high:d.h, low:d.l, open:d.o, source:"Finnhub" };
}
async function fetchQuote(symbol) {
  for (const fn of [fetchFinnhub, fetchYahoo]) {
    try { return await fn(symbol); } catch(_) {}
  }
  return null;
}
async function fetchFinnhubRec(symbol) {
  if (!API_KEYS.finnhub) return null;
  const s = symbol.replace(".TO","");
  const res = await fetch(`https://finnhub.io/api/v1/stock/recommendation?symbol=${s}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  return Array.isArray(d) && d.length ? d[0] : null;
}
async function fetchFinnhubTarget(symbol) {
  if (!API_KEYS.finnhub) return null;
  const s = symbol.replace(".TO","");
  const res = await fetch(`https://finnhub.io/api/v1/stock/price-target?symbol=${s}&token=${API_KEYS.finnhub}`);
  const d = await res.json();
  return d?.targetMean ?? null;
}

// ─── SEED DATA ────────────────────────────────────────────────────────────────
function rng(seed) { let s=seed; return()=>{s=(s*9301+49297)%233280;return s/233280;}; }
function seedRatings(ticker, target) {
  const r = rng(ticker.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const count = 6+Math.floor(r()*8), bias = r();
  return Array.from({length:count},()=>{
    const v=r();
    let rating;
    if(bias>0.65) rating=v<0.45?"Strong Buy":v<0.80?"Buy":v<0.92?"Hold":v<0.97?"Sell":"Strong Sell";
    else if(bias>0.35) rating=v<0.20?"Strong Buy":v<0.50?"Buy":v<0.80?"Hold":v<0.93?"Sell":"Strong Sell";
    else rating=v<0.05?"Strong Buy":v<0.20?"Buy":v<0.48?"Hold":v<0.75?"Sell":"Strong Sell";
    return { firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)], rating,
             daysAgo:Math.floor(r()*60)+1, target:target??null, targetMult:0.82+r()*0.44 };
  });
}
function seedOptionsRatings(key) {
  const r = rng(key.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const ratings = ["Strong Buy","Buy","Buy","Hold","Sell"];
  return Array.from({length:4+Math.floor(r()*4)},()=>({
    firm:OPTIONS_ANALYSTS[Math.floor(r()*OPTIONS_ANALYSTS.length)],
    rating:ratings[Math.floor(r()*ratings.length)],
    daysAgo:Math.floor(r()*14)+1,
    targetPremium:(2+r()*18).toFixed(2),
  }));
}
function seedIndexRatings(symbol) {
  const r = rng(symbol.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const labels = ["Bullish","Neutral","Bearish"];
  return Array.from({length:5+Math.floor(r()*6)},()=>({
    firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)],
    outlook:labels[Math.floor(r()*labels.length)],
    target:(r()*8-2).toFixed(1),
    daysAgo:Math.floor(r()*30)+1,
  }));
}
function seedFuturesRatings(symbol) {
  const r = rng(symbol.split("").reduce((a,c)=>a+c.charCodeAt(0),0));
  const labels = ["Strong Buy","Buy","Hold","Sell"];
  return Array.from({length:4+Math.floor(r()*5)},()=>({
    firm:ANALYST_FIRMS[Math.floor(r()*ANALYST_FIRMS.length)],
    rating:labels[Math.floor(r()*labels.length)],
    target12m:(r()*0.3-0.05).toFixed(2),
    daysAgo:Math.floor(r()*45)+1,
  }));
}
function calcConsensus(ratings) {
  const w={"Strong Buy":5,"Buy":4,"Hold":3,"Sell":2,"Strong Sell":1};
  const score=ratings.reduce((a,r)=>a+(w[r.rating]||3),0)/ratings.length;
  return score>=4.3?"Strong Buy":score>=3.6?"Buy":score>=2.6?"Hold":score>=1.8?"Sell":"Strong Sell";
}
function consensusFromFinnhub(d) {
  const total=(d.strongBuy||0)+(d.buy||0)+(d.hold||0)+(d.sell||0)+(d.strongSell||0);
  if(!total) return null;
  const score=((d.strongBuy||0)*5+(d.buy||0)*4+(d.hold||0)*3+(d.sell||0)*2+(d.strongSell||0))/total;
  return score>=4.3?"Strong Buy":score>=3.6?"Buy":score>=2.6?"Hold":score>=1.8?"Sell":"Strong Sell";
}

// ─── STYLE TOKENS ─────────────────────────────────────────────────────────────
const BADGE={
  "Strong Buy":{bg:"#16a34a"},"Buy":{bg:"#15803d"},"Hold":{bg:"#ca8a04"},
  "Sell":{bg:"#dc2626"},"Strong Sell":{bg:"#991b1b"},
  "Bullish":{bg:"#16a34a"},"Neutral":{bg:"#ca8a04"},"Bearish":{bg:"#dc2626"},
  "CALL":{bg:"#1d4ed8"},"PUT":{bg:"#9333ea"},
};
const BAR={"Strong Buy":"#22c55e","Buy":"#4ade80","Hold":"#facc15","Sell":"#f87171","Strong Sell":"#ef4444"};
const SRC={"Finnhub":"#00d4aa","Yahoo Finance":"#8b5cf6","Seed Data":"#475569"};
const CATEGORY_COLOR={
  "Metals":"#f59e0b","Energy":"#ef4444","Index Futures":"#3b82f6",
  "Bonds":"#22c55e","Agriculture":"#84cc16",
};

function Badge({label,size="sm"}) {
  const c=(BADGE[label]||{bg:"#475569"});
  return <span style={{background:c.bg,color:"#fff",borderRadius:4,
    padding:size==="lg"?"5px 13px":"3px 8px",fontSize:size==="lg"?12:10,
    fontWeight:800,letterSpacing:0.4,fontFamily:"monospace",whiteSpace:"nowrap"}}>{label}</span>;
}
function SourcePill({source}) {
  const c=SRC[source]||"#64748b";
  return <span style={{background:`${c}22`,color:c,border:`1px solid ${c}44`,
    borderRadius:10,padding:"2px 7px",fontSize:10,fontWeight:600}}>{source}</span>;
}
function BreakdownBar({ratings}) {
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>counts[r.rating]++);
  return <div style={{display:"flex",gap:2,borderRadius:4,overflow:"hidden",height:6,marginTop:8}}>
    {CONSENSUS_ORDER.map(r=>counts[r]>0&&<div key={r} style={{flex:counts[r]/ratings.length,background:BAR[r]}}/>)}
  </div>;
}
function Skeleton() {
  return <div style={{height:4,background:"#1e293b",borderRadius:2,overflow:"hidden",marginTop:12}}>
    <div style={{height:"100%",width:"40%",background:"#3b82f6",borderRadius:2,animation:"slide 1.2s ease-in-out infinite"}}/>
    <style>{`@keyframes slide{0%{margin-left:-40%}100%{margin-left:100%}}`}</style>
  </div>;
}
function PctBadge({v}) {
  const n=parseFloat(v); const isUp=n>=0;
  return <span style={{fontSize:12,color:isUp?"#22c55e":"#ef4444",fontWeight:700}}>
    {isUp?"▲":"▼"} {Math.abs(n).toFixed(2)}%
  </span>;
}

// ─── STOCK CARD ───────────────────────────────────────────────────────────────
function StockCard({stock,onClick,selected}) {
  const consensus=stock.consensus||"Hold";
  const upside=stock.avgTarget&&stock.price?(((stock.avgTarget-stock.price)/stock.price)*100).toFixed(1):null;
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",
      border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14,color:"#e2e8f0"}}>{stock.ticker}</span>
            <span style={{fontSize:10,color:"#6b7280",background:"#1f2937",borderRadius:3,padding:"2px 6px"}}>{stock.sector}</span>
            {stock.source&&!stock.loading&&<SourcePill source={stock.source}/>}
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{stock.name}</div>
        </div>
        <Badge label={consensus}/>
      </div>
      {stock.loading?<Skeleton/>:(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
            <div>
              <span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>
                {stock.price?`$${stock.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—"}
              </span>
              {stock.changeP!==undefined&&<span style={{marginLeft:6}}><PctBadge v={stock.changeP}/></span>}
            </div>
            {upside&&<div style={{textAlign:"right"}}>
              <div style={{fontSize:10,color:"#6b7280"}}>Avg Target</div>
              <div style={{fontSize:12,fontWeight:700,color:parseFloat(upside)>=0?"#22c55e":"#ef4444"}}>
                ${stock.avgTarget?.toFixed(2)} <span style={{fontSize:10}}>({upside>0?"+":""}{upside}%)</span>
              </div>
            </div>}
          </div>
          {stock.ratings&&<BreakdownBar ratings={stock.ratings}/>}
          <div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{stock.ratings?`${stock.ratings.length} analyst ratings`:""}</div>
        </>
      )}
    </div>
  );
}

// ─── INDEX CARD ───────────────────────────────────────────────────────────────
function IndexCard({idx,data,onClick,selected}) {
  const ratings=seedIndexRatings(idx.symbol);
  const bullish=ratings.filter(r=>r.outlook==="Bullish").length;
  const bearish=ratings.filter(r=>r.outlook==="Bearish").length;
  const neutral=ratings.filter(r=>r.outlook==="Neutral").length;
  const majority=bullish>bearish&&bullish>neutral?"Bullish":bearish>bullish&&bearish>neutral?"Bearish":"Neutral";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",
      border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontSize:14}}>{idx.region}</span>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"#e2e8f0"}}>{idx.symbol}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{idx.name}</div>
        </div>
        <Badge label={majority}/>
      </div>
      {!data?<Skeleton/>:(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
            <div>
              <span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              <span style={{marginLeft:6}}><PctBadge v={data.changeP}/></span>
            </div>
          </div>
          <div style={{display:"flex",gap:3,borderRadius:4,overflow:"hidden",height:6,marginTop:8}}>
            <div style={{flex:bullish,background:"#22c55e"}}/>
            <div style={{flex:neutral,background:"#facc15"}}/>
            <div style={{flex:bearish,background:"#ef4444"}}/>
          </div>
          <div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{ratings.length} analyst outlooks · {bullish}↑ {neutral}→ {bearish}↓</div>
        </>
      )}
    </div>
  );
}

// ─── FUTURES CARD ─────────────────────────────────────────────────────────────
function FuturesCard({fut,data,onClick,selected}) {
  const ratings=seedFuturesRatings(fut.symbol);
  const consensus=calcConsensus(ratings);
  const catColor=CATEGORY_COLOR[fut.category]||"#64748b";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",
      border:`1.5px solid ${selected?"#3b82f6":"#1f2937"}`,borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:13,color:"#e2e8f0"}}>{fut.symbol}</span>
            <span style={{fontSize:10,background:`${catColor}22`,color:catColor,border:`1px solid ${catColor}44`,
              borderRadius:3,padding:"2px 6px"}}>{fut.category}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{fut.name} · {fut.unit}</div>
        </div>
        <Badge label={consensus}/>
      </div>
      {!data?<Skeleton/>:(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginTop:10}}>
            <div>
              <span style={{fontSize:18,fontWeight:700,color:"#f1f5f9"}}>{data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</span>
              <span style={{marginLeft:6}}><PctBadge v={data.changeP}/></span>
            </div>
          </div>
          <BreakdownBar ratings={ratings}/>
          <div style={{fontSize:10,color:"#4b5563",marginTop:4}}>{ratings.length} analyst ratings</div>
        </>
      )}
    </div>
  );
}

// ─── OPTIONS CARD ─────────────────────────────────────────────────────────────
function OptionsCard({opt,onClick,selected}) {
  const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
  const ratings=seedOptionsRatings(key);
  const consensus=calcConsensus(ratings);
  const isCall=opt.type==="CALL";
  const daysToExp=Math.ceil((new Date(opt.expiry)-new Date())/(1000*60*60*24));
  const contractCost=(opt.premium*100).toFixed(0);
  const riskColor=RISK_COLORS[opt.risk]||"#64748b";
  const mColor=MONEYNESS_COLORS[opt.moneyness]||"#64748b";
  const breakeven=isCall?(opt.strike+opt.premium).toFixed(2):(opt.strike-opt.premium).toFixed(2);
  const tier=opt.premium*100<50?"🟢":opt.premium*100<200?"🔵":opt.premium*100<500?"🟡":"🔴";
  return (
    <div onClick={onClick} style={{background:selected?"#1a2235":"#111827",
      border:`1.5px solid ${selected?(isCall?"#3b82f6":"#9333ea"):"#1f2937"}`,
      borderRadius:10,padding:"14px 16px",cursor:"pointer",transition:"all 0.15s",position:"relative"}}>

      {/* Beginner tag */}
      {opt.beginner&&<div style={{position:"absolute",top:10,right:10,fontSize:9,background:"#064e3b",color:"#34d399",borderRadius:3,padding:"2px 6px",fontWeight:700}}>BEGINNER FRIENDLY</div>}

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",paddingRight:opt.beginner?90:0}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:800,fontSize:14,color:"#e2e8f0"}}>{opt.underlying}</span>
            <Badge label={opt.type}/>
            <span style={{fontSize:11,fontFamily:"monospace",color:"#94a3b8",background:"#1e293b",padding:"2px 6px",borderRadius:3}}>${opt.strike}</span>
            <span style={{fontSize:10,color:mColor,background:`${mColor}18`,border:`1px solid ${mColor}44`,borderRadius:3,padding:"2px 5px",fontWeight:700}}>{opt.moneyness}</span>
          </div>
          <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>{opt.name} · {opt.sector} · {daysToExp}d to exp</div>
        </div>
      </div>

      {/* Price highlight */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginTop:10,background:"#1e293b",borderRadius:8,padding:"8px 12px"}}>
        <div>
          <div style={{fontSize:10,color:"#64748b"}}>Premium / share</div>
          <div style={{fontSize:20,fontWeight:900,color:isCall?"#60a5fa":"#c084fc"}}>${opt.premium?.toFixed(2)}</div>
        </div>
        <div style={{textAlign:"center"}}>
          <div style={{fontSize:10,color:"#64748b"}}>1 Contract Cost</div>
          <div style={{fontSize:18,fontWeight:800,color:"#f1f5f9"}}>{tier} ${contractCost}</div>
          <div style={{fontSize:9,color:"#64748b"}}>= 100 shares</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontSize:10,color:"#64748b"}}>Breakeven</div>
          <div style={{fontSize:14,fontWeight:700,color:"#94a3b8"}}>${breakeven}</div>
        </div>
      </div>

      {/* Greeks row */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:5,marginTop:8}}>
        {[
          {l:"IV",v:`${opt.iv}%`},
          {l:"Delta",v:opt.delta?.toFixed(2)},
          {l:"OI",v:opt.oi>=1000?`${(opt.oi/1000).toFixed(0)}k`:opt.oi},
          {l:"Risk",v:RISK_LABELS[opt.risk],c:riskColor},
        ].map(m=>(
          <div key={m.l} style={{background:"#0f172a",borderRadius:5,padding:"5px 6px",textAlign:"center"}}>
            <div style={{fontSize:9,color:"#64748b"}}>{m.l}</div>
            <div style={{fontSize:11,fontWeight:700,color:m.c||"#e2e8f0"}}>{m.v}</div>
          </div>
        ))}
      </div>

      <BreakdownBar ratings={ratings}/>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
        <div style={{fontSize:10,color:"#4b5563"}}>{ratings.length} desk ratings</div>
        <Badge label={consensus}/>
      </div>
    </div>
  );
}

// ─── DETAIL PANELS ────────────────────────────────────────────────────────────
function StockDetail({stock,onClose}) {
  const ratings=stock.ratings||[]; const consensus=stock.consensus||"Hold";
  const upside=stock.avgTarget&&stock.price?(((stock.avgTarget-stock.price)/stock.price)*100).toFixed(1):null;
  const counts={}; CONSENSUS_ORDER.forEach(r=>counts[r]=0); ratings.forEach(r=>counts[r.rating]++);
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{stock.ticker}</span>
            <Badge label={consensus} size="lg"/>
            {stock.source&&<SourcePill source={stock.source}/>}
          </div>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{stock.name} · {stock.sector}</div>
        </div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {l:"Price",v:stock.price?`$${stock.price.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`:"—",s:stock.changeP!==undefined?`${stock.changeP>=0?"▲":"▼"} ${Math.abs(stock.changeP).toFixed(2)}%`:null,sc:stock.changeP>=0?"#22c55e":"#ef4444"},
          {l:"Avg Target",v:stock.avgTarget?`$${stock.avgTarget.toFixed(2)}`:"—",s:upside?`${parseFloat(upside)>=0?"+":""}${upside}% upside`:null,sc:parseFloat(upside||0)>=0?"#22c55e":"#ef4444"},
          {l:"Day Range",v:stock.low&&stock.high?`$${stock.low.toFixed(2)}–$${stock.high.toFixed(2)}`:"—",s:null},
          {l:"Analysts",v:ratings.length||"—",s:"ratings",sc:"#64748b"},
        ].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>
            {m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}
          </div>
        ))}
      </div>
      {ratings.length>0&&<>
        <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
          <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Distribution</div>
          {CONSENSUS_ORDER.map(r=>{
            const pct=ratings.length?Math.round((counts[r]/ratings.length)*100):0;
            return <div key={r} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
              <span style={{width:82,fontSize:11,color:"#94a3b8",flexShrink:0}}>{r}</span>
              <div style={{flex:1,background:"#0f172a",borderRadius:3,height:7,overflow:"hidden"}}>
                <div style={{width:`${pct}%`,height:"100%",background:BAR[r],transition:"width 0.5s"}}/>
              </div>
              <span style={{width:22,fontSize:11,color:"#64748b",textAlign:"right"}}>{counts[r]}</span>
            </div>;
          })}
        </div>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Ratings</div>
        <div style={{display:"flex",flexDirection:"column",gap:5}}>
          {[...ratings].sort((a,b)=>CONSENSUS_ORDER.indexOf(a.rating)-CONSENSUS_ORDER.indexOf(b.rating)).map((r,i)=>{
            const tgt=r.target??(stock.price?(stock.price*(r.targetMult||1)):null);
            const up=tgt&&stock.price?(((tgt-stock.price)/stock.price)*100).toFixed(1):null;
            const age=r.daysAgo; const ageL=!age?"Recent":age===1?"Today":age<7?`${age}d`:age<30?`${Math.floor(age/7)}w`:`${Math.floor(age/30)}mo`;
            return <div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{r.firm}</div>
                <div style={{fontSize:10,color:"#64748b"}}>{ageL} ago</div>
              </div>
              {tgt&&<div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:11,color:parseFloat(up||0)>=0?"#22c55e":"#ef4444",fontWeight:600}}>
                  ${tgt.toFixed(2)}{up&&<span style={{fontSize:10}}> ({up>0?"+":""}{up}%)</span>}
                </div>
              </div>}
              <Badge label={r.rating}/>
            </div>;
          })}
        </div>
      </>}
    </div>
  );
}

function IndexDetail({idx,data,onClose}) {
  const ratings=seedIndexRatings(idx.symbol);
  const bullish=ratings.filter(r=>r.outlook==="Bullish").length;
  const bearish=ratings.filter(r=>r.outlook==="Bearish").length;
  const neutral=ratings.filter(r=>r.outlook==="Neutral").length;
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:18}}>{idx.region}</span>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{idx.symbol}</span>
          </div>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{idx.name}</div>
        </div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      {data&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {l:"Level",v:data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2}),s:`${data.changeP>=0?"▲":"▼"} ${Math.abs(data.changeP).toFixed(2)}%`,sc:data.changeP>=0?"#22c55e":"#ef4444"},
          {l:"Change",v:`${data.change>=0?"+":""}${data.change?.toFixed(2)}`,s:"today",sc:"#64748b"},
          {l:"High",v:data.high?.toFixed(2)||"—",s:null},{l:"Low",v:data.low?.toFixed(2)||"—",s:null},
        ].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div>
            <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>
            {m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}
          </div>
        ))}
      </div>}
      <div style={{background:"#1e293b",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Outlook</div>
        {[["Bullish","#22c55e",bullish],["Neutral","#facc15",neutral],["Bearish","#ef4444",bearish]].map(([l,c,n])=>(
          <div key={l} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
            <span style={{width:60,fontSize:11,color:"#94a3b8"}}>{l}</span>
            <div style={{flex:1,background:"#0f172a",borderRadius:3,height:7,overflow:"hidden"}}>
              <div style={{width:`${ratings.length?(n/ratings.length)*100:0}%`,height:"100%",background:c,transition:"width 0.5s"}}/>
            </div>
            <span style={{width:22,fontSize:11,color:"#64748b",textAlign:"right"}}>{n}</span>
          </div>
        ))}
      </div>
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Views</div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {ratings.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div>
            </div>
            <div style={{fontSize:11,color:parseFloat(r.target)>=0?"#22c55e":"#ef4444",fontWeight:600}}>
              {parseFloat(r.target)>=0?"+":""}{r.target}% target
            </div>
            <Badge label={r.outlook}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function FuturesDetail({fut,data,onClose}) {
  const ratings=seedFuturesRatings(fut.symbol);
  const consensus=calcConsensus(ratings);
  const catColor=CATEGORY_COLOR[fut.category]||"#64748b";
  return (
    <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{fut.symbol}</span>
            <Badge label={consensus} size="lg"/>
          </div>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{fut.name} · <span style={{color:catColor}}>{fut.category}</span></div>
        </div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>
      {data&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
        {[
          {l:"Price",v:`${data.price?.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})} ${fut.unit}`,s:`${data.changeP>=0?"▲":"▼"} ${Math.abs(data.changeP).toFixed(2)}%`,sc:data.changeP>=0?"#22c55e":"#ef4444"},
          {l:"Change",v:`${data.change>=0?"+":""}${data.change?.toFixed(2)}`,s:"session",sc:"#64748b"},
          {l:"High",v:data.high?.toFixed(2)||"—"},{l:"Low",v:data.low?.toFixed(2)||"—"},
        ].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:8,padding:"11px 13px"}}>
            <div style={{fontSize:10,color:"#64748b",marginBottom:3}}>{m.l}</div>
            <div style={{fontSize:15,fontWeight:800,color:"#f1f5f9"}}>{m.v}</div>
            {m.s&&<div style={{fontSize:11,color:m.sc||"#64748b",marginTop:2}}>{m.s}</div>}
          </div>
        ))}
      </div>}
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Analyst Ratings</div>
      <div style={{display:"flex",flexDirection:"column",gap:5}}>
        {ratings.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div>
            </div>
            <div style={{fontSize:11,color:parseFloat(r.target12m)>=0?"#22c55e":"#ef4444",fontWeight:600}}>
              {parseFloat(r.target12m)>=0?"+":""}{(parseFloat(r.target12m)*100).toFixed(0)}% 12m
            </div>
            <Badge label={r.rating}/>
          </div>
        ))}
      </div>
    </div>
  );
}

function OptionsDetail({opt,onClose}) {
  const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
  const ratings=seedOptionsRatings(key);
  const consensus=calcConsensus(ratings);
  const isCall=opt.type==="CALL";
  const daysToExp=Math.ceil((new Date(opt.expiry)-new Date())/(1000*60*60*24));
  const contractCost=(opt.premium*100).toFixed(2);
  const breakeven=isCall?(opt.strike+opt.premium).toFixed(2):(opt.strike-opt.premium).toFixed(2);
  const pctToBreakeven=opt.spotPrice?(Math.abs((parseFloat(breakeven)-opt.spotPrice)/opt.spotPrice)*100).toFixed(1):null;
  const riskColor=RISK_COLORS[opt.risk]||"#64748b";
  const mColor=MONEYNESS_COLORS[opt.moneyness]||"#64748b";
  const maxLoss=parseFloat(contractCost);
  const exampleGain200=(opt.premium*2*100-maxLoss).toFixed(2);
  const exampleGain300=(opt.premium*3*100-maxLoss).toFixed(2);

  return (
    <div style={{background:"#0f172a",border:`1.5px solid ${isCall?"#1e3a5f":"#2e1a5f"}`,borderRadius:12,padding:20,overflowY:"auto",height:"100%",boxSizing:"border-box"}}>

      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
        <div>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
            <span style={{fontFamily:"monospace",fontWeight:900,fontSize:20,color:"#f8fafc"}}>{opt.underlying}</span>
            <Badge label={opt.type} size="lg"/>
            <Badge label={consensus} size="lg"/>
            {opt.beginner&&<span style={{fontSize:10,background:"#064e3b",color:"#34d399",borderRadius:4,padding:"3px 8px",fontWeight:700}}>BEGINNER FRIENDLY</span>}
          </div>
          <div style={{color:"#94a3b8",fontSize:12,marginTop:3}}>{opt.name} · {opt.sector} · Strike ${opt.strike} · {daysToExp} days left</div>
        </div>
        <button onClick={onClose} style={{background:"#1e293b",border:"none",color:"#94a3b8",cursor:"pointer",borderRadius:6,padding:"6px 12px",fontSize:12}}>✕</button>
      </div>

      {/* Cost summary — most important for beginners */}
      <div style={{background:"linear-gradient(135deg,#0f2744,#1a1040)",border:`1px solid ${isCall?"#1e40af":"#581c87"}`,borderRadius:10,padding:14,marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:10,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>💰 What You Pay</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          <div>
            <div style={{fontSize:10,color:"#64748b"}}>Premium per share</div>
            <div style={{fontSize:22,fontWeight:900,color:isCall?"#60a5fa":"#c084fc"}}>${opt.premium?.toFixed(2)}</div>
          </div>
          <div>
            <div style={{fontSize:10,color:"#64748b"}}>1 Contract (100 shares)</div>
            <div style={{fontSize:22,fontWeight:900,color:"#f1f5f9"}}>${contractCost}</div>
            <div style={{fontSize:10,color:"#475569"}}>this is your max loss</div>
          </div>
        </div>
      </div>

      {/* Breakeven */}
      <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>🎯 Breakeven Analysis</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          <div style={{background:"#0f172a",borderRadius:7,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#64748b"}}>Current Price</div>
            <div style={{fontSize:16,fontWeight:800,color:"#f1f5f9"}}>${opt.spotPrice?.toFixed(2)}</div>
          </div>
          <div style={{background:"#0f172a",borderRadius:7,padding:"10px 12px"}}>
            <div style={{fontSize:10,color:"#64748b"}}>Breakeven at Expiry</div>
            <div style={{fontSize:16,fontWeight:800,color:"#f59e0b"}}>${breakeven}</div>
            <div style={{fontSize:10,color:"#64748b"}}>{pctToBreakeven}% {isCall?"above":"below"} current</div>
          </div>
        </div>
        <div style={{marginTop:8,fontSize:11,color:"#64748b",lineHeight:1.6,padding:"8px 10px",background:"#0f172a",borderRadius:7}}>
          {isCall
            ? `📈 Stock must rise above $${breakeven} by ${opt.expiry} for this call to profit. Currently ${pctToBreakeven}% away.`
            : `📉 Stock must fall below $${breakeven} by ${opt.expiry} for this put to profit. Currently ${pctToBreakeven}% away.`
          }
        </div>
      </div>

      {/* Profit scenarios */}
      <div style={{background:"#1e293b",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>📊 Profit Scenarios (1 Contract)</div>
        {[
          {label:"Premium doubles (2×)",profit:exampleGain200,pct:100},
          {label:"Premium triples (3×)",profit:exampleGain300,pct:200},
          {label:"Expires worthless",profit:(-maxLoss).toFixed(2),pct:-100},
        ].map(s=>(
          <div key={s.label} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",background:"#0f172a",borderRadius:7,marginBottom:5}}>
            <span style={{fontSize:11,color:"#94a3b8"}}>{s.label}</span>
            <div style={{textAlign:"right"}}>
              <span style={{fontSize:13,fontWeight:700,color:parseFloat(s.profit)>=0?"#22c55e":"#ef4444"}}>
                {parseFloat(s.profit)>=0?"+":""} ${s.profit}
              </span>
              <span style={{fontSize:10,color:"#64748b",marginLeft:6}}>({s.pct>0?"+":""}{s.pct}%)</span>
            </div>
          </div>
        ))}
      </div>

      {/* Greeks */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:7,marginBottom:12}}>
        {[
          {l:"Impl. Volatility",v:`${opt.iv}%`,tip:"Higher IV = more expensive"},
          {l:"Delta",v:opt.delta?.toFixed(3),tip:"Price sensitivity"},
          {l:"Days to Exp.",v:daysToExp,tip:"Time remaining"},
          {l:"Open Interest",v:opt.oi?.toLocaleString(),tip:"Active contracts"},
          {l:"Volume Today",v:opt.vol?.toLocaleString(),tip:"Contracts traded"},
          {l:"Risk Level",v:RISK_LABELS[opt.risk],c:riskColor},
        ].map(m=>(
          <div key={m.l} style={{background:"#1e293b",borderRadius:7,padding:"9px 10px"}}>
            <div style={{fontSize:9,color:"#64748b",marginBottom:2}}>{m.l}</div>
            <div style={{fontSize:13,fontWeight:800,color:m.c||"#f1f5f9"}}>{m.v}</div>
            {m.tip&&<div style={{fontSize:9,color:"#374151",marginTop:2}}>{m.tip}</div>}
          </div>
        ))}
      </div>

      {/* Moneyness & sector */}
      <div style={{display:"flex",gap:8,marginBottom:12}}>
        <div style={{flex:1,background:"#1e293b",borderRadius:7,padding:"9px 12px"}}>
          <div style={{fontSize:10,color:"#64748b"}}>Moneyness</div>
          <div style={{fontSize:14,fontWeight:800,color:mColor}}>{opt.moneyness}</div>
          <div style={{fontSize:10,color:"#374151"}}>
            {opt.moneyness==="ITM"?"In the money — has intrinsic value":opt.moneyness==="ATM"?"At the money — near the strike":"Out of the money — needs to move"}
          </div>
        </div>
        <div style={{flex:1,background:"#1e293b",borderRadius:7,padding:"9px 12px"}}>
          <div style={{fontSize:10,color:"#64748b"}}>Sector</div>
          <div style={{fontSize:14,fontWeight:800,color:"#94a3b8"}}>{opt.sector}</div>
        </div>
      </div>

      {/* Analyst ratings */}
      <div style={{fontSize:11,color:"#94a3b8",marginBottom:8,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase"}}>Options Desk Ratings</div>
      <div style={{display:"flex",flexDirection:"column",gap:5,marginBottom:12}}>
        {ratings.map((r,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",background:"#1e293b",borderRadius:7,padding:"9px 12px",gap:8}}>
            <div style={{flex:1}}>
              <div style={{fontSize:12,fontWeight:600,color:"#e2e8f0"}}>{r.firm}</div>
              <div style={{fontSize:10,color:"#64748b"}}>{r.daysAgo}d ago</div>
            </div>
            <div style={{fontSize:11,color:"#22c55e",fontWeight:600}}>tgt: ${r.targetPremium}</div>
            <Badge label={r.rating}/>
          </div>
        ))}
      </div>

      {/* Education box */}
      <div style={{background:"#0c1a2e",border:"1px solid #1e3a5f",borderRadius:8,padding:12,fontSize:10,color:"#64748b",lineHeight:1.8}}>
        <div style={{color:"#3b82f6",fontWeight:700,marginBottom:4}}>📚 Options Basics</div>
        <div><strong style={{color:"#94a3b8"}}>Call:</strong> You profit if stock goes UP above breakeven</div>
        <div><strong style={{color:"#94a3b8"}}>Put:</strong> You profit if stock goes DOWN below breakeven</div>
        <div><strong style={{color:"#94a3b8"}}>Max Loss:</strong> Always limited to what you paid (${contractCost})</div>
        <div><strong style={{color:"#94a3b8"}}>Contract:</strong> Always represents 100 shares</div>
        <div style={{marginTop:6,color:"#374151"}}>⚠️ Options can expire worthless. Start with 1 contract to learn. Not financial advice.</div>
      </div>
    </div>
  );
}

// ─── SETTINGS MODAL ───────────────────────────────────────────────────────────
function SettingsModal({keys,onSave,onClose}) {
  const [vals,setVals]=useState({...keys});
  return (
    <div style={{position:"fixed",inset:0,background:"#00000099",zIndex:100,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#0f172a",border:"1.5px solid #1e3a5f",borderRadius:12,padding:24,width:"100%",maxWidth:400}}>
        <div style={{fontSize:16,fontWeight:800,color:"#f8fafc",marginBottom:4}}>API Keys</div>
        <div style={{fontSize:12,color:"#64748b",marginBottom:18}}>Keys are stored in session only and sent directly to each provider.</div>
        {[
          {key:"finnhub",label:"Finnhub",url:"https://finnhub.io"},
          {key:"alphavantage",label:"Alpha Vantage",url:"https://www.alphavantage.co/support/#api-key"},
          {key:"polygon",label:"Polygon.io",url:"https://polygon.io"},
        ].map(p=>(
          <div key={p.key} style={{marginBottom:14}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
              <label style={{fontSize:12,fontWeight:600,color:"#94a3b8"}}>{p.label}</label>
              <a href={p.url} target="_blank" rel="noreferrer" style={{fontSize:10,color:"#3b82f6"}}>Get free key ↗</a>
            </div>
            <input value={vals[p.key]||""} onChange={e=>setVals(v=>({...v,[p.key]:e.target.value}))}
              placeholder={`${p.label} API key…`}
              style={{width:"100%",boxSizing:"border-box",background:"#1e293b",border:"1px solid #334155",color:"#e2e8f0",borderRadius:7,padding:"8px 12px",fontSize:12,outline:"none",fontFamily:"monospace"}}/>
          </div>
        ))}
        <div style={{fontSize:11,color:"#475569",marginBottom:16,padding:"8px 12px",background:"#1e293b",borderRadius:6}}>
          💡 Yahoo Finance is always active — no key needed.
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <button onClick={onClose} style={{background:"#1e293b",border:"1px solid #334155",color:"#94a3b8",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13}}>Cancel</button>
          <button onClick={()=>onSave(vals)} style={{background:"#3b82f6",border:"none",color:"#fff",borderRadius:7,padding:"8px 18px",cursor:"pointer",fontSize:13,fontWeight:700}}>Save & Refresh</button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [tab,setTab]=useState("stocks");
  const [subTab,setSubTab]=useState("SP500");
  const [optFilter,setOptFilter]=useState("ALL");
  const [budgetFilter,setBudgetFilter]=useState("all");
  const [beginnerOnly,setBeginnerOnly]=useState(false);
  const [futFilter,setFutFilter]=useState("All");
  const [stockData,setStockData]=useState({});
  const [indexData,setIndexData]=useState({});
  const [futuresData,setFuturesData]=useState({});
  const [selected,setSelected]=useState(null);
  const [search,setSearch]=useState("");
  const [showSettings,setShowSettings]=useState(false);
  const [apiKeys,setApiKeys]=useState(()=>{try{return JSON.parse(sessionStorage.getItem("av_keys")||"{}");}catch{return{};}});
  const [time,setTime]=useState(new Date());
  const [lastRefresh,setLastRefresh]=useState(null);
  const loadingRef=useRef({});

  useEffect(()=>{
    if(apiKeys.finnhub) API_KEYS.finnhub=apiKeys.finnhub;
    if(apiKeys.alphavantage) API_KEYS.alphavantage=apiKeys.alphavantage;
    if(apiKeys.polygon) API_KEYS.polygon=apiKeys.polygon;
  },[apiKeys]);
  useEffect(()=>{const t=setInterval(()=>setTime(new Date()),15000);return()=>clearInterval(t);},[]);

  const loadStock=useCallback(async(stock)=>{
    const key=stock.ticker; if(loadingRef.current[key]) return; loadingRef.current[key]=true;
    setStockData(p=>({...p,[key]:{...stock,loading:true}}));
    const quote=await fetchQuote(stock.ticker);
    const price=quote?.price??SEED_PRICES[stock.ticker]??100;
    const [rec,target]=await Promise.all([fetchFinnhubRec(stock.ticker).catch(()=>null),fetchFinnhubTarget(stock.ticker).catch(()=>null)]);
    let ratings,consensus,avgTarget;
    if(rec&&((rec.strongBuy||0)+(rec.buy||0)+(rec.hold||0)+(rec.sell||0)+(rec.strongSell||0))>0){
      consensus=consensusFromFinnhub(rec);
      ratings=[
        ...Array(rec.strongBuy||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[i%ANALYST_FIRMS.length],rating:"Strong Buy",daysAgo:i*3+1,target})),
        ...Array(rec.buy||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+3)%ANALYST_FIRMS.length],rating:"Buy",daysAgo:i*4+2,target})),
        ...Array(rec.hold||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+6)%ANALYST_FIRMS.length],rating:"Hold",daysAgo:i*5+3,target})),
        ...Array(rec.sell||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+9)%ANALYST_FIRMS.length],rating:"Sell",daysAgo:i*6+4,target})),
        ...Array(rec.strongSell||0).fill(0).map((_,i)=>({firm:ANALYST_FIRMS[(i+12)%ANALYST_FIRMS.length],rating:"Strong Sell",daysAgo:i*7+5,target})),
      ];
      avgTarget=target??price;
    } else {
      ratings=seedRatings(stock.ticker,target);
      consensus=calcConsensus(ratings);
      avgTarget=target??(price*(0.90+Math.random()*0.28));
    }
    setStockData(p=>({...p,[key]:{...stock,loading:false,price,change:quote?.change??0,changeP:quote?.changeP??0,high:quote?.high,low:quote?.low,source:quote?.source??"Seed Data",ratings,consensus,avgTarget:+avgTarget.toFixed(2)}}));
    loadingRef.current[key]=false;
  },[]);

  const loadIndex=useCallback(async(idx)=>{
    const key=idx.symbol; if(loadingRef.current["i_"+key]) return; loadingRef.current["i_"+key]=true;
    const quote=await fetchYahoo(idx.ySymbol).catch(()=>null);
    setIndexData(p=>({...p,[key]:quote??SEED_INDEX[key]??{price:0,change:0,changeP:0}}));
    loadingRef.current["i_"+key]=false;
  },[]);

  const loadFuture=useCallback(async(fut)=>{
    const key=fut.symbol; if(loadingRef.current["f_"+key]) return; loadingRef.current["f_"+key]=true;
    const quote=await fetchYahoo(fut.symbol).catch(()=>null);
    setFuturesData(p=>({...p,[key]:quote??SEED_FUTURES[key]??{price:0,change:0,changeP:0}}));
    loadingRef.current["f_"+key]=false;
  },[]);

  useEffect(()=>{
    loadingRef.current={};
    STOCKS[subTab]?.forEach(s=>loadStock(s));
    INDICES.forEach(i=>loadIndex(i));
    FUTURES.forEach(f=>loadFuture(f));
    setLastRefresh(new Date());
  },[subTab,loadStock,loadIndex,loadFuture]);

  const handleSaveKeys=(vals)=>{
    sessionStorage.setItem("av_keys",JSON.stringify(vals));
    setApiKeys(vals); setShowSettings(false);
    loadingRef.current={};
    STOCKS[subTab]?.forEach(s=>loadStock(s));
    INDICES.forEach(i=>loadIndex(i));
    FUTURES.forEach(f=>loadFuture(f));
  };

  const mktOpen=time.getHours()>=9&&time.getHours()<16;
  const keysConfigured=[apiKeys.finnhub,apiKeys.alphavantage,apiKeys.polygon].filter(k=>k&&k.length>10).length;

  // Filter data for current tab
  const currentStocks=STOCKS[subTab]?.map(s=>stockData[s.ticker]||{...s,loading:true})||[];
  const filteredStocks=currentStocks.filter(s=>{
    const q=search.toLowerCase();
    return !q||s.ticker.toLowerCase().includes(q)||s.name.toLowerCase().includes(q)||s.sector.toLowerCase().includes(q);
  });
  const activeTier=BUDGET_TIERS.find(t=>t.id===budgetFilter)||BUDGET_TIERS[0];
  const filteredOptions=OPTIONS_UNIVERSE.filter(o=>{
    const q=search.toLowerCase();
    const matchSearch=!q||o.underlying.toLowerCase().includes(q)||o.name.toLowerCase().includes(q)||o.sector?.toLowerCase().includes(q);
    const matchType=optFilter==="ALL"||o.type===optFilter;
    const contractCost=o.premium*100;
    const matchBudget=budgetFilter==="all"||(activeTier.specOnly?o.risk>=4:(contractCost<activeTier.max&&o.risk<4));
    const matchBeginner=!beginnerOnly||o.beginner;
    return matchSearch&&matchType&&matchBudget&&matchBeginner;
  }).sort((a,b)=>a.premium*100-b.premium*100);
  const futCategories=["All",...new Set(FUTURES.map(f=>f.category))];
  const filteredFutures=FUTURES.filter(f=>{
    const q=search.toLowerCase();
    const matchSearch=!q||f.name.toLowerCase().includes(q)||f.symbol.toLowerCase().includes(q);
    const matchCat=futFilter==="All"||f.category===futFilter;
    return matchSearch&&matchCat;
  });
  const filteredIndices=INDICES.filter(i=>{
    const q=search.toLowerCase();
    return !q||i.symbol.toLowerCase().includes(q)||i.name.toLowerCase().includes(q);
  });

  const TABS=[
    {id:"stocks",label:"📈 Stocks"},
    {id:"options",label:"⚡ Options"},
    {id:"indices",label:"🌐 Indices"},
    {id:"futures",label:"🛢 Futures"},
  ];

  return (
    <div style={{minHeight:"100vh",background:"#060e1a",color:"#e2e8f0",fontFamily:"'Inter',-apple-system,sans-serif",display:"flex",flexDirection:"column",overflow:"hidden"}}>

      {/* Header */}
      <div style={{background:"#080f1c",borderBottom:"1px solid #1e293b",padding:"0 16px",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",height:50}}>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{width:26,height:26,background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#fff"}}>A</div>
            <span style={{fontWeight:800,fontSize:15,color:"#f8fafc"}}>AnalystView</span>
            <span style={{fontSize:10,color:"#475569",background:"#1e293b",padding:"2px 7px",borderRadius:10}}>PRO</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <div style={{display:"flex",alignItems:"center",gap:4}}>
              <div style={{width:6,height:6,borderRadius:"50%",background:mktOpen?"#22c55e":"#ef4444",boxShadow:mktOpen?"0 0 5px #22c55e":"none"}}/>
              <span style={{fontSize:11,color:"#64748b"}}>{mktOpen?"Open":"Closed"}</span>
            </div>
            <button onClick={()=>setShowSettings(true)} style={{background:"#1e293b",border:`1px solid ${keysConfigured>0?"#22c55e44":"#ca8a0444"}`,
              color:keysConfigured>0?"#22c55e":"#f59e0b",borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:11,fontWeight:600}}>
              🔑 {keysConfigured}/3
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs */}
      <div style={{background:"#080f1c",borderBottom:"1px solid #1e293b",padding:"0 16px",display:"flex",alignItems:"center",flexShrink:0,overflowX:"auto"}}>
        {TABS.map(t=>(
          <button key={t.id} onClick={()=>{setTab(t.id);setSelected(null);setSearch("");}} style={{
            background:"none",border:"none",cursor:"pointer",padding:"11px 14px",fontSize:12,fontWeight:700,whiteSpace:"nowrap",
            color:tab===t.id?"#3b82f6":"#64748b",
            borderBottom:tab===t.id?"2px solid #3b82f6":"2px solid transparent"}}>
            {t.label}
          </button>
        ))}
        <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
          {lastRefresh&&<span style={{fontSize:10,color:"#374151"}}>{lastRefresh.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>}
          <button onClick={()=>{loadingRef.current={};STOCKS[subTab]?.forEach(s=>loadStock(s));INDICES.forEach(i=>loadIndex(i));FUTURES.forEach(f=>loadFuture(f));setLastRefresh(new Date());}}
            style={{background:"#1e293b",border:"1px solid #1f2937",color:"#64748b",borderRadius:5,padding:"4px 10px",cursor:"pointer",fontSize:11}}>↻</button>
        </div>
      </div>

      {/* Sub-tabs */}
      {tab==="stocks"&&(
        <div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",gap:0,flexShrink:0}}>
          {[["SP500","🇺🇸 S&P 500"],["TSX","🇨🇦 TSX"]].map(([id,label])=>(
            <button key={id} onClick={()=>{setSubTab(id);setSelected(null);}} style={{
              background:"none",border:"none",cursor:"pointer",padding:"9px 14px",fontSize:11,fontWeight:700,
              color:subTab===id?"#60a5fa":"#64748b",
              borderBottom:subTab===id?"2px solid #60a5fa":"2px solid transparent"}}>
              {label}
            </button>
          ))}
        </div>
      )}
      {tab==="options"&&(
        <>
          {/* Call/Put toggle */}
          <div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",alignItems:"center",flexShrink:0,gap:0}}>
            {[["ALL","All"],["CALL","📗 Calls"],["PUT","📕 Puts"]].map(([id,label])=>(
              <button key={id} onClick={()=>{setOptFilter(id);setSelected(null);}} style={{
                background:"none",border:"none",cursor:"pointer",padding:"9px 14px",fontSize:11,fontWeight:700,
                color:optFilter===id?(id==="CALL"?"#60a5fa":id==="PUT"?"#c084fc":"#60a5fa"):"#64748b",
                borderBottom:optFilter===id?`2px solid ${id==="CALL"?"#3b82f6":id==="PUT"?"#9333ea":"#60a5fa"}`:"2px solid transparent"}}>
                {label}
              </button>
            ))}
            <div style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:6}}>
              <button onClick={()=>setBeginnerOnly(b=>!b)} style={{
                background:beginnerOnly?"#064e3b":"#1e293b",
                border:`1px solid ${beginnerOnly?"#34d399":"#334155"}`,
                color:beginnerOnly?"#34d399":"#64748b",
                borderRadius:6,padding:"4px 10px",cursor:"pointer",fontSize:10,fontWeight:700}}>
                🌱 Beginner Only
              </button>
            </div>
          </div>
          {/* Budget tiers */}
          <div style={{background:"#060e1a",borderBottom:"1px solid #111827",padding:"8px 16px",display:"flex",gap:6,flexShrink:0,overflowX:"auto",alignItems:"center"}}>
            <span style={{fontSize:10,color:"#475569",flexShrink:0}}>Budget:</span>
            {BUDGET_TIERS.map(tier=>(
              <button key={tier.id} onClick={()=>setBudgetFilter(tier.id)} style={{
                background:budgetFilter===tier.id?`${tier.color}22`:"#111827",
                border:`1px solid ${budgetFilter===tier.id?tier.color:"#1f2937"}`,
                color:budgetFilter===tier.id?tier.color:"#64748b",
                borderRadius:20,padding:"4px 12px",cursor:"pointer",fontSize:11,fontWeight:700,flexShrink:0,whiteSpace:"nowrap"}}>
                {tier.label}
              </button>
            ))}
            <span style={{fontSize:10,color:"#374151",marginLeft:"auto",flexShrink:0}}>
              {filteredOptions.length} contracts · sorted cheapest first
            </span>
          </div>
        </>
      )}
      {tab==="futures"&&(
        <div style={{background:"#080f1c",borderBottom:"1px solid #111827",padding:"0 16px",display:"flex",gap:0,flexShrink:0,overflowX:"auto"}}>
          {futCategories.map(cat=>(
            <button key={cat} onClick={()=>{setFutFilter(cat);setSelected(null);}} style={{
              background:"none",border:"none",cursor:"pointer",padding:"9px 12px",fontSize:11,fontWeight:700,whiteSpace:"nowrap",
              color:futFilter===cat?(CATEGORY_COLOR[cat]||"#60a5fa"):"#64748b",
              borderBottom:futFilter===cat?`2px solid ${CATEGORY_COLOR[cat]||"#3b82f6"}`:"2px solid transparent"}}>
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Search bar */}
      <div style={{padding:"10px 16px",background:"#080f1c",borderBottom:"1px solid #111827",flexShrink:0}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`Search ${tab}…`}
          style={{width:"100%",boxSizing:"border-box",background:"#111827",border:"1px solid #1e293b",color:"#e2e8f0",borderRadius:7,padding:"8px 12px",fontSize:13,outline:"none"}}/>
      </div>

      {/* Main Content */}
      <div style={{flex:1,display:"grid",gridTemplateColumns:selected?"1fr 360px":"1fr",overflow:"hidden"}}>
        <div style={{overflowY:"auto",padding:14}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(240px,1fr))",gap:10}}>

            {tab==="stocks"&&filteredStocks.map(stock=>(
              <StockCard key={stock.ticker} stock={stock}
                onClick={()=>setSelected(selected?.ticker===stock.ticker?null:{type:"stock",...stock})}
                selected={selected?.ticker===stock.ticker}/>
            ))}

            {tab==="options"&&filteredOptions.map((opt,i)=>{
              const key=`${opt.underlying}-${opt.strike}-${opt.type}-${opt.expiry}`;
              return <OptionsCard key={key} opt={opt}
                onClick={()=>setSelected(selected?._key===key?null:{type:"option",_key:key,...opt})}
                selected={selected?._key===key}/>;
            })}

            {tab==="indices"&&filteredIndices.map(idx=>(
              <IndexCard key={idx.symbol} idx={idx} data={indexData[idx.symbol]}
                onClick={()=>setSelected(selected?.symbol===idx.symbol?null:{type:"index",...idx})}
                selected={selected?.symbol===idx.symbol}/>
            ))}

            {tab==="futures"&&filteredFutures.map(fut=>(
              <FuturesCard key={fut.symbol} fut={fut} data={futuresData[fut.symbol]}
                onClick={()=>setSelected(selected?.symbol===fut.symbol?null:{type:"future",...fut})}
                selected={selected?.symbol===fut.symbol}/>
            ))}

          </div>
          {((tab==="stocks"&&filteredStocks.length===0)||(tab==="options"&&filteredOptions.length===0)||
            (tab==="indices"&&filteredIndices.length===0)||(tab==="futures"&&filteredFutures.length===0))&&(
            <div style={{textAlign:"center",color:"#475569",padding:60,fontSize:14}}>No results match your search.</div>
          )}
        </div>

        {/* Detail Panel */}
        {selected&&(
          <div style={{borderLeft:"1px solid #1e293b",overflowY:"auto",padding:12}}>
            {selected.type==="stock"&&<StockDetail stock={stockData[selected.ticker]||selected} onClose={()=>setSelected(null)}/>}
            {selected.type==="option"&&<OptionsDetail opt={selected} onClose={()=>setSelected(null)}/>}
            {selected.type==="index"&&<IndexDetail idx={selected} data={indexData[selected.symbol]} onClose={()=>setSelected(null)}/>}
            {selected.type==="future"&&<FuturesDetail fut={selected} data={futuresData[selected.symbol]} onClose={()=>setSelected(null)}/>}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{borderTop:"1px solid #1e293b",padding:"7px 16px",display:"flex",justifyContent:"space-between",background:"#080f1c",flexShrink:0}}>
        <span style={{fontSize:10,color:"#374151"}}>AnalystView · Not financial advice</span>
        <span style={{fontSize:10,color:"#374151",fontFamily:"monospace"}}>{time.toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
      </div>

      {showSettings&&<SettingsModal keys={apiKeys} onSave={handleSaveKeys} onClose={()=>setShowSettings(false)}/>}
    </div>
  );
}
