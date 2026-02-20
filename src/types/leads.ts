export type LeadLog = {
  id: string;
  timestamp: string;
  source: string;
  name: string;
  phone: string;
  email?: string;
  telegram?: string;
  city?: string;
  date?: string;
  format?: string;
  comment?: string;
  extra?: Record<string, string>;
  pagePath?: string;
  referrer?: string;
  status?: string;
};
