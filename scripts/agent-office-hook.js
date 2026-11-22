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

function describe(ev) {
  const t = ev.tool_name, i = ev.tool_input || {};
  const base = p => (p ? path.basename(String(p)) : "");
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
    case "PreToolUse": return { state: "working", task: describe(ev), progress: Math.min(95, (agent.progress || 5) + 3) };
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
      if (!u) return;
      Object.assign(a, u, { updated: now });

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
