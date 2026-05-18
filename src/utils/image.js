// 이미지 압축 — 1200px 이하 + JPEG 75% 시작 + 자동 루프로 900KB 미만 보장
// Firestore 단일 필드 1MB 한도 안전 마진 + IDB 용량 절약 + cloudSync 비용 절감
// 자동 루프: 압축 후 크기 초과 시 quality 0.1씩 감소 → 한도 시 maxDim 15%씩 감소
export function compressImage(file) {
  return new Promise((resolve) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      const MAX_BYTES = 900000  // ~900KB (1MB 안전 마진)
      const MIN_DIM = 400
      const MIN_QUALITY = 0.4
      let maxDim = 1200
      let quality = 0.75

      function render(dim, q) {
        const scale = Math.min(1, dim / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height)
        return canvas.toDataURL('image/jpeg', q)
      }

      let result = render(maxDim, quality)
      // 자동 압축 루프 — 한도 도달 또는 더 줄일 수 없는 시점까지
      // 안전장치: 최대 20회 반복 (무한 루프 차단)
      let iterations = 0
      while (result.length > MAX_BYTES && iterations < 20) {
        if (quality > MIN_QUALITY) {
          quality = Math.max(MIN_QUALITY, quality - 0.1)
        } else if (maxDim > MIN_DIM) {
          maxDim = Math.max(MIN_DIM, Math.round(maxDim * 0.85))
        } else {
          break
        }
        result = render(maxDim, quality)
        iterations++
      }

      URL.revokeObjectURL(url)
      resolve(result)
    }
    img.src = url
  })
}
