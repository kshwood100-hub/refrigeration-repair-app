// 표준 폼 매핑 — cases.v3 형식 (v4도 v4ToV3 변환 후 동일 형식) → 표준 폼 7개 섹션
// 시스템 일관성: 검색·AI 진단·설비기록 저장 모두 같은 7섹션 형식.

import casesData from '../data/cases.v3.json'
import casesV4Pilot from '../data/cases_v4_pilot.json'

function pickLang(field, lang) {
  if (!field) return ''
  if (typeof field === 'string') return field
  return field[lang] || field.en || field.ko || ''
}

function allLangsJoin(field) {
  if (!field) return ''
  if (typeof field === 'string') return field
  return Object.values(field).filter(Boolean).join(' ')
}

// v4 → v3 변환 (DiagnosisSearchPage 와 동일 로직)
function v4ToV3Local(v4case) {
  const langKeys = ['ko','en','zh','ja','es','hi','vi','th','id','ar']
  function joinLang(field) {
    if (!field) return undefined
    const out = {}
    for (const l of langKeys) {
      if (Array.isArray(field[l])) out[l] = field[l].map(x => '• ' + x).join('\n')
    }
    return Object.keys(out).length ? out : undefined
  }
  const downstream = joinLang(v4case.downstream_effects)
  const causesObj = joinLang(v4case.root_causes)
  const indicators = joinLang(v4case.diagnostic_indicators)
  const actionsObj = joinLang(v4case.actions)
  return {
    id: 'v4_' + v4case.id,
    title: v4case.title,
    keywords: v4case.search_keywords || [],
    causes: [
      { name: { ko: '🔗 인과 흐름', en: '🔗 Effects' }, check: indicators ?? {}, fix: downstream ?? {} },
      { name: { ko: '🔧 근본 원인 + 조치', en: '🔧 Root Causes + Actions' }, check: causesObj ?? {}, fix: actionsObj ?? {} },
    ],
    tip: v4case.tip,
  }
}

let _allCases = null
function getAllCases() {
  if (_allCases) return _allCases
  _allCases = [
    ...(casesData.cases || []),
    ...(casesV4Pilot.cases || []).map(v4ToV3Local),
  ]
  return _allCases
}

// matchCases — 사용자 입력 → top N cases (단순 keyword 매칭).
// RAG context 용도 (= AI 진단에 우리 데이터 컨텍스트 제공).
// 점수 가중치: title=3 / keywords=2 / cause name=1.
export function matchCases(userText, lang = 'ko', limit = 5) {
  if (!userText || !userText.trim()) return []
  const tokens = userText.toLowerCase().split(/\s+/).filter(t => t.length > 0)
  if (tokens.length === 0) return []

  const cases = getAllCases()
  const scored = []
  for (const c of cases) {
    const title = allLangsJoin(c.title).toLowerCase()
    const keywords = (c.keywords || []).join(' ').toLowerCase()
    const causes = (c.causes || []).map(cc => allLangsJoin(cc.name)).join(' ').toLowerCase()
    let score = 0
    for (const tok of tokens) {
      if (title.includes(tok)) score += 3
      if (keywords.includes(tok)) score += 2
      if (causes.includes(tok)) score += 1
    }
    if (score > 0) scored.push({ c, score })
  }
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit).map(s => s.c)
}

// RAG context 박는 라벨 — 10개 언어 (lang별 라벨로 AI 가 자기 언어로 답 가능)
const RAG_LABELS = {
  ko: { ref: '참고', cause: '원인', check: '점검', fix: '조치', tip: '팁' },
  en: { ref: 'Reference', cause: 'Cause', check: 'Check', fix: 'Fix', tip: 'Tip' },
  zh: { ref: '参考', cause: '原因', check: '检查', fix: '处理', tip: '提示' },
  ja: { ref: '参考', cause: '原因', check: '点検', fix: '対応', tip: 'ヒント' },
  es: { ref: 'Referencia', cause: 'Causa', check: 'Verificación', fix: 'Acción', tip: 'Consejo' },
  hi: { ref: 'संदर्भ', cause: 'कारण', check: 'जांच', fix: 'कार्रवाई', tip: 'सुझाव' },
  vi: { ref: 'Tham khảo', cause: 'Nguyên nhân', check: 'Kiểm tra', fix: 'Xử lý', tip: 'Mẹo' },
  th: { ref: 'อ้างอิง', cause: 'สาเหตุ', check: 'ตรวจ', fix: 'แก้ไข', tip: 'เคล็ดลับ' },
  id: { ref: 'Referensi', cause: 'Penyebab', check: 'Periksa', fix: 'Tindakan', tip: 'Tip' },
  ar: { ref: 'مرجع', cause: 'السبب', check: 'الفحص', fix: 'الإجراء', tip: 'نصيحة' },
}

// cases context — quickDiag Cloud Function 으로 전송할 RAG 텍스트 형식
// lang별 라벨로 AI 가 자기 언어로 일관 답변
export function casesToContext(cases, lang = 'ko') {
  if (!cases || cases.length === 0) return ''
  const L = RAG_LABELS[lang] || RAG_LABELS.en
  const lines = []
  for (let i = 0; i < cases.length; i++) {
    const c = cases[i]
    const title = pickLang(c.title, lang)
    lines.push(`[${L.ref} ${i + 1}] ${title}`)
    const causeArr = (c.causes || []).slice(0, 3)
    for (const cause of causeArr) {
      const name = pickLang(cause.name, lang)
      const check = pickLang(cause.check, lang)
      const fix = pickLang(cause.fix, lang)
      if (name) lines.push(`  - ${L.cause}: ${name}`)
      if (check) lines.push(`    ${L.check}: ${check.slice(0, 200)}`)
      if (fix) lines.push(`    ${L.fix}: ${fix.slice(0, 200)}`)
    }
    const tip = pickLang(c.tip, lang)
    if (tip) lines.push(`  ${L.tip}: ${tip.slice(0, 150)}`)
    lines.push('')
  }
  return lines.join('\n')
}

// 일반 검색(증상 입력) 결과 = 장비 정보 빼고 6개 섹션만.
// AI 진단(사진 + 증상) 결과 = 7개 섹션 모두.
export function mapToStandardForm(v3Case, lang = 'ko', includeEquipmentInfo = false) {
  const causes = (v3Case.causes || []).map((c) => ({
    name: pickLang(c.name, lang),
    check: pickLang(c.check, lang),
    fix: pickLang(c.fix, lang),
  }))

  const result = {
    symptoms: pickLang(v3Case.title, lang),
    causes: causes.map((c) => c.name).filter(Boolean),
    inspectionSteps: causes.map((c) => c.check).filter(Boolean),
    solutions: causes.map((c) => c.fix).filter(Boolean),
    estimates: null,  // 데이터 없음 → "확인 필요"
    references: {
      tip: pickLang(v3Case.tip, lang),
      keywords: (v3Case.keywords || []).join(', '),
    },
  }

  if (includeEquipmentInfo) {
    result.equipmentInfo = {
      type: v3Case.tags?.equipment || '',
      brand: '',
      model: '',
      serial: '',
      refrigerant: '',
      capacity: '',
      tempRange: '',
      compStage: '',
    }
  }

  return result
}

// 표준 폼 섹션 라벨 — 10개 언어. STANDARD_FORM_PROMPT 와 동일 라벨.
export const STANDARD_FORM_LABELS = {
  ko: {
    equipmentInfo: '장비 정보',
    type: '종류', brand: '브랜드', model: '모델', serial: '시리얼',
    refrigerant: '냉매', capacity: '용량', tempRange: '온도 범위', compStage: '압축 단수',
    symptoms: '증상',
    causes: '가능 원인 (가능성 순)',
    inspectionSteps: '점검 순서',
    solutions: '해결 방법',
    estimates: '예상',
    workTime: '작업 시간', partsCost: '부품 비용', laborCost: '작업 비용',
    references: '참고',
    relatedTip: '관련 팁', keywords: '키워드',
    verifyNeeded: '확인 필요',
  },
  en: {
    equipmentInfo: 'Equipment Info',
    type: 'Type', brand: 'Brand', model: 'Model', serial: 'Serial',
    refrigerant: 'Refrigerant', capacity: 'Capacity', tempRange: 'Temperature Range', compStage: 'Compression Stage',
    symptoms: 'Symptoms',
    causes: 'Possible Causes (by likelihood)',
    inspectionSteps: 'Inspection Steps',
    solutions: 'Solution',
    estimates: 'Estimated',
    workTime: 'Work time', partsCost: 'Parts cost', laborCost: 'Labor cost',
    references: 'References',
    relatedTip: 'Related Tip', keywords: 'Keywords',
    verifyNeeded: 'Verify needed',
  },
  zh: {
    equipmentInfo: '设备信息', type: '类型', brand: '品牌', model: '型号', serial: '序列号',
    refrigerant: '制冷剂', capacity: '容量', tempRange: '温度范围', compStage: '压缩级数',
    symptoms: '症状', causes: '可能原因 (按可能性排序)', inspectionSteps: '检查顺序', solutions: '解决方法',
    estimates: '预估', workTime: '工作时间', partsCost: '部件成本', laborCost: '人工成本',
    references: '参考', relatedTip: '相关提示', keywords: '关键词', verifyNeeded: '需确认',
  },
  ja: {
    equipmentInfo: '機器情報', type: '種類', brand: 'ブランド', model: 'モデル', serial: 'シリアル',
    refrigerant: '冷媒', capacity: '容量', tempRange: '温度範囲', compStage: '圧縮段数',
    symptoms: '症状', causes: '考えられる原因 (可能性順)', inspectionSteps: '点検手順', solutions: '解決方法',
    estimates: '予想', workTime: '作業時間', partsCost: '部品費', laborCost: '人件費',
    references: '参考', relatedTip: '関連ヒント', keywords: 'キーワード', verifyNeeded: '要確認',
  },
  es: {
    equipmentInfo: 'Información del equipo', type: 'Tipo', brand: 'Marca', model: 'Modelo', serial: 'Serie',
    refrigerant: 'Refrigerante', capacity: 'Capacidad', tempRange: 'Rango de temperatura', compStage: 'Etapa de compresión',
    symptoms: 'Síntomas', causes: 'Causas posibles (por probabilidad)', inspectionSteps: 'Pasos de inspección', solutions: 'Solución',
    estimates: 'Estimado', workTime: 'Tiempo de trabajo', partsCost: 'Costo de piezas', laborCost: 'Costo de mano de obra',
    references: 'Referencias', relatedTip: 'Consejo relacionado', keywords: 'Palabras clave', verifyNeeded: 'Verificar',
  },
  hi: {
    equipmentInfo: 'उपकरण जानकारी', type: 'प्रकार', brand: 'ब्रांड', model: 'मॉडल', serial: 'सीरियल',
    refrigerant: 'रेफ्रिजरेंट', capacity: 'क्षमता', tempRange: 'तापमान सीमा', compStage: 'संपीड़न चरण',
    symptoms: 'लक्षण', causes: 'संभावित कारण (संभावना के क्रम में)', inspectionSteps: 'जांच क्रम', solutions: 'समाधान',
    estimates: 'अनुमान', workTime: 'कार्य समय', partsCost: 'पार्ट्स लागत', laborCost: 'श्रम लागत',
    references: 'संदर्भ', relatedTip: 'संबंधित सुझाव', keywords: 'कीवर्ड', verifyNeeded: 'पुष्टि आवश्यक',
  },
  vi: {
    equipmentInfo: 'Thông tin thiết bị', type: 'Loại', brand: 'Thương hiệu', model: 'Kiểu', serial: 'Serial',
    refrigerant: 'Chất làm lạnh', capacity: 'Công suất', tempRange: 'Phạm vi nhiệt độ', compStage: 'Cấp nén',
    symptoms: 'Triệu chứng', causes: 'Nguyên nhân có thể (theo khả năng)', inspectionSteps: 'Thứ tự kiểm tra', solutions: 'Giải pháp',
    estimates: 'Dự kiến', workTime: 'Thời gian', partsCost: 'Chi phí linh kiện', laborCost: 'Chi phí nhân công',
    references: 'Tham khảo', relatedTip: 'Mẹo liên quan', keywords: 'Từ khóa', verifyNeeded: 'Cần xác minh',
  },
  th: {
    equipmentInfo: 'ข้อมูลอุปกรณ์', type: 'ประเภท', brand: 'แบรนด์', model: 'รุ่น', serial: 'ซีเรียล',
    refrigerant: 'สารทำความเย็น', capacity: 'ความจุ', tempRange: 'ช่วงอุณหภูมิ', compStage: 'ขั้นการอัด',
    symptoms: 'อาการ', causes: 'สาเหตุที่เป็นไปได้ (ตามความน่าจะเป็น)', inspectionSteps: 'ลำดับการตรวจ', solutions: 'วิธีแก้',
    estimates: 'ประมาณการ', workTime: 'เวลาทำงาน', partsCost: 'ค่าอะไหล่', laborCost: 'ค่าแรง',
    references: 'อ้างอิง', relatedTip: 'คำแนะนำที่เกี่ยวข้อง', keywords: 'คำสำคัญ', verifyNeeded: 'ต้องยืนยัน',
  },
  id: {
    equipmentInfo: 'Info Peralatan', type: 'Jenis', brand: 'Merek', model: 'Model', serial: 'Serial',
    refrigerant: 'Refrigeran', capacity: 'Kapasitas', tempRange: 'Rentang suhu', compStage: 'Tingkat kompresi',
    symptoms: 'Gejala', causes: 'Kemungkinan Penyebab (berdasarkan kemungkinan)', inspectionSteps: 'Urutan pemeriksaan', solutions: 'Solusi',
    estimates: 'Perkiraan', workTime: 'Waktu kerja', partsCost: 'Biaya suku cadang', laborCost: 'Biaya tenaga kerja',
    references: 'Referensi', relatedTip: 'Tip terkait', keywords: 'Kata kunci', verifyNeeded: 'Perlu verifikasi',
  },
  ar: {
    equipmentInfo: 'معلومات المعدات', type: 'النوع', brand: 'العلامة', model: 'الموديل', serial: 'الرقم التسلسلي',
    refrigerant: 'المبرد', capacity: 'السعة', tempRange: 'نطاق الحرارة', compStage: 'مرحلة الضغط',
    symptoms: 'الأعراض', causes: 'الأسباب المحتملة (حسب الاحتمال)', inspectionSteps: 'خطوات الفحص', solutions: 'الحل',
    estimates: 'التقدير', workTime: 'وقت العمل', partsCost: 'تكلفة القطع', laborCost: 'تكلفة العمل',
    references: 'المراجع', relatedTip: 'نصيحة ذات صلة', keywords: 'الكلمات الرئيسية', verifyNeeded: 'يلزم التحقق',
  },
}

export function getStandardLabels(lang) {
  return STANDARD_FORM_LABELS[lang] || STANDARD_FORM_LABELS.en
}
