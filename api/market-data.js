// Vercel serverless function — multi-source live market data.
// QUOTES:  Yahoo (2 hosts, raced concurrently) + Stooq (all US/TSX tickers +
//          curated indices/futures) run IN PARALLEL — whichever answers first wins.
// OPTIONS: Yahoo Finance (2 hosts, raced concurrently).
// NEWS:    Yahoo Finance search + CNBC + BNN Bloomberg, merged and deduped.
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
  // Race both hosts concurrently (instead of one-after-another) — since Yahoo
  // often just hangs rather than rejecting fast from datacenter IPs, running
  // them in parallel with a single shared timeout roughly halves worst-case wait.
  const attempt = async (host) => {
    const r = await fetch(`https://${host}${path}`, {
      headers: { "User-Agent": UA, Accept: "application/json" },
      signal: AbortSignal.timeout(5000),
    });
    const d = await r.json().catch(() => null);
    if (r.ok && d) return d;
    throw new Error(`${host} empty/failed`);
  };
  try {
    return await Promise.any(["query1.finance.yahoo.com", "query2.finance.yahoo.com"].map(attempt));
  } catch (_) {
    return null;
  }
}

// ── News: CNBC + BNN Bloomberg, alongside Yahoo ────────────────────────────
// CNBC: their own public RSS feeds (meant for syndication).
// BNN Bloomberg: no public RSS was found, so we use Google News' site-filtered
// search feed instead — a standard, publicly documented mechanism for pulling
// a site's real, live headlines for a specific query without scraping.
// Both return only { title, link, pubDate, source } — never article bodies.

function parseRssItems(xml, sourceName, limit = 10) {
  if (!xml) return [];
  const clean = s => (s || "")
    .replace(/<!\[CDATA\[/g, "").replace(/\]\]>/g, "")
    .replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, "").trim();
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < limit) {
    const block = m[1];
    const title = clean((block.match(/<title>([\s\S]*?)<\/title>/) || [])[1]);
    let link = clean((block.match(/<link>([\s\S]*?)<\/link>/) || [])[1]);
    const pubDate = (block.match(/<pubDate>([\s\S]*?)<\/pubDate>/) || [])[1];
    // Google News wraps the real source URL in a redirect; keep as-is, it still opens correctly
    if (title) {
      items.push({
        title, link,
        pubDate: pubDate ? new Date(pubDate).toISOString() : null,
        source: sourceName,
      });
    }
  }
  return items;
}

async function fetchCnbcNews(query) {
  try {
    const q = encodeURIComponent(`site:cnbc.com ${query}`);
    const r = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-US&gl=US&ceid=US:en`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRssItems(xml, "CNBC", 8);
  } catch (_) { return []; }
}

async function fetchBnnBloombergNews(query) {
  try {
    const q = encodeURIComponent(`site:bnnbloomberg.ca ${query}`);
    const r = await fetch(`https://news.google.com/rss/search?q=${q}&hl=en-CA&gl=CA&ceid=CA:en`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(7000) });
    if (!r.ok) return [];
    const xml = await r.text();
    return parseRssItems(xml, "BNN Bloomberg", 8);
  } catch (_) { return []; }
}

// Stooq daily-history CSV -> Yahoo chart-shaped response
function resolveStooqSymbol(symbol) {
  if (STOOQ_MAP[symbol]) return STOOQ_MAP[symbol];
  // TSX tickers (e.g. "RY.TO") -> Stooq's Canadian convention "ry.ca"
  if (/\.TO$/i.test(symbol)) return symbol.replace(/\.TO$/i, "").toLowerCase() + ".ca";
  // Plain US tickers (AAPL, MSFT, TSLA...) -> Stooq's US convention "aapl.us"
  if (/^[A-Z]{1,5}$/i.test(symbol)) return symbol.toLowerCase() + ".us";
  return null; // unmapped index/futures symbols with no clean Stooq equivalent
}

async function tryStooq(symbol) {
  const s = resolveStooqSymbol(symbol);
  if (!s) return null;
  try {
    const r = await fetch(`https://stooq.com/q/d/l/?s=${encodeURIComponent(s)}&i=d`, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(5000) });
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
    // Run Yahoo and Stooq concurrently — don't wait for Yahoo to fully fail
    // before trying Stooq, since Yahoo is frequently unreachable from Vercel.
    const [y, s] = await Promise.all([
      tryYahoo(`/v8/finance/chart/${sym}?interval=1d&range=2d`),
      tryStooq(symbol),
    ]);
    if (y?.chart?.result?.[0]?.meta) return res.status(200).json(y);
    if (s) return res.status(200).json(s);
    return res.status(502).json({ error: "quote_unavailable", message: `No source could provide a quote for ${symbol}` });
  }

  if (type === "options") {
    const y = await tryYahoo(`/v7/finance/options/${sym}${date ? `?date=${encodeURIComponent(date)}` : ""}`);
    if (y?.optionChain?.result?.[0]?.options?.[0]?.calls?.length) return res.status(200).json(y);
    return res.status(502).json({ error: "options_unavailable", message: `Yahoo could not provide options for ${symbol}. The app will fall back to Alpha Vantage automatically.` });
  }

  if (type === "news") {
    const query = req.query.name || symbol; // company name searches better than raw ticker
    const [yahooRaw, cnbc, bnn] = await Promise.all([
      tryYahoo(`/v1/finance/search?q=${sym}&quotesCount=0&newsCount=10`),
      fetchCnbcNews(query),
      fetchBnnBloombergNews(query),
    ]);
    const yahooItems = (yahooRaw?.news || []).map(n => ({
      title: n.title, link: n.link,
      pubDate: n.providerPublishTime ? new Date(n.providerPublishTime * 1000).toISOString() : null,
      source: n.publisher || "Yahoo Finance",
    }));
    const merged = [...yahooItems, ...cnbc, ...bnn].filter(n => n.title);
    // De-dup near-identical headlines (same story picked up by our search across sources)
    const seen = new Set(); const deduped = [];
    for (const n of merged) {
      const k = n.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 50);
      if (!seen.has(k)) { seen.add(k); deduped.push(n); }
    }
    deduped.sort((a, b) => (b.pubDate || "").localeCompare(a.pubDate || ""));
    if (deduped.length) return res.status(200).json({ news: deduped.slice(0, 15) });
    return res.status(502).json({ error: "news_unavailable", message: "No news source responded" });
  }

  return res.status(400).json({ error: "bad_request", message: "type must be 'quote', 'options' or 'news'" });
}