import { Helmet } from 'react-helmet-async';

export const StructuredData = () => (
  <Helmet>
    <script type="application/ld+json">
      {JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Organization',
        'name': 'Future Screen',
        'url': 'https://future-screen.vercel.app',
        'telephone': '+79122466566',
        'alternateName': 'Фьюче Скрин',
        'description': 'Техсопровождение мероприятий: LED-экраны, звук, свет, сцены. КП за 15 минут. Работаем по РФ с 2007 года.',
        'foundingDate': '2007',
        'address': {
          '@type': 'PostalAddress',
          'streetAddress': 'Большой Конный полуостров, 5а',
          'addressLocality': 'Екатеринбург',
          'addressRegion': 'Свердловская область',
          'addressCountry': 'RU',
        },
        'contactPoint': [
          {
            '@type': 'ContactPoint',
            'telephone': '+79122466566',
            'contactType': 'sales',
            'availableLanguage': ['Russian'],
          },
          {
            '@type': 'ContactPoint',
            'telephone': '+79530458558',
            'contactType': 'sales',
            'availableLanguage': ['Russian'],
          },
        ],
        'email': ['gr@future-screen.ru', 'an@future-screen.ru'],
        'areaServed': {
          '@type': 'Country',
          'name': 'Россия',
        },
      })}
    </script>
  </Helmet>
);
