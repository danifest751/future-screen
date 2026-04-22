export const PAGE_CASES_KEY = 'page_cases';

export interface PageCasesContent {
  seo: { title: string; description: string };
  section: { title: string; subtitle: string };
  videoOverlay: { watch: string; manyTemplate: string };
  emptyState: string;
  details: {
    titleSuffix: string;
    servicesLabel: string;
    videosLabel: string;
    contactPrompt: string;
    contactLink: string;
    requestTitle: string;
    requestSubtitle: string;
    requestCta: string;
  };
}

const isString = (v: unknown): v is string => typeof v === 'string';

export const parsePageCases = (raw: string | null | undefined): PageCasesContent | null => {
  if (!raw) return null;
  try {
    const p = JSON.parse(raw);
    if (
      p &&
      typeof p === 'object' &&
      p.seo && isString(p.seo.title) && isString(p.seo.description) &&
      p.section && isString(p.section.title) && isString(p.section.subtitle) &&
      p.videoOverlay && isString(p.videoOverlay.watch) && isString(p.videoOverlay.manyTemplate) &&
      isString(p.emptyState) &&
      p.details &&
      isString(p.details.titleSuffix) && isString(p.details.servicesLabel) &&
      isString(p.details.videosLabel) && isString(p.details.contactPrompt) &&
      isString(p.details.contactLink) && isString(p.details.requestTitle) &&
      isString(p.details.requestSubtitle) && isString(p.details.requestCta)
    ) {
      return p as PageCasesContent;
    }
  } catch {
    // fallthrough
  }
  return null;
};

export const serializePageCases = (v: PageCasesContent): string => JSON.stringify(v);

export const formatVideoCount = (template: string, count: number): string =>
  template.replace(/\{count\}/g, String(count));
