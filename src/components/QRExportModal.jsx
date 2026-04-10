import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { exportQRChunks } from '../utils/backup'

export default function QRExportModal({ onClose }) {
  const [chunks, setChunks] = useState([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    exportQRChunks().then((c) => {
      setChunks(c)
      setLoading(false)
    })
  }, [])

  return (
    <div className="fixed inset-0 bg-gray-950 z-50 flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold text-base">QR 내보내기</h3>
          <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm text-center py-20">QR 생성 중...</p>
        ) : (
          <>
            <p className="text-gray-400 text-xs text-center mb-5">
              새 폰에서 순서대로 스캔하세요 (사진 제외)
            </p>

            <div className="bg-white p-4 rounded-2xl flex items-center justify-center mx-auto w-fit">
              <QRCodeSVG value={chunks[current]} size={260} level="L" />
            </div>

            <p className="text-white text-2xl font-bold text-center mt-5">
              {current + 1} / {chunks.length}
            </p>

            {chunks.length > 1 && (
              <div className="flex gap-4 mt-5 justify-center">
                <button
                  onClick={() => setCurrent((c) => Math.max(0, c - 1))}
                  disabled={current === 0}
                  className="flex items-center gap-1.5 px-6 py-3 bg-gray-800 text-white rounded-xl disabled:opacity-30 text-sm"
                >
                  <ChevronLeft size={16} /> 이전
                </button>
                <button
                  onClick={() => setCurrent((c) => Math.min(chunks.length - 1, c + 1))}
                  disabled={current === chunks.length - 1}
                  className="flex items-center gap-1.5 px-6 py-3 bg-gray-800 text-white rounded-xl disabled:opacity-30 text-sm"
                >
                  다음 <ChevronRight size={16} />
                </button>
              </div>
            )}

            <p className="text-gray-500 text-xs text-center mt-6">
              새 폰에서 "QR 가져오기"를 눌러 스캔하세요
            </p>
          </>
        )}
      </div>
    </div>
  )
}
