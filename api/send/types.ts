export type SubmissionBody = {
  requestId?: string;
  email?: boolean;
  clientEmail?: boolean;
  telegram?: boolean;
  emailError?: string;
  clientEmailError?: string;
  error?: string;
  validationErrors?: string[];
  details?: string;
  tgEmailAlertSent?: boolean;
};

export type SubmissionRequestBody = {
  requestId?: string;
  pagePath?: string;
  referrer?: string;
};

export type DeliveryLogEntry = {
  at: string;
  step: string;
  status: 'pending' | 'success' | 'warning' | 'error';
  channel: 'system' | 'api' | 'telegram' | 'email' | 'client-email' | 'database';
  message: string;
  details?: string;
  meta?: Record<string, string>;
};

export type DeliveryLogger = (entry: Omit<DeliveryLogEntry, 'at'>) => Promise<void>;

export interface EmailPayload {
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
}

export type EmailSendResult = {
  adminSent: boolean;
  clientSent: boolean;
  errorMessage: string;
  clientErrorMessage: string;
};
