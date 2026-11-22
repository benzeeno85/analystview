#!/usr/bin/env node
/**
 * Installs the Agent Office hooks into ~/.claude/settings.json.
 * Safe to re-run: backs up the file first, keeps your existing settings and hooks,
 * and doesn't add duplicates.   Usage:  node scripts/install-hooks.js
 */
const fs = require("fs");
const os = require("os");
const path = require("path");

const hook = path.resolve(__dirname, "agent-office-hook.js").replace(/\\/g, "/");
const command = `node "${hook}"`;
const dir = path.join(process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), ".claude"));
const file = path.join(dir, "settings.json");
const EVENTS = { SessionStart: false, UserPromptSubmit: false, PreToolUse: true, PostToolUse: true, PostToolUseFailure: true, Notification: false, Stop: false, SessionEnd: false };

fs.mkdirSync(dir, { recursive: true });
let settings = {};
if (fs.existsSync(file)) {
  const text = fs.readFileSync(file, "utf8");
  try { settings = text.trim() ? JSON.parse(text) : {}; }
  catch (e) { console.error(`Could not parse ${file}: ${e.message}\nNothing changed. Fix or move that file and re-run.`); process.exit(1); }
  fs.copyFileSync(file, file + ".bak-agent-office");
}
settings.hooks = settings.hooks || {};
let added = 0;
for (const [ev, needsMatcher] of Object.entries(EVENTS)) {
  const list = (settings.hooks[ev] = settings.hooks[ev] || []);
  const want = needsMatcher === true ? "" : needsMatcher;
  const mine = list.find(g => (g.hooks || []).some(h => h.command === command));
  if (mine) { // already installed: widen an older, narrower matcher (e.g. mcp__.* -> all tools)
    if (needsMatcher && (mine.matcher || "") !== want) { mine.matcher = want; added++; }
    continue;
  }
  list.push({ ...(needsMatcher ? { matcher: needsMatcher === true ? "" : needsMatcher } : {}), hooks: [{ type: "command", command }] });
  added++;
}
fs.writeFileSync(file, JSON.stringify(settings, null, 2));
console.log(added ? `Added ${added} hook(s) to ${file}` : `Already installed in ${file}`);
console.log(`Hook script: ${hook}\nRestart your Claude Code sessions, then run: npm start`);
