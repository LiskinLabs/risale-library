import { getUserLang } from './misc';

export const getDirFromLanguage = (lang: string) => {
  if (!lang) return 'auto';
  const rtlLanguages = new Set(['ar', 'he', 'fa', 'ur', 'dv', 'ps', 'sd', 'yi', 'ug']);
  const primaryLang = lang.split('-')[0]!.toLowerCase();
  return rtlLanguages.has(primaryLang) ? 'rtl' : 'auto';
};

export const getDirFromUILanguage = () => {
  const lang = getUserLang();
  return getDirFromLanguage(lang);
};
