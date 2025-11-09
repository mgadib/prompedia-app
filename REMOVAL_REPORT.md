# REMOVAL REPORT
## Deep Clean Codebase Audit

**Generated:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

---

## Executive Summary

**Current Bundle Size:** 0.87 MB (895 KB)  
**Estimated Post-Cleanup:** ~0.80 MB (800 KB)  
**Bundle Size Reduction:** ~11% (-95 KB)

**Current Dependencies:** 69 packages  
**Estimated Post-Cleanup:** ~45 packages  
**Dependency Reduction:** ~35% (-24 packages)

**Files to Delete:** 35+ files

---

## Bundle Size Impact

### Current Bundle Breakdown
```
index-DHE1M1qD.js        242 KB  (Main app bundle)
ui-vendor-JIIAyobU.js     89 KB  (UI components - HEAVY)
supabase-BJgz1uob.js     153 KB  (Supabase SDK - KEEP)
react-vendor-CqrCmzmk.js 159 KB  (React core - KEEP)
App-Bs-Nc_u7.js           83 KB  (App page)
index-D8lssZlt.css        68 KB  (Styles)
Other chunks             101 KB
─────────────────────────────────
TOTAL                     895 KB
```

### Estimated Savings
- **UI Vendor Bundle:** -40 KB (remove unused Radix components)
- **Main Bundle:** -30 KB (remove dead code)
- **CSS:** -10 KB (remove unused styles)
- **Other optimizations:** -10 KB

**Total Estimated Savings:** ~90 KB (10% reduction)

---

## Dependencies Audit

### Priority 1 - Safe to Delete (Unused Packages)

#### UI Component Libraries (Unused)
- `embla-carousel-react` (8.6.0) - Carousel component never imported
- `recharts` (2.15.4) - Chart component never imported  
- `input-otp` (1.4.2) - InputOTP component never imported
- `react-day-picker` (8.10.1) - Calendar component never imported
- `react-resizable-panels` (2.1.9) - Resizable component never imported
- `vaul` (0.9.9) - Drawer component never imported
- `cmdk` (1.1.1) - Command component never imported

#### Form Libraries (Unused)
- `react-hook-form` (7.61.1) - Only imported in form.tsx, but form.tsx never used
- `@hookform/resolvers` (3.10.0) - Depends on react-hook-form

#### Theme Library (Can be simplified)
- `next-themes` (0.3.0) - Only used in sonner.tsx, can hardcode theme

#### Dev Dependencies (Unused)
- `lovable-tagger` (1.1.11) - Only used in vite.config.ts for dev mode, safe to remove
- `@tailwindcss/typography` (0.5.16) - Not configured in tailwind.config.ts

#### Unused Radix UI Packages (20 packages)
These correspond to unused UI components:
- `@radix-ui/react-accordion`
- `@radix-ui/react-aspect-ratio`
- `@radix-ui/react-avatar`
- `@radix-ui/react-checkbox`
- `@radix-ui/react-collapsible`
- `@radix-ui/react-context-menu`
- `@radix-ui/react-hover-card`
- `@radix-ui/react-menubar`
- `@radix-ui/react-navigation-menu`
- `@radix-ui/react-popover`
- `@radix-ui/react-progress`
- `@radix-ui/react-radio-group`
- `@radix-ui/react-scroll-area`
- `@radix-ui/react-slider`
- `@radix-ui/react-switch`
- `@radix-ui/react-table` (if exists)
- `@radix-ui/react-tabs`
- `@radix-ui/react-toggle`
- `@radix-ui/react-toggle-group`
- `@radix-ui/react-breadcrumb` (if exists)

**Total Unused Dependencies:** 30 packages

### Priority 2 - Needs Code Changes Before Removal

#### `date-fns` (3.6.0)
- **Status:** Used in `src/lib/i18n-formatting.ts`
- **Issue:** `i18n-formatting.ts` is never imported anywhere
- **Action:** Delete `i18n-formatting.ts` first, then remove `date-fns`
- **Impact:** No functional impact (file is orphaned)

---

## Files Deleted

### Dead Code Modules

#### Pages
- `src/pages/Index.tsx` - Never imported, unused fallback page

#### Hooks
- `src/hooks/usePromptOperations.ts` - Never imported anywhere
- `src/hooks/usePrompts.ts` - Never imported (React Query hooks unused)

#### Libraries
- `src/lib/performance-monitor.ts` - Only self-referenced, never used
- `src/lib/i18n-formatting.ts` - Never imported, orphaned
- `src/lib/actions.ts` - Contains `generateActionInstructions()` which is unused (only `generateModeAwareActionInstructions` is used)

#### UI Components (Unused)
- `src/components/ui/accordion.tsx`
- `src/components/ui/aspect-ratio.tsx`
- `src/components/ui/avatar.tsx`
- `src/components/ui/breadcrumb.tsx`
- `src/components/ui/calendar.tsx`
- `src/components/ui/carousel.tsx`
- `src/components/ui/chart.tsx`
- `src/components/ui/checkbox.tsx`
- `src/components/ui/collapsible.tsx`
- `src/components/ui/command.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/drawer.tsx`
- `src/components/ui/hover-card.tsx`
- `src/components/ui/input-otp.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/navigation-menu.tsx`
- `src/components/ui/pagination.tsx`
- `src/components/ui/popover.tsx`
- `src/components/ui/progress.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/resizable.tsx`
- `src/components/ui/scroll-area.tsx`
- `src/components/ui/slider.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/toggle.tsx`
- `src/components/ui/toggle-group.tsx`

**Total UI Component Files:** 27 files

#### Styles
- `src/App.css` - Contains unused `.logo`, `.card`, `.read-the-docs` styles

#### Test Files (Optional)
- `src/lib/storage-manager.test.ts` - Test file, can be kept if tests are run

#### Public Assets
- `public/placeholder.svg` - Never referenced in code

**Total Files to Delete:** 35+ files

---

## Priority 1 - Safe to Delete

### Dependencies
```bash
npm uninstall embla-carousel-react recharts input-otp react-day-picker react-resizable-panels vaul cmdk react-hook-form @hookform/resolvers next-themes @tailwindcss/typography lovable-tagger

npm uninstall @radix-ui/react-accordion @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group
```

### Files
```bash
# Dead code modules
rm src/pages/Index.tsx
rm src/hooks/usePromptOperations.ts
rm src/hooks/usePrompts.ts
rm src/lib/performance-monitor.ts
rm src/lib/i18n-formatting.ts

# Unused UI components (27 files)
rm src/components/ui/accordion.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/calendar.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/checkbox.tsx
rm src/components/ui/collapsible.tsx
rm src/components/ui/command.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/pagination.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/progress.tsx
rm src/components/ui/radio-group.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/scroll-area.tsx
rm src/components/ui/slider.tsx
rm src/components/ui/switch.tsx
rm src/components/ui/table.tsx
rm src/components/ui/tabs.tsx
rm src/components/ui/toggle.tsx
rm src/components/ui/toggle-group.tsx

# Unused styles
rm src/App.css

# Unused assets
rm public/placeholder.svg
```

**Impact:** Removes ~30 unused dependencies and 35+ dead files. No functional impact.

---

## Priority 2 - Needs Refactoring (COMPLETED ✅)

### 1. `src/lib/actions.ts` - Remove unused function ✅
**Status:** COMPLETED
**File:** `src/lib/actions.ts`  
**Issue:** `generateActionInstructions()` is exported but never used  
**Usage Analysis:** Only `generateModeAwareActionInstructions()` is used (in PromptEditor.tsx)  
**Migration Plan:**
- Remove `generateActionInstructions()` function (lines 177-187)
- Keep `generateModeAwareActionInstructions()` and `getActionById()`

**Code Change:**
```typescript
// DELETE lines 177-187:
export const generateActionInstructions = (actionId: string, content: string): string => {
  // ... entire function
};
```

### 2. `src/components/ui/sonner.tsx` - Remove next-themes dependency ✅
**Status:** COMPLETED
**File:** `src/components/ui/sonner.tsx`  
**Issue:** Uses `next-themes` only for theme detection  
**Migration Plan:**
- Remove `import { useTheme } from "next-themes"`
- Hardcode theme to "system" or detect via CSS media query
- Alternative: Use `localStorage.getItem('theme')` or default to "light"

**Code Change:**
```typescript
// BEFORE:
import { useTheme } from "next-themes";
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();
  return <Sonner theme={theme as ToasterProps["theme"]} ... />
};

// AFTER:
const Toaster = ({ ...props }: ToasterProps) => {
  // Simple theme detection
  const theme = typeof window !== 'undefined' 
    ? (localStorage.getItem('theme') || 'system') 
    : 'system';
  return <Sonner theme={theme as ToasterProps["theme"]} ... />
};
```

### 3. `src/components/ui/skeleton.tsx` - Remove unused exports ✅
**Status:** COMPLETED
**File:** `src/components/ui/skeleton.tsx`  
**Issue:** `SkeletonInput`, `SkeletonText`, `SkeletonButton` are exported but never used  
**Usage Analysis:** Only `Skeleton` and `SkeletonCard` are imported  
**Migration Plan:**
- Remove unused skeleton variants (lines 48-80)
- Keep only `Skeleton` and `SkeletonCard`

**Code Change:**
```typescript
// DELETE lines 48-80:
function SkeletonInput(...) { ... }
function SkeletonText(...) { ... }
function SkeletonButton(...) { ... }

// UPDATE export:
export { Skeleton, SkeletonCard };
```

### 4. `src/index.css` - Remove unused CSS classes ✅
**Status:** COMPLETED
**File:** `src/index.css`  
**Issue:** Several utility classes defined but never used  
**Unused Classes:**
- `.sidebar-mobile` and `.sidebar-mobile.open` (lines 142-152)
- `.editor-header-mobile` (lines 160-164)
- `.editor-buttons-mobile` (lines 166-171)
- `.editor-controls-mobile` (lines 173-177)
- `.sidebar-tablet` (lines 193-195)
- `.responsive-text`, `.responsive-padding`, `.responsive-gap` (lines 203-213) - Only `.responsive-text` is used in PromptLibrary.tsx

**Migration Plan:**
- Remove unused mobile/tablet classes
- Keep `.responsive-text` (used in PromptLibrary.tsx)
- Remove `.responsive-padding` and `.responsive-gap`

**Code Change:**
```css
/* DELETE lines 142-177 (unused mobile classes) */
/* DELETE lines 193-195 (unused tablet classes) */
/* DELETE lines 207-213 (unused responsive utilities, except responsive-text) */
```

### 5. `vite.config.ts` - Remove lovable-tagger ✅
**Status:** COMPLETED
**File:** `vite.config.ts`  
**Issue:** `lovable-tagger` only used in dev mode  
**Migration Plan:**
- Remove import: `import { componentTagger } from "lovable-tagger";`
- Remove from plugins: `mode === "development" && componentTagger()`

**Code Change:**
```typescript
// BEFORE:
import { componentTagger } from "lovable-tagger";
plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),

// AFTER:
plugins: [react()],
```

---

## Priority 3 - Replace with Lighter Alternative

### None Identified
All heavy libraries in use are necessary:
- `@supabase/supabase-js` - Core functionality (157 KB - acceptable)
- `react` + `react-dom` - Core framework (163 KB - acceptable)
- `@tanstack/react-query` - Data fetching (included in react-vendor)
- `i18next` - Internationalization (necessary)

**Note:** The main bundle size contributors are essential dependencies. The cleanup focuses on removing unused code rather than replacing libraries.

---

## Actual Commands to Execute

### Step 1: Remove Dependencies
```bash
# Remove unused UI libraries
npm uninstall embla-carousel-react recharts input-otp react-day-picker react-resizable-panels vaul cmdk

# Remove unused form libraries
npm uninstall react-hook-form @hookform/resolvers

# Remove theme library (after refactoring sonner.tsx)
npm uninstall next-themes

# Remove unused Radix UI packages
npm uninstall @radix-ui/react-accordion @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-hover-card @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toggle @radix-ui/react-toggle-group

# Remove unused dev dependencies
npm uninstall @tailwindcss/typography lovable-tagger

# Remove date-fns (after deleting i18n-formatting.ts)
npm uninstall date-fns
```

### Step 2: Delete Dead Code Files
```bash
# Dead modules
rm src/pages/Index.tsx
rm src/hooks/usePromptOperations.ts
rm src/hooks/usePrompts.ts
rm src/lib/performance-monitor.ts
rm src/lib/i18n-formatting.ts
rm src/App.css
rm public/placeholder.svg

# Unused UI components (27 files)
rm src/components/ui/accordion.tsx
rm src/components/ui/aspect-ratio.tsx
rm src/components/ui/avatar.tsx
rm src/components/ui/breadcrumb.tsx
rm src/components/ui/calendar.tsx
rm src/components/ui/carousel.tsx
rm src/components/ui/chart.tsx
rm src/components/ui/checkbox.tsx
rm src/components/ui/collapsible.tsx
rm src/components/ui/command.tsx
rm src/components/ui/context-menu.tsx
rm src/components/ui/drawer.tsx
rm src/components/ui/hover-card.tsx
rm src/components/ui/input-otp.tsx
rm src/components/ui/menubar.tsx
rm src/components/ui/navigation-menu.tsx
rm src/components/ui/pagination.tsx
rm src/components/ui/popover.tsx
rm src/components/ui/progress.tsx
rm src/components/ui/radio-group.tsx
rm src/components/ui/resizable.tsx
rm src/components/ui/scroll-area.tsx
rm src/components/ui/slider.tsx
rm src/components/ui/switch.tsx
rm src/components/ui/table.tsx
rm src/components/ui/tabs.tsx
rm src/components/ui/toggle.tsx
rm src/components/ui/toggle-group.tsx
```

### Step 3: Refactor Files ✅ COMPLETED
1. ✅ Edit `src/components/ui/sonner.tsx` - Removed next-themes dependency
2. ✅ Edit `src/lib/actions.ts` - Removed `generateActionInstructions()` function
3. ✅ Edit `src/components/ui/skeleton.tsx` - Removed unused skeleton variants
4. ✅ Edit `src/index.css` - Removed unused CSS classes
5. ✅ Edit `vite.config.ts` - Removed lovable-tagger

### Step 4: Verify Build
```bash
npm run build
npm run lint
npm run test  # If tests exist
```

---

## Summary

### Files Deleted: 35+ files
- 5 dead code modules
- 27 unused UI components
- 1 unused stylesheet
- 1 unused asset
- 1 test file (optional)

### Dependencies Removed: ~30 packages
- 7 unused UI libraries
- 2 unused form libraries
- 1 theme library (after refactor)
- 18 unused Radix UI packages
- 2 unused dev dependencies

### Bundle Size Impact
- **Before:** 895 KB
- **After:** ~800 KB (estimated)
- **Savings:** ~95 KB (11% reduction)

### Maintenance Benefits
- Reduced dependency surface area (security)
- Faster `npm install` times
- Smaller `node_modules` directory
- Cleaner codebase (easier to navigate)
- Reduced bundle analysis noise

---

## Post-Cleanup Checklist

- [ ] Run `npm install` to update lock file
- [ ] Run `npm run build` to verify build succeeds
- [ ] Run `npm run lint` to check for errors
- [ ] Test all major features (auth, prompts, library)
- [ ] Verify no runtime errors in browser console
- [ ] Check bundle size with `npm run build` output
- [ ] Update documentation if needed
- [ ] Commit changes with message: "chore: remove dead code and unused dependencies"

---

**Report Generated by:** Performance Engineer Audit  
**Date:** 2025-01-08

