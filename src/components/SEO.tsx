import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';

interface SEOProps {
    title?: string;
    description?: string;
    canonical?: string;
    type?: 'website' | 'article' | 'product';
    image?: string;
    noIndex?: boolean;
    structuredData?: object;
}

export const SEO = ({ title, description, canonical, type = 'website', image, noIndex = false, structuredData }: SEOProps) => {
    const { t, i18n } = useTranslation();
    const siteTitle = t('app.title');
    const defaultDescription = t('app.description');

    // Construct full title
    const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} - Catatan Prompt AI Pribadi`;
    const metaDescription = description || defaultDescription;
    const currentUrl = canonical || window.location.href;
    const locale = i18n.language;
    const defaultImage = 'https://prompedia.app/logo.png';

    // Organization schema - always included
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "prompedia.app",
        "url": "https://prompedia.app",
        "description": defaultDescription,
        "sameAs": ["https://kerjabaik.ai"]
    };

    // Combine organization schema with custom structured data
    const allStructuredData = structuredData 
        ? Array.isArray(structuredData) 
            ? [organizationSchema, ...structuredData]
            : [organizationSchema, structuredData]
        : organizationSchema;

    return (
        <Helmet>
            <html lang={locale} />
            <title>{fullTitle}</title>
            <meta name="description" content={metaDescription} />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:title" content={fullTitle} />
            <meta property="og:description" content={metaDescription} />
            <meta property="og:site_name" content={siteTitle} />
            <meta property="og:locale" content={locale === 'id' ? 'id_ID' : 'en_US'} />
            <meta property="og:image" content={image || defaultImage} />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={currentUrl} />
            <meta property="twitter:title" content={fullTitle} />
            <meta property="twitter:description" content={metaDescription} />
            <meta property="twitter:image" content={image || defaultImage} />

            {/* Geo / Special Tags for LLMs */}
            <meta name="keywords" content={t('geo.keywords')} />
            <meta name="geo.region" content={locale === 'id' ? 'ID' : 'US'} />

            {noIndex && <meta name="robots" content="noindex, follow" />}

            {/* JSON-LD Structured Data */}
            {Array.isArray(allStructuredData) ? (
                allStructuredData.map((schema, index) => (
                    <script key={index} type="application/ld+json">
                        {JSON.stringify(schema)}
                    </script>
                ))
            ) : (
                <script type="application/ld+json">
                    {JSON.stringify(allStructuredData)}
                </script>
            )}
        </Helmet>
    );
};
