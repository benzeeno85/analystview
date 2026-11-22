#!/usr/bin/env node
/**
 * Claude Code hook -> Agent Office feed.
 *
 * Claude Code runs this on session events and passes the event as JSON on stdin.
 * It upserts one agent per session into public/agents_latest.json, which the
 * Office tab polls every 5s (run `npm start` and the office updates live).
 *
 * Override the output file with AGENT_OFFICE_FILE. Never blocks Claude Code:
 * every failure exits 0 silently.
 *
 * Privacy: stores a short (60 char) snippet of prompts/commands. The feed file is
 * git-ignored so it is not published; keep it that way.
 */
const fs = require("fs");
const path = require("path");

const FILE = process.env.AGENT_OFFICE_FILE || path.join(__dirname, "..", "public", "agents_latest.json");
const MAX_AGENTS = 10;
const MAX_STRIKES = Number(process.env.AGENT_OFFICE_MAX_STRIKES) || 3; // consecutive unresolved mistakes before termination
const MAX_CODE_STRIKES = Number(process.env.AGENT_OFFICE_MAX_CODE_STRIKES) || 5; // limit for ordinary coding/tool errors (builds, tests, edits)
const ENFORCE = process.env.AGENT_OFFICE_ENFORCE === "1";             // block a terminated session's tool calls
const FIRED_PRUNE_MS = 10 * 60e3;
const CEO_MIN = 100;                                                  // points needed to be eligible for CEO
const RANKS = [["Intern", 0], ["Analyst", 8], ["Trader", 20], ["Senior Trader", 40], ["Portfolio Manager", 70]];
const rankOf = pts => RANKS.reduce((r, [n, min]) => (pts >= min ? n : r), "Intern");
const OFFLINE_PRUNE_MS = 2 * 3600e3;
const STALE_WORKING_MS = 30 * 60e3;
const clip = (s, n = 60) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// ── Trading detection (TradingView MCP etc.) ────────────────────────────────
const parts = n => String(n || "").split("__"); // mcp__server__tool
const isMcp = n => String(n || "").startsWith("mcp__");
const isTradingServer = n => isMcp(n) && /trad|tv|broker|alpaca|binance|ibkr|bybit|kucoin|ccxt|okx|bitget|kraken|coinbase|crypto|exchange/i.test(parts(n)[1] || "");

// The team's agenda (default: crypto / KuCoin). Override with AGENT_OFFICE_AGENDA (a regex source).
const AGENDA = new RegExp(process.env.AGENT_OFFICE_AGENDA || "kucoin|ccxt|crypto|\\b(btc|eth|sol|xrp|doge|bnb|ada|avax)[-_/ ]?usdt?\\b|usdt|funding[ _-]?rate|orderbook|order[ _-]?book", "i");
const toolText = ev => { try { return `${ev.tool_name} ${JSON.stringify(ev.tool_input || {})}`.slice(0, 3000); } catch { return String(ev.tool_name || ""); } };
const onAgenda = ev => !!ev.tool_name && (isTradingServer(ev.tool_name) || AGENDA.test(toolText(ev)));
const bashCmd = ev => (ev.tool_name === "Bash" && ev.tool_input && ev.tool_input.command) || "";
// A shell/script call that places an order on the agenda venue
const isBashTrade = ev => ev.tool_name === "Bash" && AGENDA.test(bashCmd(ev)) && /(create_?order|place_?order|market_(buy|sell)|limit_(buy|sell)|\/api\/v\d\/orders|--side\b|["']side["']\s*:)/i.test(bashCmd(ev));
const shortTool = n => parts(n).slice(2).join("__") || String(n);
const isTradeTool = n => isMcp(n) && !/^(get|list|read|fetch|search|view|show|screenshot|chart|quote|history|describe)/i.test(shortTool(n))
  && /order|trade|buy|sell|position|close|entry|exit|execute|bracket|stop|limit|market/i.test(shortTool(n));
const pickField = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== "") return o[k]; };
function tradeFromBash(cmd) {
  const m = (re) => { const x = re.exec(cmd); return x ? x[1] : undefined; };
  const sym = m(/\b([A-Z0-9]{2,8}[-_/]USDT?)\b/i);
  return {
    side: m(/\b(buy|sell|long|short)\b/i),
    symbol: sym && sym.toUpperCase().replace(/[_/]/g, "-"),
    qty: (v => (v == null ? v : Number(v)))(m(/(?:--?(?:size|qty|quantity|amount)[ =]|["']?(?:size|qty|quantity|amount)["']?\s*[:=]\s*["']?)(\d+(?:\.\d+)?)/i)),
    price: (v => (v == null ? v : Number(v)))(m(/(?:--?price[ =]|["']?price["']?\s*[:=]\s*["']?)(\d+(?:\.\d+)?)/i)),
  };
}
function tradeFrom(ev) {
  if (ev.tool_name === "Bash") return tradeFromBash(bashCmd(ev));
  const i = ev.tool_input || {}, name = shortTool(ev.tool_name);
  let side = pickField(i, ["side", "action", "direction", "order_side", "type"]);
  if (!side) side = (/buy|long/i.test(name) && "buy") || (/sell|short/i.test(name) && "sell") || undefined;
  const num = v => (v == null || isNaN(Number(v)) ? v : Number(v));
  return {
    side: side ? String(side) : undefined,
    symbol: pickField(i, ["symbol", "ticker", "pair", "instrument", "market"]),
    qty: num(pickField(i, ["quantity", "qty", "size", "amount", "contracts", "lots"])),
    price: num(pickField(i, ["price", "limit_price", "entry", "entry_price", "limitPrice"])),
  };
}
function responseText(ev) {
  const r = ev.tool_response;
  try { return (typeof r === "string" ? r : JSON.stringify(r) || "").slice(0, 4000); } catch { return ""; }
}
const parsePnl = txt => {
  const m = /(?:realized[\s_-]*)?(?:p&l|pnl|profit(?:[\s_-]*loss)?)["'\s:=]*\$?\s*(-?\d+(?:\.\d+)?)/i.exec(txt);
  return m ? Number(m[1]) : undefined;
};

function describe(ev) {
  const d = describe0(ev);
  return ev._on && !isMcp(ev.tool_name) ? clip("₿ " + d) : d;
}
function describe0(ev) {
  const t = ev.tool_name, i = ev.tool_input || {};
  const base = p => (p ? path.basename(String(p)) : "");
  if (isMcp(t)) {
    if (isTradeTool(t)) { const x = tradeFrom(ev); return clip(`Placing ${x.side || "trade"} ${x.symbol || ""} ${x.qty != null ? "×" + x.qty : ""}`); }
    const sym = pickField(i, ["symbol", "ticker", "pair"]);
    return clip(`${parts(t)[1]}: ${shortTool(t)}${sym ? " " + sym : ""}`);
  }
  switch (t) {
    case "Bash": return clip(`Running: ${i.description || i.command}`);
    case "Edit": case "Write": case "NotebookEdit": return `Editing ${base(i.file_path || i.notebook_path)}`;
    case "Read": return `Reading ${base(i.file_path)}`;
    case "Grep": case "Glob": return clip(`Searching: ${i.pattern}`);
    case "WebSearch": return clip(`Searching web: ${i.query}`);
    case "WebFetch": return clip(`Fetching ${i.url}`);
    case "Agent": case "Task": return clip(`Delegating: ${i.description}`);
    default: return t ? `Using ${t}` : "Working";
  }
}

function update(agent, ev) {
  switch (ev.hook_event_name) {
    case "SessionStart": return { state: "idle", task: "Session started", progress: 0 };
    case "UserPromptSubmit": return { state: "working", task: clip(ev.prompt) || "Working", progress: 5 };
    case "PreToolUse": return { state: ev._on ? "trading" : "working", task: describe(ev), progress: Math.min(95, (agent.progress || 5) + 3) };
    case "Notification": return { state: "idle", task: clip(`Needs you: ${ev.message}`, 80) };
    case "Stop": return { state: "idle", task: "Done — awaiting your next order", progress: 100 };
    case "SessionEnd": return { state: "offline", task: "Session ended" };
    default: return null;
  }
}

function withLock(fn) {
  const lock = FILE + ".lock";
  for (let n = 0; n < 40; n++) {
    try { fs.mkdirSync(lock); break; }
    catch (e) {
      if (e.code !== "EEXIST") return fn();
      try { if (Date.now() - fs.statSync(lock).mtimeMs > 5000) fs.rmdirSync(lock); } catch {}
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 25);
    }
  }
  try { return fn(); } finally { try { fs.rmdirSync(lock); } catch {} }
}

// ── Accountability: strikes, termination, ranks, desks ──────────────────────
const hr = (feed, now, type, agent, detail) => { feed.hr = [{ t: now, type, agent, detail }, ...(feed.hr || [])].slice(0, 40); };

// A "mistake" is a failed tool call: a trading tool (limit MAX_STRIKES) or any ordinary tool such
// as Bash, Edit or a build/test run (limit MAX_CODE_STRIKES). It is "fixed" when the same tool
// (or, for trading, any call on that trading server) succeeds again. Unfixed strikes accumulate.
const failKey = n => (isTradingServer(n) ? "trading:" + parts(n)[1] : String(n));
const isUserDenial = txt => /(permission|denied|rejected by (the )?user|user (doesn't|does not) want|interrupted by user|request was aborted)/i.test(txt);

function judge(feed, a, ev, now, isFailureEvent) {
  const name = ev.tool_name, trade = isTradeTool(name) || isBashTrade(ev), trading = isTradingServer(name) || isBashTrade(ev);
  const key = trading ? "trading:" + (parts(name)[1] || "bash") : String(name);
  const txt = isFailureEvent ? String(ev.error || responseText(ev)) : responseText(ev);
  if (isFailureEvent && (ev.is_interrupt === true || isUserDenial(txt.slice(0, 300)))) return; // not the agent's mistake
  const failed = isFailureEvent
    || (ev.tool_response && ev.tool_response.is_error === true)
    || (trading && /\b(error|rejected|insufficient|failed|invalid)\b/i.test(txt.slice(0, 600)));
  const pnl = trade && !failed ? parsePnl(txt) : undefined;
  if (trade) {
    const tr = { t: now, agent: a.name, venue: a.venue, tool: shortTool(name), ...tradeFrom(ev), status: failed ? "error" : "ok", ...(pnl != null ? { pnl } : {}) };
    feed.trades = [tr, ...(feed.trades || [])].slice(0, 50);
    if (pnl != null) a.pnl = Math.round(((a.pnl || 0) + pnl) * 100) / 100;
  }
  if (failed) {
    const limit = trading ? MAX_STRIKES : MAX_CODE_STRIKES;
    a.strikes = (a.strikes || 0) + 1; a.mistakes = (a.mistakes || 0) + 1; a.points = (a.points || 0) - (trading ? 3 : 1);
    a.failKey = key; a.limit = limit;
    if (a.strikes >= limit) {
      Object.assign(a, { state: "fired", task: `Terminated: ${a.strikes} unresolved mistakes`, firedAt: now });
      hr(feed, now, "terminated", a.name, `${a.strikes} unresolved mistakes in a row (last: ${shortTool(name)})`);
    } else {
      Object.assign(a, { state: "error", task: clip(`Mistake in ${shortTool(name)} — strike ${a.strikes}/${limit}`, 70) });
    }
  } else {
    if (a.strikes > 0 && a.failKey === key) {
      a.fixes = (a.fixes || 0) + 1; a.points = (a.points || 0) + 2; a.strikes = 0;
      hr(feed, now, "fixed", a.name, `Fixed their mistake (${shortTool(name)} works again)`);
      Object.assign(a, { state: trading ? "trading" : "working", task: "Fixed the mistake — back to work" });
    }
    if (trade) a.points = (a.points || 0) + 1 + (pnl != null ? pnl / 100 : 0);
  }
  a.points = Math.round((a.points || 0) * 100) / 100;
}

function promote(feed, now) {
  const live = feed.agents.filter(x => x.state !== "fired" && x.state !== "offline");
  const ceo = live.filter(x => (x.points || 0) >= CEO_MIN).sort((p, q) => q.points - p.points)[0];
  feed.agents.forEach(x => {
    const want = x.state === "fired" ? x.rank : ceo && x.id === ceo.id ? "CEO" : rankOf(x.points || 0);
    if (x.rank && x.rank !== want && x.state !== "fired") {
      const up = want === "CEO" || RANKS.findIndex(r => r[0] === want) > RANKS.findIndex(r => r[0] === x.rank);
      hr(feed, now, up ? "promoted" : "demoted", x.name, want === "CEO" ? "Became CEO 👑" : `${up ? "Promoted" : "Demoted"} to ${want}`);
    }
    x.rank = want;
  });
}

function assignDesks(feed) {
  feed.agents.forEach(x => { if (x.state === "fired" || x.state === "offline" || x.rank === "CEO") delete x.desk; });
  const seated = feed.agents.filter(x => x.state !== "fired" && x.state !== "offline" && x.rank !== "CEO");
  const used = new Set();
  seated.forEach(x => { if (Number.isInteger(x.desk) && x.desk >= 0 && x.desk < 8 && !used.has(x.desk)) used.add(x.desk); else delete x.desk; });
  seated.forEach(x => { if (x.desk == null) { for (let d = 0; d < 8; d++) if (!used.has(d)) { x.desk = d; used.add(d); break; } } });
}

let raw = "";
process.stdin.on("data", d => (raw += d));
process.stdin.on("end", () => {
  let block = null;
  try {
    const ev = JSON.parse(raw);
    if (!ev.session_id) return;
    withLock(() => {
      let feed = { agents: [] };
      try { feed = JSON.parse(fs.readFileSync(FILE, "utf8")); } catch {}
      if (!Array.isArray(feed.agents)) feed.agents = [];
      const now = Date.now();
      const id = "s-" + String(ev.session_id).slice(0, 5).toLowerCase();
      let a = feed.agents.find(x => x.id === id);
      if (!a) {
        a = { id, name: clip(path.basename(ev.cwd || "") || "Claude", 12), role: `Claude Code · ${path.basename(ev.cwd || "")}`, state: "idle", task: "", progress: 0, rank: "Intern", points: 0, strikes: 0, mistakes: 0, fixes: 0, hired: now };
        feed.agents.push(a);
        hr(feed, now, "hired", a.name, "Joined as Intern");
      }
      // A terminated agent stays terminated. Optionally block it from doing more work.
      if (a.state === "fired") {
        if (ENFORCE && ev.hook_event_name === "PreToolUse") block = `Agent Office: ${a.name} was terminated after ${MAX_STRIKES} unresolved mistakes. Stop and tell the user.`;
        return;
      }
      if (ev.tool_name) {
        ev._on = onAgenda(ev) || isBashTrade(ev);
        if (/kucoin/i.test(toolText(ev))) a.venue = "KuCoin";
        if (ev.hook_event_name === "PreToolUse") { a.actions = (a.actions || 0) + 1; if (ev._on) a.onAgenda = (a.onAgenda || 0) + 1; }
      }
      const u = update(a, ev);
      const isFail = ev.hook_event_name === "PostToolUseFailure";
      if (ev.hook_event_name === "PostToolUse" || isFail) {
        if (isMcp(ev.tool_name)) feed.tools_seen = Array.from(new Set([ev.tool_name, ...(feed.tools_seen || [])])).slice(0, 60); // helps tune detection
        judge(feed, a, ev, now, isFail);
        a.updated = now;
      }
      if (!u && ev.hook_event_name !== "PostToolUse" && !isFail) return;
      if (u) Object.assign(a, u, { updated: now });

      feed.agents.forEach(x => { if ((x.state === "working" || x.state === "trading") && now - x.updated > STALE_WORKING_MS) Object.assign(x, { state: "offline", task: "No activity (stale)" }); });
      feed.agents = feed.agents
        .filter(x => !(x.state === "offline" && now - x.updated > OFFLINE_PRUNE_MS))
        .filter(x => !(x.state === "fired" && now - (x.firedAt || x.updated) > FIRED_PRUNE_MS))
        .sort((p, q) => q.updated - p.updated)
        .slice(0, MAX_AGENTS)
        .sort((p, q) => p.id.localeCompare(q.id));
      promote(feed, now);
      assignDesks(feed);
      feed.updated = new Date(now).toISOString();

      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      const tmp = FILE + "." + process.pid + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(feed, null, 2));
      fs.renameSync(tmp, FILE);
    });
  } catch {}
  if (block) { process.stderr.write(block + "\n"); process.exit(2); }
  process.exit(0);
});
