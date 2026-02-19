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
};

export const cases: CaseItem[] = [
  {
    slug: 'forum-ekb-2024',
    title: 'Форум в Екатеринбурге',
    city: 'Екатеринбург',
    date: '2024',
    format: 'Форум',
    services: ['led', 'sound', 'light', 'support'],
    summary: 'LED-порталы и задник сцены, звуковая система под 800 гостей, свет для спикеров и трансляции.',
    metrics: '800 гостей, 2 дня, резерв по процессингу',
  },
  {
    slug: 'city-concert',
    title: 'Городской концерт',
    city: 'Тюмень',
    date: '2023',
    format: 'Концерт',
    services: ['led', 'sound', 'stage', 'light', 'support'],
    summary: 'Большая сцена с порталами, линейные массивы, вогнутый LED-задник, световое шоу.',
    metrics: '5 000 зрителей, покрытие площади 80×60 м',
  },
  {
    slug: 'expo-stand',
    title: 'Выставочный стенд',
    city: 'Москва',
    date: '2024',
    format: 'Выставка',
    services: ['led', 'video', 'support'],
    summary: 'LED-тотемы и центральный экран, плейаут контента, быстрая сборка ночью.',
    metrics: 'Монтаж за 6 часов, работа 3 дня',
  },
];
