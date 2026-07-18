// Vercel serverless function — generates AI reports with automatic provider fallback.
// Priority: Anthropic (if key set and has credits) -> Google Gemini (free tier).
//
// SETUP:
//   Vercel -> Settings -> Environment Variables:
//     ANTHROPIC_API_KEY  (optional, from console.anthropic.com — paid, min $5 credits)
//     GEMINI_API_KEY     (free, from https://aistudio.google.com/apikey — no credit card)
//   Then redeploy.

export const config = {
  maxDuration: 60,
};

// ── Gemini helpers ───────────────────────────────────────────────────────────
// Model IDs verified current as of July 2026 — tried in order until one succeeds.
// (Google retired gemini-2.5-flash / -lite for new API keys in 2026.)
const GEMINI_MODELS = ["gemini-3.5-flash", "gemini-3-flash-preview", "gemini-2.5-flash-preview"];

async function callGemini(apiKey, messages, wantSearch, maxTokens) {
  // Convert Anthropic-style messages to a single Gemini prompt
  const prompt = messages.map(m => (typeof m.content === "string" ? m.content : "")).join("\n\n");
  const errors = [];
  for (const model of GEMINI_MODELS) {
    try {
      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          // Gemini 3.x models spend "thinking" tokens that count against this limit,
          // so give ample headroom to avoid the JSON being truncated mid-response.
          maxOutputTokens: Math.max((maxTokens || 1500) * 4, 8192),
          // When the caller wants structured output (the report call, no search tools),
          // force valid JSON at the API level so parsing can never fail on formatting.
          ...(wantSearch ? {} : { responseMimeType: "application/json" }),
        },
        ...(wantSearch ? { tools: [{ google_search: {} }] } : {}),
      };
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }
      );
      const d = await r.json();
      if (!r.ok) { errors.push(`${model}: ${d?.error?.message || `HTTP ${r.status}`}`); continue; }
      const text = (d?.candidates?.[0]?.content?.parts || [])
        .map(p => p.text || "").filter(Boolean).join("\n").trim();
      if (!text) { errors.push(`${model}: empty response`); continue; }
      // Normalise to Anthropic response shape so the frontend needs no changes
      const content = [];
      if (wantSearch && d?.candidates?.[0]?.groundingMetadata) {
        content.push({ type: "web_search_tool_result", content: [] });
      }
      content.push({ type: "text", text });
      return { ok: true, data: { content, provider: `gemini:${model}` } };
    } catch (e) { errors.push(`${model}: ${e.message}`); }
  }
  return { ok: false, error: errors.join(" | ") || "All Gemini models failed" };
}

// ── Anthropic helper ─────────────────────────────────────────────────────────
async function callAnthropic(apiKey, messages, tools, maxTokens) {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: maxTokens || 1500,
      messages,
      ...(tools ? { tools } : {}),
    }),
  });
  const d = await r.json();
  if (!r.ok) return { ok: false, status: r.status, error: d?.error?.message || "Anthropic API request failed" };
  return { ok: true, data: d };
}

// ── Handler ──────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!anthropicKey && !geminiKey) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "No AI provider key is set. Add GEMINI_API_KEY (free, from aistudio.google.com/apikey) and/or ANTHROPIC_API_KEY in Vercel -> Settings -> Environment Variables, then redeploy."
    });
  }

  const { messages, tools, max_tokens } = req.body || {};
  if (!messages) {
    return res.status(400).json({ error: "bad_request", message: "Missing 'messages' in request body." });
  }
  const wantSearch = Array.isArray(tools) && tools.length > 0;

  try {
    // 1) Try Anthropic first if a key is present
    if (anthropicKey) {
      const a = await callAnthropic(anthropicKey, messages, tools, max_tokens);
      if (a.ok) return res.status(200).json(a.data);
      console.error("Anthropic failed, will try Gemini fallback:", a.status, a.error);
      // fall through to Gemini regardless of the reason (credits, rate limit, etc.)
    }

    // 2) Gemini fallback (or primary, if no Anthropic key)
    if (geminiKey) {
      const g = await callGemini(geminiKey, messages, wantSearch, max_tokens);
      if (g.ok) return res.status(200).json(g.data);
      console.error("Gemini also failed:", g.error);
      return res.status(502).json({ error: "all_providers_failed", message: `Gemini error: ${g.error}` });
    }

    // Anthropic failed and no Gemini key configured
    return res.status(502).json({
      error: "anthropic_api_error",
      message: "Anthropic request failed and no GEMINI_API_KEY fallback is configured. Add a free Gemini key (aistudio.google.com/apikey) in Vercel -> Settings -> Environment Variables."
    });
  } catch (e) {
    console.error("Server error:", e);
    return res.status(500).json({ error: "server_error", message: e.message });
  }
}