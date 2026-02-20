import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

type Props = {
  open: boolean;
  onClose: () => void;
};

const LoginModal = ({ open, onClose }: Props) => {
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || isLoading) return;
    setError('');
    setSubmitting(true);
    const ok = await login(email, password);
    setSubmitting(false);

    if (ok) {
      setEmail('');
      setPassword('');
      onClose();
      navigate('/admin/content');
    } else {
      setError('Неверный email или пароль');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 text-center">
          <div className="text-lg font-semibold text-white">Вход в админку</div>
          <div className="text-sm text-slate-400">Введите логин и пароль</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
            autoFocus
            required
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500"
            required
          />
          {error && <div className="text-center text-sm text-red-400">{error}</div>}
          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60"
          >
            {submitting ? 'Входим...' : 'Войти'}
          </button>
        </form>
        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300"
        >
          Отмена
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
