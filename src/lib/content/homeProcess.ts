export const HOME_PROCESS_KEY = 'home_process';

export interface HomeProcessStep {
  num: string;
  title: string;
  desc: string;
}

export interface HomeProcessContent {
  badge: string;
  title: string;
  accentTitle: string;
  steps: HomeProcessStep[];
}

const isString = (v: unknown): v is string => typeof v === 'string';
const isStep = (v: unknown): v is HomeProcessStep =>
  v !== null &&
  typeof v === 'object' &&
  isString((v as HomeProcessStep).num) &&
  isString((v as HomeProcessStep).title) &&
  isString((v as HomeProcessStep).desc);

export const parseHomeProcess = (raw: string | null | undefined): HomeProcessContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isString(parsed.badge) &&
      isString(parsed.title) &&
      isString(parsed.accentTitle) &&
      Array.isArray(parsed.steps) &&
      parsed.steps.every(isStep)
    ) {
      return parsed as HomeProcessContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeProcess = (value: HomeProcessContent): string => JSON.stringify(value);
