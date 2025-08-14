export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageBase64 } = req.body;

    const apiRes = await fetch('https://api.openai.com/v1/chat/completions', {
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
            content: "Du bist ein Ernährungs-Experte. Bewerte das Produkt auf einer Skala von 1 bis 10 (10 = sehr gesund) und nenne kurz 2 Vorteile und 2 Nachteile."
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Bewerte dieses Produkt" },
              { type: "image_url", image_url: `data:image/jpeg;base64,${imageBase64}` }
            ]
          }
        ]
      })
    });

    const data = await apiRes.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
