import { supabase } from '../lib/supabase';
import { packages as basePackages, type Package } from '../data/packages';
import { categories as baseCategories, type Category } from '../data/categories';
import { contacts as baseContacts } from '../data/contacts';
import { cases as baseCases, type CaseItem } from '../data/cases';
import type { LeadLog } from '../types/leads';
import { normalizeList } from '../utils/normalizeList';

type LeadRow = {
  id: string;
  created_at: string;
  source: string;
  name: string;
  phone: string;
  email: string | null;
  telegram: string | null;
  city: string | null;
  date: string | null;
  format: string | null;
  comment: string | null;
  extra: Record<string, string> | null;
  page_path: string | null;
  referrer: string | null;
  status: string | null;
};

type PackageRow = {
  id: Package['id'];
  name: string;
  for_formats: string[];
  includes: string[];
  options?: string[];
  price_hint: string;
};

type CategoryRow = {
  id: Category['id'];
  title: string;
  short_description: string;
  bullets: string[];
  page_path: string;
};

type ContactsRow = {
  id?: number;
  phones?: string[];
  emails?: string[];
  address?: string;
  working_hours?: string;
};

export type ContactsRecord = typeof baseContacts & { id?: number };

const toErrorMessage = (err: unknown) => (err instanceof Error ? err.message : 'Unknown error');

const mapLeadFromDB = (row: LeadRow): LeadLog => ({
  id: row.id,
  timestamp: row.created_at,
  source: row.source,
  name: row.name,
  phone: row.phone,
  email: row.email ?? undefined,
  telegram: row.telegram ?? undefined,
  city: row.city ?? undefined,
  date: row.date ?? undefined,
  format: row.format ?? undefined,
  comment: row.comment ?? undefined,
  extra: row.extra ?? undefined,
  pagePath: row.page_path ?? undefined,
  referrer: row.referrer ?? undefined,
  status: row.status ?? undefined,
});

export const mapPackageFromDB = (row: PackageRow): Package => ({
  id: row.id,
  name: row.name,
  forFormats: row.for_formats,
  includes: row.includes,
  options: row.options,
  priceHint: row.price_hint,
});

export const mapPackageToDB = (pkg: Package) => {
  const row: Record<string, unknown> = {
    name: pkg.name,
    for_formats: normalizeList(pkg.forFormats),
    includes: normalizeList(pkg.includes),
    options: pkg.options ? normalizeList(pkg.options) : undefined,
    price_hint: pkg.priceHint,
  };

  if (pkg.id !== undefined && pkg.id !== null && String(pkg.id).trim() !== '') {
    row.id = typeof pkg.id === 'string' && /^\d+$/.test(pkg.id) ? Number(pkg.id) : pkg.id;
  }

  return row;
};

export const mapCategoryFromDB = (row: CategoryRow): Category => ({
  id: row.id,
  title: row.title,
  shortDescription: row.short_description,
  bullets: row.bullets,
  pagePath: row.page_path,
});

export const mapCategoryToDB = (cat: Category) => {
  const row: Record<string, unknown> = {
    title: cat.title,
    short_description: cat.shortDescription,
    bullets: normalizeList(cat.bullets),
    page_path: cat.pagePath,
  };

  if (cat.id !== undefined && cat.id !== null && String(cat.id).trim() !== '') {
    row.id = typeof cat.id === 'string' && /^\d+$/.test(cat.id) ? Number(cat.id) : cat.id;
  }

  return row;
};

export const sanitizeServices = (services: string[]): CaseItem['services'] =>
  services
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => s.toLowerCase())
    .filter((s): s is CaseItem['services'][number] =>
      ['led', 'sound', 'light', 'video', 'stage', 'support'].includes(s)
    );

export const mapContactsFromDB = (row: ContactsRow): ContactsRecord => ({
  id: row.id,
  phones: row.phones || [],
  emails: row.emails || [],
  address: row.address || '',
  workingHours: row.working_hours || '',
});

export const mapContactsToDB = (contacts: ContactsRecord) => {
  const result: Record<string, unknown> = {
    phones: contacts.phones,
    emails: contacts.emails,
    address: contacts.address,
    working_hours: contacts.workingHours,
  };

  if (contacts.id) {
    result.id = contacts.id;
  }

  return result;
};

export const loadPackages = async (): Promise<Package[]> => {
  const { data, error } = await supabase.from('packages').select('*').order('id');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPackageFromDB(row as PackageRow));
};

export const upsertPackage = async (payload: Package): Promise<Package> => {
  const { data, error } = await supabase
    .from('packages')
    .upsert(mapPackageToDB(payload))
    .select();

  if (error) throw new Error(error.message);
  if (!data || !data[0]) throw new Error('Package was not returned after upsert');
  return mapPackageFromDB(data[0] as PackageRow);
};

export const removePackage = async (id: Package['id']): Promise<void> => {
  const { error } = await supabase.from('packages').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const resetPackages = async (): Promise<Package[]> => {
  await supabase.from('packages').delete().not('id', 'is', null);

  const { data, error } = await supabase.from('packages').insert(basePackages.map(mapPackageToDB)).select();
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPackageFromDB(row as PackageRow));
};

export const loadCategories = async (): Promise<Category[]> => {
  const { data, error } = await supabase.from('categories').select('*').order('id');
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCategoryFromDB(row as CategoryRow));
};

export const upsertCategory = async (payload: Category): Promise<Category> => {
  const { data, error } = await supabase
    .from('categories')
    .upsert(mapCategoryToDB(payload))
    .select();

  if (error) throw new Error(error.message);
  if (!data || !data[0]) throw new Error('Category was not returned after upsert');
  return mapCategoryFromDB(data[0] as CategoryRow);
};

export const removeCategory = async (id: Category['id']): Promise<void> => {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw new Error(error.message);
};

export const resetCategories = async (): Promise<Category[]> => {
  await supabase.from('categories').delete().not('id', 'is', null);

  const { data, error } = await supabase.from('categories').insert(baseCategories.map(mapCategoryToDB)).select();
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCategoryFromDB(row as CategoryRow));
};

export const loadContacts = async (): Promise<ContactsRecord | null> => {
  const { data, error } = await supabase.from('contacts').select('*').order('id', { ascending: true }).limit(1);
  if (error) throw new Error(error.message);
  if (!data || data.length === 0) return null;
  return mapContactsFromDB(data[0] as ContactsRow);
};

export const saveContacts = async (payload: typeof baseContacts, existingId?: number): Promise<ContactsRecord | null> => {
  const nextPayload: ContactsRecord = { ...payload, id: existingId };
  const { error } = await supabase.from('contacts').upsert(mapContactsToDB(nextPayload)).select();
  if (error) throw new Error(error.message);
  return loadContacts();
};

export const resetContacts = async (): Promise<ContactsRecord | null> => {
  await supabase.from('contacts').delete().neq('id', 0);
  const { error } = await supabase.from('contacts').insert(mapContactsToDB(baseContacts));
  if (error) throw new Error(error.message);
  return loadContacts();
};

export const loadLeads = async (): Promise<LeadLog[]> => {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapLeadFromDB(row as LeadRow));
};

export const clearLeads = async (): Promise<void> => {
  const leads = await loadLeads();
  const ids = leads.map((lead) => lead.id);
  if (!ids.length) return;

  const { error } = await supabase.from('leads').delete().in('id', ids);
  if (error) throw new Error(error.message);
};

export const loadCases = async (): Promise<CaseItem[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as CaseItem[];
};

export const addCase = async (payload: Omit<CaseItem, 'services'> & { services: string[] }): Promise<CaseItem> => {
  const next: Record<string, unknown> = {
    ...payload,
    services: sanitizeServices(payload.services)
  };
  // Only include videos if column exists in DB (avoid 400 error)
  if (!payload.videos || payload.videos.length === 0) {
    delete next.videos;
  }
  const { data, error } = await supabase.from('cases').insert(next).select();
  if (error) throw new Error(error.message);
  if (!data || !data[0]) throw new Error('Case was not returned after insert');
  return data[0] as CaseItem;
};

export const updateCase = async (
  slug: string,
  payload: Partial<Omit<CaseItem, 'services'>> & { services?: string[] },
): Promise<CaseItem> => {
  const updates: Record<string, unknown> = {
    ...payload,
    services: payload.services ? sanitizeServices(payload.services) : undefined,
  };
  // Only include videos if it has values (avoid 400 if column doesn't exist yet)
  if (!payload.videos || payload.videos.length === 0) {
    delete updates.videos;
  }

  const { data, error } = await supabase
    .from('cases')
    .update(updates)
    .eq('slug', slug)
    .select();

  if (error) throw new Error(error.message);
  if (!data || !data[0]) throw new Error('Case was not returned after update');
  return data[0] as CaseItem;
};

export const removeCase = async (slug: string): Promise<void> => {
  const { error } = await supabase.from('cases').delete().eq('slug', slug);
  if (error) throw new Error(error.message);
};

export const resetCases = async (): Promise<CaseItem[]> => {
  await supabase.from('cases').delete().neq('slug', 'temp_impossible_slug');
  const { data, error } = await supabase.from('cases').insert(baseCases).select();
  if (error) throw new Error(error.message);
  return (data ?? []) as CaseItem[];
};
