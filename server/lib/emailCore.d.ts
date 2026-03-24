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

export function normalizeEmailPayload(payload?: unknown): {
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

export function validateEmailPayload(payload?: unknown): { valid: boolean; errors: string[] };
export function sanitizeEmailPayload(payload?: unknown): { payload: ReturnType<typeof normalizeEmailPayload>; valid: boolean; errors: string[] };
export function formatTelegramMessage(payload?: unknown): string;
export function formatEmailFailureAlertMessage(payload: {
  requestId: string;
  source?: string;
  name?: string;
  phone?: string;
  email?: string;
  errorMessage: string;
}): string;
export function buildAdminEmailMessage(payload: unknown, requestId: string): {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  text: string;
  html: string;
};
export function buildClientEmailMessage(payload: unknown): {
  from: string;
  to: string;
  subject: string;
  text: string;
  html: string;
};
export function createRequestId(): string;
export function processEmailSubmission(args: {
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
}): Promise<SubmissionResult>;
