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
const MAX_AGENTS = 8;
const OFFLINE_PRUNE_MS = 2 * 3600e3;
const STALE_WORKING_MS = 30 * 60e3;
const clip = (s, n = 60) => String(s || "").replace(/\s+/g, " ").trim().slice(0, n);

// ── Trading detection (TradingView MCP etc.) ────────────────────────────────
const parts = n => String(n || "").split("__"); // mcp__server__tool
const isMcp = n => String(n || "").startsWith("mcp__");
const isTradingServer = n => isMcp(n) && /trad|tv|broker|alpaca|binance|ibkr|bybit/i.test(parts(n)[1] || "");
const shortTool = n => parts(n).slice(2).join("__") || String(n);
const isTradeTool = n => isMcp(n) && !/^(get|list|read|fetch|search|view|show|screenshot|chart|quote|history|describe)/i.test(shortTool(n))
  && /order|trade|buy|sell|position|close|entry|exit|execute|bracket|stop|limit|market/i.test(shortTool(n));
const pickField = (o, keys) => { for (const k of keys) if (o && o[k] != null && o[k] !== "") return o[k]; };
function tradeFrom(ev) {
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
    case "SessionStart": return { state: "break", task: "Session started", progress: 0 };
    case "UserPromptSubmit": return { state: "working", task: clip(ev.prompt) || "Working", progress: 5 };
    case "PreToolUse": return { state: isTradingServer(ev.tool_name) ? "trading" : "working", task: describe(ev), progress: Math.min(95, (agent.progress || 5) + 3) };
    case "Notification": return { state: "error", task: clip(`Needs you: ${ev.message}`, 80) };
    case "Stop": return { state: "break", task: "Done — waiting for your next prompt", progress: 100 };
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

let raw = "";
process.stdin.on("data", d => (raw += d));
process.stdin.on("end", () => {
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
        a = { id, name: clip(path.basename(ev.cwd || "") || "Claude", 12), role: `Claude Code · ${path.basename(ev.cwd || "")}`, state: "break", task: "", progress: 0 };
        feed.agents.push(a);
      }
      const u = update(a, ev);
      if (ev.hook_event_name === "PostToolUse" && isMcp(ev.tool_name)) {
        // learn which MCP tools exist so detection can be tuned (see feed.tools_seen)
        feed.tools_seen = Array.from(new Set([ev.tool_name, ...(feed.tools_seen || [])])).slice(0, 60);
        if (isTradeTool(ev.tool_name)) {
          const txt = responseText(ev);
          const failed = (ev.tool_response && ev.tool_response.is_error === true) || /\b(error|rejected|insufficient|failed|invalid)\b/i.test(txt.slice(0, 600));
          const pnl = failed ? undefined : parsePnl(txt);
          const tr = { t: now, agent: a.name, tool: shortTool(ev.tool_name), ...tradeFrom(ev), status: failed ? "error" : "ok", ...(pnl != null ? { pnl } : {}) };
          feed.trades = [tr, ...(feed.trades || [])].slice(0, 50);
          if (pnl != null) a.pnl = Math.round(((a.pnl || 0) + pnl) * 100) / 100;
          a.updated = now;
        }
      }
      if (!u && ev.hook_event_name !== "PostToolUse") return;
      if (u) Object.assign(a, u, { updated: now });

      feed.agents.forEach(x => { if (x.state === "working" && now - x.updated > STALE_WORKING_MS) Object.assign(x, { state: "offline", task: "No activity (stale)" }); });
      feed.agents = feed.agents
        .filter(x => !(x.state === "offline" && now - x.updated > OFFLINE_PRUNE_MS))
        .sort((p, q) => q.updated - p.updated)
        .slice(0, MAX_AGENTS)
        .sort((p, q) => p.id.localeCompare(q.id)); // stable desk assignment
      feed.updated = new Date(now).toISOString();

      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      const tmp = FILE + "." + process.pid + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(feed, null, 2));
      fs.renameSync(tmp, FILE);
    });
  } catch {}
  process.exit(0);
});
