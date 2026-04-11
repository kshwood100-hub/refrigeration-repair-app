import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  ChevronLeft, Camera, User, Building2, Phone, Mail,
  MapPin, Loader, Check, Trash2, CreditCard, Plus,
} from 'lucide-react'
import { db } from '../db'
import { loadSettings } from '../utils/settings'
import { scanBusinessCard } from '../utils/scanBusinessCard'
import { scanBusinessCardGemini } from '../utils/scanBusinessCardGemini'
import { scanBusinessCardTesseract } from '../utils/scanBusinessCardTesseract'

const EMPTY = {
  name: '', company: '', title: '', phone: '', mobile: '', email: '', address: '', memo: '',
}

export default function BusinessCardPage() {
  const navigate = useNavigate()
  const fileRef = useRef()

  const [mode, setMode] = useState('list')   // 'list' | 'confirm'
  const [photoUrl, setPhotoUrl] = useState('')
  const [form, setForm] = useState(EMPTY)
  const [scanning, setScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)
  const [saving, setSaving] = useState(false)
  const [rawText, setRawText] = useState('')
  const [deleting, setDeleting] = useState(null)

  const cards = useLiveQuery(
    () => db.business_cards.orderBy('createdAt').reverse().toArray(), []
  )
  const customers = useLiveQuery(() => db.customers.toArray(), [])
  const customerMap = Object.fromEntries((customers ?? []).map((c) => [c.id, c]))

  function setField(key, val) {
    setForm((p) => ({ ...p, [key]: val }))
  }

  async function handleCapture(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const reader = new FileReader()
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result
      setPhotoUrl(dataUrl)
      setForm(EMPTY)
      setMode('confirm')

      setScanning(true)
      setScanProgress(0)
      try {
        const result = await scanBusinessCardGemini(dataUrl)
        setForm({
          name:    result.name    ?? '',
          company: result.company ?? '',
          title:   result.title   ?? '',
          phone:   result.phone   ?? '',
          mobile:  result.mobile  ?? '',
          email:   result.email   ?? '',
          address: result.address ?? '',
          memo:    result.memo    ?? '',
        })
      } catch (err) {
        alert('AI 스캔 오류: ' + err.message)
      } finally {
        setScanning(false)
      }
    }
    reader.readAsDataURL(file)
  }

  async function handleSave() {
    if (!form.name.trim()) { alert('이름을 입력해주세요.'); return }
    setSaving(true)
    try {
      const now = new Date().toISOString()
      const primaryPhone = form.mobile.trim() || form.phone.trim()

      // 동일 이름+전화 고객 찾기
      let customerId = null
      const existing = (customers ?? []).find(
        (c) => c.name === form.name.trim() && (c.phone === primaryPhone || !primaryPhone)
      )
      if (existing) {
        customerId = existing.id
      } else {
        customerId = await db.customers.add({
          name:    form.name.trim(),
          phone:   primaryPhone,
          address: form.address.trim(),
        })
      }

      await db.business_cards.add({
        customerId,
        dataUrl:  photoUrl,
        name:     form.name.trim(),
        company:  form.company.trim(),
        title:    form.title.trim(),
        phone:    form.phone.trim(),
        mobile:   form.mobile.trim(),
        email:    form.email.trim(),
        address:  form.address.trim(),
        memo:     form.memo.trim(),
        createdAt: now,
      })

      setMode('list')
      setPhotoUrl('')
      setForm(EMPTY)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    await db.business_cards.delete(id)
    setDeleting(null)
  }

  /* ── CONFIRM VIEW ───────────────────────────────────────── */
  if (mode === 'confirm') {
    const fields = [
      { key: 'name',    label: '이름',      Icon: User,      required: true },
      { key: 'company', label: '회사명',     Icon: Building2 },
      { key: 'title',   label: '직함',      Icon: null },
      { key: 'mobile',  label: '휴대폰',    Icon: Phone },
      { key: 'phone',   label: '전화(직통)', Icon: Phone },
      { key: 'email',   label: '이메일',    Icon: Mail },
      { key: 'address', label: '주소',      Icon: MapPin },
      { key: 'memo',    label: '메모',      Icon: null },
    ]
    return (
      <div className="p-4 pb-12">
        <div className="flex items-center gap-3 mb-5">
          <button onClick={() => { setMode('list'); setPhotoUrl('') }} className="text-gray-500">
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <h2 className="text-base font-semibold text-gray-900">명함 정보 확인</h2>
        </div>

        {/* 명함 사진 */}
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-300 bg-gray-50 flex items-center justify-center">
          <img src={photoUrl} alt="명함" className="w-full max-h-44 object-contain" />
        </div>

        {/* 스캔 중 */}
        {scanning && (
          <div className="flex items-center justify-center gap-2 py-3 mb-3 text-blue-600 text-sm bg-blue-50 rounded-xl">
            <Loader size={15} className="animate-spin" strokeWidth={2} />
            {scanProgress > 0 ? `Tesseract 분석 중… ${scanProgress}%` : 'AI가 명함 내용을 분석 중입니다…'}
          </div>
        )}

        {!scanning && (
          <div className="flex gap-2 mb-3">
            <button
              onClick={async () => {
                setScanning(true)
                setScanProgress(0)
                setRawText('')
                try {
                  const result = await scanBusinessCardTesseract(photoUrl, setScanProgress)
                  setRawText(result._rawText ?? '')
                  setForm({
                    name:    result.name    ?? '',
                    company: result.company ?? '',
                    title:   result.title   ?? '',
                    phone:   result.phone   ?? '',
                    mobile:  result.mobile  ?? '',
                    email:   result.email   ?? '',
                    address: result.address ?? '',
                    memo:    result.memo    ?? '',
                  })
                } catch (err) {
                  alert('Tesseract 오류: ' + err.message)
                } finally {
                  setScanning(false)
                }
              }}
              className="flex-1 py-2 text-xs font-medium bg-amber-50 border border-amber-300 text-amber-700 rounded-xl"
            >
              Tesseract 테스트
            </button>
            {loadSettings().claudeApiKey && (
              <button
                onClick={async () => {
                  setScanning(true)
                  setScanProgress(0)
                  try {
                    const result = await scanBusinessCard(photoUrl, loadSettings().claudeApiKey)
                    setForm({
                      name:    result.name    ?? '',
                      company: result.company ?? '',
                      title:   result.title   ?? '',
                      phone:   result.phone   ?? '',
                      mobile:  result.mobile  ?? '',
                      email:   result.email   ?? '',
                      address: result.address ?? '',
                      memo:    result.memo    ?? '',
                    })
                  } catch (err) {
                    alert('AI 스캔 오류: ' + err.message)
                  } finally {
                    setScanning(false)
                  }
                }}
                className="flex-1 py-2 text-xs font-medium bg-blue-50 border border-blue-300 text-blue-700 rounded-xl"
              >
                Claude AI 재스캔
              </button>
            )}
          </div>
        )}

        {rawText && (
          <div className="mb-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
            <p className="text-xs font-semibold text-gray-500 mb-1">Tesseract 인식 원문</p>
            <p className="text-xs text-gray-600 whitespace-pre-wrap font-mono leading-relaxed">{rawText}</p>
          </div>
        )}


        {/* 폼 */}
        <div className="space-y-2.5">
          {fields.map(({ key, label, Icon, required }) => (
            <div key={key}>
              <label className="text-xs text-gray-400 mb-0.5 block">
                {label}{required && <span className="text-red-400 ml-0.5">*</span>}
              </label>
              <div className="relative">
                {Icon && (
                  <Icon
                    size={13}
                    strokeWidth={1.5}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                  />
                )}
                <input
                  value={form[key]}
                  onChange={(e) => setField(key, e.target.value)}
                  placeholder={label}
                  className={`w-full ${Icon ? 'pl-8' : 'pl-3'} pr-3 py-2.5 text-sm border border-gray-300 rounded-xl outline-none focus:border-gray-400 bg-white`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => { setMode('list'); setPhotoUrl('') }}
            className="flex-1 py-3 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || scanning || saving}
            className="flex-2 px-6 py-3 text-sm font-medium bg-gray-900 text-white rounded-xl disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            {saving
              ? <Loader size={14} className="animate-spin" />
              : <Check size={14} strokeWidth={2} />}
            저장 &amp; 고객 등록
          </button>
        </div>
      </div>
    )
  }

  /* ── LIST VIEW ──────────────────────────────────────────── */
  return (
    <div className="p-4 pb-10">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/service')} className="text-gray-500">
            <ChevronLeft size={22} strokeWidth={1.5} />
          </button>
          <h2 className="text-base font-semibold text-gray-900">명함 관리</h2>
          {cards && cards.length > 0 && (
            <span className="text-xs text-gray-400">{cards.length}장</span>
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-gray-900 text-white rounded-lg"
        >
          <Camera size={13} strokeWidth={2} />
          명함 스캔
        </button>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {(!cards || cards.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <CreditCard size={44} strokeWidth={1} className="mb-3 opacity-25" />
          <p className="text-sm mb-1 font-medium text-gray-500">저장된 명함이 없습니다</p>
          <p className="text-xs text-center leading-relaxed">
            명함 스캔 버튼을 눌러 촬영하면<br />자동으로 고객 정보를 추출합니다
          </p>
          <button
            onClick={() => fileRef.current?.click()}
            className="mt-5 flex items-center gap-1.5 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-xl"
          >
            <Camera size={14} strokeWidth={2} />
            첫 명함 스캔
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {cards.map((card) => {
            const customer = customerMap[card.customerId]
            return (
              <div
                key={card.id}
                className="bg-white border border-gray-300 rounded-xl p-3 shadow-sm"
              >
                <div className="flex items-start gap-3">
                  {card.dataUrl ? (
                    <img
                      src={card.dataUrl}
                      alt="명함"
                      className="w-16 h-10 object-cover rounded-lg border border-gray-300 shrink-0 bg-gray-50"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded-lg border border-gray-300 bg-gray-50 flex items-center justify-center shrink-0">
                      <CreditCard size={18} strokeWidth={1} className="text-gray-300" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900 truncate">
                          {card.name || '이름 없음'}
                        </p>
                        {(card.company || card.title) && (
                          <p className="text-xs text-gray-500 truncate">
                            {[card.company, card.title].filter(Boolean).join(' · ')}
                          </p>
                        )}
                        {(card.mobile || card.phone) && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {card.mobile || card.phone}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleting(card.id)}
                        className="p-1 text-gray-300 shrink-0"
                      >
                        <Trash2 size={14} strokeWidth={1.5} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {customer && (
                        <button
                          onClick={() => navigate(`/customers/${card.customerId}`)}
                          className="text-xs text-emerald-600 font-medium"
                        >
                          ✓ 고객 이력 보기
                        </button>
                      )}
                      <button
                        onClick={() => navigate('/service/new', { state: { customerId: card.customerId } })}
                        className="ml-auto flex items-center gap-1 text-xs text-blue-600 font-medium"
                      >
                        <Plus size={11} strokeWidth={2} />
                        새 의뢰
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-6">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm">
            <p className="font-semibold text-gray-900 mb-1">명함을 삭제하시겠습니까?</p>
            <p className="text-sm text-gray-400 mb-5">고객 정보는 유지됩니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleting(null)}
                className="flex-1 py-2.5 text-sm font-medium border border-gray-300 rounded-xl text-gray-600"
              >
                취소
              </button>
              <button
                onClick={() => handleDelete(deleting)}
                className="flex-1 py-2.5 text-sm font-medium bg-red-500 text-white rounded-xl"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
