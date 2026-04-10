import Tesseract from 'tesseract.js'

export async function scanBusinessCardTesseract(dataUrl, onProgress) {
  const result = await Tesseract.recognize(dataUrl, 'kor+eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })

  const text = result.data.text
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // 전화번호 패턴
  const phonePattern = /(\d{2,4}[-.\s]?\d{3,4}[-.\s]?\d{4})/g
  const phones = text.match(phonePattern) ?? []

  // 이메일 패턴
  const emailMatch = text.match(/[\w.-]+@[\w.-]+\.\w+/)

  // 모바일 vs 일반 전화 구분 (010, 011 등)
  const mobile = phones.find((p) => p.replace(/\D/g, '').startsWith('010') || p.replace(/\D/g, '').startsWith('011')) ?? ''
  const phone = phones.find((p) => p !== mobile) ?? ''

  // 이름 추정: 짧은 한글 줄 (2~4자)
  const nameLine = lines.find((l) => /^[가-힣]{2,4}$/.test(l)) ?? ''

  // 회사명 추정: 주식회사, (주), Co., Ltd 포함 줄
  const companyLine = lines.find((l) =>
    /(주식회사|\(주\)|co\.|ltd|corp|inc)/i.test(l)
  ) ?? ''

  // 직함 추정: 대리|과장|부장|이사|사장|팀장|차장|부사장|전무 포함
  const titleLine = lines.find((l) =>
    /(대리|과장|부장|이사|사장|팀장|차장|부사장|전무|상무|주임|대표|원장|실장|본부장|센터장)/.test(l)
  ) ?? ''

  // 주소 추정: 시|구|동|로|길 포함 줄
  const addressLine = lines.find((l) =>
    /(서울|부산|대구|인천|광주|대전|울산|세종|경기|강원|충북|충남|전북|전남|경북|경남|제주)|(시|구|동|로|길)\s/.test(l)
  ) ?? ''

  return {
    name: nameLine,
    company: companyLine,
    title: titleLine,
    mobile,
    phone,
    email: emailMatch?.[0] ?? '',
    address: addressLine,
    memo: '',
    _rawText: text,  // 디버그용
  }
}
