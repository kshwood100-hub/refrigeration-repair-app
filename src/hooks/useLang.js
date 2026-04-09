import { useTranslation } from 'react-i18next'

// 현재 언어가 한국어인지 확인
export function useIsKorean() {
  const { i18n } = useTranslation()
  return i18n.language.startsWith('ko')
}

// 한국어면 ko 필드, 아니면 en 필드 반환
export function useLocalField() {
  const isKo = useIsKorean()
  return (item, field) => {
    const enField = `${field}_en`
    return isKo ? item[field] : (item[enField] ?? item[field])
  }
}
