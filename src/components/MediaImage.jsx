import { useEffect, useState } from 'react'
import { getMediaUrl } from '../utils/cloudSync'

// 사진 표시 컴포넌트.
// dataUrl 우선 (즉시 표시), 없으면 storagePath에서 다운로드.
// 다른 기기에서 pull로 받은 사진은 storagePath만 있어 lazy load.
export default function MediaImage({ dataUrl, storagePath, alt = '', className, style, onClick }) {
  const [url, setUrl] = useState(dataUrl || null)
  const [loading, setLoading] = useState(!dataUrl && !!storagePath)

  useEffect(() => {
    if (dataUrl) { setUrl(dataUrl); setLoading(false); return }
    if (!storagePath) { setUrl(null); setLoading(false); return }
    let canceled = false
    setLoading(true)
    getMediaUrl(storagePath).then((u) => {
      if (canceled) return
      setUrl(u)
      setLoading(false)
    })
    return () => { canceled = true }
  }, [dataUrl, storagePath])

  if (loading) {
    return <div className={className} style={{ ...style, background: '#1a2436' }} />
  }
  if (!url) {
    return <div className={className} style={{ ...style, background: '#1a2436' }} />
  }
  return <img src={url} alt={alt} className={className} style={style} onClick={onClick} />
}
