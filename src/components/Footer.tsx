import { Link } from 'react-router-dom';
import { useContacts } from '../hooks/useContacts';
import { PhoneIcon } from './icons/PhoneIcon';

const Footer = () => {
  const { contacts } = useContacts();

  return (
  <footer className="border-t py-10" style={{ borderColor: 'var(--border-color)', background: 'color-mix(in srgb, var(--bg-primary) 80%, transparent)' }}>
    <div className="container-page grid gap-8 md:grid-cols-3">
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-lg font-semibold text-white">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">FS</div>
          <div>
            Future Screen
            <div className="text-xs text-slate-400">Техсопровождение мероприятий</div>
          </div>
        </div>
        <p className="text-sm text-slate-300">
          LED-экраны, свет, звук, сцены и комплекты «под ключ». Работаем по РФ с 2007 года.
        </p>
      </div>
      <div>
        <div className="font-semibold text-white">Навигация</div>
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-slate-300">
          <Link to="/">Главная</Link>
          <Link to="/led">LED-экраны</Link>
          <Link to="/support">Техсопровождение</Link>
          <Link to="/rent">Аренда</Link>
          <Link to="/cases">Кейсы</Link>
          <Link to="/prices">Пакеты</Link>
          <Link to="/about">О компании</Link>
          <Link to="/contacts">Контакты</Link>
        </div>
      </div>
      <div className="space-y-3 text-sm text-slate-200">
        <div className="font-semibold text-white">Контакты</div>
        <div className="space-y-2">
          {contacts.phones.map((p) => (
            <a key={p} href={`tel:${p.replace(/[^\d+]/g, '')}`} className="flex items-center gap-2 hover:text-white">
              <PhoneIcon className="h-4 w-4" /> {p}
            </a>
          ))}
          <div className="text-slate-300">{contacts.emails.join(', ')}</div>
          <div className="text-slate-400">{contacts.address}</div>
          <div className="text-slate-400">{contacts.workingHours}</div>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
