import { useTranslation } from 'react-i18next'

// 현재 언어가 한국어인지 확인
export function useIsKorean() {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('ko')
}

// 현재 언어 코드에 맞는 데이터 필드 반환
// 우선순위: 현재 언어 → en → 기본(ko)
// 예) lang='zh' → item.title_zh ?? item.title_en ?? item.title
export function useLocalField() {
  const { i18n } = useTranslation()
  const lang = i18n.language.split('-')[0] // 'ko', 'en', 'zh', 'ja', 'es', 'hi'

  return (item, field) => {
    if (lang === 'ko') return item[field]
    const localField = `${field}_${lang}`
    const enField = `${field}_en`
    return item[localField] ?? item[enField] ?? item[field]
  }
}
