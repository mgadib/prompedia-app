/**
 * Sitemap Generator Utility
 * Generate dynamic sitemap.xml from Supabase data
 * Build-safe: handles database unavailability gracefully during build time
 */

import { getSupabase } from '@/integrations/supabase/client';
import { ENV } from './constants';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

/**
 * Check if we're in a build environment (Node.js, not browser)
 */
function isBuildEnvironment(): boolean {
  return typeof window === 'undefined' && typeof process !== 'undefined';
}

/**
 * Get all public prompts for sitemap with timeout and error handling
 */
async function getPublicPrompts(): Promise<Array<{ id: string; updated_at?: string }>> {
  // In build environment, skip database queries if they fail
  const isBuild = isBuildEnvironment();
  
  try {
    const supabase = getSupabase();
    
    // Add timeout for build environments (5 seconds)
    let queryPromise: Promise<{ data: Array<{ id: string; updated_at?: string }> | null; error: unknown }>;
    
    if (isBuild) {
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      queryPromise = Promise.race([
        supabase
          .from('prompts')
          .select('id, updated_at')
          .eq('is_public', true)
          .order('id', { ascending: false }),
        timeoutPromise
      ]) as Promise<{ data: Array<{ id: string; updated_at?: string }> | null; error: unknown }>;
    } else {
      queryPromise = supabase
        .from('prompts')
        .select('id, updated_at')
        .eq('is_public', true)
        .order('id', { ascending: false });
    }

    const result = await queryPromise;

    const { data, error } = result as { data: Array<{ id: string; updated_at?: string }> | null; error: unknown };
    
    if (error) {
      if (isBuild) {
        console.warn('⚠️ Database unavailable during build, using fallback sitemap');
        return [];
      }
      throw error;
    }
    return data || [];
  } catch (error) {
    if (isBuild) {
      console.warn('⚠️ Failed to fetch public prompts for sitemap (build environment):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
    console.error('Failed to fetch public prompts for sitemap:', error);
    return [];
  }
}

/**
 * Get all unique tag names from public prompts with timeout and error handling
 */
async function getUniquePublicTagNames(): Promise<string[]> {
  const isBuild = isBuildEnvironment();
  
  try {
    const supabase = getSupabase();
    
    // Get all public prompts
    let promptsQueryPromise: Promise<{ data: Array<{ id: string }> | null; error: unknown }>;
    
    if (isBuild) {
      const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) => 
        setTimeout(() => reject(new Error('Database query timeout')), 5000)
      );
      
      promptsQueryPromise = Promise.race([
        supabase
          .from('prompts')
          .select('id')
          .eq('is_public', true),
        timeoutPromise
      ]) as Promise<{ data: Array<{ id: string }> | null; error: unknown }>;
    } else {
      promptsQueryPromise = supabase
        .from('prompts')
        .select('id')
        .eq('is_public', true);
    }

    const promptsResult = await promptsQueryPromise;

    const { data: prompts, error: promptsError } = promptsResult as { data: Array<{ id: string }> | null; error: unknown };

    if (promptsError) {
      if (isBuild) {
        console.warn('⚠️ Database unavailable during build, skipping tags');
        return [];
      }
      throw promptsError;
    }
    if (!prompts || prompts.length === 0) return [];

    const promptIds = prompts.map(p => p.id);

    // Get all tags linked to public prompts
    const promptTagsResult = await supabase
      .from('prompt_tags')
      .select('tag_id')
      .in('prompt_id', promptIds);

    const { data: promptTags, error: tagsError } = promptTagsResult;

    if (tagsError) {
      if (isBuild) return [];
      throw tagsError;
    }
    if (!promptTags || promptTags.length === 0) return [];

    const tagIds = Array.from(new Set(promptTags.map(pt => pt.tag_id)));

    // Get tag names
    const tagsResult = await supabase
      .from('tags')
      .select('name')
      .in('id', tagIds);

    const { data: tags, error: tagNamesError } = tagsResult;

    if (tagNamesError) {
      if (isBuild) return [];
      throw tagNamesError;
    }
    if (!tags) return [];

    // Return unique tag names
    return Array.from(new Set(tags.map(t => t.name).filter(Boolean)));
  } catch (error) {
    if (isBuild) {
      console.warn('⚠️ Failed to fetch unique tag names for sitemap (build environment):', error instanceof Error ? error.message : 'Unknown error');
      return [];
    }
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
 * Generate minimal fallback sitemap (used when database is unavailable)
 */
function generateFallbackSitemap(): string {
  const today = formatDate();
  const urls: SitemapUrl[] = [
    {
      loc: '/',
      lastmod: today,
      changefreq: 'daily',
      priority: 1.0,
    },
  ];
  return generateSitemapXml(urls);
}

/**
 * Generate complete sitemap with all routes
 * Returns fallback sitemap if database is unavailable (build-safe)
 */
export async function generateSitemap(): Promise<string> {
  const today = formatDate();
  const isBuild = isBuildEnvironment();
  
  const urls: SitemapUrl[] = [];

  // Homepage (always included)
  urls.push({
    loc: '/',
    lastmod: today,
    changefreq: 'daily',
    priority: 1.0,
  });

  try {
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
  } catch (error) {
    // If database fails and we're in build, use fallback
    if (isBuild) {
      console.warn('⚠️ Using fallback sitemap due to database unavailability');
      return generateFallbackSitemap();
    }
    // In runtime, still try to return what we have
    console.warn('⚠️ Some sitemap data unavailable, continuing with available data');
  }

  return generateSitemapXml(urls);
}

/**
 * Generate sitemap and save to file (for build scripts)
 * Build-safe: never throws, always creates a valid sitemap even if database is unavailable
 */
export async function generateAndSaveSitemap(outputPath: string = 'public/sitemap.xml'): Promise<void> {
  try {
    const sitemapXml = await generateSitemap();
    const fs = await import('fs/promises');
    await fs.writeFile(outputPath, sitemapXml, 'utf-8');
    const urlCount = sitemapXml.match(/<url>/g)?.length || 0;
    console.log(`✅ Sitemap generated successfully: ${outputPath}`);
    console.log(`   Total URLs: ${urlCount}`);
    
    if (urlCount === 1) {
      console.log('   ℹ️  Fallback sitemap used (database unavailable during build)');
    }
  } catch (error) {
    // Even if generation fails, create a minimal fallback sitemap
    console.error('❌ Failed to generate sitemap, creating fallback:', error);
    try {
      const fallbackXml = generateFallbackSitemap();
      const fs = await import('fs/promises');
      await fs.writeFile(outputPath, fallbackXml, 'utf-8');
      console.log(`✅ Fallback sitemap created: ${outputPath}`);
    } catch (fallbackError) {
      // If even fallback fails, log but don't throw (build should continue)
      console.error('❌ Failed to create fallback sitemap:', fallbackError);
      console.warn('⚠️  Build will continue without sitemap');
    }
  }
}

