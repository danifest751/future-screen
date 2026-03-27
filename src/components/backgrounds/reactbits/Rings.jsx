import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Rings.css';

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
uniform int uRings;
uniform float uSpread;
uniform float uSpeed;
uniform vec2 uMouse;
uniform float uMouseInfluence;

varying vec2 vUv;

void main() {
  vec2 uv = vUv * 2.0 - 1.0;
  uv.x *= uResolution.x / uResolution.y;
  
  // Mouse influence on center
  vec2 center = uMouse * 2.0 - 1.0;
  center.x *= uResolution.x / uResolution.y;
  center *= uMouseInfluence * 0.3;
  
  float dist = length(uv - center);
  
  vec3 col = vec3(0.02, 0.05, 0.12); // Dark background
  
  float t = uTime * uSpeed * 0.5;
  
  for (int i = 0; i < 20; i++) {
    if (i >= uRings) break;
    
    float fi = float(i);
    float ringDist = 0.15 + fi * 0.12 * uSpread;
    float pulse = sin(t + fi * 0.5) * 0.02;
    ringDist += pulse;
    
    float ringWidth = 0.003 + fi * 0.001;
    float ring = smoothstep(ringDist - ringWidth, ringDist, dist) - 
                 smoothstep(ringDist, ringDist + ringWidth, dist);
    
    // Color gradient from center
    vec3 ringColor = mix(
      vec3(0.2, 0.5, 1.0), // Blue center
      vec3(0.6, 0.3, 0.9), // Purple outer
      fi / float(uRings)
    );
    
    float alpha = ring * (0.4 - fi * 0.02);
    col = mix(col, ringColor, alpha);
  }
  
  // Add glow at center
  float glow = exp(-dist * 2.0) * 0.3;
  col += vec3(0.2, 0.4, 0.8) * glow;
  
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Rings({
  rings = 5,
  spread = 1,
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
  const mouseRef = useRef(new THREE.Vector2(0.5, 0.5));

  useEffect(() => {
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
        uRings: { value: rings },
        uSpread: { value: spread },
        uSpeed: { value: speed },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseInfluence: { value: mouseInteraction ? 1.0 : 0.0 },
      },
      transparent: true,
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

    return () => {
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
  }, [rings, spread, speed, mouseInteraction, transparent]);

  return <div ref={containerRef} className="rings-container" aria-hidden="true" {...rest} />;
}
