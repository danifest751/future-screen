/**
 * Маппинг-функции для преобразования данных из БД (snake_case) в формат приложения (camelCase).
 */

import type { Database } from './database.types';
import type { CaseItem } from '../data/cases';
import type { Category } from '../data/categories';
import type { Package } from '../data/packages';
import type { LeadLog } from '../types/leads';
import type { LeadDeliveryLogEntry } from '../types/leads';
import type { Locale } from '../i18n/types';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type PackageRow = Database['public']['Tables']['packages']['Row'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type ContactRow = Database['public']['Tables']['contacts']['Row'];

/**
 * Преобразовать кейс из БД в формат приложения.
 */
export function mapCaseFromDB(row: CaseRow, locale: Locale = 'ru', fallbackToRu = true): CaseItem {
  return {
    slug: row.slug,
    title: locale === 'en' ? (row.title_en ?? (fallbackToRu ? row.title : '')) : row.title,
    city: locale === 'en' ? (row.city_en ?? (fallbackToRu ? row.city : '') ?? '') : row.city ?? '',
    date: locale === 'en' ? (row.date_en ?? (fallbackToRu ? row.date : '') ?? '') : row.date ?? '',
    format: locale === 'en' ? (row.format_en ?? (fallbackToRu ? row.format : '') ?? '') : row.format ?? '',
    services: (row.services ?? []) as CaseItem['services'],
    summary: locale === 'en' ? (row.summary_en ?? (fallbackToRu ? row.summary : '') ?? '') : row.summary ?? '',
    metrics: (locale === 'en' ? row.metrics_en ?? (fallbackToRu ? row.metrics : undefined) : row.metrics) ?? undefined,
    images: row.images ?? undefined,
    videos: row.videos ?? undefined,
  };
}

/**
 * Преобразовать кейс из формата приложения в БД.
 */
export function mapCaseToDB(
  caseItem: { slug: string; title?: string; city?: string; date?: string; format?: string; services?: string[]; summary?: string; metrics?: string; images?: string[]; videos?: string[] },
  locale: Locale = 'ru',
  forInsert = false
): Record<string, unknown> {
  const localized = locale === 'en'
    ? {
        ...(forInsert
          ? {
              title: caseItem.title,
              city: caseItem.city,
              date: caseItem.date,
              format: caseItem.format,
              summary: caseItem.summary,
              metrics: caseItem.metrics,
            }
          : {}),
        title_en: caseItem.title,
        city_en: caseItem.city,
        date_en: caseItem.date,
        format_en: caseItem.format,
        summary_en: caseItem.summary,
        metrics_en: caseItem.metrics,
      }
    : {
        title: caseItem.title,
        city: caseItem.city,
        date: caseItem.date,
        format: caseItem.format,
        summary: caseItem.summary,
        metrics: caseItem.metrics,
      };

  return {
    slug: caseItem.slug,
    ...localized,
    services: caseItem.services,
    images: caseItem.images,
    videos: caseItem.videos,
  };
}

/**
 * Преобразовать категорию из БД в формат приложения.
 */
export function mapCategoryFromDB(row: CategoryRow, locale: Locale = 'ru', fallbackToRu = true): Category {
  return {
    id: row.id,
    title: locale === 'en' ? (row.title_en ?? (fallbackToRu ? row.title : '')) : row.title,
    shortDescription:
      locale === 'en'
        ? (row.short_description_en ?? (fallbackToRu ? row.short_description : '') ?? '')
        : row.short_description ?? '',
    bullets:
      locale === 'en'
        ? ((row.bullets_en?.length ? row.bullets_en : fallbackToRu ? row.bullets : []) ?? [])
        : row.bullets ?? [],
    pagePath: row.page_path ?? '',
  };
}

/**
 * Преобразовать категорию из формата приложения в БД.
 */
export function mapCategoryToDB(cat: Category, locale: Locale = 'ru', forInsert = false): Record<string, unknown> {
  const localized = locale === 'en'
    ? {
        ...(forInsert
          ? {
              title: cat.title,
              short_description: cat.shortDescription,
              bullets: cat.bullets,
            }
          : {}),
        title_en: cat.title,
        short_description_en: cat.shortDescription,
        bullets_en: cat.bullets,
      }
    : {
        title: cat.title,
        short_description: cat.shortDescription,
        bullets: cat.bullets,
      };

  return {
    ...localized,
    page_path: cat.pagePath,
  };
}

/**
 * Преобразовать пакет из БД в формат приложения.
 */
export function mapPackageFromDB(row: PackageRow, locale: Locale = 'ru', fallbackToRu = true): Package {
  return {
    id: row.id,
    name: locale === 'en' ? (row.name_en ?? (fallbackToRu ? row.name : '')) : row.name,
    forFormats:
      locale === 'en'
        ? ((row.for_formats_en?.length ? row.for_formats_en : fallbackToRu ? row.for_formats : []) ?? [])
        : row.for_formats ?? [],
    includes:
      locale === 'en'
        ? ((row.includes_en?.length ? row.includes_en : fallbackToRu ? row.includes : []) ?? [])
        : row.includes ?? [],
    options:
      locale === 'en'
        ? ((row.options_en?.length ? row.options_en : fallbackToRu ? row.options : undefined) ?? undefined)
        : row.options ?? undefined,
    priceHint:
      (locale === 'en' ? row.price_hint_en ?? (fallbackToRu ? row.price_hint : undefined) : row.price_hint) ?? undefined,
  };
}

/**
 * Преобразовать пакет из формата приложения в БД.
 */
export function mapPackageToDB(pkg: Package, locale: Locale = 'ru', forInsert = false): Record<string, unknown> {
  const localized = locale === 'en'
    ? {
        ...(forInsert
          ? {
              name: pkg.name,
              for_formats: pkg.forFormats,
              includes: pkg.includes,
              options: pkg.options,
              price_hint: pkg.priceHint,
            }
          : {}),
        name_en: pkg.name,
        for_formats_en: pkg.forFormats,
        includes_en: pkg.includes,
        options_en: pkg.options,
        price_hint_en: pkg.priceHint,
      }
    : {
        name: pkg.name,
        for_formats: pkg.forFormats,
        includes: pkg.includes,
        options: pkg.options,
        price_hint: pkg.priceHint,
      };

  return {
    ...localized,
  };
}

/**
 * Преобразовать лид из БД в формат приложения.
 */
export function mapLeadFromDB(row: LeadRow): LeadLog {
  const deliveryLog = Array.isArray(row.delivery_log)
    ? (row.delivery_log as LeadDeliveryLogEntry[])
    : undefined;

  return {
    id: String(row.id),
    requestId: row.request_id ?? undefined,
    timestamp: row.created_at ?? '',
    source: row.source,
    name: row.name,
    phone: row.phone,
    email: row.email ?? undefined,
    telegram: row.telegram ?? undefined,
    city: row.city ?? undefined,
    date: row.date ?? undefined,
    format: row.format ?? undefined,
    comment: row.comment ?? undefined,
    extra: (row.extra as Record<string, string>) ?? undefined,
    pagePath: row.page_path ?? undefined,
    referrer: row.referrer ?? undefined,
    status: row.status ?? undefined,
    deliveryLog,
  };
}

/**
 * Преобразовать контакты из БД в формат приложения.
 */
export function mapContactsFromDB(
  rows: ContactRow[],
  locale: Locale = 'ru',
  fallbackToRu = true
): { phones: string[]; emails: string[]; address: string; workingHours: string; id?: number } {
  if (rows.length === 0) {
    return { phones: [], emails: [], address: '', workingHours: '' };
  }
  const row = rows[0];
  return {
    id: row.id,
    phones: row.phones ?? [],
    emails: row.emails ?? [],
    address: locale === 'en' ? (row.address_en ?? (fallbackToRu ? row.address : '') ?? '') : row.address ?? '',
    workingHours:
      locale === 'en'
        ? (row.working_hours_en ?? (fallbackToRu ? row.working_hours : '') ?? '')
        : row.working_hours ?? '',
  };
}

/**
 * Преобразовать контакты из формата приложения в БД.
 */
export function mapContactsToDB(contacts: { phones: string[]; emails: string[]; address: string; workingHours: string }, locale: Locale = 'ru'): Record<string, unknown> {
  const localized = locale === 'en'
    ? { address_en: contacts.address, working_hours_en: contacts.workingHours }
    : { address: contacts.address, working_hours: contacts.workingHours };

  return {
    phones: contacts.phones,
    emails: contacts.emails,
    ...localized,
  };
}

/**
 * Преобразовать лид из формата приложения в БД.
 */
export function mapLeadToDB(lead: LeadLog): Record<string, unknown> {
  return {
    request_id: lead.requestId,
    source: lead.source,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    telegram: lead.telegram,
    city: lead.city,
    date: lead.date,
    format: lead.format,
    comment: lead.comment,
    extra: lead.extra,
    page_path: lead.pagePath,
    referrer: lead.referrer,
    status: lead.status,
    delivery_log: lead.deliveryLog,
  };
}
