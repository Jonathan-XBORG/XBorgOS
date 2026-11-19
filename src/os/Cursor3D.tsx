import { useEffect, useRef, useState } from 'react'
import {
  ACESFilmicToneMapping,
  Color,
  Group,
  LinearSRGBColorSpace,
  Mesh,
  MeshPhysicalMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// The floating glass cursor. The model and its camera come straight from
// Cursor.blend (exported to /os/cursor.glb), so the framing matches the
// Figma render. It replaces the system pointer on devices with a fine pointer,
// and steps aside for touch screens, reduced motion and browsers without WebGL.

const SIZE = 80 // CSS px of the square canvas (the arrow itself is about 60px)
const INTERACTIVE = 'a, button, input, textarea, select, label, [role="button"], [role="option"], [data-cursor="hover"]'
const TEXT = 'input[type="text"], input:not([type]), textarea'

function canUse3dCursor() {
  if (typeof window === 'undefined') return false
  if (!window.matchMedia('(pointer: fine)').matches) return false
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false
  if (new URLSearchParams(window.location.search).get('cursor') === 'off') return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

export default function Cursor3D() {
  const [enabled] = useState(canUse3dCursor)
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!enabled) return
    const wrap = wrapRef.current!
    const canvas = canvasRef.current!
    document.documentElement.classList.add('has-3d-cursor')

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
    renderer.setPixelRatio(dpr)
    renderer.setSize(SIZE, SIZE, false)
    renderer.outputColorSpace = SRGBColorSpace
    renderer.toneMapping = ACESFilmicToneMapping
    renderer.toneMappingExposure = 0.9

    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.03).texture
    scene.environment = envTex

    let camera = new PerspectiveCamera(30, 1, 0.1, 100)
    let pivot: Object3D | null = null
    // Where the tip of the arrow sits in the canvas, in CSS px. The canvas is
    // placed so this point is exactly under the real pointer.
    const hotspot = { x: SIZE * 0.14, y: SIZE * 0.45 }
    let disposed = false

    const material = new MeshPhysicalMaterial({
      // Base colour of the Blender "Caustics Glass" shader (linear values).
      color: new Color().setRGB(0.03, 0.05, 0.871, LinearSRGBColorSpace),
      metalness: 0,
      roughness: 0.05,
      ior: 1.45,
      clearcoat: 1,
      clearcoatRoughness: 0.03,
      iridescence: 0.2,
      iridescenceIOR: 1.3,
      specularIntensity: 1,
      envMapIntensity: 0.85,
    })

    new GLTFLoader().load('/os/cursor.glb', (gltf) => {
      if (disposed) return
      const glCam = gltf.cameras[0] as PerspectiveCamera | undefined
      gltf.scene.traverse((node) => {
        if ((node as Mesh).isMesh) (node as Mesh).material = material
      })
      scene.add(gltf.scene)
      gltf.scene.updateMatrixWorld(true)
      if (glCam) {
        camera = glCam
        camera.aspect = 1
        // Leave room around the arrow so the tilt never clips at the canvas edge.
        camera.zoom = 0.76
        camera.updateProjectionMatrix()
        camera.updateMatrixWorld(true)
      }

      const mesh = gltf.scene.getObjectByProperty('isMesh', true) as Mesh

      // The tip is the vertex furthest left on screen. The canvas is placed so
      // the tip sits exactly under the real pointer.
      const attr = mesh.geometry.attributes.position
      const v = new Vector3()
      const tip = new Vector3()
      let best = Infinity
      for (let i = 0; i < attr.count; i++) {
        v.fromBufferAttribute(attr, i).applyMatrix4(mesh.matrixWorld)
        const projected = v.clone().project(camera)
        if (projected.x < best) {
          best = projected.x
          tip.copy(v)
          hotspot.x = ((projected.x + 1) / 2) * SIZE
          hotspot.y = ((1 - projected.y) / 2) * SIZE
        }
      }

      // Tilt around the tip, so the point never drifts off the pointer.
      const group = new Group()
      group.position.copy(tip)
      scene.add(group)
      group.updateMatrixWorld(true)
      group.attach(mesh)
      group.updateMatrixWorld(true)
      pivot = group
    })

    const baseRotation = { x: 0, y: 0, z: 0 }
    const target = { x: -200, y: -200 }
    const pos = { x: -200, y: -200 }
    const vel = { x: 0, y: 0 }
    let scale = 1
    let scaleTarget = 1
    let visible = false
    let pressed = false
    let hovering = false
    let overText = false

    const onMove = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      target.x = e.clientX
      target.y = e.clientY
      if (!visible) {
        pos.x = target.x
        pos.y = target.y
        visible = true
      }
      const el = e.target instanceof Element ? e.target : null
      hovering = Boolean(el?.closest(INTERACTIVE))
      overText = Boolean(el?.closest(TEXT))
    }
    const onLeave = () => {
      visible = false
    }
    const onDown = () => {
      pressed = true
    }
    const onUp = () => {
      pressed = false
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)

    let raf = 0
    let last = performance.now()
    let opacity = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000

      // The tip sits exactly on the pointer; only the glass itself floats.
      const px = pos.x
      const py = pos.y
      pos.x = target.x
      pos.y = target.y
      vel.x += ((pos.x - px) / Math.max(dt, 0.001) - vel.x) * 0.2
      vel.y += ((pos.y - py) / Math.max(dt, 0.001) - vel.y) * 0.2

      scaleTarget = pressed ? 0.86 : hovering ? 1.12 : overText ? 0.8 : 1
      scale += (scaleTarget - scale) * (1 - Math.exp(-dt * 18))
      opacity += ((visible ? 1 : 0) - opacity) * (1 - Math.exp(-dt * 14))

      const bob = Math.sin(t * 2.2) * 2.5
      const lift = 22 + bob
      wrap.style.opacity = opacity.toFixed(3)
      wrap.style.transform = `translate3d(${pos.x - hotspot.x}px, ${pos.y - hotspot.y}px, 0)`
      canvas.style.transform = `scale(${scale.toFixed(3)})`
      canvas.style.transformOrigin = `${hotspot.x}px ${hotspot.y}px`
      wrap.style.filter = `drop-shadow(0px ${lift.toFixed(1)}px 9px rgba(0, 0, 0, 0.25))`

      if (pivot) {
        const tiltY = Math.max(-0.5, Math.min(0.5, vel.x / 2400))
        const tiltX = Math.max(-0.5, Math.min(0.5, vel.y / 2400))
        pivot.rotation.set(
          baseRotation.x + tiltX + Math.sin(t * 1.3) * 0.04,
          baseRotation.y + tiltY + Math.cos(t * 1.1) * 0.05,
          baseRotation.z,
        )
      }
      renderer.render(scene, camera)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      document.documentElement.classList.remove('has-3d-cursor')
      envTex.dispose()
      pmrem.dispose()
      material.dispose()
      renderer.dispose()
    }
  }, [enabled])

  if (!enabled) return null
  return (
    <div className="os-cursor" ref={wrapRef} aria-hidden="true">
      <canvas ref={canvasRef} width={SIZE} height={SIZE} style={{ width: SIZE, height: SIZE }} />
    </div>
  )
}
