export const HOME_HERO_KEY = 'home_hero';

export interface HomeHeroStat {
  value: string;
  label: string;
}

export interface HomeHeroContent {
  badge: string;
  titleLines: string[];
  subtitle: string;
  primaryCta: string;
  secondaryCta: string;
  stats: HomeHeroStat[];
}

const isString = (value: unknown): value is string => typeof value === 'string';
const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every(isString);
const isStatArray = (value: unknown): value is HomeHeroStat[] =>
  Array.isArray(value) &&
  value.every(
    (entry) =>
      entry !== null &&
      typeof entry === 'object' &&
      isString((entry as HomeHeroStat).value) &&
      isString((entry as HomeHeroStat).label),
  );

export const parseHomeHero = (raw: string | null | undefined): HomeHeroContent | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      typeof parsed === 'object' &&
      isString((parsed as HomeHeroContent).badge) &&
      isStringArray((parsed as HomeHeroContent).titleLines) &&
      isString((parsed as HomeHeroContent).subtitle) &&
      isString((parsed as HomeHeroContent).primaryCta) &&
      isString((parsed as HomeHeroContent).secondaryCta) &&
      isStatArray((parsed as HomeHeroContent).stats)
    ) {
      return parsed as HomeHeroContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializeHomeHero = (value: HomeHeroContent): string => JSON.stringify(value);
