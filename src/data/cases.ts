import { caseItemsContent } from '../content/data/cases';

export type CaseItem = {
  slug: string;
  title: string;
  city: string;
  date: string;
  format: string;
  services: Array<'led' | 'sound' | 'light' | 'video' | 'stage' | 'support'>;
  summary: string;
  metrics?: string;
  images?: string[];
  videos?: string[];
};

export const cases: CaseItem[] = caseItemsContent as unknown as CaseItem[];
