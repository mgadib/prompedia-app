/**
 * Sitemap Generator Utility
 * Generate dynamic sitemap.xml from Supabase data
 */

import { supabase } from '@/integrations/supabase/client';
import { ENV } from './constants';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Get all public prompts for sitemap
 */
async function getPublicPrompts(): Promise<Array<{ id: string; updated_at?: string }>> {
  try {
    const { data, error } = await supabase
      .from('prompts')
      .select('id, updated_at')
      .eq('is_public', true)
      .order('id', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Failed to fetch public prompts for sitemap:', error);
    return [];
  }
}

/**
 * Get all unique tag names from public prompts
 */
async function getUniquePublicTagNames(): Promise<string[]> {
  try {
    // Get all public prompts
    const { data: prompts, error: promptsError } = await supabase
      .from('prompts')
      .select('id')
      .eq('is_public', true);

    if (promptsError) throw promptsError;
    if (!prompts || prompts.length === 0) return [];

    const promptIds = prompts.map(p => p.id);

    // Get all tags linked to public prompts
    const { data: promptTags, error: tagsError } = await supabase
      .from('prompt_tags')
      .select('tag_id')
      .in('prompt_id', promptIds);

    if (tagsError) throw tagsError;
    if (!promptTags || promptTags.length === 0) return [];

    const tagIds = Array.from(new Set(promptTags.map(pt => pt.tag_id)));

    // Get tag names
    const { data: tags, error: tagNamesError } = await supabase
      .from('tags')
      .select('name')
      .in('id', tagIds);

    if (tagNamesError) throw tagNamesError;
    if (!tags) return [];

    // Return unique tag names
    return Array.from(new Set(tags.map(t => t.name).filter(Boolean)));
  } catch (error) {
    console.error('Failed to fetch unique tag names for sitemap:', error);
    return [];
  }
}

/**
 * Format date for sitemap (YYYY-MM-DD)
 */
function formatDate(date?: string | null): string {
  if (!date) {
    return new Date().toISOString().split('T')[0] || '';
  }
  try {
    return new Date(date).toISOString().split('T')[0] || '';
  } catch {
    return new Date().toISOString().split('T')[0] || '';
  }
}

/**
 * Escape XML special characters
 */
function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate sitemap XML string
 */
function generateSitemapXml(urls: SitemapUrl[]): string {
  const baseUrl = ENV.SITE_URL || 'https://prompedia.app';
  
  const urlEntries = urls.map(url => {
    const loc = escapeXml(`${baseUrl}${url.loc}`);
    const lastmod = url.lastmod ? `    <lastmod>${url.lastmod}</lastmod>\n` : '';
    const changefreq = url.changefreq ? `    <changefreq>${url.changefreq}</changefreq>\n` : '';
    const priority = url.priority !== undefined ? `    <priority>${url.priority}</priority>\n` : '';
    
    return `  <url>\n    <loc>${loc}</loc>\n${lastmod}${changefreq}${priority}  </url>`;
  }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlEntries}
</urlset>`;
}

/**
 * Generate complete sitemap with all routes
 */
export async function generateSitemap(): Promise<string> {
  const today = formatDate();
  
  const urls: SitemapUrl[] = [];

  // Homepage
  urls.push({
    loc: '/',
    lastmod: today,
    changefreq: 'daily',
    priority: 1.0,
  });

  // Public prompts
  const prompts = await getPublicPrompts();
  prompts.forEach(prompt => {
    urls.push({
      loc: `/p/${prompt.id}`,
      lastmod: formatDate(prompt.updated_at),
      changefreq: 'weekly',
      priority: 0.8,
    });
  });

  // Unique tag pages
  const tagNames = await getUniquePublicTagNames();
  tagNames.forEach(tagName => {
    urls.push({
      loc: `/tags/${encodeURIComponent(tagName)}`,
      lastmod: today,
      changefreq: 'weekly',
      priority: 0.7,
    });
  });

  return generateSitemapXml(urls);
}

/**
 * Generate sitemap and save to file (for build scripts)
 */
export async function generateAndSaveSitemap(outputPath: string = 'public/sitemap.xml'): Promise<void> {
  try {
    const sitemapXml = await generateSitemap();
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, sitemapXml, 'utf-8');
    console.log(`✅ Sitemap generated successfully: ${outputPath}`);
    console.log(`   Total URLs: ${sitemapXml.match(/<url>/g)?.length || 0}`);
  } catch (error) {
    console.error('❌ Failed to generate sitemap:', error);
    throw error;
  }
}

