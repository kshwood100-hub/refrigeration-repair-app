import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ko from './locales/ko.json'
import en from './locales/en.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'
import es from './locales/es.json'
import ja from './locales/ja.json'
import vi from './locales/vi.json'
import th from './locales/th.json'
import id from './locales/id.json'
import ar from './locales/ar.json'
import pt from './locales/pt.json'

// localStorage에서 저장된 언어 직접 읽기
const savedLng = localStorage.getItem('i18nextLng') || localStorage.getItem('rfg_lang')

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ko, en, zh, hi, es, ja, vi, th, id, ar, pt },
    lng: savedLng || undefined,
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'zh', 'hi', 'es', 'ja', 'vi', 'th', 'id', 'ar', 'pt'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    initImmediate: false,
    react: { useSuspense: false },
  })

// 아랍어 RTL — 화면 방향(dir) 적용 (ar=오른쪽→왼쪽, 그 외 왼쪽→오른쪽)
const applyDir = (lng) => {
  document.documentElement.dir = (lng || '').split('-')[0] === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.lang = lng || 'ko'
}
applyDir(i18n.language)
i18n.on('languageChanged', applyDir)

export default i18n
