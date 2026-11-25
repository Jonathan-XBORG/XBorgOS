import { useEffect, useRef } from 'react'
import {
  Box3,
  DirectionalLight,
  HalfFloatType,
  Mesh,
  MeshStandardMaterial,
  OrthographicCamera,
  PerspectiveCamera,
  PlaneGeometry,
  PMREMGenerator,
  Scene,
  ShaderMaterial,
  Vector2,
  Vector3,
  WebGLRenderer,
  WebGLRenderTarget,
  type Object3D,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// The "XBorg 3D" wallpaper: the 3D logo (XborgLogo.blend, exported to
// /V2/os/v2/logo.glb) on black, centred, turning towards the pointer, drawn
// as a grid of small squares: each one the average colour of what it
// covers, smaller where the logo only partly fills it.

const CELL = 16 // CSS px per square, gap included
const GAP = 2 // CSS px between squares
const RADIUS = 1.5 // CSS px corner radius of a square
const TURN = { x: 0.55, y: 0.8 } // radians at the screen edges

const quad = new PlaneGeometry(2, 2)
const vertex = /* glsl */ `
  void main() {
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`

// One texel per square: the average of the scene inside that square
// (premultiplied colour, coverage in alpha).
const downsample = /* glsl */ `
  uniform sampler2D scene;
  uniform vec2 res;
  uniform float split;
  uniform float cell;
  void main() {
    vec2 id = floor(gl_FragCoord.xy);
    vec4 sum = vec4(0.0);
    for (int i = 0; i < 4; i++) {
      for (int j = 0; j < 4; j++) {
        vec2 o = (vec2(float(i), float(j)) + 0.5) / 4.0;
        float x = split + (id.x + o.x) * cell;
        float yTop = (id.y + o.y) * cell;
        sum += texture2D(scene, vec2(x, res.y - yTop) / res);
      }
    }
    gl_FragColor = sum / 16.0;
  }
`

const composite = /* glsl */ `
  uniform sampler2D scene;
  uniform sampler2D grid;
  uniform vec2 res;
  uniform vec2 gridSize;
  uniform float split;
  uniform float cell;
  uniform float gap;
  uniform float radius;
  uniform float px;

  vec3 toSRGB(vec3 c) {
    c = clamp(c, 0.0, 1.0);
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  void main() {
    vec2 p = gl_FragCoord.xy;
    vec3 col = vec3(0.0);
    {
      vec2 q = vec2(p.x - split, res.y - p.y);
      vec2 id = floor(q / cell);
      vec2 f = q - id * cell - 0.5 * cell;
      vec4 c = texture2D(grid, (id + 0.5) / gridSize);
      float a = c.a;
      if (a > 0.015) {
        // Full squares where the logo fills the cell, smaller ones on its edges.
        float s = (cell - gap) * clamp(0.25 + a * 1.1, 0.0, 1.0);
        float r = min(radius, 0.2 * s);
        vec2 d = abs(f) - (0.5 * s - r);
        float sd = length(max(d, 0.0)) + min(max(d.x, d.y), 0.0) - r;
        float m = clamp(0.5 - sd, 0.0, 1.0);
        vec3 cc = c.rgb / max(a, 0.0001);
        // A slightly darker rim, like the squares in the reference.
        cc *= mix(0.78, 1.0, clamp(-sd / px - 0.5, 0.0, 1.0));
        col = mix(col, cc, m);
      }
    }
    gl_FragColor = vec4(toSRGB(col), 1.0);
  }
`

export default function LogoWallpaper() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current!
    let renderer: WebGLRenderer
    try {
      renderer = new WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' })
    } catch {
      return
    }
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const fine = window.matchMedia('(pointer: fine)').matches
    renderer.setClearColor(0x000000, 1)

    // The logo scene, rendered into a target (linear colour, coverage in alpha).
    const scene = new Scene()
    const pmrem = new PMREMGenerator(renderer)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    const key = new DirectionalLight(0xffffff, 1.05)
    key.position.set(-2, 3, 4)
    scene.add(key)
    const camera = new PerspectiveCamera(30, 1, 0.1, 100)
    camera.position.set(0, 0, 10)
    const material = new MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0, envMap: env, envMapIntensity: 0.4 })
    let logo: Object3D | null = null
    let logoHeight = 1
    let disposed = false

    new GLTFLoader().load('/V2/os/v2/logo.glb', (gltf) => {
      if (disposed) return
      const model = gltf.scene
      model.traverse((n) => {
        if ((n as Mesh).isMesh) (n as Mesh).material = material
      })
      // Exported with its face along X: turn it to face the camera.
      model.rotation.y = -Math.PI / 2
      const holder = new Scene()
      holder.add(model)
      const box = new Box3().setFromObject(holder)
      const centre = box.getCenter(new Vector3())
      model.position.sub(centre)
      logoHeight = box.getSize(new Vector3()).y
      scene.add(holder)
      logo = holder
      size()
    })

    const sceneRT = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: 4 })
    const gridRT = new WebGLRenderTarget(1, 1, { type: HalfFloatType })
    const flat = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const downMat = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: downsample,
      uniforms: { scene: { value: sceneRT.texture }, res: { value: new Vector2() }, split: { value: 0 }, cell: { value: 0 } },
    })
    const compMat = new ShaderMaterial({
      vertexShader: vertex,
      fragmentShader: composite,
      uniforms: {
        scene: { value: sceneRT.texture },
        grid: { value: gridRT.texture },
        res: { value: new Vector2() },
        gridSize: { value: new Vector2() },
        split: { value: 0 },
        cell: { value: 0 },
        gap: { value: 0 },
        radius: { value: 0 },
        px: { value: 1 },
      },
    })
    const downScene = new Scene().add(new Mesh(quad, downMat))
    const compScene = new Scene().add(new Mesh(quad, compMat))

    let w = 0
    let h = 0
    function size() {
      // Up to 3x for 3x screens, within a pixel budget so huge screens stay smooth.
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      let dpr = Math.min(window.devicePixelRatio || 1, 3)
      if (w * h * dpr * dpr > 9_000_000) dpr = Math.max(1, Math.sqrt(9_000_000 / (w * h)))
      renderer.setPixelRatio(dpr)
      renderer.setSize(w, h, false)
      const W = Math.round(w * dpr)
      const H = Math.round(h * dpr)
      sceneRT.setSize(W, H)
      const cell = CELL * dpr
      // The grid covers the whole screen, with a column edge on its centre
      // so the logo sits symmetrically in the squares.
      const split = W / 2 - Math.ceil(W / 2 / cell) * cell
      const cols = Math.ceil((W - split) / cell)
      const rows = Math.ceil(H / cell)
      gridRT.setSize(cols, rows)
      downMat.uniforms.res.value.set(W, H)
      downMat.uniforms.split.value = split
      downMat.uniforms.cell.value = cell
      const u = compMat.uniforms
      u.res.value.set(W, H)
      u.gridSize.value.set(cols, rows)
      u.split.value = split
      u.cell.value = cell
      u.gap.value = GAP * dpr
      u.radius.value = RADIUS * dpr
      u.px.value = dpr
      // The logo takes about 40% of the height (less on narrow screens).
      camera.aspect = w / h
      const target = Math.min(0.42, (0.36 * w) / h)
      camera.position.z = logoHeight / target / (2 * Math.tan((camera.fov * Math.PI) / 360))
      camera.updateProjectionMatrix()
      draw()
    }

    // The logo turns towards the pointer, easing in.
    const aim = { x: 0, y: 0 }
    const turn = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      aim.y = ((e.clientX / window.innerWidth) * 2 - 1) * TURN.y
      aim.x = ((e.clientY / window.innerHeight) * 2 - 1) * TURN.x
    }
    if (fine) window.addEventListener('pointermove', onMove, { passive: true })

    function draw() {
      if (logo) logo.rotation.set(turn.x, turn.y, 0)
      renderer.setRenderTarget(sceneRT)
      renderer.setClearColor(0x000000, 0)
      renderer.clear()
      renderer.render(scene, camera)
      renderer.setRenderTarget(gridRT)
      renderer.render(downScene, flat)
      renderer.setRenderTarget(null)
      renderer.setClearColor(0x000000, 1)
      renderer.render(compScene, flat)
    }

    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      if (!fine) {
        // Touch screens: a slow sway instead of following a pointer.
        const t = now / 1000
        aim.y = Math.sin(t * 0.35) * TURN.y * 0.6
        aim.x = Math.sin(t * 0.23) * TURN.x * 0.4
      }
      const k = 1 - Math.exp(-dt * 4)
      const moving = Math.abs(aim.x - turn.x) + Math.abs(aim.y - turn.y) > 0.0005
      turn.x += (aim.x - turn.x) * k
      turn.y += (aim.y - turn.y) * k
      if (moving || !fine) draw()
      raf = requestAnimationFrame(tick)
    }
    if (reduce) size()
    else {
      size()
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('resize', size)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onMove)
      sceneRT.dispose()
      gridRT.dispose()
      downMat.dispose()
      compMat.dispose()
      material.dispose()
      env.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
  }, [])

  return <canvas ref={ref} className="os-wallpaper-live" />
}
