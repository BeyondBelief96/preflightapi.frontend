import { useEffect, useRef } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Clock,
  Color,
  Points,
  PerspectiveCamera,
  Scene,
  ShaderMaterial,
  WebGLRenderer,
} from 'three'

const PRIMARY_HEX = '#4a88e6'

function isMobile() {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

export function CloudDeck() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

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
    const particleCount = mobile ? 250 : 500

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const scene = new Scene()
    const camera = new PerspectiveCamera(60, 1, 0.1, 500)
    camera.position.set(0, 30, 40)
    camera.lookAt(0, 5, -40)

    // Build cloud particles spread across a wide, thin layer below the camera
    const positions = new Float32Array(particleCount * 3)
    const sizes = new Float32Array(particleCount)
    const phases = new Float32Array(particleCount)
    const opacities = new Float32Array(particleCount)

    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 200
      positions[i * 3 + 1] = Math.random() * 10 - 2
      positions[i * 3 + 2] = (Math.random() - 0.5) * 200

      sizes[i] = 25 + Math.random() * 45
      phases[i] = Math.random() * Math.PI * 2
      opacities[i] = 0.15 + Math.random() * 0.4
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geometry.setAttribute('aPhase', new BufferAttribute(phases, 1))
    geometry.setAttribute('aOpacity', new BufferAttribute(opacities, 1))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uColor: {
          value: new Color().lerpColors(
            new Color(PRIMARY_HEX),
            new Color('#c0d8f0'),
            0.45,
          ),
        },
      },
      vertexShader: /* glsl */ `
        attribute float aSize;
        attribute float aPhase;
        attribute float aOpacity;
        uniform float uTime;
        varying float vAlpha;

        void main() {
          vec3 pos = position;

          // Gentle lateral sway
          pos.x += sin(uTime * 0.08 + aPhase) * 3.0;
          // Slow forward drift (simulates flying over clouds)
          pos.z += uTime * 2.0;
          // Wrap Z so clouds recycle seamlessly
          pos.z = mod(pos.z + 100.0, 200.0) - 100.0;

          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

          // Soft breathing pulse
          float pulse = sin(uTime * 0.25 + aPhase) * 0.12 + 0.88;
          gl_PointSize = aSize * pulse * (200.0 / -mvPosition.z);

          // Fade with distance
          float dist = -mvPosition.z;
          float fog = 1.0 - smoothstep(30.0, 160.0, dist);

          vAlpha = aOpacity * fog * pulse * 0.28;

          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          // Gaussian-like falloff for soft cloud edges
          float alpha = exp(-dist * dist * 8.0) * vAlpha;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    })

    const points = new Points(geometry, material)
    scene.add(points)

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
