import { useEffect, useRef } from 'react';
import * as THREE from 'three';

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
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform float uSpeed;
uniform float uAmplitude;
uniform float uBlend;
uniform vec2 uMouse;
uniform float uMouseInfluence;

varying vec2 vUv;

// Simplex noise function
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
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.3;
  
  // Mouse influence
  vec2 mouseOffset = (uMouse - 0.5) * uMouseInfluence * 0.1;
  uv += mouseOffset;
  
  // Create flowing aurora bands
  float noise1 = snoise(vec3(uv.x * 2.0, uv.y * 1.5 + t * 0.5, t * 0.3));
  float noise2 = snoise(vec3(uv.x * 3.0 + 100.0, uv.y * 2.0 - t * 0.4, t * 0.25));
  float noise3 = snoise(vec3(uv.x * 1.5 + 200.0, uv.y * 1.0 + t * 0.6, t * 0.35));
  
  // Amplitude affects wave intensity
  float amp = uAmplitude;
  
  // Create flowing bands
  float band1 = smoothstep(0.3 - noise1 * 0.2 * amp, 0.7 + noise1 * 0.2 * amp, uv.y + noise1 * 0.15 * amp);
  float band2 = smoothstep(0.2 - noise2 * 0.25 * amp, 0.6 + noise2 * 0.25 * amp, uv.y + noise2 * 0.2 * amp + 0.15);
  float band3 = smoothstep(0.25 - noise3 * 0.2 * amp, 0.65 + noise3 * 0.2 * amp, uv.y + noise3 * 0.15 * amp - 0.1);
  
  // Blend colors based on bands
  vec3 col = vec3(0.0);
  col = mix(col, uColor1, band1 * (0.6 + noise1 * 0.4));
  col = mix(col, uColor2, band2 * (0.5 + noise2 * 0.4) * (1.0 - band1 * 0.5));
  col = mix(col, uColor3, band3 * (0.5 + noise3 * 0.4) * (1.0 - (band1 + band2) * 0.3));
  
  // Add glow
  float glow = (band1 + band2 + band3) * 0.4;
  col += glow * uBlend;
  
  // Soft edges
  float alpha = max(max(band1, band2), band3) * 0.85;
  alpha *= smoothstep(0.0, 0.15, uv.y) * smoothstep(1.0, 0.85, uv.y);
  
  gl_FragColor = vec4(col, alpha);
}
`;

export default function Aurora({
  color1 = '#3A29FF',
  color2 = '#FF94B4',
  color3 = '#FF3232',
  speed = 1,
  amplitude = 1,
  blend = 0.5,
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

  const toVec3 = (hex) => {
    const h = hex.replace('#', '').trim();
    const v = h.length === 3
      ? [parseInt(h[0] + h[0], 16), parseInt(h[1] + h[1], 16), parseInt(h[2] + h[2], 16)]
      : [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
    return new THREE.Vector3(v[0] / 255, v[1] / 255, v[2] / 255);
  };

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
        uColor1: { value: toVec3(color1) },
        uColor2: { value: toVec3(color2) },
        uColor3: { value: toVec3(color3) },
        uSpeed: { value: speed },
        uAmplitude: { value: amplitude },
        uBlend: { value: blend },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
        uMouseInfluence: { value: mouseInteraction ? 1.0 : 0.0 },
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
  }, [color1, color2, color3, speed, amplitude, blend, mouseInteraction, transparent]);

  return <div ref={containerRef} className="aurora-container" aria-hidden="true" {...rest} />;
}
