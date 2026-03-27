import { useEffect, useRef, useCallback } from 'react';
import './Waves.css';

export default function Waves({
  lineColor = '#FFFFFF',
  backgroundColor = '#070112',
  waveSpeedX = 0.0125,
  waveSpeedY = 0.005,
  waveAmpX = 32,
  waveAmpY = 16,
  xGap = 10,
  yGap = 32,
  friction = 0.925,
  tension = 0.005,
  maxCursorMove = 100,
  mouseInteraction = true,
  transparent = true,
  ...rest
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0, active: false });
  const linesRef = useRef([]);
  const ctxRef = useRef(null);
  const timeRef = useRef(0);

  const hexToRgb = useCallback((hex) => {
    const h = hex.replace('#', '').trim();
    const v = h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return { r: v[0], g: v[1], b: v[2] };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);

      // Initialize wave lines
      const lineCount = Math.ceil(canvas.offsetHeight / yGap) + 2;
      linesRef.current = [];

      for (let i = 0; i < lineCount; i++) {
        const y = i * yGap;
        const pointCount = Math.ceil(canvas.offsetWidth / xGap) + 2;
        const points = [];

        for (let j = 0; j < pointCount; j++) {
          points.push({
            x: j * xGap,
            y: y,
            origY: y,
            vy: 0,
          });
        }

        linesRef.current.push({
          y,
          points,
          offset: i * 0.5,
        });
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const bgRgb = hexToRgb(backgroundColor);
    const lineRgb = hexToRgb(lineColor);

    const animate = () => {
      const canvas = canvasRef.current;
      const ctx = ctxRef.current;
      if (!canvas || !ctx) return;

      timeRef.current += 1;
      const t = timeRef.current;

      // Clear with background
      ctx.fillStyle = `rgb(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b})`;
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const mouse = mouseRef.current;

      linesRef.current.forEach((line, lineIdx) => {
        // Update points
        line.points.forEach((point, pointIdx) => {
          // Wave motion
          const waveX = Math.sin(pointIdx * 0.3 + t * waveSpeedX + line.offset) * waveAmpX;
          const waveY = Math.cos(pointIdx * 0.2 + t * waveSpeedY + line.offset * 0.7) * waveAmpY;

          // Mouse interaction
          if (mouseInteraction && mouse.active) {
            const dx = mouse.x - point.x;
            const dy = mouse.y - point.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < maxCursorMove) {
              const force = (maxCursorMove - dist) / maxCursorMove;
              point.vy += dy * force * tension;
            }
          }

          // Spring physics
          const targetY = line.y + waveY;
          point.vy += (targetY - point.y) * tension;
          point.vy *= friction;
          point.y += point.vy;

          // Add wave X offset
          point.x = pointIdx * xGap + waveX * 0.3;
        });

        // Draw line
        ctx.beginPath();
        ctx.moveTo(line.points[0].x, line.points[0].y);

        for (let i = 1; i < line.points.length - 1; i++) {
          const p0 = line.points[i - 1];
          const p1 = line.points[i];
          const p2 = line.points[i + 1];

          const cpX = (p0.x + p1.x) / 2;
          const cpY = (p0.y + p1.y) / 2;
          const nextX = (p1.x + p2.x) / 2;
          const nextY = (p1.y + p2.y) / 2;

          ctx.quadraticCurveTo(p1.x, p1.y, nextX, nextY);
        }

        const lastIdx = line.points.length - 1;
        ctx.lineTo(line.points[lastIdx].x, line.points[lastIdx].y);

        // Gradient opacity based on line index
        const opacity = 0.15 + (lineIdx % 3) * 0.05;
        ctx.strokeStyle = `rgba(${lineRgb.r}, ${lineRgb.g}, ${lineRgb.b}, ${opacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    };

    const handleMouseLeave = () => {
      mouseRef.current.active = false;
    };

    if (mouseInteraction) {
      canvas.addEventListener('mousemove', handleMouseMove);
      canvas.addEventListener('mouseleave', handleMouseLeave);
    }

    return () => {
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (mouseInteraction) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [lineColor, backgroundColor, waveSpeedX, waveSpeedY, waveAmpX, waveAmpY, xGap, yGap, friction, tension, maxCursorMove, mouseInteraction, hexToRgb]);

  return (
    <div className="waves-container" aria-hidden="true" {...rest}>
      <canvas ref={canvasRef} className="waves-canvas" />
    </div>
  );
}
