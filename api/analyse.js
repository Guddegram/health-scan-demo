export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST requests allowed' });
  }

  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ error: 'No image data provided' });
  }

  try {
    const apiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Du bist ein Ernährungs-Experte. Antworte im JSON-Format mit 'score' (1-10) und 'details' (kurze Bewertung)."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bewerte dieses Produkt" },
              { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` }
            ]
          }
        ],
        response_format: { type: "json_object" }
      })
    });

    const data = await apiRes.json();

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: data.error?.message || "API request failed" });
    }

    let parsed;
    try {
      parsed = JSON.parse(data.choices[0].message.content);
    } catch {
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    res.status(200).json({
      score: parsed.score,
      details: parsed.details
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
