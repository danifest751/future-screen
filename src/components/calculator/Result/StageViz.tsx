import type { CalcResult } from '../../../data/calculatorConfig';

interface Props {
  result: CalcResult;
}

const StageViz = ({ result }: Props) => {
  const { width, height, distance } = result;

  const svgW = 400;
  const padTop = 44;
  const padSide = 50;
  const padBottom = 30;

  const maxHoriz = width * 1.4;
  const maxVert = distance + height;
  const scaleX = (svgW - padSide * 2) / maxHoriz;
  const scaleY = (300 - padTop - padBottom) / (maxVert * 1.1);
  const scale = Math.min(scaleX, scaleY);

  const screenW = width * scale;
  const screenH = Math.max(height * scale, 8);
  const dist = distance * scale;

  const screenX = (svgW - screenW) / 2;
  const screenY = padTop;

  const stageY = screenY + screenH;
  const stageH = 10;

  const viewerY = stageY + stageH + dist;
  const svgH = viewerY + padBottom + 10;
  const cx = svgW / 2;

  // Человечки-зрители
  const personCount = Math.min(7, Math.max(3, Math.round(width / 2)));
  const personSpacing = screenW * 0.8 / (personCount - 1);
  const personStartX = cx - (personCount - 1) * personSpacing / 2;

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 text-sm font-semibold text-white">Схема сцены</div>
      <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full" style={{ maxHeight: 340 }}>
        <defs>
          <linearGradient id="screenGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgb(99,102,241)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="rgb(99,102,241)" stopOpacity={0.15} />
          </linearGradient>
          <linearGradient id="stageGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(255,255,255,0.12)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
          </linearGradient>
        </defs>

        {/* Сцена / подиум */}
        <rect
          x={screenX - 16}
          y={stageY}
          width={screenW + 32}
          height={stageH}
          rx={2}
          fill="url(#stageGrad)"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth={1}
        />
        <text x={cx} y={stageY + stageH / 2 + 3} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={7}>
          СЦЕНА
        </text>

        {/* Экран */}
        <rect
          x={screenX}
          y={screenY}
          width={screenW}
          height={screenH}
          rx={3}
          fill="url(#screenGrad)"
          stroke="rgb(99,102,241)"
          strokeWidth={2}
        />
        {/* Свечение экрана */}
        <rect
          x={screenX - 2}
          y={screenY - 2}
          width={screenW + 4}
          height={screenH + 4}
          rx={5}
          fill="none"
          stroke="rgb(99,102,241)"
          strokeWidth={1}
          opacity={0.2}
        />
        <text x={cx} y={screenY + screenH / 2 + 4} textAnchor="middle" fill="white" fontSize={11} fontWeight={700}>
          LED {width}×{height}
        </text>

        {/* Размерная линия — ширина (сверху) */}
        <line x1={screenX} y1={screenY - 10} x2={screenX} y2={screenY - 18} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
        <line x1={screenX + screenW} y1={screenY - 10} x2={screenX + screenW} y2={screenY - 18} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
        <line x1={screenX} y1={screenY - 14} x2={screenX + screenW} y2={screenY - 14} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        {/* Стрелки */}
        <polygon points={`${screenX},${screenY - 14} ${screenX + 5},${screenY - 17} ${screenX + 5},${screenY - 11}`} fill="rgba(255,255,255,0.4)" />
        <polygon points={`${screenX + screenW},${screenY - 14} ${screenX + screenW - 5},${screenY - 17} ${screenX + screenW - 5},${screenY - 11}`} fill="rgba(255,255,255,0.4)" />
        <text x={cx} y={screenY - 20} textAnchor="middle" fill="rgba(255,255,255,0.7)" fontSize={10} fontWeight={600}>
          {width} м
        </text>

        {/* Размерная линия — высота (слева) */}
        <line x1={screenX - 10} y1={screenY} x2={screenX - 18} y2={screenY} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
        <line x1={screenX - 10} y1={screenY + screenH} x2={screenX - 18} y2={screenY + screenH} stroke="rgba(255,255,255,0.3)" strokeWidth={1} />
        <line x1={screenX - 14} y1={screenY} x2={screenX - 14} y2={screenY + screenH} stroke="rgba(255,255,255,0.4)" strokeWidth={1} />
        <polygon points={`${screenX - 14},${screenY} ${screenX - 17},${screenY + 5} ${screenX - 11},${screenY + 5}`} fill="rgba(255,255,255,0.4)" />
        <polygon points={`${screenX - 14},${screenY + screenH} ${screenX - 17},${screenY + screenH - 5} ${screenX - 11},${screenY + screenH - 5}`} fill="rgba(255,255,255,0.4)" />
        <text
          x={screenX - 20}
          y={screenY + screenH / 2 + 3}
          textAnchor="end"
          fill="rgba(255,255,255,0.7)"
          fontSize={10}
          fontWeight={600}
        >
          {height} м
        </text>

        {/* Размерная линия — дистанция (справа) */}
        <line
          x1={screenX + screenW + 16}
          y1={stageY + stageH}
          x2={screenX + screenW + 16}
          y2={viewerY - 6}
          stroke="rgba(255,255,255,0.25)"
          strokeWidth={1}
          strokeDasharray="4 3"
        />
        <polygon points={`${screenX + screenW + 16},${stageY + stageH} ${screenX + screenW + 13},${stageY + stageH + 5} ${screenX + screenW + 19},${stageY + stageH + 5}`} fill="rgba(255,255,255,0.3)" />
        <polygon points={`${screenX + screenW + 16},${viewerY - 6} ${screenX + screenW + 13},${viewerY - 11} ${screenX + screenW + 19},${viewerY - 11}`} fill="rgba(255,255,255,0.3)" />
        <text
          x={screenX + screenW + 24}
          y={(stageY + stageH + viewerY - 6) / 2 + 4}
          fill="rgba(255,255,255,0.6)"
          fontSize={10}
          fontWeight={600}
        >
          {distance} м
        </text>

        {/* Зрители — человечки */}
        {Array.from({ length: personCount }).map((_, i) => {
          const px = personStartX + i * personSpacing;
          const py = viewerY;
          return (
            <g key={i} opacity={0.5 + (i === Math.floor(personCount / 2) ? 0.3 : 0)}>
              <circle cx={px} cy={py - 8} r={3.5} fill="rgba(255,255,255,0.5)" />
              <line x1={px} y1={py - 4} x2={px} y2={py + 4} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
              <line x1={px - 4} y1={py - 1} x2={px + 4} y2={py - 1} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
              <line x1={px} y1={py + 4} x2={px - 3} y2={py + 10} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
              <line x1={px} y1={py + 4} x2={px + 3} y2={py + 10} stroke="rgba(255,255,255,0.4)" strokeWidth={1.5} strokeLinecap="round" />
            </g>
          );
        })}

        {/* Площадь */}
        <text x={cx} y={svgH - 4} textAnchor="middle" fill="rgba(255,255,255,0.35)" fontSize={9}>
          Площадь экрана: {result.area} м² · {result.pitch.label}
        </text>
      </svg>
    </div>
  );
};

export default StageViz;
