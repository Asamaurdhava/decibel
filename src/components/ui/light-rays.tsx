'use client';

import { useRef, useEffect, useState } from 'react';

const hexToRgb = (hex: string): [number, number, number] => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? [parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255] : [1, 1, 1];
};

type Origin = 'top-left' | 'top-center' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom-center' | 'bottom-right';

const getAnchorAndDir = (origin: Origin, w: number, h: number) => {
  const o = 0.2;
  switch (origin) {
    case 'top-left': return { anchor: [0, -o * h], dir: [0, 1] };
    case 'top-right': return { anchor: [w, -o * h], dir: [0, 1] };
    case 'left': return { anchor: [-o * w, 0.5 * h], dir: [1, 0] };
    case 'right': return { anchor: [(1 + o) * w, 0.5 * h], dir: [-1, 0] };
    case 'bottom-left': return { anchor: [0, (1 + o) * h], dir: [0, -1] };
    case 'bottom-center': return { anchor: [0.5 * w, (1 + o) * h], dir: [0, -1] };
    case 'bottom-right': return { anchor: [w, (1 + o) * h], dir: [0, -1] };
    default: return { anchor: [0.5 * w, -o * h], dir: [0, 1] };
  }
};

const VERT = `attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}`;

const FRAG = `precision highp float;
uniform float iTime;
uniform vec2 iResolution;
uniform vec2 rayPos;
uniform vec2 rayDir;
uniform vec3 raysColor;
uniform float raysSpeed;
uniform float lightSpread;
uniform float rayLength;
uniform float pulsating;
uniform float fadeDistance;
uniform float saturation;
uniform vec2 mousePos;
uniform float mouseInfluence;
uniform float noiseAmount;
uniform float distortion;
varying vec2 vUv;

float noise(vec2 st) {
  return fract(sin(dot(st, vec2(12.9898, 78.233))) * 43758.5453);
}

float rayStrength(vec2 src, vec2 ref, vec2 coord, float sA, float sB, float spd) {
  vec2 d = coord - src;
  vec2 dn = normalize(d);
  float ca = dot(dn, ref);
  float da = ca + distortion * sin(iTime * 2.0 + length(d) * 0.01) * 0.2;
  float sf = pow(max(da, 0.0), 1.0 / max(lightSpread, 0.001));
  float dist = length(d);
  float maxD = iResolution.x * rayLength;
  float lf = clamp((maxD - dist) / maxD, 0.0, 1.0);
  float ff = clamp((iResolution.x * fadeDistance - dist) / (iResolution.x * fadeDistance), 0.5, 1.0);

  // Heartbeat: two beats 3 seconds apart, then rest
  float t = mod(iTime, 10.0);
  float beat1 = smoothstep(0.0, 0.15, t) * smoothstep(0.4, 0.15, t);
  float beat2 = smoothstep(3.0, 3.15, t) * smoothstep(3.4, 3.15, t);
  float heartbeat = beat1 + beat2 * 0.7;
  float p = pulsating > 0.5 ? (0.7 + 0.3 * heartbeat) : 1.0;

  float bs = clamp(
    (0.45 + 0.15 * sin(da * sA + iTime * spd)) +
    (0.3 + 0.2 * cos(-da * sB + iTime * spd)),
    0.0, 1.0
  );
  return bs * lf * ff * sf * p;
}

void main() {
  vec2 coord = vec2(gl_FragCoord.x, iResolution.y - gl_FragCoord.y);
  vec2 fd = rayDir;
  if (mouseInfluence > 0.0) {
    vec2 ms = mousePos * iResolution.xy;
    fd = normalize(mix(rayDir, normalize(ms - rayPos), mouseInfluence));
  }
  vec4 r1 = vec4(1.0) * rayStrength(rayPos, fd, coord, 36.2214, 21.11349, 1.5 * raysSpeed);
  vec4 r2 = vec4(1.0) * rayStrength(rayPos, fd, coord, 22.3991, 18.0234, 1.1 * raysSpeed);
  vec4 c = r1 * 0.5 + r2 * 0.4;
  if (noiseAmount > 0.0) {
    c.rgb *= (1.0 - noiseAmount + noiseAmount * noise(coord * 0.01 + iTime * 0.1));
  }
  float b = 1.0 - (coord.y / iResolution.y);
  c.x *= 0.1 + b * 0.8;
  c.y *= 0.3 + b * 0.6;
  c.z *= 0.5 + b * 0.5;
  if (saturation != 1.0) {
    float g = dot(c.rgb, vec3(0.299, 0.587, 0.114));
    c.rgb = mix(vec3(g), c.rgb, saturation);
  }
  c.rgb *= raysColor;
  gl_FragColor = c;
}`;

interface Props {
  raysOrigin?: Origin;
  raysColor?: string;
  raysSpeed?: number;
  lightSpread?: number;
  rayLength?: number;
  followMouse?: boolean;
  mouseInfluence?: number;
  noiseAmount?: number;
  distortion?: number;
  className?: string;
  pulsating?: boolean;
  fadeDistance?: number;
  saturation?: number;
}

export default function LightRays({
  raysOrigin = 'top-center',
  raysColor = '#ffffff',
  raysSpeed = 0.8,
  lightSpread = 0.5,
  rayLength = 3,
  followMouse = true,
  mouseInfluence = 0.08,
  noiseAmount = 0,
  distortion = 0,
  className = '',
  pulsating = false,
  fadeDistance = 1,
  saturation = 0.6,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [visible, setVisible] = useState(false);

  // Intersection observer — only render when visible
  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // WebGL setup
  useEffect(() => {
    if (!visible || !containerRef.current) return;
    if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }

    let dead = false;
    const el = containerRef.current;

    (async () => {
      const { Renderer, Program, Triangle, Mesh } = await import('ogl');
      if (dead || !el) return;

      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio, 2), alpha: true });
      const gl = renderer.gl;
      gl.canvas.style.width = '100%';
      gl.canvas.style.height = '100%';
      while (el.firstChild) el.removeChild(el.firstChild);
      el.appendChild(gl.canvas);

      const u = {
        iTime: { value: 0 },
        iResolution: { value: [1, 1] },
        rayPos: { value: [0, 0] },
        rayDir: { value: [0, 1] },
        raysColor: { value: hexToRgb(raysColor) },
        raysSpeed: { value: raysSpeed },
        lightSpread: { value: lightSpread },
        rayLength: { value: rayLength },
        pulsating: { value: pulsating ? 1.0 : 0.0 },
        fadeDistance: { value: fadeDistance },
        saturation: { value: saturation },
        mousePos: { value: [0.5, 0.5] },
        mouseInfluence: { value: mouseInfluence },
        noiseAmount: { value: noiseAmount },
        distortion: { value: distortion },
      };

      const mesh = new Mesh(gl, {
        geometry: new Triangle(gl),
        program: new Program(gl, { vertex: VERT, fragment: FRAG, uniforms: u }),
      });

      const mouse = { x: 0.5, y: 0.5 };
      const smooth = { x: 0.5, y: 0.5 };

      const resize = () => {
        if (!el) return;
        const { clientWidth: w, clientHeight: h } = el;
        renderer.setSize(w, h);
        const dpr = renderer.dpr;
        u.iResolution.value = [w * dpr, h * dpr];
        const { anchor, dir } = getAnchorAndDir(raysOrigin, w * dpr, h * dpr);
        u.rayPos.value = anchor;
        u.rayDir.value = dir;
      };

      const onMouse = (e: MouseEvent) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        mouse.x = (e.clientX - r.left) / r.width;
        mouse.y = (e.clientY - r.top) / r.height;
      };

      let raf = 0;
      const loop = (t: number) => {
        u.iTime.value = t * 0.001;
        if (followMouse && mouseInfluence > 0) {
          smooth.x += (mouse.x - smooth.x) * 0.08;
          smooth.y += (mouse.y - smooth.y) * 0.08;
          u.mousePos.value = [smooth.x, smooth.y];
        }
        try { renderer.render({ scene: mesh }); } catch { return; }
        raf = requestAnimationFrame(loop);
      };

      window.addEventListener('resize', resize);
      if (followMouse) window.addEventListener('mousemove', onMouse);
      resize();
      raf = requestAnimationFrame(loop);

      cleanupRef.current = () => {
        cancelAnimationFrame(raf);
        window.removeEventListener('resize', resize);
        window.removeEventListener('mousemove', onMouse);
        try {
          const ext = gl.getExtension('WEBGL_lose_context');
          if (ext) ext.loseContext();
          if (gl.canvas.parentNode) gl.canvas.parentNode.removeChild(gl.canvas);
        } catch { /* ignore */ }
      };
    })();

    return () => {
      dead = true;
      if (cleanupRef.current) { cleanupRef.current(); cleanupRef.current = null; }
    };
  }, [visible, raysOrigin, raysColor, raysSpeed, lightSpread, rayLength, pulsating, fadeDistance, saturation, followMouse, mouseInfluence, noiseAmount, distortion]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}
    />
  );
}
