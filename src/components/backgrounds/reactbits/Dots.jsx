import { useEffect, useRef, useCallback } from 'react';
import './Dots.css';

export default function Dots({
  dotSize = 16,
  gap = 32,
  baseColor = '#5227FF',
  activeColor = '#5227FF',
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  mouseInteraction = true,
  transparent = true,
  ...rest
}) {
  const canvasRef = useRef(null);
  const rafRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000, vx: 0, vy: 0, lastX: -1000, lastY: -1000 });
  const dotsRef = useRef([]);
  const ctxRef = useRef(null);
  const lastTimeRef = useRef(0);

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

      // Initialize dots grid
      const cols = Math.ceil(canvas.offsetWidth / gap) + 1;
      const rows = Math.ceil(canvas.offsetHeight / gap) + 1;
      dotsRef.current = [];

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          dotsRef.current.push({
            x: i * gap + gap / 2,
            y: j * gap + gap / 2,
            origX: i * gap + gap / 2,
            origY: j * gap + gap / 2,
            vx: 0,
            vy: 0,
            size: dotSize,
            active: false,
            activeTime: 0,
          });
        }
      }
    };

    resize();
    window.addEventListener('resize', resize);

    const baseRgb = hexToRgb(baseColor);
    const activeRgb = hexToRgb(activeColor);

    const animate = (timestamp) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      const mouse = mouseRef.current;
      const mouseSpeed = Math.sqrt(mouse.vx * mouse.vx + mouse.vy * mouse.vy);

      dotsRef.current.forEach((dot) => {
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Mouse interaction
        if (mouseInteraction && dist < proximity) {
          const force = (proximity - dist) / proximity;
          const angle = Math.atan2(dy, dx);
          
          if (mouseSpeed > speedTrigger) {
            // Shock effect on fast mouse movement
            const shockForce = shockStrength * force * (mouseSpeed / maxSpeed);
            dot.vx -= Math.cos(angle) * shockForce * 10;
            dot.vy -= Math.sin(angle) * shockForce * 10;
            dot.active = true;
            dot.activeTime = timestamp;
          } else {
            // Gentle attraction
            dot.vx += Math.cos(angle) * force * 0.5;
            dot.vy += Math.sin(angle) * force * 0.5;
          }
        }

        // Return to original position (spring force)
        const returnStrength = 1 / returnDuration;
        dot.vx += (dot.origX - dot.x) * returnStrength * dt;
        dot.vy += (dot.origY - dot.y) * returnStrength * dt;

        // Apply resistance (damping)
        dot.vx *= 1 - (resistance / 10000);
        dot.vy *= 1 - (resistance / 10000);

        // Update position
        dot.x += dot.vx * dt;
        dot.y += dot.vy * dt;

        // Decay active state
        if (timestamp - dot.activeTime > 500) {
          dot.active = false;
        }

        // Draw dot
        const activeFactor = dot.active ? 1 : Math.max(0, 1 - dist / (proximity * 2));
        const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * activeFactor);
        const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * activeFactor);
        const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * activeFactor);
        
        const size = dot.size * (1 + activeFactor * 0.5);
        const alpha = 0.4 + activeFactor * 0.6;

        ctx.beginPath();
        ctx.arc(dot.x, dot.y, size / 2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
        ctx.fill();

        // Glow effect for active dots
        if (activeFactor > 0.1) {
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${activeFactor * 0.2})`;
          ctx.fill();
        }
      });

      // Reset mouse velocity
      mouse.vx = 0;
      mouse.vy = 0;

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (mouseRef.current.lastX !== -1000) {
        mouseRef.current.vx = x - mouseRef.current.lastX;
        mouseRef.current.vy = y - mouseRef.current.lastY;
      }
      
      mouseRef.current.x = x;
      mouseRef.current.y = y;
      mouseRef.current.lastX = x;
      mouseRef.current.lastY = y;
    };

    const handleMouseLeave = () => {
      mouseRef.current.x = -1000;
      mouseRef.current.y = -1000;
      mouseRef.current.lastX = -1000;
      mouseRef.current.lastY = -1000;
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
  }, [dotSize, gap, baseColor, activeColor, proximity, speedTrigger, shockRadius, shockStrength, maxSpeed, resistance, returnDuration, mouseInteraction, hexToRgb]);

  return (
    <div className="dots-container" aria-hidden="true" {...rest}>
      <canvas ref={canvasRef} className="dots-canvas" />
    </div>
  );
}
