import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ENV } from '../lib/constants';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface AuthorInfo {
  name?: string;
  url?: string;
  identifier?: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: 'website' | 'article' | 'profile' | 'book' | 'music' | 'video';
  tags?: string[];
  canonical?: string;
  jsonLd?: Record<string, any> | Record<string, any>[] | null;
  breadcrumbs?: BreadcrumbItem[];
  // Enhanced props for GEO
  author?: AuthorInfo;
  publishedTime?: string;
  modifiedTime?: string;
  schemaType?: 'Article' | 'CreativeWork' | 'CollectionPage' | 'WebPage' | 'FAQPage' | 'HowTo';
  // For CollectionPage (tag pages)
  collectionItemCount?: number;
  // For FAQPage
  faqItems?: Array<{ question: string; answer: string }>;
  // For HowTo
  howToSteps?: Array<{ name: string; text: string; image?: string }>;
  // Language support
  alternateLanguages?: Array<{ lang: string; url: string }>;
}

const setOrCreateMeta = (selector: string, attrs: Record<string, string>) => {
  const head = document.head;
  let el = head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    head.appendChild(el);
  } else {
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
  }
};

const setOrCreateLink = (rel: string, href: string, hreflang?: string) => {
  const head = document.head;
  const selector = hreflang 
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    if (hreflang) {
      el.setAttribute('hreflang', hreflang);
    }
    head.appendChild(el);
  } else {
    el.setAttribute('href', href);
    if (hreflang) {
      el.setAttribute('hreflang', hreflang);
    }
  }
};

const setOrCreateJsonLd = (id: string, payload: Record<string, any>) => {
  const head = document.head;
  let el = head.querySelector<HTMLScriptElement>(`script#${id}`);
  const json = JSON.stringify(payload, null, 0);
  if (!el) {
    el = document.createElement('script');
    el.setAttribute('id', id);
    el.setAttribute('type', 'application/ld+json');
    el.text = json;
    head.appendChild(el);
  } else {
    el.text = json;
  }
};

export const SEO = ({
  title,
  description,
  url,
  image,
  type = 'website',
  tags,
  canonical,
  jsonLd,
  breadcrumbs,
  author,
  publishedTime,
  modifiedTime,
  schemaType,
  collectionItemCount,
  faqItems,
  howToSteps,
  alternateLanguages,
}: SEOProps) => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language || 'en';
  const baseUrl = ENV.SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://prompedia.app');

  useEffect(() => {
    const pageTitle = title || ENV.SITE_TITLE;
    
    // Update HTML lang attribute
    if (typeof document !== 'undefined') {
      document.documentElement.lang = currentLang;
    }

    // Title
    document.title = pageTitle;
    setOrCreateMeta('meta[name="title"]', { name: 'title', content: pageTitle });

    // Meta dasar
    if (description) {
      setOrCreateMeta('meta[name="description"]', { name: 'description', content: description });
      setOrCreateMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: description });
      setOrCreateMeta('meta[property="og:description"]', { property: 'og:description', content: description });
    }

    if (tags?.length) {
      setOrCreateMeta('meta[name="keywords"]', { name: 'keywords', content: tags.join(', ') });
    }

    // Canonical URL
    const canonicalUrl = canonical || url || baseUrl;
    if (canonicalUrl) {
      setOrCreateLink('canonical', canonicalUrl);
    }

    // OpenGraph metadata
    setOrCreateMeta('meta[property="og:type"]', { property: 'og:type', content: type });
    setOrCreateMeta('meta[property="og:locale"]', { property: 'og:locale', content: currentLang === 'id' ? 'id_ID' : 'en_US' });
    if (pageTitle) {
      setOrCreateMeta('meta[property="og:title"]', { property: 'og:title', content: pageTitle });
      setOrCreateMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageTitle });
    }
    if (url) {
      setOrCreateMeta('meta[property="og:url"]', { property: 'og:url', content: url });
    }
    if (image) {
      setOrCreateMeta('meta[property="og:image"]', { property: 'og:image', content: image });
      setOrCreateMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: image });
      setOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    } else {
      const defaultImage = `${baseUrl}/og-image.png`;
      setOrCreateMeta('meta[property="og:image"]', { property: 'og:image', content: defaultImage });
      setOrCreateMeta('meta[name="twitter:image"]', { name: 'twitter:image', content: defaultImage });
      setOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    }

    // Article-specific meta tags
    if (type === 'article') {
      if (publishedTime) {
        setOrCreateMeta('meta[property="article:published_time"]', { property: 'article:published_time', content: publishedTime });
      }
      if (modifiedTime) {
        setOrCreateMeta('meta[property="article:modified_time"]', { property: 'article:modified_time', content: modifiedTime });
      }
      if (tags?.length) {
        tags.forEach(tag => {
          setOrCreateMeta(`meta[property="article:tag"][content="${tag}"]`, { property: 'article:tag', content: tag });
        });
      }
      if (author?.name) {
        setOrCreateMeta('meta[property="article:author"]', { property: 'article:author', content: author.name });
      }
    }

    // Hreflang tags for multi-language support
    const defaultAlternates: Array<{ lang: string; url: string }> = [
      { lang: 'en', url: canonicalUrl },
      { lang: 'id', url: canonicalUrl },
      { lang: 'x-default', url: canonicalUrl },
    ];

    const alternates = alternateLanguages || defaultAlternates;
    alternates.forEach(alt => {
      setOrCreateLink('alternate', alt.url, alt.lang);
    });

    // JSON-LD structured data
    const structuredData: Record<string, any>[] = [];

    // Main schema based on schemaType
    if (schemaType === 'Article' || (type === 'article' && !schemaType)) {
      const articleSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: pageTitle,
        description: description || '',
        url: url || canonicalUrl,
        inLanguage: currentLang,
        datePublished: publishedTime || new Date().toISOString(),
        dateModified: modifiedTime || publishedTime || new Date().toISOString(),
      };

      if (image) {
        articleSchema.image = image;
      }

      if (author) {
        articleSchema.author = {
          '@type': 'Person',
          ...(author.name && { name: author.name }),
          ...(author.url && { url: author.url }),
          ...(author.identifier && { identifier: author.identifier }),
        };
      }

      if (tags?.length) {
        articleSchema.keywords = tags.join(', ');
      }

      if (breadcrumbs?.length) {
        articleSchema.breadcrumb = {
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((b, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: b.name,
            item: b.url,
          })),
        };
      }

      structuredData.push(articleSchema);
    } else if (schemaType === 'CreativeWork') {
      const creativeWorkSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'CreativeWork',
        name: pageTitle,
        description: description || '',
        url: url || canonicalUrl,
        inLanguage: currentLang,
      };

      if (image) {
        creativeWorkSchema.image = image;
      }

      if (author) {
        creativeWorkSchema.author = {
          '@type': 'Person',
          ...(author.name && { name: author.name }),
          ...(author.url && { url: author.url }),
          ...(author.identifier && { identifier: author.identifier }),
        };
      }

      if (tags?.length) {
        creativeWorkSchema.keywords = tags.join(', ');
      }

      structuredData.push(creativeWorkSchema);
    } else if (schemaType === 'CollectionPage') {
      const collectionSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: pageTitle,
        description: description || '',
        url: url || canonicalUrl,
        inLanguage: currentLang,
      };

      if (collectionItemCount !== undefined) {
        collectionSchema.numberOfItems = collectionItemCount;
      }

      structuredData.push(collectionSchema);
    } else if (schemaType === 'FAQPage' && faqItems?.length) {
      const faqSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqItems.map(item => ({
          '@type': 'Question',
          name: item.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.answer,
          },
        })),
      };

      structuredData.push(faqSchema);
    } else if (schemaType === 'HowTo' && howToSteps?.length) {
      const howToSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        name: pageTitle,
        description: description || '',
        step: howToSteps.map((step, idx) => ({
          '@type': 'HowToStep',
          position: idx + 1,
          name: step.name,
          text: step.text,
          ...(step.image && { image: step.image }),
        })),
      };

      structuredData.push(howToSchema);
    }

    // Custom JSON-LD (can be single object or array)
    if (jsonLd) {
      if (Array.isArray(jsonLd)) {
        structuredData.push(...jsonLd);
      } else {
        structuredData.push(jsonLd);
      }
    }

    // Breadcrumbs (if not already included in Article schema)
    if (breadcrumbs?.length && schemaType !== 'Article' && type !== 'article') {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url,
        })),
      };
      structuredData.push(breadcrumbSchema);
    }

    // Add all structured data
    structuredData.forEach((data, idx) => {
      setOrCreateJsonLd(`seo-jsonld-${idx}`, data);
    });

    // Cleanup function
    return () => {
      const cleanupIds: string[] = [];
      for (let i = 0; i < 10; i++) {
        cleanupIds.push(`seo-jsonld-${i}`);
      }
      cleanupIds.push('seo-breadcrumbs');
      cleanupIds.forEach((id) => {
        const node = document.head.querySelector(`#${id}`);
        if (node) node.remove();
      });
    };
  }, [
    title,
    description,
    url,
    image,
    type,
    tags,
    canonical,
    jsonLd,
    breadcrumbs,
    author,
    publishedTime,
    modifiedTime,
    schemaType,
    collectionItemCount,
    faqItems,
    howToSteps,
    alternateLanguages,
    currentLang,
    baseUrl,
  ]);

  return null;
};

export default SEO;
