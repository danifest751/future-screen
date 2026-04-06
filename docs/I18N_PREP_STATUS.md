# i18n Prep Status

## Purpose

This document tracks the ongoing cleanup needed before introducing full i18n with two languages.

Current strategy:
- remove hardcoded user-facing text from components and pages
- move copy into `src/content/*`
- keep behavior unchanged while preparing a clean base for `ru/en`
- keep locale preferences separate for public site and admin panel

## What Is Already Done

### Public app and shared UI

Centralized into `src/content/*`:
- global shell and shared UI copy
- `Header`, `Footer`, `RequestForm`, `ConsentCheckbox`, `LoginModal`, `ProtectedRoute`, `AdminGearButton`
- page copy for:
  - home
  - about
  - cases
  - case details
  - contacts
  - led
  - support
  - consult
  - prices
  - rent
  - rental category
  - privacy policy
  - not found
- structured data / SEO copy
- rental dropdown and rental components
- theme labels
- calculator copy
- background labels

### Static content and data

Moved out of page-level hardcode:
- `src/data/*` content mirrored into `src/content/data/*`
- adapters kept stable to avoid breaking existing imports

Covered datasets:
- cases
- categories
- contacts
- packages
- rent category content

### Admin pages already converted

Centralized into `src/content/pages/*`:
- backgrounds
- dashboard
- contacts
- packages
- categories
- content index
- privacy policy (admin)
- leads
- rental categories (list)
- rental category edit
- cases redesigned

### Admin shared UI already converted

Centralized into `src/content/components/*`:
- admin layout
- confirm modal
- case media selector
- media tag filter
- media library
- media card
- media bulk actions
- media upload modal

### Cleanup side effects already handled

- several files with broken text encoding were rewritten to clean UTF-8
- builds were kept green after each safe slice
- behavior and routing were intentionally preserved

### Locale infrastructure now in place

- added `I18nProvider` with separate locale state and storage keys:
  - public site locale
  - admin panel locale
- defaults configured as:
  - public site: `en`
  - admin panel: `ru`
- added independent language switchers:
  - in public header (site scope)
  - in admin top bar (admin scope)
- moved shared/global copy access to locale-aware runtime getters

## What Is Still Remaining

### High-priority admin pages

Still contain substantial user-facing hardcode:
- none in active admin routes after the latest cleanup pass

### Likely remaining shared/admin copy

Needs separate pass:
- `src/components/admin/media/*` leftovers, if any
- `src/components/admin/ui/*` leftovers with default user-facing labels
- any admin helper components with visible labels, placeholders, or empty states

### Public/internal copy not yet fully normalized

Still needs review:
- remaining service messages in hooks/libs where text is user-visible
- form validation and helper text in complex admin forms
- any toast/error/success messages outside already migrated areas
- full `en` coverage for all public page-specific content under `src/content/pages/*`

### Non-goals for this prep pass

Not part of current cleanup scope yet:
- translating comments/docblocks
- transliteration maps such as `slugify`
- technical console logs that are not user-facing
- dev/test pages unless they become relevant

## Recommended Next Steps

1. Finish remaining shared admin/media components:
   - sweep leftovers in `src/components/admin/media/*` and `src/components/admin/ui/*`

2. Finish heavy admin forms:
   - `AdminRentalCategoryEditPage`
   - re-check any future admin pages added after cleanup

3. Sweep remaining admin pages and toast/error strings.

4. After cleanup is complete, move to actual i18n architecture:
   - define locale routing strategy
   - introduce translation provider
   - split content into `ru/en`
   - decide how bilingual DB-managed content will be modeled

5. Finish public content parity:
   - add complete `ru/en` variants for each public page content module
   - validate all public routes in both locales

## Current Status Summary

Project status:
- public layer is largely i18n-prepared
- static content layer is largely centralized
- admin layer is partially centralized and significantly cleaner than before
- remaining work is concentrated in a smaller set of heavy admin screens

Build status during this prep:
- `npm run build` passes on current cleanup slices
