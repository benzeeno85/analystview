// Vercel serverless function — proxies AI report requests to Anthropic's API.
// This runs on Vercel's server, NOT in the browser, so your API key stays secret.
//
// SETUP (one-time):
// 1. Get a free API key at https://console.anthropic.com  (Settings -> API Keys -> Create Key)
// 2. Go to your Vercel project -> Settings -> Environment Variables
// 3. Add: Name = ANTHROPIC_API_KEY, Value = <paste your key>, apply to Production + Preview + Development
// 4. Redeploy (Vercel -> Deployments -> ... -> Redeploy), or just `git push` again

export default async function handler(req, res) {
  // Allow the request from your own site only (basic CORS safety)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "missing_api_key",
      message: "ANTHROPIC_API_KEY is not set on the server. Add it in Vercel -> Settings -> Environment Variables, then redeploy."
    });
  }

  try {
    const { messages, tools, max_tokens } = req.body || {};
    if (!messages) {
      return res.status(400).json({ error: "bad_request", message: "Missing 'messages' in request body." });
    }

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: max_tokens || 1500,
        messages,
        ...(tools ? { tools } : {}),
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      return res.status(anthropicRes.status).json({
        error: "anthropic_api_error",
        message: data?.error?.message || "Anthropic API request failed",
        details: data,
      });
    }

    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "server_error", message: e.message });
  }
}