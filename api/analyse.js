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
        max_tokens: 350,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Du bist Ernährungsberater. Analysiere das Produktbild und antworte NUR als JSON mit Feldern: " +
              '{ "name": string, "score": number, "summary": string, "pros": string[], "cons": string[], ' +
              '"calories_per_serving": number, "serving_desc": string }. ' +
              "Wenn Portionsgröße unklar ist, nutze übliche Packungsangabe (z. B. 30 g Chips, 250 ml Drink). " +
              "score: 1=sehr ungesund, 10=sehr gesund."
          },
          {
            role: "user",
            content: [
              { type: "text", text: `Bewerte dieses Produkt. Hinweis: ${hint}`.slice(0,200) },
              { type: "image_url", image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
            ]
          }
        ]
      })
    });

    const json = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: json.error?.message || "OpenAI error" });

    let parsed={}; try { parsed = JSON.parse(json.choices?.[0]?.message?.content || "{}"); } catch {}
    return res.status(200).json({
      name: String(parsed.name || ""),
      score: Number(parsed.score ?? 0),
      summary: String(parsed.summary || ""),
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0,5) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0,5) : [],
      calories_per_serving: Number(parsed.calories_per_serving ?? 0),
      serving_desc: String(parsed.serving_desc || "")
    });
  } catch (e) {
    return res.status(500).json({ error: e.message || "proxy error" });
  }
}
