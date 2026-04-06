import { Helmet } from 'react-helmet-async';
import { RequestForm } from '../components/RequestForm';
import Section from '../components/Section';
import { useI18n } from '../context/I18nContext';
import { getContactsPageContent } from '../content/pages/contacts';
import { useContacts } from '../hooks/useContacts';

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z" />
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
    <rect x="2" y="4" width="20" height="16" rx="2" />
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

const ContactsPage = () => {
  const { siteLocale } = useI18n();
  const contactsPageContent = getContactsPageContent(siteLocale);
  const { contacts, loading, error } = useContacts();

  return (
    <div className="space-y-2">
      <Helmet>
        <title>{contactsPageContent.seo.title}</title>
        <meta name="description" content={contactsPageContent.seo.description} />
      </Helmet>

      <Section title={contactsPageContent.hero.title} subtitle={contactsPageContent.hero.subtitle}>
        <div className="grid gap-6 lg:grid-cols-2">
          {loading ? (
            <div className="col-span-2 flex h-64 items-center justify-center text-slate-400">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          ) : error ? (
            <div className="col-span-2 rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-300">
              <p className="text-lg font-medium">{contactsPageContent.errors.loadTitle}</p>
              <p className="mt-1 text-sm text-red-400/80">{error}</p>
            </div>
          ) : !contacts ? (
            <div className="col-span-2 rounded-xl border border-slate-700 bg-slate-800 p-6 text-center text-slate-400">
              <p className="text-lg font-medium">{contactsPageContent.errors.emptyTitle}</p>
              <p className="mt-1 text-sm">{contactsPageContent.errors.emptyDescription}</p>
            </div>
          ) : (
            <div className="card space-y-6">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  <PhoneIcon />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-400">{contactsPageContent.labels.phones}</div>
                  <div className="mt-1 space-y-1">
                    {contacts.phones?.map((phone) => (
                      <a
                        key={phone}
                        href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                        className="block text-lg font-medium text-white transition hover:text-brand-400"
                      >
                        {phone}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  <EmailIcon />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-400">{contactsPageContent.labels.email}</div>
                  <div className="mt-1 space-y-1">
                    {contacts.emails?.map((email) => (
                      <a key={email} href={`mailto:${email}`} className="block text-white transition hover:text-brand-400">
                        {email}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  <MapPinIcon />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-400">{contactsPageContent.labels.address}</div>
                  <a
                    href={`https://yandex.ru/maps/?text=${encodeURIComponent(contacts.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-white transition hover:text-brand-400"
                  >
                    {contacts.address}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
                  <ClockIcon />
                </div>
                <div>
                  <div className="text-sm font-medium text-slate-400">{contactsPageContent.labels.workingHours}</div>
                  <div className="mt-1 text-white">{contacts.workingHours}</div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-white/10">
                <iframe
                  src={`https://yandex.ru/map-widget/v1/?text=${encodeURIComponent(contacts.address)}&z=16`}
                  width="100%"
                  height="200"
                  frameBorder="0"
                  allowFullScreen
                  title={contactsPageContent.labels.mapTitle}
                  className="grayscale-[30%] transition-all duration-300 hover:grayscale-0"
                  style={{ border: 0, display: 'block' }}
                />
                <a
                  href={`https://yandex.ru/maps/?text=${encodeURIComponent(contacts.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 border-t border-white/10 bg-white/5 py-2 text-sm text-gray-400 transition hover:bg-white/10 hover:text-white"
                >
                  <MapPinIcon />
                  {contactsPageContent.labels.openInMaps}
                </a>
              </div>
            </div>
          )}

          <RequestForm
            title={contactsPageContent.form.title}
            subtitle={contactsPageContent.form.subtitle}
            ctaText={contactsPageContent.form.ctaText}
          />
        </div>
      </Section>
    </div>
  );
};

export default ContactsPage;
