import type { Locale } from '../../i18n/types';

const ru = {
  seo: {
    title: 'О компании | Фьючер Скрин',
    description:
      'Фьючер Скрин — техсопровождение мероприятий с 2007 года. Инженеры, монтажные бригады, работа по всей РФ.',
  },
  section: {
    title: 'О компании',
    subtitle: 'С 2007 года, технический партнёр для событий по всей РФ',
  },
  paragraphs: [
    'Мы работаем с 2007 года и сопровождаем форумы, концерты, выставки и презентации. В штате — инженеры, монтажные бригады и продюсеры, которые отвечают за результат на площадке.',
    'География: Екатеринбург и регион, Москва/СПб, а также выезды по РФ. Согласовываем площадку, точки крепления, схемы питания и логистику.',
    'Мы дорожим репутацией: закладываем резерв по запросу, прозрачно считаем сметы и держим сроки монтажа/демонтажа.',
  ],
  factsTitle: 'Факты',
  facts: [
    '2007+ лет опыта',
    'Проекты по РФ: форумы, городские события, выставки',
    'Инженеры и монтажные бригады в штате',
    'Резерв оборудования и процессинга по запросу',
  ],
};

const en: typeof ru = {
  seo: {
    title: 'About Company | Future Screen',
    description:
      'Future Screen provides technical event production since 2007. In-house engineers, installation crews, and nationwide operations.',
  },
  section: {
    title: 'About Company',
    subtitle: 'Since 2007, your technical partner for events across Russia',
  },
  paragraphs: [
    'We have been working since 2007 and support forums, concerts, exhibitions, and presentations. Our in-house team includes engineers, installation crews, and producers responsible for on-site results.',
    'Geography: Yekaterinburg and region, Moscow/Saint Petersburg, as well as projects across Russia. We align venue constraints, rigging points, power schemes, and logistics in advance.',
    'We value reputation: add backup options on request, provide transparent estimates, and keep installation/dismantling timelines under control.',
  ],
  factsTitle: 'Facts',
  facts: [
    '18+ years of experience',
    'Projects across Russia: forums, city events, exhibitions',
    'In-house engineers and installation crews',
    'Equipment and processing backup on request',
  ],
};

const aboutPageContentByLocale: Record<Locale, typeof ru> = { ru, en };

export const getAboutPageContent = (locale: Locale) => aboutPageContentByLocale[locale];

export const aboutPageContent = ru;
