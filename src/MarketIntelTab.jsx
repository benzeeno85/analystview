import { useState, useEffect } from "react";

/**
 * MarketIntelTab — institutional positioning from the CFTC Commitment of Traders.
 *
 * Reads signals_latest.json produced by market_intel.py.
 * Put the JSON in public/ and this fetches it from /signals_latest.json
 *
 * Renders as a panel: the parent supplies background and padding.
 */

const CROWDED = 2.0, STRETCHED = 1.5;

const regimeOf = z =>
  z == null ? "NO DATA" :
  z >= CROWDED ? "CROWDED LONG" :
  z >= STRETCHED ? "STRETCHED LONG" :
  z <= -CROWDED ? "CROWDED SHORT" :
  z <= -STRETCHED ? "STRETCHED SHORT" : "NEUTRAL";

const regimeColor = r =>
  r.includes("CROWDED") ? "#ef4444" :
  r.includes("STRETCHED") ? "#f59e0b" :
  r === "NO DATA" ? "#475569" : "#22c55e";

const noteOf = z => {
  if (z == null) return null;
  if (z >= CROWDED) return "Funds near max long. The marginal buyer is already in — positioning offers little support on a move lower.";
  if (z <= -CROWDED) return "Funds near max short. Any bullish catalyst has a crowded exit to squeeze.";
  if (Math.abs(z) >= STRETCHED) return "Positioning leaning one way. Not an extreme yet, but size accordingly.";
  return "Positioning unremarkable. No constraint from this input.";
};

/* Funds above the axis, commercial hedgers below — they sit on opposite sides
   of every futures contract, and the gap between them is the actual signal. */
function PositioningAxis({ mmZ, commZ, accent }) {
  const W = 320, H = 92, pad = 16, span = 3, mid = H / 2;
  const x = z => pad + ((Math.max(-span, Math.min(span, z)) + span) / (span * 2)) * (W - pad * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block" }}>
      <rect x={pad} y={mid - 13} width={x(-2) - pad} height={26} fill="#ef4444" opacity="0.10" />
      <rect x={x(2)} y={mid - 13} width={W - pad - x(2)} height={26} fill="#ef4444" opacity="0.10" />
      <line x1={pad} y1={mid} x2={W - pad} y2={mid} stroke="#1f2937" strokeWidth="1.5" />
      {[-3, -2, -1, 0, 1, 2, 3].map(t => (
        <g key={t}>
          <line x1={x(t)} y1={mid - 5} x2={x(t)} y2={mid + 5} stroke={t === 0 ? "#64748b" : "#1f2937"} strokeWidth={t === 0 ? 1.5 : 1} />
          <text x={x(t)} y={H - 4} fill="#475569" fontSize="8.5" fontFamily="monospace" textAnchor="middle">{t > 0 ? `+${t}` : t}</text>
        </g>
      ))}
      {commZ != null && (
        <g>
          <circle cx={x(commZ)} cy={mid + 18} r="5" fill="none" stroke="#64748b" strokeWidth="1.5" />
          <line x1={x(commZ)} y1={mid + 13} x2={x(commZ)} y2={mid + 5} stroke="#64748b" strokeWidth="1.5" />
          <text x={x(commZ)} y={mid + 34} fill="#64748b" fontSize="8" fontFamily="monospace" textAnchor="middle">COMML</text>
        </g>
      )}
      {mmZ != null && (
        <g>
          <circle cx={x(mmZ)} cy={mid - 18} r="5.5" fill={accent} />
          <line x1={x(mmZ)} y1={mid - 13} x2={x(mmZ)} y2={mid - 5} stroke={accent} strokeWidth="1.5" />
          <text x={x(mmZ)} y={mid - 27} fill={accent} fontSize="8" fontFamily="monospace" textAnchor="middle" fontWeight="700">
            FUNDS {mmZ > 0 ? "+" : ""}{mmZ.toFixed(1)}σ
          </text>
        </g>
      )}
    </svg>
  );
}

const CAT_ACCENT = {
  GOLD: "#f59e0b", SILVER: "#94a3b8", COPPER: "#f97316",
  WTI_CRUDE: "#ef4444", ES_SP500: "#3b82f6", DXY: "#22c55e",
};

function ContractCard({ code, block }) {
  const cats = block.categories || {};
  const mm = cats.managed_money || cats.leveraged_funds;
  if (!mm) return null;
  const comm = cats.producer_merchant || cats.asset_manager || {};
  const z = mm.zscore_3y, cz = comm.zscore_3y ?? null;
  const regime = regimeOf(z);
  const confirmed = cz != null && z != null && Math.abs(cz) >= STRETCHED && cz * z < 0;

  return (
    <div style={{ background: "#111827", border: "1.5px solid #1f2937", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "#e2e8f0" }}>{block.contract}</span>
        <span style={{ fontSize: 10, background: `${regimeColor(regime)}22`, color: regimeColor(regime),
                       border: `1px solid ${regimeColor(regime)}44`, borderRadius: 3, padding: "2px 6px", whiteSpace: "nowrap" }}>
          {regime}
        </span>
      </div>

      <PositioningAxis mmZ={z} commZ={cz} accent={CAT_ACCENT[code] || "#3b82f6"} />

      <div style={{ display: "flex", gap: 16, marginTop: 6, flexWrap: "wrap" }}>
        <Stat label="PERCENTILE" value={mm.percentile_3y != null ? `${mm.percentile_3y}%` : "—"} />
        <Stat label="4W TREND" value={mm.four_week_trend || "—"} />
        <Stat label="COT DATE" value={mm.report_date || "—"} />
      </div>

      {confirmed && (
        <div style={{ marginTop: 8, fontSize: 10.5, color: "#f59e0b" }}>
          Commercials stretched the opposite way — extreme confirmed on both sides.
        </div>
      )}
      <div style={{ marginTop: 6, fontSize: 11, color: "#9ca3af", lineHeight: 1.45 }}>{noteOf(z)}</div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontSize: 8.5, color: "#475569", fontFamily: "monospace", letterSpacing: 0.6 }}>{label}</div>
      <div style={{ fontSize: 11.5, color: "#e2e8f0", fontFamily: "monospace", marginTop: 2 }}>{value}</div>
    </div>
  );
}

function VolCard({ vol }) {
  if (!vol || vol.vix == null) return null;
  const stressed = vol.vix_vix3m_ratio != null && vol.vix_vix3m_ratio >= 1.0;
  const calm = (vol.vix_52w_percentile ?? 50) <= 20;
  const tone = stressed ? "#ef4444" : calm ? "#f59e0b" : "#22c55e";

  return (
    <div style={{ background: "#111827", border: `1.5px solid #1f2937`, borderLeft: `3px solid ${tone}`,
                  borderRadius: 10, padding: "12px 16px", marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 9, color: "#475569", fontFamily: "monospace", letterSpacing: 0.8 }}>VOLATILITY REGIME</span>
        <span style={{ fontSize: 12, color: tone, fontFamily: "monospace", fontWeight: 700 }}>
          VIX {vol.vix} · {vol.vix_52w_percentile}th pctile
        </span>
      </div>
      <div style={{ fontSize: 12, color: "#e2e8f0", marginTop: 6, lineHeight: 1.4 }}>{vol.term_structure}</div>
      <div style={{ fontSize: 10.5, color: "#64748b", fontFamily: "monospace", marginTop: 5 }}>
        VIX/VIX3M {vol.vix_vix3m_ratio}
        {vol.term_structure_flipped_this_week && <span style={{ color: "#ef4444", fontWeight: 700 }}> · CURVE FLIPPED THIS WEEK</span>}
      </div>
    </div>
  );
}

function SectorCard({ sectors }) {
  if (!sectors?.ranked?.length) return null;
  const max = Math.max(...sectors.ranked.map(s => Math.abs(s.score)), 1);

  return (
    <div style={{ background: "#111827", border: "1.5px solid #1f2937", borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 2 }}>
        <span style={{ fontWeight: 800, fontSize: 13, color: "#e2e8f0" }}>Sector Rotation</span>
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>vs SPY</span>
      </div>
      <div style={{ fontSize: 11, color: sectors.complete === false ? "#f59e0b" : "#9ca3af", marginBottom: 4 }}>
        {sectors.leadership_type}
      </div>
      {sectors.complete === false && (
        <div style={{ fontSize: 10, color: "#f59e0b", background: "#f59e0b18",
                      border: "1px solid #f59e0b44", borderRadius: 4,
                      padding: "5px 8px", marginBottom: 8, lineHeight: 1.45 }}>
          Showing {sectors.sectors_covered} of {sectors.sectors_total} sectors
          {sectors.missing_sectors?.length ? ` — no data for ${sectors.missing_sectors.join(", ")}` : ""}.
          Rankings below are computed on a partial set and may shift once the
          missing feeds return. Re-run the data pull before relying on this.
        </div>
      )}
      {sectors.complete !== false && <div style={{ height: 6 }} />}

      {sectors.ranked.map(s => {
        const pos = s.score >= 0;
        return (
          <div key={s.ticker} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
            <span style={{ fontSize: 10, color: "#9ca3af", fontFamily: "monospace", width: 36 }}>{s.ticker}</span>
            <div style={{ flex: 1, display: "flex", alignItems: "center", height: 14 }}>
              <div style={{ width: "50%", display: "flex", justifyContent: "flex-end" }}>
                {!pos && <div style={{ width: `${(Math.abs(s.score) / max) * 100}%`, height: 14, background: "#ef4444", opacity: 0.6, borderRadius: "2px 0 0 2px" }} />}
              </div>
              <div style={{ width: 1, height: 14, background: "#1f2937" }} />
              <div style={{ width: "50%" }}>
                {pos && <div style={{ width: `${(s.score / max) * 100}%`, height: 14, background: "#22c55e", opacity: 0.6, borderRadius: "0 2px 2px 0" }} />}
              </div>
            </div>
            <span style={{ fontSize: 10, fontFamily: "monospace", width: 44, textAlign: "right", color: pos ? "#22c55e" : "#ef4444" }}>
              {pos ? "+" : ""}{s.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}


/* ---------------------------------------------------------------
   Crypto positioning. There is no COT for crypto — no regulator
   compels disclosure. Funding rate is the honest analogue: perpetual
   futures are tethered to spot by a payment between longs and shorts
   every 8 hours, so positive funding means the crowd is long AND
   paying to stay there.
   --------------------------------------------------------------- */
const FUNDING_HOT = 50, FUNDING_EXTREME = 100, FUNDING_NEG = -10;

const fundingColor = v =>
  v >= FUNDING_EXTREME ? "#ef4444" :
  v >= FUNDING_HOT ? "#f59e0b" :
  v <= FUNDING_NEG ? "#3b82f6" : "#22c55e";

function FundingBar({ value }) {
  // -50 .. +150 annualised maps across the bar
  const lo = -50, hi = 150;
  const pct = Math.max(0, Math.min(100, ((value - lo) / (hi - lo)) * 100));
  const zero = ((0 - lo) / (hi - lo)) * 100;
  const hot = ((FUNDING_HOT - lo) / (hi - lo)) * 100;

  return (
    <div style={{ position: "relative", height: 6, background: "#1f2937",
                  borderRadius: 3, margin: "5px 0 3px" }}>
      <div style={{ position: "absolute", left: `${hot}%`, right: 0, top: 0, bottom: 0,
                    background: "#ef4444", opacity: 0.15, borderRadius: "0 3px 3px 0" }} />
      <div style={{ position: "absolute", left: `${zero}%`, top: -2, width: 1, height: 10,
                    background: "#64748b" }} />
      <div style={{ position: "absolute", left: `${pct}%`, top: -3, width: 8, height: 12,
                    marginLeft: -4, borderRadius: 2, background: fundingColor(value) }} />
    </div>
  );
}

function CryptoCard({ sym, e }) {
  const f = e.funding || {};
  const oi = e.open_interest || {};
  const p = e.positioning || {};
  const ann = f.mean_7d_annualised_pct;
  const name = sym.replace("USDT", "");

  // retail more long than the top-trader cohort is the divergence worth seeing
  const gap = (p.retail_ratio && p.top_trader_ratio)
    ? p.retail_ratio - p.top_trader_ratio : null;

  return (
    <div style={{ background: "#111827", border: "1.5px solid #1f2937",
                  borderRadius: 10, padding: "14px 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 13, color: "#e2e8f0" }}>
          {name}
        </span>
        {e.last_price != null && (
          <span style={{ fontFamily: "monospace", fontSize: 11, color: "#9ca3af" }}>
            ${e.last_price >= 100 ? e.last_price.toLocaleString(undefined, { maximumFractionDigits: 0 })
                                  : e.last_price.toFixed(2)}
            <span style={{ color: (e.price_change_7d_pct ?? 0) >= 0 ? "#22c55e" : "#ef4444",
                           marginLeft: 6 }}>
              {(e.price_change_7d_pct ?? 0) >= 0 ? "+" : ""}{e.price_change_7d_pct}%
            </span>
          </span>
        )}
      </div>

      {ann != null && (
        <div style={{ marginTop: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between",
                        fontSize: 8.5, color: "#475569", fontFamily: "monospace",
                        letterSpacing: 0.6 }}>
            <span>FUNDING 7D AVG (ANNUALISED)</span>
            <span style={{ color: fundingColor(ann) }}>{ann >= 0 ? "+" : ""}{ann}%</span>
          </div>
          <FundingBar value={ann} />
          <div style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
            {f.percentile_4m != null ? `${f.percentile_4m}th pctile · ` : ""}
            {f.days_same_sign != null ? `${f.days_same_sign}d same sign` : ""}
          </div>
        </div>
      )}

      {(p.retail_ratio || oi.change_7d_pct != null) && (
        <div style={{ display: "flex", gap: 16, marginTop: 9, flexWrap: "wrap" }}>
          {oi.change_7d_pct != null && (
            <Stat label="OPEN INT 7D" value={`${oi.change_7d_pct >= 0 ? "+" : ""}${oi.change_7d_pct}%`} />
          )}
          {p.retail_ratio != null && <Stat label="RETAIL L/S" value={p.retail_ratio} />}
          {p.top_trader_ratio != null && <Stat label="TOP TRADERS" value={p.top_trader_ratio} />}
        </div>
      )}

      {gap != null && gap > 0.5 && (
        <div style={{ marginTop: 8, fontSize: 10.5, color: "#f59e0b" }}>
          Retail {gap.toFixed(2)} more long than top traders.
        </div>
      )}

      {f.state && (
        <div style={{ marginTop: 6, fontSize: 11, color: "#9ca3af", lineHeight: 1.45 }}>
          {f.state}
        </div>
      )}
      {oi.interpretation && oi.interpretation !== "no clear OI/price divergence" && (
        <div style={{ marginTop: 4, fontSize: 10.5, color: "#64748b", lineHeight: 1.45 }}>
          {oi.interpretation}
        </div>
      )}
    </div>
  );
}

function CryptoSection({ data }) {
  if (!data?.symbols || !Object.keys(data.symbols).length) return null;
  return (
    <div style={{ marginTop: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline",
                    marginBottom: 4 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#f8fafc" }}>Crypto Positioning</span>
        <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
          {(data.generated_at_utc || "").slice(0, 16).replace("T", " ")} UTC
        </span>
      </div>
      <div style={{ fontSize: 10.5, color: "#64748b", marginBottom: 10, lineHeight: 1.5 }}>
        No COT exists for crypto — nobody is compelled to disclose. Funding rate is the
        honest substitute: longs pay shorts every 8 hours when the crowd is long.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(300px,1fr))",
                    gap: 10 }}>
        {Object.entries(data.symbols).map(([sym, e]) => <CryptoCard key={sym} sym={sym} e={e} />)}
      </div>
      <div style={{ marginTop: 8, fontSize: 10, color: "#374151", lineHeight: 1.6 }}>
        Funding above ~50% annualised means leveraged longs are paying heavily to stay in —
        fuel for a liquidation cascade if price stalls. It can persist for weeks in a strong
        trend, so treat it as crowding, not timing.
      </div>
    </div>
  );
}

export default function MarketIntelTab({ dataUrl = "/api/signals",
                                        cryptoUrl = "/api/crypto" }) {
  const [data, setData] = useState(null);
  const [crypto, setCrypto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    // /api/signals falls back to the committed file server-side. If the
    // endpoint itself is absent (plain static host, or local CRA without the
    // api routes), fall back to the raw file client-side too.
    fetch(dataUrl)
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .catch(() => fetch("/signals_latest.json").then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }))
      .then(j => { if (alive) setData(j); })
      .catch(e => { if (alive) setError(e.message); });

    // crypto is optional — if the file is not there the section simply
    // does not render, rather than breaking the whole tab
    fetch(cryptoUrl)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .catch(() => fetch("/crypto_latest.json").then(r => (r.ok ? r.json() : null)))
      .then(j => { if (alive && j) setCrypto(j); })
      .catch(() => {});

    return () => { alive = false; };
  }, [dataUrl, cryptoUrl]);

  if (error) {
    return (
      <div style={{ textAlign: "center", color: "#475569", padding: 60, fontSize: 13 }}>
        <div style={{ color: "#ef4444", marginBottom: 8 }}>Could not load positioning data ({error})</div>
        <div style={{ fontSize: 11, lineHeight: 1.6 }}>
          Copy <code style={{ fontFamily: "monospace", color: "#9ca3af" }}>output/signals_latest.json</code> from
          your market_intel folder into <code style={{ fontFamily: "monospace", color: "#9ca3af" }}>public/</code>,
          then reload.
        </div>
      </div>
    );
  }

  if (!data) return <div style={{ textAlign: "center", color: "#475569", padding: 60, fontSize: 14 }}>Loading positioning data…</div>;

  const wp = data.whale_positioning || {};
  const bad = Object.entries(data.data_quality || {}).filter(([, v]) => v !== "ok");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#f8fafc" }}>Institutional Positioning</span>
        <span style={{ fontSize: 10, color: "#475569", fontFamily: "monospace" }}>
          {(data.generated_at_utc || "").slice(0, 16).replace("T", " ")} UTC
        </span>
      </div>

      <VolCard vol={data.volatility} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(320px,1fr))", gap: 10 }}>
        {Object.entries(wp).map(([code, block]) => <ContractCard key={code} code={code} block={block} />)}
      </div>

      <div style={{ marginTop: 10 }}>
        <SectorCard sectors={data.sectors} />
      </div>

      <CryptoSection data={crypto} />

      {bad.length > 0 && (
        <div style={{ marginTop: 10, fontSize: 10, color: "#f59e0b", fontFamily: "monospace" }}>
          {bad.length} feed{bad.length > 1 ? "s" : ""} unavailable: {bad.map(([k]) => k).join(", ")}
        </div>
      )}

      <div style={{ marginTop: 14, fontSize: 10, color: "#374151", lineHeight: 1.6 }}>
        COT is a Tuesday snapshot released Friday 15:30 ET — up to 3 days old. Funds (managed money) are
        trend followers: readings beyond ±2σ are contrarian warnings, not confirmation. Commercials hold the
        physical and their extremes tend to mark turns. Positioning shows where risk sits, not where price goes next.
      </div>
    </div>
  );
}