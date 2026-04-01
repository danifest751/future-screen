/**
 * Маппинг-функции для преобразования данных из БД (snake_case) в формат приложения (camelCase).
 */

import type { Database } from './database.types';
import type { CaseItem } from '../data/cases';
import type { Category } from '../data/categories';
import type { Package } from '../data/packages';
import type { LeadLog } from '../types/leads';

type CaseRow = Database['public']['Tables']['cases']['Row'];
type CategoryRow = Database['public']['Tables']['categories']['Row'];
type PackageRow = Database['public']['Tables']['packages']['Row'];
type LeadRow = Database['public']['Tables']['leads']['Row'];
type ContactRow = Database['public']['Tables']['contacts']['Row'];

/**
 * Преобразовать кейс из БД в формат приложения.
 */
export function mapCaseFromDB(row: CaseRow): CaseItem {
  return {
    slug: row.slug,
    title: row.title,
    city: row.city ?? '',
    date: row.date ?? '',
    format: row.format ?? '',
    services: (row.services ?? []) as CaseItem['services'],
    summary: row.summary ?? '',
    metrics: row.metrics ?? undefined,
    images: row.images ?? undefined,
    videos: row.videos ?? undefined,
  };
}

/**
 * Преобразовать кейс из формата приложения в БД.
 */
export function mapCaseToDB(caseItem: { slug: string; title?: string; city?: string; date?: string; format?: string; services?: string[]; summary?: string; metrics?: string; images?: string[]; videos?: string[] }): Record<string, unknown> {
  return {
    slug: caseItem.slug,
    title: caseItem.title,
    city: caseItem.city,
    date: caseItem.date,
    format: caseItem.format,
    services: caseItem.services,
    summary: caseItem.summary,
    metrics: caseItem.metrics,
    images: caseItem.images,
    videos: caseItem.videos,
  };
}

/**
 * Преобразовать категорию из БД в формат приложения.
 */
export function mapCategoryFromDB(row: CategoryRow): Category {
  return {
    id: row.id,
    title: row.title,
    shortDescription: row.short_description ?? '',
    bullets: row.bullets ?? [],
    pagePath: row.page_path ?? '',
  };
}

/**
 * Преобразовать категорию из формата приложения в БД.
 */
export function mapCategoryToDB(cat: Category): Record<string, unknown> {
  return {
    title: cat.title,
    short_description: cat.shortDescription,
    bullets: cat.bullets,
    page_path: cat.pagePath,
  };
}

/**
 * Преобразовать пакет из БД в формат приложения.
 */
export function mapPackageFromDB(row: PackageRow): Package {
  return {
    id: row.id,
    name: row.name,
    forFormats: row.for_formats ?? [],
    includes: row.includes ?? [],
    options: row.options ?? undefined,
    priceHint: row.price_hint ?? undefined,
  };
}

/**
 * Преобразовать пакет из формата приложения в БД.
 */
export function mapPackageToDB(pkg: Package): Record<string, unknown> {
  return {
    name: pkg.name,
    for_formats: pkg.forFormats,
    includes: pkg.includes,
    options: pkg.options,
    price_hint: pkg.priceHint,
  };
}

/**
 * Преобразовать лид из БД в формат приложения.
 */
export function mapLeadFromDB(row: LeadRow): LeadLog {
  return {
    id: String(row.id),
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
    pagePath: undefined,
    referrer: undefined,
    status: row.status ?? undefined,
  };
}

/**
 * Преобразовать контакты из БД в формат приложения.
 */
export function mapContactsFromDB(rows: ContactRow[]): { phones: string[]; emails: string[]; address: string; workingHours: string; id?: number } {
  if (rows.length === 0) {
    return { phones: [], emails: [], address: '', workingHours: '' };
  }
  const row = rows[0];
  return {
    id: row.id,
    phones: row.phones ?? [],
    emails: row.emails ?? [],
    address: row.address ?? '',
    workingHours: row.working_hours ?? '',
  };
}

/**
 * Преобразовать контакты из формата приложения в БД.
 */
export function mapContactsToDB(contacts: { phones: string[]; emails: string[]; address: string; workingHours: string }): Record<string, unknown> {
  return {
    phones: contacts.phones,
    emails: contacts.emails,
    address: contacts.address,
    working_hours: contacts.workingHours,
  };
}

/**
 * Преобразовать лид из формата приложения в БД.
 */
export function mapLeadToDB(lead: LeadLog): Record<string, unknown> {
  return {
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
    status: lead.status,
  };
}
