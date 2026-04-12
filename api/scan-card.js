export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { base64, mediaType } = req.body
  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not configured' })

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { inline_data: { mime_type: mediaType, data: base64 } },
            {
              text: 'Extract all text from this business card image and return JSON only.\nFormat: {"name":"","company":"","title":"","phone":"","mobile":"","email":"","address":"","memo":""}\nEmpty string for missing fields. For phone numbers include country code if shown.',
            },
          ],
        }],
      }),
    }
  )

  if (!response.ok) {
    const err = await response.json().catch(() => ({}))
    return res.status(response.status).json({ error: err?.error?.message ?? `API error ${response.status}` })
  }

  const data = await response.json()
  return res.status(200).json(data)
}
