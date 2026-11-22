import { useState, useEffect, useMemo, useRef } from "react";

/**
 * OfficeTab — a top-down virtual office where your agents are visible at work.
 *
 * LIVE MODE: polls /agents_latest.json every 5s (override with REACT_APP_AGENTS_FEED).
 * Have your agents (or a script / GitHub Action) write that file:
 *
 *   {
 *     "agents": [
 *       { "id": "atlas", "name": "Atlas", "role": "Market Data",
 *         "state": "working",            // working | meeting | break | error | offline
 *         "task": "Fetching S&P 500 quotes",
 *         "progress": 40,                // optional 0-100
 *         "color": "#3b82f6" }           // optional shirt colour
 *     ],
 *     "events": [ { "t": "2026-01-01T10:00:00Z", "agent": "Atlas", "text": "Finished crypto refresh" } ]  // optional
 *   }
 *
 * No feed (or invalid JSON) -> DEMO mode with simulated agents. Up to 8 agents get desks.
 */

const FEED = process.env.REACT_APP_AGENTS_FEED || "/agents_latest.json";

const STATES = {
  trading: { label: "Trading",         short: "TRADING",   icon: "📈", color: "#eab308" },
  working: { label: "Working",         short: "WORKING",   icon: "⌨️", color: "#22c55e" },
  idle:    { label: "Awaiting orders", short: "IDLE",      icon: "🪑", color: "#94a3b8" },
  error:   { label: "Needs fix",       short: "NEEDS FIX", icon: "⚠️", color: "#f59e0b" },
  fired:   { label: "Terminated",      short: "FIRED",     icon: "🚫", color: "#ef4444" },
  offline: { label: "Offline",         short: "OFFLINE",   icon: "💤", color: "#64748b" },
};
const ALIAS = { break: "idle", meeting: "idle" };
const stateOf = s => (STATES[s] ? s : ALIAS[s] || "offline");
const SEATED = new Set(["trading", "working", "idle", "error"]); // everyone else is out of the office

// ── Geometry ────────────────────────────────────────────────────────────────
const DESKS = [0, 1].flatMap(r => [0, 1, 2, 3].map(c => ({ x: 40 + c * 150, y: 70 + r * 170 })));
const seatOf = d => ({ x: d.x + 55, y: d.y + 64 });
const ZONE_SPOTS = {
  meeting: [[780, 78], [870, 78], [780, 162], [870, 162], [725, 120], [925, 120]],
  break:   [[715, 372], [760, 372], [915, 305], [950, 335], [860, 330], [830, 385]],
  error:   [[75, 545], [130, 545], [185, 545], [240, 545], [290, 545], [100, 505], [215, 505], [270, 505]],
  offline: [[700, 560], [750, 560], [800, 560], [850, 560], [900, 560], [950, 560], [725, 510], [925, 510]],
};
const CEO_SEAT = { x: 500, y: 562, zone: "ops" };
// Route through corridors so agents walk via doors instead of through walls.
const TOP_Y = { workspace: 200, meeting: 205, break: 262 };
const BOTTOM_DOOR = { server: [170, 432], ops: [510, 432], lobby: [820, 432] };
const JUNCTION = [655, 432];

function pathBetween(from, to) {
  if (!from || from.zone === to.zone) return [[to.x, to.y]];
  const exit = z => (TOP_Y[z] ? [[655, TOP_Y[z]]] : [BOTTOM_DOOR[z]]);
  const fromTop = !!TOP_Y[from.zone], toTop = !!TOP_Y[to.zone];
  let pts = [];
  if (fromTop && toTop) pts = [[655, TOP_Y[from.zone]], [655, TOP_Y[to.zone]]];
  else {
    pts = [...exit(from.zone), JUNCTION, ...exit(to.zone).slice().reverse()];
    if (toTop) pts = [...exit(from.zone), JUNCTION, [655, TOP_Y[to.zone]]];
  }
  return [...pts, [to.x, to.y]];
}

const SHIRTS = ["#3b82f6", "#ec4899", "#8b5cf6", "#14b8a6", "#f97316", "#ef4444", "#84cc16", "#06b6d4"];
const SKINS = ["#f1c9a5", "#e0a77d", "#c68642", "#8d5524", "#f5d5b8", "#d9a066", "#a9714b", "#f2d0b4"];
const HAIRS = ["#2b1b12", "#5a3825", "#111827", "#b45309", "#7c2d12", "#374151", "#facc15", "#1f2937"];

// ── Demo simulation ─────────────────────────────────────────────────────────
const DEMO_ROSTER = [
  { id: "atlas", name: "Atlas", role: "Market Data Collector", tasks: ["Fetching S&P 500 quotes", "Refreshing TSX prices", "Batching price requests", "Syncing futures curve"] },
  { id: "nova",  name: "Nova",  role: "Options Flow Analyst",  tasks: ["Scanning unusual options flow", "Ranking high-IV chains", "Computing call/put skew", "Flagging large sweeps"] },
  { id: "sage",  name: "Sage",  role: "COT Positioning",       tasks: ["Parsing CFTC COT report", "Computing z-scores", "Finding crowded trades", "Updating signals_latest.json"] },
  { id: "echo",  name: "Echo",  role: "News Sentiment",        tasks: ["Reading Google News RSS", "Scoring headline sentiment", "Deduplicating stories", "Tagging sector news"] },
  { id: "quill", name: "Quill", role: "Report Writer",         tasks: ["Drafting analyst report", "Summarising ETF fundamentals", "Proofreading thesis", "Generating AI report"] },
  { id: "vega",  name: "Vega",  role: "Crypto Derivatives",    tasks: ["Reading funding rates", "Tracking open interest", "Retail vs top traders", "Updating crypto_latest.json"] },
  { id: "rook",  name: "Rook",  role: "Risk Monitor",          tasks: ["Checking sector exposure", "Stress testing positions", "Watching VIX regime", "Reviewing drawdowns"] },
  { id: "iris",  name: "Iris",  role: "ETF Researcher",        tasks: ["Comparing ETF expense ratios", "Reviewing holdings overlap", "Pulling fund flows", "Rating ETF categories"] },
];
const pick = a => a[Math.floor(Math.random() * a.length)];
const ERROR_TASKS = ["order rejected by broker", "bad symbol in request", "timeout from data provider", "malformed JSON response"];
const NEW_HIRES = ["Blake", "Cole", "Dana", "Eli", "Finn", "Gwen", "Hugo", "Ines", "Jude", "Kira"];
const RANK_LIST = [["Intern", 0], ["Analyst", 8], ["Trader", 20], ["Senior Trader", 40], ["Portfolio Manager", 70]];
const CEO_MIN = 100, MAX_STRIKES = 3;
const rankOf = pts => RANK_LIST.reduce((r, [n, min]) => (pts >= min ? n : r), "Intern");
const RANK_SHORT = { Intern: "INT", Analyst: "ANL", Trader: "TRD", "Senior Trader": "SNR", "Portfolio Manager": "PM", CEO: "CEO" };

// Top performer (>= CEO_MIN points, still employed) becomes CEO; everyone else is ranked on points.
function applyRanks(list, hr) {
  const ceo = list.filter(x => x.state !== "fired" && x.state !== "offline" && x.points >= CEO_MIN).sort((p, q) => q.points - p.points)[0];
  list.forEach(x => {
    const want = x.state === "fired" ? x.rank : ceo && x.id === ceo.id ? "CEO" : rankOf(x.points);
    if (hr && x.rank && x.rank !== want && x.state !== "fired") {
      const up = want === "CEO" || RANK_LIST.findIndex(r => r[0] === want) > RANK_LIST.findIndex(r => r[0] === x.rank);
      hr(up ? "promoted" : "demoted", x.name, want === "CEO" ? "Became CEO 👑" : `${up ? "Promoted" : "Demoted"} to ${want}`);
    }
    x.rank = want;
  });
}

function initDemo() {
  const list = DEMO_ROSTER.map((r, i) => ({
    ...r, color: SHIRTS[i], state: "working", task: pick(r.tasks), progress: Math.floor(Math.random() * 70),
    desk: i, points: 10 + Math.floor(Math.random() * 85), strikes: 0, pnl: Math.floor(Math.random() * 400) - 60,
  }));
  applyRanks(list);
  return list;
}

function stepDemo(agents, log, hr) {
  const next = agents.map(a => ({ ...a }));
  next.forEach((a, i) => {
    if (a.state === "working") {
      a.progress = Math.min(100, (a.progress || 0) + 8 + Math.random() * 18);
      if (a.progress >= 100) {
        const pnl = Math.round(Math.random() * 160 - 45);
        a.pnl += pnl; a.points = +(a.points + 1 + pnl / 100).toFixed(2);
        log(a.name, `Completed: ${a.task} (${pnl >= 0 ? "+" : "-"}$${Math.abs(pnl)})`);
        Object.assign(a, { task: pick(a.tasks), progress: 0 });
      } else if (Math.random() < 0.015) {
        a.strikes = 1; a.points -= 3;
        Object.assign(a, { state: "error", task: `Mistake: ${pick(ERROR_TASKS)} — strike 1/${MAX_STRIKES}` });
        log(a.name, a.task);
      }
    } else if (a.state === "error") {
      if (Math.random() < 0.5) {
        a.strikes = 0; a.points += 2;
        Object.assign(a, { state: "working", task: pick(a.tasks), progress: 0 });
        log(a.name, "Fixed the mistake"); hr("fixed", a.name, "Fixed their mistake");
      } else {
        a.strikes += 1; a.points -= 3;
        if (a.strikes >= MAX_STRIKES) {
          Object.assign(a, { state: "fired", task: `Terminated: ${a.strikes} unresolved mistakes`, firedTick: 0 });
          hr("terminated", a.name, `${a.strikes} unresolved mistakes in a row`);
        } else a.task = `Still failing — strike ${a.strikes}/${MAX_STRIKES}`;
      }
    } else if (a.state === "fired") {
      a.firedTick = (a.firedTick || 0) + 1;
      if (a.firedTick >= 3) {
        const name = pick(NEW_HIRES.filter(n => !next.some(x => x.name === n)));
        next[i] = { id: "hire-" + Math.random().toString(36).slice(2, 6), name, role: a.role, tasks: a.tasks, color: a.color,
          state: "working", task: pick(a.tasks), progress: 0, desk: a.desk, rank: "Intern", points: 0, strikes: 0, pnl: 0 };
        hr("hired", name, `Joined as Intern, replacing ${a.name}`);
      }
    }
  });
  applyRanks(next, hr);
  return next;
}

const hhmmss = d => new Date(d).toLocaleTimeString([], { hour12: false });
const clip = (s, n) => (s && s.length > n ? s.slice(0, n - 1) + "…" : s || "");

// ── Component ───────────────────────────────────────────────────────────────
export default function OfficeTab() {
  const [demo, setDemo] = useState(initDemo);
  const [demoHr, setDemoHr] = useState([]);
  const demoRef = useRef(null);
  const mounted = useRef(false);
  const [feed, setFeed] = useState(null);
  const [forceDemo, setForceDemo] = useState(false);
  const [logItems, setLogItems] = useState([]);
  const [selected, setSelected] = useState(null);
  const [pos, setPos] = useState({});
  const [walking, setWalking] = useState({});
  const [now, setNow] = useState(new Date());
  const lastTarget = useRef({});
  const timers = useRef({});
  const prevStates = useRef({});
  const seenEvents = useRef(new Set());

  const pushHr = (type, agent, detail) => setDemoHr(l => [{ t: Date.now(), type, agent, detail }, ...l].slice(0, 40));
  const pushLog = (agent, text) =>
    setLogItems(l => [{ t: Date.now(), agent, text }, ...l].slice(0, 60));

  // clock
  useEffect(() => { const i = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(i); }, []);

  // live feed polling
  useEffect(() => {
    if (forceDemo) { setFeed(null); return; }
    let dead = false;
    const poll = async () => {
      try {
        const r = await fetch(FEED, { cache: "no-store" });
        const ct = r.headers.get("content-type") || "";
        if (!r.ok || !ct.includes("json")) throw new Error("no feed");
        const j = await r.json();
        if (!Array.isArray(j.agents) || !j.agents.length) throw new Error("bad feed");
        if (!dead) setFeed(j);
      } catch { if (!dead) setFeed(null); }
    };
    poll();
    const i = setInterval(poll, 5000);
    return () => { dead = true; clearInterval(i); };
  }, [forceDemo]);

  // demo simulation (only while no live feed)
  const live = !!feed;
  useEffect(() => {
    if (live) return;
    if (demoRef.current === null) demoRef.current = demo;
    const i = setInterval(() => { const n = stepDemo(demoRef.current, pushLog, pushHr); demoRef.current = n; setDemo(n); }, 1800);
    return () => clearInterval(i);
  }, [live]);

  const agents = useMemo(() => {
    const raw = live ? feed.agents : demo;
    const order = [...raw].sort((p, q) => String(p.id || p.name).localeCompare(String(q.id || q.name)));
    const list = raw.map(a => {
      const id = a.id || a.name;
      const i = order.findIndex(x => (x.id || x.name) === id);
      return { ...a, id, state: stateOf(a.state), color: a.color || SHIRTS[i % SHIRTS.length], idx: i,
        points: a.points || 0, strikes: a.strikes || 0, rank: a.rank || rankOf(a.points || 0) };
    });
    return [...list.filter(a => a.state !== "fired"), ...list.filter(a => a.state === "fired")].slice(0, 8);
  }, [live, feed, demo]);

  // live mode: derive log from state/task changes + optional events
  useEffect(() => {
    if (!live) return;
    agents.forEach(a => {
      const prev = prevStates.current[a.id];
      if (prev && (prev.state !== a.state || prev.task !== a.task))
        pushLog(a.name, prev.state !== a.state ? `${STATES[a.state].label}: ${a.task || ""}` : `Now: ${a.task}`);
      prevStates.current[a.id] = { state: a.state, task: a.task };
    });
    (feed.events || []).forEach(e => {
      const k = `${e.t}|${e.agent}|${e.text}`;
      if (!seenEvents.current.has(k)) { seenEvents.current.add(k); pushLog(e.agent, e.text); }
    });
  }, [live, feed, agents]);

  // Everyone stays at their desk (the CEO in the corner office). Only terminated or offline agents leave.
  const targets = useMemo(() => {
    let out_n = 0;
    const out = {};
    agents.forEach(a => {
      if (SEATED.has(a.state)) {
        if (a.rank === "CEO") out[a.id] = CEO_SEAT;
        else out[a.id] = { ...seatOf(DESKS[(Number.isInteger(a.desk) ? a.desk : a.idx) % 8]), zone: "workspace" };
      } else {
        const list = ZONE_SPOTS.offline;
        const [x, y] = list[out_n++ % list.length];
        out[a.id] = { x, y, zone: "lobby" };
      }
    });
    return out;
  }, [agents]);

  // walk agents along corridors when their target changes
  useEffect(() => {
    agents.forEach(a => {
      const t = targets[a.id];
      const last = lastTarget.current[a.id];
      if (last && last.x === t.x && last.y === t.y) return;
      lastTarget.current[a.id] = t;
      (timers.current[a.id] || []).forEach(clearTimeout);
      let from = last, delay = 0;
      if (!from) {
        if (!mounted.current) { setPos(p => ({ ...p, [a.id]: { x: t.x, y: t.y } })); return; }
        from = { x: 820, y: 520, zone: "lobby" }; delay = 150; // new hire arrives through the lobby
        setPos(p => ({ ...p, [a.id]: { x: from.x, y: from.y } }));
      }
      const pts = pathBetween(from, t);
      const step = 850;
      setWalking(w => ({ ...w, [a.id]: true }));
      timers.current[a.id] = pts.map((p, i) =>
        setTimeout(() => {
          setPos(ps => ({ ...ps, [a.id]: { x: p[0], y: p[1] } }));
          if (i === pts.length - 1) setTimeout(() => setWalking(w => ({ ...w, [a.id]: false })), step);
        }, delay + i * step)
      );
    });
  }, [targets, agents]);
  useEffect(() => { mounted.current = true; }, []);
  useEffect(() => () => Object.values(timers.current).flat().forEach(clearTimeout), []);

  const counts = useMemo(() => {
    const c = { trading: 0, working: 0, idle: 0, error: 0, fired: 0, offline: 0 };
    agents.forEach(a => c[a.state]++);
    return c;
  }, [agents]);

  const sel = agents.find(a => a.id === selected);
  const total = live ? feed.agents.length : demo.length;
  const trades = live && Array.isArray(feed.trades) ? feed.trades : [];
  const totalPnl = agents.reduce((n, x) => n + (Number(x.pnl) || 0), 0);
  const hasPnl = trades.length > 0 || agents.some(x => x.pnl != null);
  const money = v => `${v >= 0 ? "+" : "-"}$${Math.abs(v).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div style={{ flex: 1, overflow: "auto", background: "#060e1a", padding: 14 }}>
      <style>{CSS}</style>

      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 12 }}>
        <span style={{ fontWeight: 800, fontSize: 15, color: "#f8fafc" }}>🏢 Agent Office</span>
        <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 10, color: live ? "#22c55e" : "#f59e0b", background: live ? "#22c55e18" : "#f59e0b18", border: `1px solid ${live ? "#22c55e55" : "#f59e0b55"}` }}>
          {live ? "● LIVE FEED" : "◌ DEMO MODE"}
        </span>
        {total > 8 && <span style={{ fontSize: 10, color: "#64748b" }}>showing 8 of {total}</span>}
        {hasPnl && <span style={{ fontSize: 11, fontWeight: 800, padding: "2px 10px", borderRadius: 10, color: totalPnl >= 0 ? "#22c55e" : "#ef4444", background: "#0b1424", border: `1px solid ${totalPnl >= 0 ? "#22c55e66" : "#ef444466"}` }}>P&L {money(totalPnl)} · {trades.length} trades</span>}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginLeft: "auto" }}>
          {Object.entries(STATES).map(([k, s]) => (
            <span key={k} style={{ fontSize: 10, color: s.color, background: "#0b1424", border: "1px solid #1e293b", borderRadius: 10, padding: "2px 8px", fontWeight: 700 }}>
              {s.icon} {s.label} · {counts[k]}
            </span>
          ))}
          <button onClick={() => setForceDemo(f => !f)} style={{ background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 10, fontWeight: 700 }}>
            {forceDemo ? "Try live feed" : "Force demo"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "flex-start" }}>
        {/* floor plan */}
        <div style={{ flex: "1 1 640px", minWidth: 0, background: "#0b1424", border: "1px solid #1e293b", borderRadius: 10, padding: 8 }}>
          <svg viewBox="0 0 1000 620" style={{ width: "100%", display: "block" }} onClick={() => setSelected(null)}>
            <FloorPlan counts={counts} now={now} agents={agents} />

            {/* agents */}
            {agents.map(a => {
              const p = pos[a.id] || (mounted.current ? { x: 820, y: 520 } : targets[a.id]);
              return <Person key={a.id} a={a} x={p.x} y={p.y} walking={!!walking[a.id]} selected={selected === a.id}
                compact={!SEATED.has(a.state) || a.rank === "CEO"} onClick={e => { e.stopPropagation(); setSelected(a.id); }} />;
            })}
          </svg>
        </div>

        {/* side panel */}
        <div style={{ flex: "0 0 290px", maxWidth: "100%", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ background: "#0b1424", border: "1px solid #1e293b", borderRadius: 10, padding: 10 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 6 }}>TEAM</div>
            {agents.map(a => (
              <div key={a.id} onClick={() => setSelected(a.id === selected ? null : a.id)}
                style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 6px", borderRadius: 6, cursor: "pointer", background: selected === a.id ? "#1e293b" : "transparent" }}>
                <span style={{ width: 9, height: 9, borderRadius: "50%", background: a.color, flexShrink: 0 }} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#e2e8f0" }}>{a.name} <span style={{ fontSize: 9, fontWeight: 800, color: a.rank === "CEO" ? "#eab308" : "#60a5fa", background: "#111c33", borderRadius: 6, padding: "0 5px" }}>{a.rank === "CEO" ? "👑 CEO" : a.rank}</span>{a.strikes > 0 && <span style={{ color: "#ef4444", fontSize: 10, fontWeight: 800 }}> ✗{a.strikes}/{a.limit || MAX_STRIKES}</span>}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.task}</div>
                </div>
                {a.pnl != null && <span style={{ fontSize: 10, fontWeight: 800, color: a.pnl >= 0 ? "#22c55e" : "#ef4444" }}>{money(a.pnl)}</span>}
                <span title={STATES[a.state].label} style={{ fontSize: 13 }}>{STATES[a.state].icon}</span>
              </div>
            ))}
          </div>

          {sel && (
            <div style={{ background: "#0b1424", border: `1px solid ${STATES[sel.state].color}66`, borderRadius: 10, padding: 12 }}>
              <div style={{ fontWeight: 800, color: "#f8fafc", fontSize: 14 }}>{sel.name}</div>
              <div style={{ fontSize: 11, color: "#64748b", marginBottom: 8 }}>{sel.role}</div>
              <div style={{ fontSize: 11, color: STATES[sel.state].color, fontWeight: 700 }}>{STATES[sel.state].icon} {STATES[sel.state].label}</div>
              <div style={{ fontSize: 12, color: "#e2e8f0", margin: "4px 0 8px" }}>{sel.task}</div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginBottom: 8 }}>{sel.rank} · {Math.round(sel.points)} pts · strikes {sel.strikes}/{sel.limit || MAX_STRIKES} · mistakes {sel.mistakes || 0} · fixes {sel.fixes || 0}{sel.pnl != null ? ` · P&L ${money(sel.pnl)}` : ""}</div>
              {(sel.state === "working" || sel.state === "trading") && sel.progress != null && (
                <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${Math.round(sel.progress)}%`, height: "100%", background: "#22c55e", transition: "width .8s" }} />
                </div>
              )}
              <div style={{ fontSize: 10, color: "#475569", marginTop: 8 }}>
                Recent: {logItems.filter(l => l.agent === sel.name).slice(0, 3).map(l => l.text).join(" · ") || "—"}
              </div>
            </div>
          )}

          {live && (
            <div style={{ background: "#0b1424", border: "1px solid #eab30855", borderRadius: 10, padding: 10, maxHeight: 260, overflowY: "auto" }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#eab308", letterSpacing: 1, marginBottom: 6 }}>📈 TRADE BLOTTER</div>
              {trades.length === 0 && <div style={{ fontSize: 11, color: "#475569" }}>No trades detected yet. Trades appear when an agent calls a TradingView order/trade tool.</div>}
              {trades.slice(0, 25).map((t, i) => {
                const buy = /buy|long/i.test(t.side || ""), sell = /sell|short/i.test(t.side || "");
                return (
                  <div key={i} style={{ fontSize: 11, padding: "4px 0", borderBottom: "1px solid #111827", display: "flex", gap: 6, alignItems: "baseline", flexWrap: "wrap" }}>
                    <span style={{ color: "#475569", fontFamily: "monospace" }}>{hhmmss(t.t)}</span>
                    <b style={{ color: "#cbd5e1" }}>{t.agent}</b>
                    <span style={{ fontWeight: 800, color: buy ? "#22c55e" : sell ? "#ef4444" : "#94a3b8" }}>{(t.side || t.action || "TRADE").toUpperCase()}</span>
                    <span style={{ color: "#e2e8f0" }}>{t.symbol || "?"}{t.qty != null ? ` ×${t.qty}` : ""}{t.price != null ? ` @ ${t.price}` : ""}</span>
                    {t.status === "error" && <span style={{ color: "#ef4444" }}>failed</span>}
                    {t.pnl != null && <span style={{ marginLeft: "auto", fontWeight: 800, color: t.pnl >= 0 ? "#22c55e" : "#ef4444" }}>{money(t.pnl)}</span>}
                  </div>
                );
              })}
            </div>
          )}

          <HrPanel items={live ? feed.hr || [] : demoHr} />

          <div style={{ background: "#0b1424", border: "1px solid #1e293b", borderRadius: 10, padding: 10, maxHeight: 280, overflowY: "auto" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#64748b", letterSpacing: 1, marginBottom: 6 }}>ACTIVITY LOG</div>
            {logItems.length === 0 && <div style={{ fontSize: 11, color: "#475569" }}>Waiting for activity…</div>}
            {logItems.map((l, i) => (
              <div key={l.t + "-" + i} style={{ fontSize: 11, color: "#94a3b8", padding: "3px 0", borderBottom: "1px solid #111827" }}>
                <span style={{ color: "#475569", fontFamily: "monospace" }}>{hhmmss(l.t)}</span>{" "}
                <b style={{ color: "#cbd5e1" }}>{l.agent}</b> {l.text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@keyframes ofc-step-l { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-4px) } }
@keyframes ofc-step-r { 0%,100% { transform: translateY(-4px) } 50% { transform: translateY(0) } }
@keyframes ofc-type   { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-1.5px) } }
@keyframes ofc-glow   { 0%,100% { opacity: .85 } 50% { opacity: 1 } }
@keyframes ofc-blink  { 0%,100% { opacity: 1 } 50% { opacity: .25 } }
@keyframes ofc-zzz    { 0% { transform: translateY(0); opacity: 0 } 50% { opacity: 1 } 100% { transform: translateY(-8px); opacity: 0 } }
.ofc-agent { transition: transform .85s linear; cursor: pointer; }
.ofc-foot-l { animation: ofc-step-l .35s infinite; }
.ofc-foot-r { animation: ofc-step-r .35s infinite; }
.ofc-hand-l { animation: ofc-type .22s infinite; }
.ofc-hand-r { animation: ofc-type .22s infinite .11s; }
.ofc-screen { animation: ofc-glow 2s infinite; }
.ofc-blink  { animation: ofc-blink 1s infinite; }
.ofc-zzz    { animation: ofc-zzz 2.2s infinite; }
`;

// ── Agent figure (top-down) ─────────────────────────────────────────────────
function Person({ a, x, y, walking, selected, compact, onClick }) {
  const i = a.idx, st = STATES[a.state];
  const typing = (a.state === "working" || a.state === "trading") && !walking;
  return (
    <g className="ofc-agent" style={{ transform: `translate(${x}px, ${y}px)`, filter: a.state === "fired" ? "grayscale(1)" : undefined }} onClick={onClick} opacity={a.state === "offline" ? 0.6 : a.state === "fired" ? 0.75 : 1}>
      <ellipse cx="0" cy="10" rx="15" ry="7" fill="rgba(0,0,0,.22)" />
      {walking && <>
        <ellipse className="ofc-foot-l" cx="-5" cy="15" rx="3.5" ry="4.5" fill="#1f2937" />
        <ellipse className="ofc-foot-r" cx="5" cy="15" rx="3.5" ry="4.5" fill="#1f2937" />
      </>}
      {/* shoulders / torso */}
      <ellipse cx="0" cy="4" rx="14" ry="9" fill={a.color} stroke="rgba(0,0,0,.25)" />
      {/* arms */}
      <ellipse className={typing ? "ofc-hand-l" : ""} cx="-10" cy="-4" rx="3.2" ry="6" fill={a.color} stroke="rgba(0,0,0,.25)" />
      <ellipse className={typing ? "ofc-hand-r" : ""} cx="10" cy="-4" rx="3.2" ry="6" fill={a.color} stroke="rgba(0,0,0,.25)" />
      <circle cx="-8" cy="-9" r="2.4" fill={SKINS[i % 8]} />
      <circle cx="8" cy="-9" r="2.4" fill={SKINS[i % 8]} />
      {/* head */}
      <circle cx="0" cy="-3" r="8" fill={SKINS[i % 8]} stroke="rgba(0,0,0,.3)" />
      <path d="M-8,-4 A8,8 0 0 1 8,-4 Q0,-9 -8,-4Z" fill={HAIRS[i % 8]} transform="translate(0,-1)" />
      <circle cx="0" cy="-4" r="8" fill={HAIRS[i % 8]} opacity="0" />
      <path d="M-8,-3 A8,8 0 0 1 8,-3 L8,0 Q0,-5 -8,0Z" fill={HAIRS[i % 8]} transform="translate(0,-2)" />
      {selected && <circle cx="0" cy="2" r="22" fill="none" stroke="#fff" strokeWidth="1.5" strokeDasharray="4 3" />}
      {/* status badge */}
      <g transform="translate(0,-24)">
        <circle r="8" fill="#fff" stroke={st.color} strokeWidth="2" className={a.state === "error" ? "ofc-blink" : ""} />
        <text textAnchor="middle" y="3.5" fontSize="9">{st.icon}</text>
      </g>
      {a.rank === "CEO" && <text x="-18" y="-20" fontSize="11">👑</text>}
      {a.state === "offline" && <text className="ofc-zzz" x="12" y="-14" fontSize="10" fontWeight="800" fill="#475569">z</text>}
      {/* name plate */}
      {compact ? (
        <g transform="translate(0,22)">
          <rect x={-(a.name.length * 3.2 + 7)} y="0" width={a.name.length * 6.4 + 14} height="15" rx="7" fill="#fff" fillOpacity=".92" stroke={st.color} />
          <text textAnchor="middle" y="11" fontSize="9.5" fontWeight="700" fill="#0f172a">{a.name}</text>
        </g>
      ) : (
        <g transform="translate(0,22)">
          <rect x="-66" y="0" width="132" height="31" rx="6" fill="#fff" fillOpacity=".94" stroke={st.color} />
          <text textAnchor="middle" y="12" fontSize="9.5" fontWeight="800" fill="#0f172a">{clip(a.name, 9)} · {RANK_SHORT[a.rank] || ""}{a.strikes > 0 ? " " + "✗".repeat(a.strikes) : ""}</text>
          <text textAnchor="middle" y="23" fontSize="8.5" fill="#475569">{clip(a.task, 27)}</text>
          {a.progress != null && <rect x="-60" y="27" width={Math.max(0, Math.min(120, a.progress * 1.2))} height="2.5" rx="1" fill={st.color} style={{ transition: "width .8s" }} />}
        </g>
      )}
    </g>
  );
}

// ── Static floor plan ───────────────────────────────────────────────────────
function Room({ x, y, w, h, fill, label, glass, lx, anchor }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={fill} stroke={glass ? "#8fb8d8" : "#8b95a5"} strokeWidth={glass ? 2.5 : 5} />
      <rect x={x} y={y} width={w} height={h} fill="url(#ofc-tile)" />
      <text x={lx ?? x + 10} y={y + h - 8} textAnchor={anchor || "start"} fontSize="9" fontWeight="800" fill="#64748b" letterSpacing="1.5" opacity=".8">{label}</text>
    </g>
  );
}
const Door = ({ x, y, w, h, fill }) => <rect x={x} y={y} width={w} height={h} fill={fill} />;
const Plant = ({ x, y }) => (
  <g transform={`translate(${x},${y})`}>
    <circle r="9" fill="#a16207" stroke="#78350f" /><circle r="14" fill="#16a34a" opacity=".85" /><circle cx="-4" cy="-3" r="8" fill="#22c55e" /><circle cx="5" cy="3" r="7" fill="#15803d" />
  </g>
);

function Desk({ d, agent }) {
  const on = agent && (agent.state === "working" || agent.state === "trading");
  const screen = on ? "#38bdf8" : agent && agent.state === "error" ? "#7f1d1d" : "#1e293b";
  return (
    <g transform={`translate(${d.x},${d.y})`}>
      <rect width="110" height="54" rx="3" fill="#c9a77c" stroke="#8a6a43" strokeWidth="1.5" />
      <rect x="2" y="2" width="106" height="50" rx="2" fill="none" stroke="#dcc29c" opacity=".7" />
      {/* monitor */}
      <rect x="30" y="5" width="50" height="5" rx="1" fill="#0f172a" />
      <rect className={on ? "ofc-screen" : ""} x="32" y="6" width="46" height="3" fill={screen} />
      <rect x="53" y="10" width="4" height="4" fill="#334155" />
      {/* keyboard + mouse + mug + papers */}
      <rect x="38" y="24" width="34" height="11" rx="2" fill="#e5e7eb" stroke="#9ca3af" />
      <rect x="40" y="26" width="30" height="7" fill="#d1d5db" opacity=".7" />
      <ellipse cx="86" cy="30" rx="3.5" ry="5" fill="#f3f4f6" stroke="#9ca3af" />
      <circle cx="12" cy="38" r="5" fill="#fff" stroke="#9ca3af" /><circle cx="12" cy="38" r="3" fill="#78350f" />
      <rect x="92" y="10" width="12" height="15" fill="#fff" stroke="#cbd5e1" transform="rotate(8 98 17)" />
      {/* nameplate */}
      <rect x="40" y="42" width="30" height="8" rx="1" fill="#1f2937" />
      <text x="55" y="48.5" textAnchor="middle" fontSize="6" fill="#e5e7eb" fontWeight="700">{agent ? clip(agent.name.toUpperCase(), 8) : "OPEN"}</text>
      {/* chair */}
      <circle cx="55" cy="70" r="15" fill="#334155" stroke="#0f172a" transform="translate(0,0)" />
    </g>
  );
}

function FloorPlan({ counts, now, agents }) {
  const h = now.getHours() % 12, m = now.getMinutes(), s = now.getSeconds();
  const hAng = (h + m / 60) * 30, mAng = (m + s / 60) * 6;
  const byIdx = i => agents.find(a => a.rank !== "CEO" && ["trading", "working", "idle", "error"].includes(a.state) && (Number.isInteger(a.desk) ? a.desk : a.idx) === i);
  return (
    <g>
      <defs>
        <pattern id="ofc-tile" width="24" height="24" patternUnits="userSpaceOnUse">
          <path d="M24 0H0V24" fill="none" stroke="#000" strokeOpacity=".05" />
        </pattern>
        <linearGradient id="ofc-win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bae6fd" /><stop offset="1" stopColor="#7dd3fc" /></linearGradient>
      </defs>
      <rect width="1000" height="620" fill="#d6dbe3" />
      <rect width="1000" height="620" fill="url(#ofc-tile)" />

      {/* windows along the top */}
      {[40, 190, 340, 490, 690, 840].map(x => <rect key={x} x={x} y="6" width="110" height="9" rx="2" fill="url(#ofc-win)" stroke="#94a3b8" />)}

      {/* rooms */}
      <Room x={20} y={20} w={620} h={400} fill="#e9e3d6" label="OPEN WORKSPACE" lx={220} />
      <Room x={670} y={20} w={310} h={210} fill="#dde6ef" label="MEETING ROOM" glass />
      <Room x={670} y={250} w={310} h={170} fill="#e8d9bf" label="BREAK ROOM" lx={970} anchor="end" />
      <Room x={20} y={440} w={310} h={160} fill="#cdd5df" label="SERVER ROOM" />
      <Room x={350} y={440} w={300} h={160} fill="#dde6ef" label="OPS / MISSION CONTROL" />
      <Room x={670} y={440} w={310} h={160} fill="#e9e3d6" label="LOBBY / OUT OF OFFICE" />

      {/* doors */}
      <Door x={636} y={175} w={9} h={60} fill="#e9e3d6" />
      <Door x={666} y={185} w={9} h={50} fill="#dde6ef" />
      <Door x={666} y={242} w={9} h={40} fill="#e8d9bf" />
      <Door x={150} y={436} w={40} h={9} fill="#cdd5df" />
      <Door x={800} y={436} w={40} h={9} fill="#e9e3d6" />
      <Door x={490} y={436} w={40} h={9} fill="#dde6ef" />

      {/* wall clock */}
      <g transform="translate(330,20)">
        <circle r="13" fill="#fff" stroke="#475569" strokeWidth="2" />
        {[0, 3, 6, 9].map(k => <line key={k} x1="0" y1="-10" x2="0" y2="-8" stroke="#475569" transform={`rotate(${k * 30})`} />)}
        <line x1="0" y1="0" x2="0" y2="-6" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" transform={`rotate(${hAng})`} />
        <line x1="0" y1="0" x2="0" y2="-9" stroke="#0f172a" strokeWidth="1.2" strokeLinecap="round" transform={`rotate(${mAng})`} />
        <line x1="0" y1="2" x2="0" y2="-10" stroke="#ef4444" strokeWidth=".7" transform={`rotate(${s * 6})`} />
      </g>

      {/* desks */}
      {DESKS.map((d, i) => <Desk key={i} d={d} agent={byIdx(i)} />)}
      {/* printer + cabinets */}
      <rect x="40" y="385" width="46" height="26" rx="3" fill="#f1f5f9" stroke="#94a3b8" /><rect x="48" y="391" width="30" height="5" fill="#cbd5e1" /><text x="63" y="406" textAnchor="middle" fontSize="6" fill="#64748b" fontWeight="700">PRINTER</text>
      {[110, 135, 160].map(x => <g key={x}><rect x={x} y="385" width="22" height="26" fill="#94a3b8" stroke="#64748b" /><line x1={x + 2} y1="398" x2={x + 20} y2="398" stroke="#64748b" /></g>)}
      <Plant x={610} y={50} /><Plant x={45} y={44} /><Plant x={610} y={395} />

      {/* meeting room */}
      <rect x="760" y="26" width="130" height="8" rx="1" fill="#fff" stroke="#94a3b8" />
      <text x="825" y="32.5" textAnchor="middle" fontSize="6" fill="#64748b" fontWeight="700">WHITEBOARD</text>
      <ellipse cx="825" cy="120" rx="78" ry="34" fill="#a97c50" stroke="#6b4a2b" strokeWidth="2" />
      <ellipse cx="825" cy="118" rx="70" ry="28" fill="#c29467" opacity=".6" />
      {[[795, 112], [840, 124], [820, 108]].map(([x, y], k) => <rect key={k} x={x} y={y} width="14" height="9" fill="#fff" stroke="#cbd5e1" transform={`rotate(${k * 20} ${x} ${y})`} />)}
      {ZONE_SPOTS.meeting.map(([x, y], k) => <circle key={k} cx={x} cy={y + 4} r="14" fill="#475569" stroke="#1e293b" opacity=".85" />)}
      <Plant x={955} y={45} />

      {/* break room */}
      <rect x="690" y="385" width="110" height="28" rx="8" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      <rect x="696" y="388" width="46" height="20" rx="6" fill="#d97706" /><rect x="750" y="388" width="46" height="20" rx="6" fill="#d97706" />
      <rect x="900" y="262" width="60" height="26" rx="3" fill="#475569" stroke="#1e293b" /><rect x="908" y="266" width="14" height="16" fill="#0f172a" /><circle cx="940" cy="275" r="5" fill="#ef4444" className="ofc-blink" />
      <text x="930" y="298" textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="800">COFFEE</text>
      <rect x="840" y="262" width="20" height="26" rx="4" fill="#bae6fd" stroke="#38bdf8" /><text x="850" y="298" textAnchor="middle" fontSize="6.5" fill="#64748b" fontWeight="800">WATER</text>
      <ellipse cx="860" cy="355" rx="38" ry="22" fill="#d6c3a0" stroke="#92704a" strokeWidth="2" />
      <Plant x={962} y={335} />

      {/* server room */}
      {[40, 90, 140, 190, 240, 290].map((x, k) => (
        <g key={x}>
          <rect x={x - 17} y="450" width="34" height="38" rx="2" fill="#1f2937" stroke="#0f172a" />
          {[0, 1, 2, 3].map(r => <g key={r}><rect x={x - 13} y={455 + r * 8} width="26" height="5" fill="#374151" />
            <circle cx={x + 9} cy={457.5 + r * 8} r="1.3" fill={counts.error > 0 && (k + r) % 3 === 0 ? "#ef4444" : "#22c55e"} className="ofc-blink" /></g>)}
        </g>
      ))}

      {/* ops / mission control */}
      <rect x="370" y="452" width="260" height="78" rx="4" fill="#0f172a" stroke="#475569" strokeWidth="3" />
      <text x="500" y="468" textAnchor="middle" fontSize="9" fontWeight="800" fill="#38bdf8" letterSpacing="2">MISSION CONTROL</text>
      {Object.entries(STATES).map(([k, st], n) => (
        <g key={k} transform={`translate(${380 + n * 41},476)`}>
          <rect width="38" height="46" rx="4" fill="#111c33" stroke={st.color} strokeOpacity=".6" />
          <text x="19" y="19" textAnchor="middle" fontSize="15" fontWeight="800" fill={st.color}>{counts[k]}</text>
          <text x="19" y="31" textAnchor="middle" fontSize="10">{st.icon}</text>
          <text x="19" y="41" textAnchor="middle" fontSize="5" fill="#94a3b8" fontWeight="700">{st.short}</text>
        </g>
      ))}
      <rect x="440" y="548" width="120" height="34" rx="3" fill="#c9a77c" stroke="#8a6a43" strokeWidth="1.5" />
      <rect x="480" y="552" width="40" height="5" fill="#0f172a" />
      <text x="500" y="575" textAnchor="middle" fontSize="6" fontWeight="800" fill="#78350f" letterSpacing="1">CEO OFFICE</text>
      <Plant x={390} y={565} /><Plant x={612} y={565} />

      {/* lobby */}
      <rect x="760" y="455" width="120" height="26" rx="3" fill="#78716c" stroke="#44403c" strokeWidth="2" />
      <text x="820" y="472" textAnchor="middle" fontSize="8" fontWeight="800" fill="#e7e5e4" letterSpacing="1">RECEPTION</text>
      <Plant x={690} y={460} /><Plant x={960} y={460} />
    </g>
  );
}

const HR_ICON = { hired: "🆕", promoted: "⬆️", demoted: "⬇️", terminated: "🚫", fixed: "🔧" };
const HR_COLOR = { hired: "#60a5fa", promoted: "#22c55e", demoted: "#f59e0b", terminated: "#ef4444", fixed: "#94a3b8" };
function HrPanel({ items }) {
  return (
    <div style={{ background: "#0b1424", border: "1px solid #ef444455", borderRadius: 10, padding: 10, maxHeight: 220, overflowY: "auto" }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: 1, marginBottom: 6 }}>🏛 HR · ACCOUNTABILITY</div>
      <div style={{ fontSize: 10, color: "#475569", marginBottom: 6 }}>Unfixed mistakes in a row = terminated and replaced ({MAX_STRIKES} for trading tools, 5 for ordinary coding errors). Top performers rise to CEO.</div>
      {items.length === 0 && <div style={{ fontSize: 11, color: "#475569" }}>No HR events yet.</div>}
      {items.slice(0, 20).map((h, i) => (
        <div key={i} style={{ fontSize: 11, padding: "3px 0", borderBottom: "1px solid #111827", color: "#94a3b8" }}>
          <span style={{ color: "#475569", fontFamily: "monospace" }}>{hhmmss(h.t)}</span> {HR_ICON[h.type] || "•"}{" "}
          <b style={{ color: HR_COLOR[h.type] || "#cbd5e1" }}>{h.agent}</b> {h.detail}
        </div>
      ))}
    </div>
  );
}
