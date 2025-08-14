export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Only POST" });

  const { imageBase64, hint = "" } = req.body || {};
  if (!imageBase64) return res.status(400).json({ error: "No image data provided" });

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Du bist Ernährungsberater. Antworte NUR als JSON: "+
              "{ \"score\": number(1-10), \"pros\": string[], \"cons\": string[], \"summary\": string }."
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Bewerte dieses Produkt. Hinweis: ${hint}`.slice(0,200) },
              // 👉 WICHTIG: image_url als Objekt mit url
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ]
      })
    });

    const json = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: json.error?.message || "OpenAI error" });

    let parsed;
    try { parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}"); }
    catch { return res.status(500).json({ error: "Invalid JSON from model" }); }

    const out = {
      score: Number(parsed.score ?? 0),
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0,5) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0,5) : [],
      summary: String(parsed.summary || "")
    };
    return res.status(200).json(out);

  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
