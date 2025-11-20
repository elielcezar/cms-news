import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * Componente para detectar idioma preferido e redirecionar
 * Usado na rota raiz "/" para direcionar ao idioma correto
 */
export function LanguageRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Verificar localStorage
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && ['pt', 'en', 'es'].includes(savedLang)) {
      navigate(`/${savedLang}`, { replace: true });
      return;
    }

    // 2. Detectar idioma do navegador
    const browserLang = navigator.language.toLowerCase();
    
    let detectedLang = 'pt'; // default
    
    if (browserLang.startsWith('pt')) {
      detectedLang = 'pt';
    } else if (browserLang.startsWith('en')) {
      detectedLang = 'en';
    } else if (browserLang.startsWith('es')) {
      detectedLang = 'es';
    }

    navigate(`/${detectedLang}`, { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-pulse">Carregando...</div>
    </div>
  );
}

