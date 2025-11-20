import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

type Language = 'pt' | 'en' | 'es';

interface LanguageContextType {
  language: Language;
  changeLanguage: (lang: Language) => void;
  languages: { code: Language; name: string; flag: string }[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const SUPPORTED_LANGUAGES = [
  { code: 'pt' as Language, name: 'Português', flag: '🇧🇷' },
  { code: 'en' as Language, name: 'English', flag: '🇺🇸' },
  { code: 'es' as Language, name: 'Español', flag: '🇪🇸' },
];

export function LanguageProvider({ children }: { children: ReactNode }) {
  const { lang } = useParams<{ lang: string }>();
  const navigate = useNavigate();
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<Language>('pt');

  useEffect(() => {
    // Sincronizar idioma da URL com o estado e i18next
    const currentLang = (lang as Language) || 'pt';
    if (['pt', 'en', 'es'].includes(currentLang)) {
      setLanguage(currentLang);
      i18n.changeLanguage(currentLang);
      localStorage.setItem('preferredLanguage', currentLang);
    }
  }, [lang, i18n]);

  const changeLanguage = (newLang: Language) => {
    // Trocar idioma mantendo o mesmo path
    const currentPath = window.location.pathname;
    const pathWithoutLang = currentPath.replace(/^\/(pt|en|es)/, '');
    const newPath = `/${newLang}${pathWithoutLang}`;
    
    navigate(newPath);
    setLanguage(newLang);
    i18n.changeLanguage(newLang);
    localStorage.setItem('preferredLanguage', newLang);
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        languages: SUPPORTED_LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage deve ser usado dentro de um LanguageProvider');
  }
  return context;
}

