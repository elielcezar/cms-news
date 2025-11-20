import { Helmet } from 'react-helmet-async';
import { useLanguage } from '@/contexts/LanguageContext';

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  article?: boolean;
  canonicalPath?: string;
}

export function SEO({
  title,
  description = 'We Love Rave - Your source for electronic music news',
  image = '/og-image.jpg',
  article = false,
  canonicalPath = '',
}: SEOProps) {
  const { language } = useLanguage();
  
  const siteTitle = 'We Love Rave';
  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle;
  const baseUrl = 'https://weloverave.club';
  const canonicalUrl = `${baseUrl}/${language}${canonicalPath}`;

  // URLs alternativas para hreflang
  const alternateUrls = {
    pt: `${baseUrl}/pt${canonicalPath}`,
    en: `${baseUrl}/en${canonicalPath}`,
    es: `${baseUrl}/es${canonicalPath}`,
  };

  return (
    <Helmet>
      {/* Títulos */}
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} />
      <meta name="twitter:title" content={fullTitle} />

      {/* Descrições */}
      <meta name="description" content={description} />
      <meta property="og:description" content={description} />
      <meta name="twitter:description" content={description} />

      {/* Imagens */}
      <meta property="og:image" content={image.startsWith('http') ? image : `${baseUrl}${image}`} />
      <meta name="twitter:image" content={image.startsWith('http') ? image : `${baseUrl}${image}`} />
      <meta name="twitter:card" content="summary_large_image" />

      {/* URLs */}
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:url" content={canonicalUrl} />

      {/* Tipo de conteúdo */}
      <meta property="og:type" content={article ? 'article' : 'website'} />

      {/* Idioma */}
      <meta property="og:locale" content={language === 'pt' ? 'pt_BR' : language === 'en' ? 'en_US' : 'es_ES'} />

      {/* Hreflang para SEO multilíngue */}
      <link rel="alternate" hrefLang="pt" href={alternateUrls.pt} />
      <link rel="alternate" hrefLang="en" href={alternateUrls.en} />
      <link rel="alternate" hrefLang="es" href={alternateUrls.es} />
      <link rel="alternate" hrefLang="x-default" href={alternateUrls.pt} />

      {/* Site Name */}
      <meta property="og:site_name" content={siteTitle} />
    </Helmet>
  );
}

