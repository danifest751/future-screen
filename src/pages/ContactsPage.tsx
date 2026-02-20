import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';
import { useContacts } from '../hooks/useContacts';
import { RequestForm } from '../components/RequestForm';

const ContactsPage = () => {
  const { contacts, loading } = useContacts();

  return (
  <div className="space-y-2">
    <Helmet>
      <title>Контакты | Future Screen</title>
      <meta name="description" content="Контакты Future Screen: телефон, email, адрес. Свяжитесь любым удобным способом." />
    </Helmet>
    <Section title="Контакты" subtitle="Свяжитесь любым удобным способом">
      <div className="grid gap-6 md:grid-cols-2">
        {loading ? (
          <div className="col-span-2 text-center text-slate-400">Загрузка...</div>
        ) : (
        <div className="card space-y-3 text-sm text-slate-200">
          <div>
            <div className="text-xs uppercase text-slate-400">Телефоны</div>
            <div className="mt-1 space-y-1">
              {contacts.phones?.map((p) => (
                <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`} className="block text-white hover:text-brand-100">
                  {p}
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Email</div>
            <div className="mt-1 text-white">{contacts.emails?.join(', ') || '—'}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-400">Адрес</div>
            <div className="mt-1 text-white">{contacts.address}</div>
            <div className="text-slate-400">{contacts.workingHours}</div>
          </div>
          <div className="rounded-lg bg-white/5 p-4 text-slate-300">
            Карта (Яндекс) — подключить iframe/скрипт на проде.
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
