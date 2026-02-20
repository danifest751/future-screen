import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';

const sections = [
  { to: '/admin/packages', title: 'Пакеты', desc: 'Тарифы, состав, ценовые подсказки', icon: '📦' },
  { to: '/admin/categories', title: 'Категории', desc: 'Категории аренды и контент страниц', icon: '🗂️' },
  { to: '/admin/contacts', title: 'Контакты', desc: 'Телефоны, email, адрес, график', icon: '📞' },
  { to: '/admin/cases', title: 'Кейсы', desc: 'Портфолио, метрики и изображения', icon: '📁' },
  { to: '/admin/calculator', title: 'Калькулятор', desc: 'Конфигурация расчета и модели экранов', icon: '🧮' },
  { to: '/admin/leads', title: 'Заявки', desc: 'Лента заявок и экспорт', icon: '📬' },
];

const AdminContentIndexPage = () => {
  return (
    <AdminLayout title="Все настройки" subtitle="Центр управления админкой">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => (
          <Link
            key={section.to}
            to={section.to}
            className="rounded-xl border border-white/10 bg-slate-800 p-5 transition hover:border-brand-500/40 hover:bg-slate-800/80"
          >
            <div className="mb-2 text-2xl">{section.icon}</div>
            <div className="text-lg font-semibold text-white">{section.title}</div>
            <div className="mt-1 text-sm text-slate-400">{section.desc}</div>
          </Link>
        ))}
      </div>
    </AdminLayout>
  );
};

export default AdminContentIndexPage;
