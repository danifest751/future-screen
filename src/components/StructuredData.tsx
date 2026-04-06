import { memo } from 'react';
import { Helmet } from 'react-helmet-async';
import { structuredDataContent } from '../content/structuredData';

export const StructuredData = memo(function StructuredData() {
  const { organization } = structuredDataContent;

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: organization.name,
          url: organization.url,
          telephone: organization.telephone,
          alternateName: organization.alternateName,
          description: organization.description,
          foundingDate: organization.foundingDate,
          address: {
            '@type': 'PostalAddress',
            streetAddress: organization.address.streetAddress,
            addressLocality: organization.address.addressLocality,
            addressRegion: organization.address.addressRegion,
            addressCountry: organization.address.addressCountry,
          },
          contactPoint: organization.contactPoints.map((contactPoint) => ({
            '@type': 'ContactPoint',
            ...contactPoint,
          })),
          email: organization.email,
          areaServed: {
            '@type': 'Country',
            name: organization.areaServed.name,
          },
        })}
      </script>
    </Helmet>
  );
});
