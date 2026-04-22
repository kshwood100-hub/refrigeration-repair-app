import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ko from './locales/ko.json'
import en from './locales/en.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'
import es from './locales/es.json'
import ja from './locales/ja.json'

// localStorage에서 저장된 언어 직접 읽기
const savedLng = localStorage.getItem('i18nextLng') || localStorage.getItem('rfg_lang')

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ko, en, zh, hi, es, ja },
    lng: savedLng || undefined,
    fallbackLng: 'ko',
    supportedLngs: ['ko', 'en', 'zh', 'hi', 'es', 'ja'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
    initImmediate: false,
    react: { useSuspense: false },
  })

export default i18n
