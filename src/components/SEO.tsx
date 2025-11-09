import { useEffect } from 'react';
import { ENV } from '../lib/constants';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOProps {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  type?: string; // Tipe Open Graph
  tags?: string[];
  canonical?: string;
  jsonLd?: Record<string, any> | null;
  breadcrumbs?: BreadcrumbItem[];
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

const setOrCreateLink = (rel: string, href: string) => {
  const head = document.head;
  let el = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    el.setAttribute('href', href);
    head.appendChild(el);
  } else {
    el.setAttribute('href', href);
  }
};

const setOrCreateJsonLd = (id: string, payload: Record<string, any>) => {
  const head = document.head;
  let el = head.querySelector<HTMLScriptElement>(`script#${id}`);
  const json = JSON.stringify(payload);
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
}: SEOProps) => {
  useEffect(() => {
    const pageTitle = title || ENV.SITE_TITLE;
    // Judul
    document.title = pageTitle;
    // Meta title dasar untuk konsistensi
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

    // URL kanonik
    if (canonical || url) {
      setOrCreateLink('canonical', canonical || url!);
    }

    // OpenGraph metadata
    setOrCreateMeta('meta[property="og:type"]', { property: 'og:type', content: type });
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
      setOrCreateMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary' });
    }

    // JSON-LD untuk structured data
    if (jsonLd) {
      setOrCreateJsonLd('seo-jsonld', jsonLd);
    }

    if (breadcrumbs?.length) {
      const payload = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: breadcrumbs.map((b, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          name: b.name,
          item: b.url,
        })),
      };
      setOrCreateJsonLd('seo-breadcrumbs', payload);
    }

    // Pembersihan untuk menghindari tag yang stale di navigasi SPA
    return () => {
      const cleanupIds = ['seo-jsonld', 'seo-breadcrumbs'];
      cleanupIds.forEach((id) => {
        const node = document.head.querySelector(`#${id}`);
        if (node) node.remove();
      });
    };
  }, [title, description, url, image, type, tags, canonical, jsonLd, breadcrumbs]);

  return null;
};

export default SEO;