export default function handler(req, res) {
  res.status(200).json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY?.length ?? 0,
  })
}
