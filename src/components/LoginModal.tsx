import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import { getGlobalContent } from '../content/global';
import { useFocusTrap } from '../hooks/useFocusTrap';

type Props = {
  open: boolean;
  onClose: () => void;
};

const LoginModal = ({ open, onClose }: Props) => {
  const { login, isLoading } = useAuth();
  const { adminLocale } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { containerRef } = useFocusTrap({
    active: open,
    onEscape: onClose,
  });
  const { loginModalContent } = getGlobalContent(adminLocale);

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || isLoading) return;

    setError('');
    setSubmitting(true);
    const isSuccess = await login(email, password);
    setSubmitting(false);

    if (isSuccess) {
      setEmail('');
      setPassword('');
      onClose();
      navigate('/admin');
      return;
    }

    setError(loginModalContent.invalidCredentials);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        className="w-full max-w-sm rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-title"
        aria-describedby="login-description"
      >
        <div className="mb-4 text-center">
          <div id="login-title" className="text-lg font-semibold text-white">
            {loginModalContent.title}
          </div>
          <div id="login-description" className="text-sm text-slate-400">
            {loginModalContent.description}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="login-email" className="sr-only">
              {loginModalContent.emailLabel}
            </label>
            <input
              id="login-email"
              type="email"
              placeholder={loginModalContent.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              autoFocus
              required
              aria-required="true"
              aria-invalid={error ? 'true' : 'false'}
              aria-describedby={error ? 'login-error' : undefined}
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="sr-only">
              {loginModalContent.passwordLabel}
            </label>
            <input
              id="login-password"
              type="password"
              placeholder={loginModalContent.passwordPlaceholder}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
              required
              aria-required="true"
              autoComplete="current-password"
            />
          </div>

          {error ? (
            <div id="login-error" className="text-center text-sm text-red-400" role="alert" aria-live="polite">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting || isLoading}
            className="w-full rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-400 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-slate-900"
            aria-busy={submitting || isLoading}
          >
            {submitting ? loginModalContent.submitting : loginModalContent.submit}
          </button>
        </form>

        <button
          onClick={onClose}
          className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 focus:outline-none focus:underline"
        >
          {loginModalContent.cancel}
        </button>
      </div>
    </div>
  );
};

export default LoginModal;
