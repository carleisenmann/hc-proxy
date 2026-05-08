module.exports = async function handler(req, res) {
res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "null");
res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Rebuild the Smartsheet path from segments
  const parts = Array.isArray(req.query.path) ? req.query.path : [req.query.path].filter(Boolean);
  const path = "/" + parts.join("/");

  // Forward any extra query params (e.g. ?rowIds=123), excluding Vercel's internal 'path' param
  const { path: _ignore, ...rest } = req.query;
  const qs = Object.keys(rest).length ? "?" + new URLSearchParams(rest).toString() : "";

  const targetUrl = "https://api.smartsheet.com" + path + qs;

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        Authorization: req.headers["authorization"] || "",
        "Content-Type": "application/json",
      },
      body: ["GET", "HEAD"].includes(req.method) ? undefined : JSON.stringify(req.body),
    });

    const text = await upstream.text();
    res.status(upstream.status).setHeader("Content-Type", "application/json").send(text);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
