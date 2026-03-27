import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import './Nebula.css';

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
uniform float uGrain;
uniform float uHueShift;
uniform float uSpeed;
uniform vec2 uMouse;

varying vec2 vUv;

// Simplex 3D Noise
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

float snoise(vec3 v){ 
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod(i, 289.0 ); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  float n_ = 1.0/7.0;
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

vec3 hsv2rgb(vec3 c) {
  vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
  vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
  return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
  vec2 uv = vUv;
  float t = uTime * uSpeed * 0.1;
  
  // Mouse parallax
  vec2 mouseOffset = (uMouse - 0.5) * 0.1;
  uv += mouseOffset;
  
  // Multi-layered nebula noise
  float n1 = snoise(vec3(uv * 2.0, t));
  float n2 = snoise(vec3(uv * 4.0 + 100.0, t * 0.8));
  float n3 = snoise(vec3(uv * 1.0 + 200.0, t * 1.2));
  float n4 = snoise(vec3(uv * 8.0 + 50.0, t * 0.5));
  
  float noise = n1 * 0.5 + n2 * 0.25 + n3 * 0.15 + n4 * 0.1;
  
  // Create nebula clouds
  float cloud1 = smoothstep(0.0, 0.6, noise);
  float cloud2 = smoothstep(-0.2, 0.4, n2);
  float cloud3 = smoothstep(-0.1, 0.5, n3);
  
  // Color palette
  float hue1 = 0.75 + uHueShift / 360.0; // Purple base
  float hue2 = 0.55 + uHueShift / 360.0; // Blue
  float hue3 = 0.85 + uHueShift / 360.0; // Pink
  
  vec3 col1 = hsv2rgb(vec3(fract(hue1), 0.7, 0.6));
  vec3 col2 = hsv2rgb(vec3(fract(hue2), 0.6, 0.5));
  vec3 col3 = hsv2rgb(vec3(fract(hue3), 0.5, 0.4));
  
  vec3 col = vec3(0.02, 0.03, 0.08); // Deep space background
  col = mix(col, col1, cloud1 * 0.7);
  col = mix(col, col2, cloud2 * 0.5 * (1.0 - cloud1 * 0.5));
  col = mix(col, col3, cloud3 * 0.4 * (1.0 - (cloud1 + cloud2) * 0.3));
  
  // Add stars
  float starNoise = snoise(vec3(uv * 50.0, t * 0.1));
  float stars = smoothstep(0.85, 1.0, starNoise) * 0.8;
  col += vec3(stars);
  
  // Grain effect
  float grain = fract(sin(dot(uv * uTime, vec2(12.9898, 78.233))) * 43758.5453);
  col += (grain - 0.5) * uGrain;
  
  // Vignette
  float vignette = 1.0 - length(vUv - 0.5) * 0.8;
  col *= vignette;
  
  gl_FragColor = vec4(col, 1.0);
}
`;

export default function Nebula({
  grain = 0.18,
  hueShift = 0,
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
        uGrain: { value: grain },
        uHueShift: { value: hueShift },
        uSpeed: { value: speed },
        uMouse: { value: new THREE.Vector2(0.5, 0.5) },
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
      material.uniforms.uMouse.value.lerp(mouseRef.current, 0.03);
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
  }, [grain, hueShift, speed, mouseInteraction, transparent]);

  return <div ref={containerRef} className="nebula-container" aria-hidden="true" {...rest} />;
}
