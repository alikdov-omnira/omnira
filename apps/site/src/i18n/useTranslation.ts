import { useEffect, useState } from "react";
import { auditLocales, languageRegistry, locales, resolveBrowserLanguage, STORAGE_KEY } from "./config";
import type { Language } from "./types";

auditLocales();

function initialLanguage(): Language {
  const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
  return saved && saved in locales ? saved : resolveBrowserLanguage();
}

export function useTranslation() {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  useEffect(() => { document.documentElement.lang = languageRegistry.find(item => item.code === language)!.htmlLang; }, [language]);
  const setLanguage = (next: Language) => { localStorage.setItem(STORAGE_KEY, next); setLanguageState(next); };
  return { language, setLanguage, copy: locales[language], languages: languageRegistry };
}
