# ADR: SEO & GEO Improvements (2025-11-06)

## Context
Comprehensive technical SEO and GEO evaluation identified opportunities to improve discoverability, sharing metadata, internal linking, observability, and performance. Key areas prioritized: dynamic per-page meta, JSON-LD, CSP alignment, internal links, telemetry, and initial bundle reduction.

## Decision
- Implement a reusable `SEO` component to set dynamic meta tags, canonical, and JSON-LD.
- Add breadcrumbs and `CreativeWork` schema on public prompt detail pages.
- Strengthen internal linking from public library cards to detail pages.
- Align `index.html` CSP with production headers to avoid policy drift.
- Add lightweight telemetry with `request_id` for user actions without new dependencies.
- Reduce initial bundle via route-level lazy-loading.

## Status
Accepted and implemented in this iteration.

## Changes
- `src/components/SEO.tsx`: New component for dynamic meta + canonical + JSON-LD + breadcrumbs.
- `src/pages/PublicPromptDetail.tsx`: Integrate `SEO`; add telemetry for view/copy/use actions.
- `src/components/PublicLibrary.tsx`: Add anchor links to detail; add telemetry for copy/use/modal; preserve card click behavior.
- `index.html`: CSP aligned to production (`script-src`, `connect-src` including `wss`, `img-src blob:`; `frame-ancestors 'none'`).
- `src/App.tsx`: Lazy-load route components with `React.lazy` and `Suspense` fallback.
- `src/lib/analytics.ts`: Minimal structured telemetry logger emitting JSON with `request_id`.

## Rationale
- Dynamic meta + JSON-LD improves SERP snippets, social previews, and crawl context per prompt.
- Breadcrumbs assist navigation and enhance search engine understanding of site structure.
- Internal links strengthen crawlability and distribute relevance to prompt detail pages.
- CSP consistency reduces unexpected client errors and tightens security posture.
- Telemetry provides traceability across request→UI actions→externals without adding dependencies.
- Lazy-loading reduces initial payload, supporting bundle budget targets.

## Validation Plan
- Build and measure bundle chunking to confirm splitting and size improvements.
- Manual UI verification: PublicLibrary links navigate to `/p/:id`, modal click remains intact.
- View page source/head to confirm dynamic meta tags and JSON-LD injection on detail routes.
- Confirm CSP header parity across environments (meta vs Vite production headers).
- Smoke test telemetry logs in console (dev) for defined events and payload.

## Risks & Mitigations
- SPA navigation may leave stale head tags; component cleans JSON-LD on unmount. Future: central meta manager.
- Telemetry currently logs locally; future enhancement to persist via Supabase table or edge function.
- CSP tightening might block future third-party assets; review before adding new externals.

## Future Work
- Dynamic sitemap generation based on public prompts (edge function or build-time script).
- RFC7807 error responses end-to-end.
- Bundle budget enforcement in CI and Lighthouse audits.
- i18n strategy for meta copy and structured data.

## Timeline
- Today: implement, verify, and document changes.
- Next 1–2 days: add dynamic sitemap and CI budget checks.

## Stakeholder Updates
- Engineering: Code changes and testing completed; telemetry live in dev.
- Product/SEO: Detail pages now emit rich metadata + breadcrumbs; internal links added.
- Security: CSP aligned; frame-ancestors denied.