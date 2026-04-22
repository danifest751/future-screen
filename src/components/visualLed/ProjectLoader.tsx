import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { extractProjectIdFromUrl, loadProject } from './loadProject';
import { useVisualLed } from './state/VisualLedContext';

/**
 * Detects `?project=<id>` on mount, fetches the project from
 * /api/visual-led/load, and hydrates state via the `project/replace`
 * action. Strips the query param after a successful load so reloading
 * doesn't re-fetch. Shows a small banner while loading / on error.
 */
const ProjectLoader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useVisualLed();
  const consumed = useRef<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'loaded'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = extractProjectIdFromUrl(location.search);
    if (!id) {
      setStatus('idle');
      return;
    }
    if (consumed.current === id) return; // already handled this id

    consumed.current = id;
    setStatus('loading');
    setError(null);

    (async () => {
      const result = await loadProject(id);
      if (!result.ok || !result.state) {
        setStatus('error');
        setError(result.error ?? 'Не удалось загрузить проект');
        return;
      }
      dispatch({ type: 'project/replace', payload: result.state });
      // Clear the ?project param so a reload doesn't re-fetch.
      navigate(location.pathname, { replace: true });
      setStatus('loaded');
      // Hide the success banner after 3s.
      window.setTimeout(() => setStatus('idle'), 3000);
    })();
  }, [dispatch, location.pathname, location.search, navigate]);

  if (status === 'idle') return null;

  return (
    <div className="mb-2 flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs"
         style={{
           borderColor:
             status === 'error'
               ? 'rgba(239, 68, 68, 0.3)'
               : status === 'loaded'
                 ? 'rgba(16, 185, 129, 0.3)'
                 : 'rgba(251, 191, 36, 0.3)',
           background:
             status === 'error'
               ? 'rgba(239, 68, 68, 0.1)'
               : status === 'loaded'
                 ? 'rgba(16, 185, 129, 0.1)'
                 : 'rgba(251, 191, 36, 0.1)',
           color:
             status === 'error'
               ? 'rgb(252, 165, 165)'
               : status === 'loaded'
                 ? 'rgb(110, 231, 183)'
                 : 'rgb(253, 224, 71)',
         }}
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="h-3 w-3 animate-spin" />
          Загружаем проект…
        </>
      ) : status === 'error' ? (
        <>
          <AlertTriangle className="h-3 w-3" />
          Не удалось загрузить проект: {error ?? 'unknown error'}
        </>
      ) : (
        <>
          <span>Проект восстановлен из ссылки</span>
        </>
      )}
    </div>
  );
};

export default ProjectLoader;
