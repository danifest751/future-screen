export type LeadDeliveryChannel = 'system' | 'api' | 'telegram' | 'email' | 'client-email' | 'database';

export type LeadDeliveryStepStatus = 'pending' | 'success' | 'warning' | 'error';

export type LeadDeliveryLogEntry = {
  at: string;
  step: string;
  status: LeadDeliveryStepStatus;
  channel: LeadDeliveryChannel;
  message: string;
  details?: string;
  meta?: Record<string, string>;
};

export type LeadLog = {
  id: string;
  requestId?: string;
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
  deliveryLog?: LeadDeliveryLogEntry[];
};
