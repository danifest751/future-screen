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
      {/* Branded header strip */}
      <header
        style={{
          flexShrink: 0,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(15,23,42,0.85)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            height: '52px',
          }}
        >
          {/* Left: back + brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textDecoration: 'none',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '12px',
                fontWeight: 500,
                letterSpacing: '0.02em',
                transition: 'color 150ms',
                flexShrink: 0,
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.9)')}
              onMouseOut={(e) => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 5l-7 7 7 7" />
              </svg>
              На сайт
            </Link>

            <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Logo */}
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
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
              <div>
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'rgba(255,255,255,0.9)',
                    letterSpacing: '-0.01em',
                    lineHeight: 1.2,
                  }}
                >
                  Визуализатор размещения экрана
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'rgba(255,255,255,0.3)',
                    letterSpacing: '0.04em',
                    lineHeight: 1.2,
                    marginTop: '1px',
                  }}
                >
                  Perspective Planner · Фьючер Скрин
                </div>
              </div>
            </div>
          </div>

          {/* Right: hints */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {[
              { icon: '📏', text: '1. Масштаб — 2 клика' },
              { icon: '▦', text: '2. Экран — 4 угла' },
              { icon: '▤', text: '3. Кабинеты' },
              { icon: '🧾', text: '4. Экспорт' },
            ].map((step) => (
              <div
                key={step.text}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(255,255,255,0.07)',
                  background: 'rgba(255,255,255,0.03)',
                  fontSize: '11px',
                  color: 'rgba(255,255,255,0.35)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ opacity: 0.7 }}>{step.icon}</span>
                {step.text}
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Tool iframe */}
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
