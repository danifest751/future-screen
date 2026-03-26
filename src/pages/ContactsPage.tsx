import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useContacts } from '../hooks/useContacts';
import { RequestForm } from '../components/RequestForm';

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.1a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92Z"/>
  </svg>
);

const EmailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"/>
    <rect x="2" y="4" width="20" height="16" rx="2"/>
  </svg>
);

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
    <circle cx="12" cy="12" r="10"/>
    <path d="M12 6v6l4 2"/>
  </svg>
);

const ContactsPage = () => {
  const { contacts, loading } = useContacts();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Контакты | Фьючер Скрин</title>
      <meta name="description" content="Контакты Фьючер Скрин: телефон, email, адрес. Свяжитесь любым удобным способом." />
    </Helmet>
    <Section title="Контакты" subtitle="Свяжитесь любым удобным способом">
      <div className="grid gap-6 lg:grid-cols-2">
        {loading ? (
          <div className="col-span-2 flex h-64 items-center justify-center text-slate-400">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          </div>
        ) : (
        <div className="card space-y-6">
          {/* Phones */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <PhoneIcon />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-400">Телефоны</div>
              <div className="mt-1 space-y-1">
                {contacts.phones?.map((p) => (
                  <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`} className="block text-lg font-medium text-white transition hover:text-brand-400">
                    {p}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <EmailIcon />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-400">Email</div>
              <div className="mt-1 space-y-1">
                {contacts.emails?.map((email) => (
                  <a key={email} href={`mailto:${email}`} className="block text-white transition hover:text-brand-400">
                    {email}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <MapPinIcon />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-400">Адрес</div>
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

          {/* Working Hours */}
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400">
              <ClockIcon />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-400">Режим работы</div>
              <div className="mt-1 text-white">{contacts.workingHours}</div>
            </div>
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-xl border border-white/10">
            <a
              href={`https://yandex.ru/maps/?text=${encodeURIComponent(contacts.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative flex h-48 items-center justify-center bg-gradient-to-br from-brand-500/20 to-brand-600/20 transition hover:from-brand-500/30 hover:to-brand-600/30"
            >
              <div className="text-center">
                <MapPinIcon />
                <span className="mt-2 block text-sm font-medium text-white group-hover:underline">Открыть в Яндекс.Картах</span>
              </div>
            </a>
          </div>
        </div>
        )}
        <RequestForm
          title="Оставить заявку"
          subtitle="Имя, телефон и кратко о задаче — ответим в течение 15 минут"
          ctaText="Отправить"
        />
      </div>
    </Section>
  </div>
  );
};

export default ContactsPage;
