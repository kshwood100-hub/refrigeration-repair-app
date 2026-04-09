import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import ko from './locales/ko.json'
import en from './locales/en.json'
import zh from './locales/zh.json'
import hi from './locales/hi.json'
import es from './locales/es.json'
import ja from './locales/ja.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { ko, en, zh, hi, es, ja },
    fallbackLng: 'en',
    supportedLngs: ['ko', 'en', 'zh', 'hi', 'es', 'ja'],
    detection: {
      order: ['navigator'],
      caches: [],
    },
    interpolation: { escapeValue: false },
  })

export default i18n
