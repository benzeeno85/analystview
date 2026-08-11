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
      <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 10 }}>{sectors.leadership_type}</div>

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

export default function MarketIntelTab({ dataUrl = "/signals_latest.json" }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    fetch(dataUrl)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then(j => { if (alive) setData(j); })
      .catch(e => { if (alive) setError(e.message); });
    return () => { alive = false; };
  }, [dataUrl]);

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
