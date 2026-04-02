import { useEffect, useRef } from 'react';
import './Mesh.css';

const vert = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 1.0);
}
`;

const frag = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform float uGridOpacity;
uniform float uGlow;
uniform float uSpeed;
uniform vec2 uMouse;

varying vec2 vUv;

// Gradient noise
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.2;
  
  // Animated gradient background
  float noise1 = snoise(vec3(uv * 2.0, t * 0.3));
  float noise2 = snoise(vec3(uv * 3.0 + 100.0, t * 0.25));
  float noise3 = snoise(vec3(uv * 1.5 + 200.0, t * 0.35));
  
  // Color palette: indigo/cyan/pink
  vec3 color1 = vec3(0.4, 0.3, 0.9); // Indigo
  vec3 color2 = vec3(0.2, 0.8, 0.9); // Cyan
  vec3 color3 = vec3(0.9, 0.3, 0.6); // Pink
  
  vec3 bgCol = mix(
    mix(color1, color2, noise1 * 0.5 + 0.5),
    color3,
    noise2 * 0.3 + noise3 * 0.2
  );
  
  // Grid lines
  float gridSize = 50.0;
  vec2 gridUV = uv * uResolution / gridSize;
  vec2 gridFract = fract(gridUV);
  
  // Grid line calculation
  float gridLine = 0.0;
  float lineWidth = 0.02;
  gridLine += smoothstep(lineWidth, 0.0, abs(gridFract.x - 0.5) * 2.0);
  gridLine += smoothstep(lineWidth, 0.0, abs(gridFract.y - 0.5) * 2.0);
  gridLine = clamp(gridLine, 0.0, 1.0);
  
  // Apply grid opacity
  vec3 gridColor = vec3(1.0, 1.0, 1.0) * uGridOpacity * 2.0;
  
  // Glow effect at center
  float distToCenter = length(uv - 0.5 - (uMouse - 0.5) * 0.1);
  float glow = exp(-distToCenter * 3.0) * uGlow;
  
  // Combine
  vec3 finalCol = bgCol * 0.15; // Darken background
  finalCol += bgCol * glow * 0.5; // Add glow
  finalCol += gridColor * gridLine; // Add grid
  
  float alpha = 0.9 + glow * 0.2;
  
  gl_FragColor = vec4(finalCol, alpha);
}
`;

export default function Mesh({
  gridOpacity = 0.08,
  glow = 0.3,
  speed = 1,
  mouseInteraction = true,
  transparent = true,
  ...rest
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const rafRef = useRef(null);
  const materialRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const mouseRef = useRef(null);
  const threeRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    let cleanup = null;

    const init = async () => {
      try {
        // Dynamic import of Three.js
        const THREE = await import('three');
        
        if (!isMountedRef.current || !containerRef.current) return;
        
        threeRef.current = THREE;
        mouseRef.current = new THREE.Vector2(0.5, 0.5);

        const container = containerRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = new THREE.ShaderMaterial({
          vertexShader: vert,
          fragmentShader: frag,
          uniforms: {
            uResolution: { value: new THREE.Vector2(1, 1) },
            uTime: { value: 0 },
            uGridOpacity: { value: gridOpacity },
            uGlow: { value: glow },
            uSpeed: { value: speed },
            uMouse: { value: new THREE.Vector2(0.5, 0.5) },
          },
          transparent: true,
          premultipliedAlpha: true,
        });
        materialRef.current = material;

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        });
        rendererRef.current = renderer;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.setClearColor(0x000000, transparent ? 0 : 1);
        renderer.domElement.style.width = '100%';
        renderer.domElement.style.height = '100%';
        renderer.domElement.style.display = 'block';
        container.appendChild(renderer.domElement);

        const clock = new THREE.Clock();

        const handleResize = () => {
          const w = container.clientWidth || 1;
          const h = container.clientHeight || 1;
          renderer.setSize(w, h, false);
          material.uniforms.uResolution.value.set(w, h);
        };

        handleResize();

        if ('ResizeObserver' in window) {
          const ro = new ResizeObserver(handleResize);
          ro.observe(container);
          resizeObserverRef.current = ro;
        } else {
          window.addEventListener('resize', handleResize);
        }

        const loop = () => {
          if (!isMountedRef.current) return;
          material.uniforms.uTime.value = clock.getElapsedTime();
          material.uniforms.uMouse.value.lerp(mouseRef.current, 0.05);
          renderer.render(scene, camera);
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);

        const handleMouseMove = (e) => {
          const rect = container.getBoundingClientRect();
          mouseRef.current.x = (e.clientX - rect.left) / rect.width;
          mouseRef.current.y = 1.0 - (e.clientY - rect.top) / rect.height;
        };

        if (mouseInteraction) {
          container.addEventListener('mousemove', handleMouseMove);
        }

        // Store cleanup function
        cleanup = () => {
          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
          else window.removeEventListener('resize', handleResize);
          if (mouseInteraction) {
            container.removeEventListener('mousemove', handleMouseMove);
          }
          geometry.dispose();
          material.dispose();
          renderer.dispose();
          renderer.forceContextLoss();
          if (renderer.domElement?.parentElement === container) {
            container.removeChild(renderer.domElement);
          }
        };
      } catch (error) {
        console.error('Failed to load Three.js:', error);
      }
    };

    init();

    return () => {
      isMountedRef.current = false;
      if (cleanup) cleanup();
    };
  }, [gridOpacity, glow, speed, mouseInteraction, transparent]);

  return <div ref={containerRef} className="mesh-container" aria-hidden="true" {...rest} />;
}
