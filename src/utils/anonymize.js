// 설비 기록 공유 모델 — 익명화 유틸 (스캐폴드)
// v2 가동 시 shareQueue에서 호출. 현재 미사용.
//
// 정책 (project_data_sharing_model.md):
// - 거래처명 / 주소 / 고객 전화: 제거
// - 작성자 식별 정보: 일체 제외
// - 장비 / 냉매 / 증상 / 조치: 그대로 전송

const PHONE_RE = /(\+?\d{1,3}[-\s]?)?(\(?\d{2,4}\)?[-\s]?)?\d{3,4}[-\s]?\d{4}/g
const EMAIL_RE = /[\w.-]+@[\w.-]+\.\w+/g

function stripPII(text) {
  if (typeof text !== 'string' || !text) return text
  return text
    .replace(PHONE_RE, '[phone]')
    .replace(EMAIL_RE, '[email]')
    .trim()
}

// service_jobs 한 건 → 익명 페이로드
export function anonymizeServiceJob(job) {
  if (!job) return null
  return {
    schema: 'service_job.v1',
    category: job.category ?? null,
    compressorType: job.compressorType ?? null,
    compressorStr: job.compressorStr ?? null,
    coolingMethod: job.coolingMethod ?? null,
    tempRange: job.tempRange ?? null,
    refrigerant: job.refrigerant ?? null,
    systemType: job.systemType ?? null,
    symptoms: stripPII(job.symptoms),
    cause: stripPII(job.cause),
    checkSteps: stripPII(job.checkSteps),
    solution: stripPII(job.solution),
    parts: stripPII(job.parts),
    // 의도적 제외: customerId, location(주소), customerName, customerPhone, price, photos
  }
}

// AI 진단 결과 한 건 → 익명 페이로드 (사진은 별도)
// 진단 영역 격리 — 다른 collection·테이블과 데이터 흐름 없음
export function anonymizeAiDiagnosis(item) {
  if (!item) return null
  return {
    schema: 'ai_diagnosis.v1',
    userText: stripPII(item.userText),
    rawResponse: stripPII(item.rawResponse),
    userMemo: stripPII(item.userMemo),
    language: item.language ?? 'ko',
    feedback: item.feedback ?? null,
    // 의도적 제외: photoData (= 별도 Storage 검수 통과 시만 영구), id, cloudId, 거래처 정보 등
  }
}

// knowhow 한 건 → 익명 페이로드
export function anonymizeKnowhow(kh) {
  if (!kh) return null
  return {
    schema: 'knowhow.v1',
    category: kh.category ?? null,
    equipBrand: kh.equipBrand ?? null,
    equipModel: kh.equipModel ?? null,
    equipCapacity: kh.equipCapacity ?? null,
    refrigerant: kh.refrigerant ?? null,
    title: stripPII(kh.title),
    body: stripPII(kh.body),
    // 의도적 제외: customerId, location, equipSerial(부분마스킹은 v2에서 결정)
  }
}
