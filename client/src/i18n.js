// Minimal i18n setup: SearchSelect calls useTranslation(). The keys are the English texts, so nothing needs translating.
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  resources: { en: { translation: {} } },
  interpolation: { escapeValue: false },
  returnNull: false,
});

export default i18n;
