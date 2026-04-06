export const structuredDataContent = {
  organization: {
    name: 'Фьючер Скрин',
    url: 'https://future-screen.vercel.app',
    telephone: '+79122466566',
    alternateName: 'Фьюче Скрин',
    description:
      'Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года.',
    foundingDate: '2007',
    address: {
      streetAddress: 'Большой Конный полуостров, 5а',
      addressLocality: 'Екатеринбург',
      addressRegion: 'Свердловская область',
      addressCountry: 'RU',
    },
    contactPoints: [
      {
        telephone: '+79122466566',
        contactType: 'sales',
        availableLanguage: ['Russian'],
      },
      {
        telephone: '+79530458558',
        contactType: 'sales',
        availableLanguage: ['Russian'],
      },
    ],
    email: ['gr@future-screen.ru', 'an@future-screen.ru'],
    areaServed: {
      name: 'Россия',
    },
  },
} as const;
