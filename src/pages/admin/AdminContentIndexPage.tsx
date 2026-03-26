import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { Package, Tag, Phone, FolderOpen, Inbox, Palette } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

type Section = {
  to: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
};

const sections: Section[] = [
  { to: '/admin/packages', title: 'Пакеты', desc: 'Тарифы, состав, ценовые подсказки', Icon: Package },
  { to: '/admin/categories', title: 'Категории', desc: 'Категории аренды и контент страниц', Icon: Tag },
  { to: '/admin/contacts', title: 'Контакты', desc: 'Телефоны, email, адрес, график', Icon: Phone },
  { to: '/admin/cases', title: 'Кейсы', desc: 'Портфолио, метрики и изображения', Icon: FolderOpen },
  { to: '/admin/backgrounds', title: 'Фоны', desc: 'Глобальный фон и все параметры анимаций', Icon: Palette },
  { to: '/admin/leads', title: 'Заявки', desc: 'Лента заявок и экспорт', Icon: Inbox },
];

const AdminContentIndexPage = () => {
  return (
    <AdminLayout title="Все настройки" subtitle="Центр управления">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const { Icon } = section;
          return (
            <Link
              key={section.to}
              to={section.to}
              className="group rounded-xl border border-white/10 bg-slate-800 p-5 transition hover:border-brand-500/40 hover:bg-slate-800/80"
            >
              <div
                className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.2) 0%, rgba(118,75,162,0.15) 100%)', border: '1px solid rgba(102,126,234,0.2)' }}
              >
                <Icon size={18} className="text-brand-400" />
              </div>
              <div className="text-lg font-semibold text-white">{section.title}</div>
              <div className="mt-1 text-sm text-slate-400">{section.desc}</div>
            </Link>
          );
        })}
      </div>
    </AdminLayout>
  );
};

export default AdminContentIndexPage;
