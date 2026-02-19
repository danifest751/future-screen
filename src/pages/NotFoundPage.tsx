import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Section from '../components/Section';

const NotFoundPage = () => (
  <div className="space-y-2">
    <Helmet>
      <title>Страница не найдена | Future Screen</title>
    </Helmet>
    <Section title="Страница не найдена" subtitle="Проверьте адрес или вернитесь на главную">
      <div className="card space-y-3 text-sm text-slate-200">
        <p>Такой страницы нет. Возможно, она была перемещена или удалена.</p>
        <div className="flex gap-3">
          <Link to="/" className="rounded-lg bg-brand-500 px-4 py-2 font-semibold text-white hover:bg-brand-400">
            На главную
          </Link>
          <Link to="/contacts" className="rounded-lg border border-white/20 px-4 py-2 font-semibold text-white hover:border-white/40">
            Контакты
          </Link>
        </div>
      </div>
    </Section>
  </div>
);

export default NotFoundPage;
