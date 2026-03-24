import * as emailCoreJs from '../../server/lib/emailCore.js';

export type EmailSendResult = {
  adminSent: boolean;
  clientSent: boolean;
  errorMessage: string;
  clientErrorMessage: string;
};

export type SubmissionResult = {
  status: number;
  body: Record<string, unknown> & {
    ok: boolean;
    requestId: string;
    telegram?: boolean;
    email?: boolean;
    clientEmail?: boolean;
    emailError?: string;
    clientEmailError?: string;
    error?: string;
    validationErrors?: string[];
    details?: string;
  };
};

type EmailCoreModule = {
  normalizeEmailPayload: (payload?: unknown) => {
    source: string;
    name: string;
    phone: string;
    email: string;
    telegram: string;
    city: string;
    date: string;
    format: string;
    comment: string;
    extra: Record<string, string>;
  };
  validateEmailPayload: (payload?: unknown) => { valid: boolean; errors: string[] };
  sanitizeEmailPayload: (payload?: unknown) => {
    payload: ReturnType<EmailCoreModule['normalizeEmailPayload']>;
    valid: boolean;
    errors: string[];
  };
  formatTelegramMessage: (payload?: unknown) => string;
  formatEmailFailureAlertMessage: (payload: {
    requestId: string;
    source?: string;
    name?: string;
    phone?: string;
    email?: string;
    errorMessage: string;
  }) => string;
  buildAdminEmailMessage: (payload: unknown, requestId: string) => {
    from: string;
    to: string;
    replyTo: string;
    subject: string;
    text: string;
    html: string;
  };
  buildClientEmailMessage: (payload: unknown) => {
    from: string;
    to: string;
    subject: string;
    text: string;
    html: string;
  };
  createRequestId: () => string;
  processEmailSubmission: (args: {
    body: unknown;
    sendTelegram: (message: string) => Promise<boolean>;
    sendEmail: (payload: unknown, requestId: string) => Promise<EmailSendResult>;
    formatTelegramMessage?: (payload: unknown) => string;
    formatEmailFailureAlertMessage?: (payload: {
      requestId: string;
      source?: string;
      name?: string;
      phone?: string;
      email?: string;
      errorMessage: string;
    }) => string;
  }) => Promise<SubmissionResult>;
};

const emailCore = emailCoreJs as unknown as EmailCoreModule;

export const normalizeEmailPayload = emailCore.normalizeEmailPayload;
export const validateEmailPayload = emailCore.validateEmailPayload;
export const sanitizeEmailPayload = emailCore.sanitizeEmailPayload;
export const formatTelegramMessage = emailCore.formatTelegramMessage;
export const formatEmailFailureAlertMessage = emailCore.formatEmailFailureAlertMessage;
export const buildAdminEmailMessage = emailCore.buildAdminEmailMessage;
export const buildClientEmailMessage = emailCore.buildClientEmailMessage;
export const createRequestId = emailCore.createRequestId;
export const processEmailSubmission = emailCore.processEmailSubmission;
