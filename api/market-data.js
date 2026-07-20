// Vercel serverless function — multi-source live market data.
// Sources, tried in order:
//   QUOTES:  Yahoo Finance (2 hosts) -> Stooq (free CSV, datacenter-friendly, no key)
//   OPTIONS: Yahoo Finance (2 hosts)
//   NEWS:    Yahoo Finance search
// (The app itself also falls back to Alpha Vantage for real options chains client-side.)

export const config = { maxDuration: 30 };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

// Yahoo symbol -> Stooq symbol (only well-known mappings; others skip the Stooq step)
const STOOQ_MAP = {
  "^GSPC":"^spx", "^DJI":"^dji", "^IXIC":"^ndq", "^GDAXI":"^dax", "^FCHI":"^cac",
  "^N225":"^nkx", "^HSI":"^hsi", "^FTSE":"^ukx",
  "GC=F":"gc.f", "SI=F":"si.f", "HG=F":"hg.f", "PL=F":"pl.f", "PA=F":"pa.f",
  "CL=F":"cl.f", "BZ=F":"cb.f", "NG=F":"ng.f", "RB=F":"rb.f", "HO=F":"ho.f",
  "ZC=F":"zc.f", "ZW=F":"zw.f", "ZS=F":"zs.f", "KC=F":"kc.f", "SB=F":"sb.f", "CC=F":"cc.f",
};

async function tryYahoo(path) {
  for (const host of ["query1.finance.yahoo.com", "query2.finance.yahoo.com"]) {
    try {
      const r = await fetch(`https://${host}${path}`, { headers: { "User-Agent": UA, Accept: "application/json" } });
      const d = await r.json().catch(() => null);
      if (r.ok && d) return d;
    } catch (_) {}
  }
  return null;
}

// Stooq daily-history CSV -> Yahoo chart-shaped response
async function tryStooq(symbol) {
  const s = STOOQ_MAP[symbol];
  if (!s) return null;
  try {
    const r = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`, { headers: { "User-Agent": UA } });
    if (!r.ok) return null;
    const csv = await r.text();
    const rows = csv.trim().split("\n").filter(l => l && !l.startsWith("Date"));
    if (rows.length < 2) return null;
    const last = rows[rows.length - 1].split(",");
    const prev = rows[rows.length - 2].split(",");
    const price = parseFloat(last[4]), prevClose = parseFloat(prev[4]);
    if (!isFinite(price) || !isFinite(prevClose)) return null;
    return {
      chart: { result: [{ meta: {
        regularMarketPrice: price, previousClose: prevClose,
        regularMarketDayHigh: parseFloat(last[2]) || undefined,
        regularMarketDayLow:  parseFloat(last[3]) || undefined,
        regularMarketOpen:    parseFloat(last[1]) || undefined,
        regularMarketVolume:  parseFloat(last[5]) || undefined,
        dataSource: "Stooq",
      } }] },
    };
  } catch (_) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, symbol, date } = req.query || {};
  if (!type || !symbol) return res.status(400).json({ error: "bad_request", message: "Missing 'type' or 'symbol'" });
  const sym = encodeURIComponent(symbol);
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  if (type === "quote") {
    const y = await tryYahoo(`/v8/finance/chart/${sym}?interval=1d&range=2d`);
    if (y?.chart?.result?.[0]?.meta) return res.status(200).json(y);
    const s = await tryStooq(symbol);
    if (s) return res.status(200).json(s);
    return res.status(502).json({ error: "quote_unavailable", message: `No source could provide a quote for ${symbol}` });
  }

  if (type === "options") {
    const y = await tryYahoo(`/v7/finance/options/${sym}${date ? `?date=${encodeURIComponent(date)}` : ""}`);
    if (y?.optionChain?.result?.[0]?.options?.[0]?.calls?.length) return res.status(200).json(y);
    return res.status(502).json({ error: "options_unavailable", message: `Yahoo could not provide options for ${symbol}. The app will fall back to Alpha Vantage automatically.` });
  }

  if (type === "news") {
    const y = await tryYahoo(`/v1/finance/search?q=${sym}&quotesCount=0&newsCount=10`);
    if (y?.news) return res.status(200).json(y);
    return res.status(502).json({ error: "news_unavailable", message: "News source unreachable" });
  }

  return res.status(400).json({ error: "bad_request", message: "type must be 'quote', 'options' or 'news'" });
}