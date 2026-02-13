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

const CONTRAIL_COUNT = 5
const TRAIL_LENGTH = 100

function isMobile() {
  return window.innerWidth < 768 || /Mobi|Android/i.test(navigator.userAgent)
}

interface Trail {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  speed: number
  age: number
}

function spawnTrail(bounds: number): Trail {
  const angle = (Math.random() - 0.5) * 0.6 + Math.PI
  return {
    x: bounds * (Math.random() < 0.5 ? 1 : -1),
    y: 10 + Math.random() * 40,
    z: -40 + Math.random() * 60,
    vx: Math.cos(angle) * (0.15 + Math.random() * 0.15),
    vy: (Math.random() - 0.5) * 0.01,
    vz: -0.02 + Math.random() * 0.04,
    speed: 0.4 + Math.random() * 0.4,
    age: 0,
  }
}

export function Contrails() {
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
    const trailCount = mobile ? 3 : CONTRAIL_COUNT
    const trailLen = mobile ? 60 : TRAIL_LENGTH
    const totalPoints = trailCount * trailLen

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches

    const scene = new Scene()
    const camera = new PerspectiveCamera(60, 1, 0.1, 500)
    camera.position.set(0, 10, 80)
    camera.lookAt(0, 20, 0)

    const bounds = 100

    // Initialize trails
    const trails: Trail[] = []
    for (let c = 0; c < trailCount; c++) {
      trails.push(spawnTrail(bounds))
    }

    // Build geometry
    const positions = new Float32Array(totalPoints * 3)
    const alphas = new Float32Array(totalPoints)
    const sizes = new Float32Array(totalPoints)

    for (let c = 0; c < trailCount; c++) {
      const trail = trails[c]
      for (let p = 0; p < trailLen; p++) {
        const idx = (c * trailLen + p) * 3
        positions[idx] = trail.x
        positions[idx + 1] = trail.y
        positions[idx + 2] = trail.z
        alphas[c * trailLen + p] = 0
        sizes[c * trailLen + p] = 1.5 + Math.random() * 1.0
      }
    }

    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(positions, 3))
    geometry.setAttribute('aAlpha', new BufferAttribute(alphas, 1))
    geometry.setAttribute('aSize', new BufferAttribute(sizes, 1))

    const material = new ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
      uniforms: {
        uColor: {
          value: new Color().lerpColors(
            new Color(PRIMARY_HEX),
            new Color('#ffffff'),
            0.7,
          ),
        },
      },
      vertexShader: /* glsl */ `
        attribute float aAlpha;
        attribute float aSize;
        varying float vAlpha;

        void main() {
          vAlpha = aAlpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * (150.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: /* glsl */ `
        uniform vec3 uColor;
        varying float vAlpha;

        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.05, dist) * vAlpha * 0.45;
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

    const posAttr = geometry.getAttribute('position') as BufferAttribute
    const alphaAttr = geometry.getAttribute('aAlpha') as BufferAttribute
    const posArr = posAttr.array as Float32Array
    const alphaArr = alphaAttr.array as Float32Array

    const animate = () => {
      frameId = requestAnimationFrame(animate)
      if (paused) return

      const delta = clock.getDelta()
      if (prefersReducedMotion) {
        renderer.render(scene, camera)
        return
      }

      const dt = delta * 60

      for (let c = 0; c < trailCount; c++) {
        const trail = trails[c]
        const base = c * trailLen

        // Shift trail points backward (tail ← head)
        for (let p = trailLen - 1; p > 0; p--) {
          const idx = (base + p) * 3
          const prev = (base + p - 1) * 3
          posArr[idx] = posArr[prev]
          posArr[idx + 1] = posArr[prev + 1]
          posArr[idx + 2] = posArr[prev + 2]
        }

        // Advance head
        trail.x += trail.vx * trail.speed * dt
        trail.y += trail.vy * trail.speed * dt
        trail.z += trail.vz * trail.speed * dt
        trail.age += dt

        const headIdx = base * 3
        posArr[headIdx] = trail.x
        posArr[headIdx + 1] = trail.y
        posArr[headIdx + 2] = trail.z

        // Fade in the trail gradually, then fade along length
        const maturity = Math.min(trail.age / trailLen, 1.0)
        for (let p = 0; p < trailLen; p++) {
          const t = p / trailLen
          alphaArr[base + p] = (1.0 - t * t) * maturity
        }

        // Respawn when out of bounds
        if (
          Math.abs(trail.x) > bounds * 1.2 ||
          trail.y > 80 ||
          trail.y < -10
        ) {
          const fresh = spawnTrail(bounds)
          Object.assign(trail, fresh)
          for (let p = 0; p < trailLen; p++) {
            const idx = (base + p) * 3
            posArr[idx] = fresh.x
            posArr[idx + 1] = fresh.y
            posArr[idx + 2] = fresh.z
            alphaArr[base + p] = 0
          }
        }
      }

      posAttr.needsUpdate = true
      alphaAttr.needsUpdate = true

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
