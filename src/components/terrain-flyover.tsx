import { useEffect, useRef } from 'react'
import {
  Clock,
  Color,
  Mesh,
  PerspectiveCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

const PRIMARY_HEX = '#4a88e6'
const ACCENT_HEX = '#4ab8e6'

function isMobile() {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

export function TerrainFlyover() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    const mobile = isMobile()
    const segments = mobile ? 36 : 64

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const scene = new Scene()
    const camera = new PerspectiveCamera(60, 1, 0.1, 300)
    camera.position.set(0, 28, 50)
    camera.lookAt(0, 0, -40)

    const geometry = new PlaneGeometry(200, 240, segments, segments)
    geometry.rotateX(-Math.PI / 2)

    const material = new ShaderMaterial({
      wireframe: true,
      transparent: true,
      uniforms: {
        uTime: { value: 0 },
        uPrimary: { value: new Color(PRIMARY_HEX) },
        uAccent: { value: new Color(ACCENT_HEX) },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        varying float vHeight;
        varying float vFogFactor;

        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

        float snoise(vec2 v) {
          const vec4 C = vec4(
            0.211324865405187, 0.366025403784439,
            -0.577350269189626, 0.024390243902439
          );
          vec2 i = floor(v + dot(v, C.yy));
          vec2 x0 = v - i + dot(i, C.xx);
          vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
          vec4 x12 = x0.xyxy + C.xxzz;
          x12.xy -= i1;
          i = mod289(i);
          vec3 p = permute(
            permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0)
          );
          vec3 m = max(
            0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)),
            0.0
          );
          m = m * m;
          m = m * m;
          vec3 x_ = 2.0 * fract(p * C.www) - 1.0;
          vec3 h = abs(x_) - 0.5;
          vec3 ox = floor(x_ + 0.5);
          vec3 a0 = x_ - ox;
          m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
          vec3 g;
          g.x = a0.x * x0.x + h.x * x0.y;
          g.yz = a0.yz * x12.xz + h.yz * x12.yw;
          return 130.0 * dot(m, g);
        }

        void main() {
          vec3 pos = position;

          // Slow scroll toward camera
          float scrollZ = pos.z + uTime * 2.5;

          // Single low-frequency octave for gentle rolling hills
          float n = snoise(vec2(pos.x * 0.018, scrollZ * 0.018)) * 6.0;
          n += snoise(vec2(pos.x * 0.04, scrollZ * 0.04)) * 2.0;

          pos.y = n;
          vHeight = (n + 6.0) / 12.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

          // Distance fog
          float dist = -mvPosition.z;
          vFogFactor = 1.0 - smoothstep(10.0, 100.0, dist);

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uPrimary;
        uniform vec3 uAccent;
        varying float vHeight;
        varying float vFogFactor;

        void main() {
          vec3 color = mix(uPrimary, uAccent, clamp(vHeight, 0.0, 1.0));
          float alpha = vFogFactor * 0.2;
          gl_FragColor = vec4(color, alpha);
        }
      `,
    })

    const mesh = new Mesh(geometry, material)
    scene.add(mesh)

    const onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    onResize()
    window.addEventListener('resize', onResize)

    let paused = false
    const onVisibility = () => {
      paused = document.hidden
      if (!paused) clock.start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    const clock = new Clock()
    let frameId: number

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (paused) return
      const t = prefersReducedMotion ? 0 : clock.getElapsedTime()
      material.uniforms.uTime.value = t
      renderer.render(scene, camera)
    }
    animate()

    return () => {
      cancelAnimationFrame(frameId)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisibility)
      renderer.dispose()
      geometry.dispose()
      material.dispose()
    }
  }, [])

  return <canvas ref={canvasRef} className="absolute inset-0" />
}
