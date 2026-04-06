import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getGlobalContent } from '../content/global';
import { useAuth } from '../context/AuthContext';
import { useI18n } from '../context/I18nContext';
import LoginModal from './LoginModal';

const AdminGearButton = () => {
  const { isAuthenticated, logout } = useAuth();
  const { adminLocale } = useI18n();
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { adminGearContent } = getGlobalContent(adminLocale);

  const handleClick = () => {
    if (isAuthenticated) {
      setShowMenu((value) => !value);
      return;
    }

    setShowLogin(true);
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-[9999]">
        <button
          onClick={handleClick}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-slate-800 text-slate-400 shadow-xl transition hover:border-brand-500/50 hover:text-white"
          title={adminGearContent.title}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
            <path fillRule="evenodd" d="M8.34 1.804A1 1 0 0 1 9.32 1h1.36a1 1 0 0 1 .98.804l.295 1.473c.497.144.971.342 1.416.587l1.25-.834a1 1 0 0 1 1.262.125l.962.962a1 1 0 0 1 .125 1.262l-.834 1.25c.245.445.443.919.587 1.416l1.473.295a1 1 0 0 1 .804.98v1.361a1 1 0 0 1-.804.98l-1.473.295a6.95 6.95 0 0 1-.587 1.416l.834 1.25a1 1 0 0 1-.125 1.262l-.962.962a1 1 0 0 1-1.262.125l-1.25-.834a6.953 6.953 0 0 1-1.416.587l-.295 1.473a1 1 0 0 1-.98.804H9.32a1 1 0 0 1-.98-.804l-.295-1.473a6.957 6.957 0 0 1-1.416-.587l-1.25.834a1 1 0 0 1-1.262-.125l-.962-.962a1 1 0 0 1-.125-1.262l.834-1.25a6.957 6.957 0 0 1-.587-1.416l-1.473-.295A1 1 0 0 1 1 11.18V9.82a1 1 0 0 1 .804-.98l1.473-.295c.144-.497.342-.971.587-1.416l-.834-1.25a1 1 0 0 1 .125-1.262l.962-.962A1 1 0 0 1 5.38 3.58l1.25.834a6.957 6.957 0 0 1 1.416-.587l.295-1.473ZM13 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" clipRule="evenodd" />
          </svg>
        </button>

        {isAuthenticated && showMenu ? (
          <div className="absolute bottom-12 right-0 w-44 rounded-xl border border-white/10 bg-slate-900 p-2 shadow-xl">
            <button
              onClick={() => {
                navigate('/admin/content');
                setShowMenu(false);
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-200 hover:bg-white/5"
            >
              {adminGearContent.editContent}
            </button>
            <hr className="my-1 border-white/10" />
            <button
              onClick={async () => {
                await logout();
                setShowMenu(false);
                navigate('/');
              }}
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-400 hover:bg-white/5"
            >
              {adminGearContent.signOut}
            </button>
          </div>
        ) : null}
      </div>

      <LoginModal open={showLogin} onClose={() => setShowLogin(false)} />
    </>
  );
};

export default AdminGearButton;
