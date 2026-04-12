export default function handler(req, res) {
  const keys = Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('NODE'))
  res.status(200).json({
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    keyLength: process.env.GEMINI_API_KEY?.length ?? 0,
    allKeys: keys.sort(),
  })
}
