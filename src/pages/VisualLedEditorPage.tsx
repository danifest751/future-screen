import { useState } from 'react';
import { Link } from 'react-router-dom';

const steps = [
  { id: '1', text: 'Масштаб: 2 клика' },
  { id: '2', text: 'Экран: 4 угла' },
  { id: '3', text: 'Кабинеты' },
  { id: '4', text: 'Экспорт' },
];

const VisualLedEditorPage = () => {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        background:
          'radial-gradient(circle at 12% -10%, rgba(59,130,246,0.2) 0%, rgba(59,130,246,0) 34%), radial-gradient(circle at 88% 110%, rgba(168,85,247,0.17) 0%, rgba(168,85,247,0) 33%), #020617',
        overflow: 'hidden',
      }}
    >
      <header
        style={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(15,23,42,0.8)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '0 20px',
            height: '52px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', minWidth: 0 }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.45)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                transition: 'color 150ms',
                flexShrink: 0,
              }}
              onMouseOver={(event) => {
                event.currentTarget.style.color = 'rgba(255,255,255,0.9)';
              }}
              onMouseOut={(event) => {
                event.currentTarget.style.color = 'rgba(255,255,255,0.45)';
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              На сайт
            </Link>

            <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 50%, #a855f7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                FS
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.92)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  Визуализатор размещения экрана
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.4)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                    marginTop: '1px',
                    textTransform: 'uppercase',
                  }}
                >
                  Perspective Planner · Фьючер Скрин
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '2px',
              scrollbarWidth: 'none',
            }}
          >
            {steps.map((step) => (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.09)',
                  background: 'rgba(15,23,42,0.65)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.58)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '999px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '9px',
                    fontWeight: 700,
                    background: 'rgba(59,130,246,0.24)',
                    color: 'rgba(255,255,255,0.95)',
                  }}
                >
                  {step.id}
                </span>
                {step.text}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div
        style={{
          position: 'relative',
          flex: 1,
          minHeight: 0,
          margin: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(2,6,23,0.55)',
          background: '#020617',
        }}
      >
        {!iframeLoaded && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255,255,255,0.72)',
              fontSize: '13px',
              background:
                'radial-gradient(circle at 20% 0%, rgba(59,130,246,0.16) 0%, transparent 40%), radial-gradient(circle at 80% 100%, rgba(168,85,247,0.14) 0%, transparent 40%), #020617',
            }}
          >
            Загружаем визуализатор...
          </div>
        )}

        <iframe
          src="/visual-led-legacy/index.html"
          title="Визуализатор размещения LED-экрана (legacy)"
          onLoad={() => setIframeLoaded(true)}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            display: 'block',
            backgroundColor: '#020617',
            opacity: iframeLoaded ? 1 : 0,
            transition: 'opacity 180ms ease',
          }}
          allow="clipboard-write; autoplay"
        />
      </div>
    </div>
  );
};

export default VisualLedEditorPage;
