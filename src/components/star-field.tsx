import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

const PRIMARY_HEX = '#4a88e6'
const ACCENT_HEX = '#4ab8e6'

function isMobile() {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

export function StarField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Bail out gracefully if WebGL is unavailable
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      })
    } catch {
      return
    }

    const mobile = isMobile()
    const particleCount = mobile ? 500 : 1000

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const scene = new Scene()
    const camera = new PerspectiveCamera(60, 1, 0.1, 200)
    camera.position.z = 80

    // Build particle attributes
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const phases = new Float32Array(particleCount)
    const colors = new Float32Array(particleCount * 3)

    const primaryColor = new Color(PRIMARY_HEX)
    const accentColor = new Color(ACCENT_HEX)

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = 30 + Math.random() * 70

      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)

      sizes[i] = Math.random() * 3 + 1
      phases[i] = Math.random() * Math.PI * 2

      const c = Math.random() < 0.7 ? primaryColor : accentColor
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
    geometry.setAttribute('color', new BufferAttribute(colors, 3))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      vertexColors: true,
      uniforms: {
        uTime: { value: 0 },
      },
      vertexShader: `
        attribute float aSize;
        attribute float aPhase;
        uniform float uTime;
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          float twinkle = sin(uTime * 0.8 + aPhase) * 0.4 + 0.6;
          gl_PointSize = aSize * twinkle * (200.0 / -mvPosition.z);
          vAlpha = twinkle * 0.6;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vAlpha;
        varying vec3 vColor;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.1, dist) * vAlpha;
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
    })

    const points = new Points(geometry, material)
    scene.add(points)

    // Resize (also updates pixel ratio for orientation changes)
    const onResize = () => {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.setSize(window.innerWidth, window.innerHeight)
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
    }
    onResize()
    window.addEventListener('resize', onResize)

    // Pause rendering when tab is hidden to save battery
    let paused = false
    const onVisibility = () => {
      paused = document.hidden
      if (!paused) clock.start()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Animate
    const clock = new Clock()
    let frameId: number

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (paused) return
      const t = clock.getElapsedTime()
      material.uniforms.uTime.value = t
      if (!prefersReducedMotion) {
        points.rotation.y = t * 0.02
        points.rotation.x = t * 0.005
      }
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
