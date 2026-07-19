// Vercel serverless function — proxies Yahoo Finance market data server-side.
// Browsers can't call Yahoo directly (CORS blocks it), but this server can.
// Provides: real quotes (stocks/indices/futures) and real options chains.
// No API key required. Responses are edge-cached for 60s.

export const config = { maxDuration: 30 };

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { type, symbol, date } = req.query || {};
  if (!type || !symbol) return res.status(400).json({ error: "bad_request", message: "Missing 'type' or 'symbol' query param" });
  const sym = encodeURIComponent(symbol);

  let path;
  if (type === "quote") {
    path = `/v8/finance/chart/${sym}?interval=1d&range=2d`;
  } else if (type === "options") {
    path = `/v7/finance/options/${sym}${date ? `?date=${encodeURIComponent(date)}` : ""}`;
  } else {
    return res.status(400).json({ error: "bad_request", message: "type must be 'quote' or 'options'" });
  }

  // Cache successful responses at Vercel's edge for 60s — keeps us light on Yahoo
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  const hosts = ["query1.finance.yahoo.com", "query2.finance.yahoo.com"];
  let lastErr = null;
  for (const host of hosts) {
    try {
      const r = await fetch(`https://${host}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d) return res.status(200).json(d);
      lastErr = `${host}: HTTP ${r.status}`;
    } catch (e) {
      lastErr = `${host}: ${e.message}`;
    }
  }
  console.error("Yahoo proxy failed:", lastErr);
  return res.status(502).json({ error: "yahoo_unavailable", message: lastErr });
}