import { Link } from 'react-router-dom';

const VisualLedEditorPage = () => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        backgroundColor: '#0a0a0a',
        overflow: 'hidden',
      }}
    >
      {/* Minimal branded header */}
      <header
        style={{
          flexShrink: 0,
          height: '48px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(10,10,10,0.95)',
          backdropFilter: 'blur(16px)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'color 150ms',
            }}
            onMouseOver={(e) => (e.currentTarget.style.color = '#fff')}
            onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            На сайт
          </Link>

          <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '12px' }}>|</span>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg viewBox="0 0 28 24" width="22" height="19" xmlns="http://www.w3.org/2000/svg">
              <rect x="0.5" y="0.5" width="27" height="23" rx="2.5" fill="#0d0d0d" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
              <circle cx="5.5" cy="6" r="2" fill="#ef4444" opacity="0.95" />
              <circle cx="11.5" cy="6" r="2" fill="#3b82f6" opacity="0.95" />
              <circle cx="17.5" cy="6" r="2" fill="#22c55e" opacity="0.95" />
              <circle cx="23" cy="6" r="2" fill="#f59e0b" opacity="0.95" />
              <circle cx="5.5" cy="12" r="2" fill="#8b5cf6" opacity="0.95" />
              <circle cx="11.5" cy="12" r="2" fill="#ef4444" opacity="0.95" />
              <circle cx="17.5" cy="12" r="2" fill="#3b82f6" opacity="0.95" />
              <circle cx="23" cy="12" r="2" fill="#22c55e" opacity="0.95" />
              <circle cx="5.5" cy="18" r="2" fill="#f59e0b" opacity="0.95" />
              <circle cx="11.5" cy="18" r="2" fill="#8b5cf6" opacity="0.95" />
              <circle cx="17.5" cy="18" r="2" fill="#ec4899" opacity="0.95" />
              <circle cx="23" cy="18" r="2" fill="#ef4444" opacity="0.95" />
            </svg>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'rgba(255,255,255,0.9)',
                letterSpacing: '-0.01em',
              }}
            >
              Визуализатор экрана
            </span>
          </div>
        </div>

        <div
          style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.3)',
            letterSpacing: '0.04em',
          }}
        >
          Фьючер Скрин · Perspective Planner
        </div>
      </header>

      {/* Tool iframe — takes remaining viewport */}
      <iframe
        src="/visual-led/index.html"
        title="Визуализатор размещения LED-экрана"
        style={{
          flex: 1,
          width: '100%',
          border: 'none',
          display: 'block',
        }}
        allow="clipboard-write"
      />
    </div>
  );
};

export default VisualLedEditorPage;
