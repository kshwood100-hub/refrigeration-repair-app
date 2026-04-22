import { useState, useEffect, useRef } from 'react'
import jsQR from 'jsqr'
import { X, CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { importQRChunks } from '../utils/backup'

export default function QRImportModal({ onClose, onDone }) {
  const { t } = useTranslation()
  const videoRef = useRef()
  const canvasRef = useRef()
  const animRef = useRef()
  const scannedRef = useRef({})
  const [scanned, setScanned] = useState({})
  const [total, setTotal] = useState(null)
  const [status, setStatus] = useState('scanning') // scanning | done | error
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    window.history.pushState({ qrImport: true }, '')
    const handlePop = () => onClose()
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  useEffect(() => {
    let stream

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        })
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        scan()
      } catch (e) {
        setErrorMsg(t('qr.cameraError', { message: e.message }))
        setStatus('error')
      }
    }

    function scan() {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || !canvas) return

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        const ctx = canvas.getContext('2d')
        ctx.drawImage(video, 0, 0)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code?.data) {
          try {
            const { i, n } = JSON.parse(code.data)
            if (!scannedRef.current[i]) {
              scannedRef.current[i] = code.data
              const next = { ...scannedRef.current }
              setScanned(next)
              setTotal(n)

              if (Object.keys(next).length === n) {
                stream?.getTracks().forEach((tr) => tr.stop())
                importQRChunks(next, n)
                  .then(() => setStatus('done'))
                  .catch((e) => {
                    setErrorMsg(t('qr.restoreError', { message: e.message }))
                    setStatus('error')
                  })
                return
              }
            }
          } catch {}
        }
      }

      animRef.current = requestAnimationFrame(scan)
    }

    start()

    return () => {
      cancelAnimationFrame(animRef.current)
      stream?.getTracks().forEach((tr) => tr.stop())
    }
  }, [])

  const scannedCount = Object.keys(scanned).length

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {status === 'done' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <CheckCircle size={64} className="text-green-400" />
          <p className="text-white text-xl font-bold">{t('qr.restoreDone')}</p>
          <p className="text-gray-400 text-sm text-center">{t('qr.restoreSuccess')}</p>
          <button
            onClick={onDone}
            className="mt-4 px-8 py-3 bg-white text-gray-900 font-semibold rounded-xl"
          >
            {t('qr.confirm')}
          </button>
        </div>
      ) : status === 'error' ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="text-red-400 text-base font-semibold text-center">{errorMsg}</p>
          <button onClick={onClose} className="px-6 py-3 bg-gray-800 text-white rounded-xl text-sm">
            {t('qr.close')}
          </button>
        </div>
      ) : (
        <>
          <div className="relative flex-1">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            <canvas ref={canvasRef} className="hidden" />

            {/* 스캔 가이드 박스 */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-64 border-2 border-white rounded-2xl opacity-60" />
            </div>

            {/* 상단 바 */}
            <div className="absolute top-0 left-0 right-0 bg-black/60 px-4 py-4 flex items-center justify-between">
              <p className="text-white font-semibold text-sm">{t('qr.importTitle')}</p>
              <button onClick={onClose}><X size={20} className="text-gray-300" /></button>
            </div>
          </div>

          {/* 하단 상태 */}
          <div className="bg-gray-950 px-5 py-5">
            {total === null ? (
              <p className="text-gray-400 text-sm text-center">{t('qr.scanGuide')}</p>
            ) : (
              <>
                <p className="text-white text-sm font-semibold text-center mb-3">
                  {t('qr.scanProgress', { count: scannedCount, total })}
                </p>
                <div className="flex gap-2 justify-center flex-wrap">
                  {Array.from({ length: total }, (_, i) => (
                    <div
                      key={i}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                        scanned[i] ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                {scannedCount < total && (
                  <p className="text-gray-500 text-xs text-center mt-3">
                    {t('qr.scanNext')}
                  </p>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
