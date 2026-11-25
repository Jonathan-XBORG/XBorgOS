import { useEffect, useRef } from 'react'

// The wallpaper redrawn in WebGL so the pointer can ripple it like water:
// rings spread from the cursor's path, a click drops a bigger splash and a
// soft lens follows the pointer. The CSS
// wallpaper underneath stays as the fallback (no WebGL, touch screens,
// reduced motion) and shows until the image is on the GPU.

const MAX_RIPPLES = 16
const RIPPLE_LIFE = 0.9 // seconds
const SPAWN_DIST = 45 // css px between two rings
const MAX_PIXELS = 4_200_000 // keeps very wide screens smooth
// A click drops a bigger splash: a wide ring of a few crests that travels
// further and lasts a little longer than the trail rings.
const MAX_SPLASHES = 4
const SPLASH_LIFE = 1.4 // seconds

const VERT = `
attribute vec2 a_pos;
varying vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`

const FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_css;
uniform vec2 u_img;
uniform float u_opacity;
uniform float u_time;
uniform vec4 u_r[${MAX_RIPPLES}];
uniform vec4 u_c[${MAX_SPLASHES}];
uniform vec2 u_mouse;
uniform float u_hover;
varying vec2 v_uv;

void main() {
  vec2 frag = v_uv * u_css;
  vec2 disp = vec2(0.0);
  for (int i = 0; i < ${MAX_RIPPLES}; i++) {
    vec4 r = u_r[i];
    if (r.w <= 0.0) continue;
    float age = u_time - r.z;
    if (age < 0.0 || age > ${RIPPLE_LIFE.toFixed(1)}) continue;
    vec2 d = frag - r.xy;
    float dist = length(d);
    float radius = age * 300.0;
    float k = (dist - radius) / 30.0;
    float band = exp(-k * k);
    float wave = sin((dist - radius) * 0.12) * band * exp(-age * 5.0) * r.w;
    if (dist > 0.001) disp += (d / dist) * wave * 34.0;
  }
  for (int i = 0; i < ${MAX_SPLASHES}; i++) {
    vec4 c = u_c[i];
    if (c.w <= 0.0) continue;
    float age = u_time - c.z;
    if (age < 0.0 || age > ${SPLASH_LIFE.toFixed(1)}) continue;
    vec2 d = frag - c.xy;
    float dist = length(d);
    float radius = age * 520.0;
    float k = (dist - radius) / 55.0;
    float band = exp(-k * k);
    float wave = sin((dist - radius) * 0.075) * band * exp(-age * 2.2) * c.w;
    if (dist > 0.001) disp += (d / dist) * wave * 60.0;
    // The drop itself: a quick dip right under the pointer.
    disp += d * 0.35 * exp(-dot(d, d) / (2.0 * 60.0 * 60.0)) * exp(-age * 8.0) * c.w;
  }
  vec2 dm = frag - u_mouse;
  disp -= dm * 0.22 * exp(-dot(dm, dm) / (2.0 * 80.0 * 80.0)) * u_hover;

  vec2 uv = (frag + disp) / u_css;
  float ra = u_css.x / u_css.y;
  float ia = u_img.x / u_img.y;
  vec2 s = ra > ia ? vec2(1.0, ia / ra) : vec2(ra / ia, 1.0);
  vec2 tuv = (uv - 0.5) * s + 0.5;
  tuv.y = 1.0 - tuv.y;
  vec3 c = texture2D(u_tex, clamp(tuv, 0.0, 1.0)).rgb;
  gl_FragColor = vec4(c * u_opacity, 1.0);
}`

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!
  gl.shaderSource(sh, src)
  gl.compileShader(sh)
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) ?? 'shader')
  return sh
}

export default function WallpaperWave({ src, small, opacity }: { src: string; small: string; opacity: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const props = useRef({ src, small, opacity })
  props.current = { src, small, opacity }
  const api = useRef<{ load: () => void } | null>(null)

  useEffect(() => {
    const el = canvas.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    const gl = el.getContext('webgl', { antialias: false, alpha: false, premultipliedAlpha: false })
    if (!gl) return

    let prog: WebGLProgram
    try {
      prog = gl.createProgram()!
      gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT))
      gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG))
      gl.linkProgram(prog)
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
    } catch {
      return
    }
    gl.useProgram(prog)
    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
    const aPos = gl.getAttribLocation(prog, 'a_pos')
    gl.enableVertexAttribArray(aPos)
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0)

    const u = (name: string) => gl.getUniformLocation(prog, name)
    const uCss = u('u_css')
    const uImg = u('u_img')
    const uOpacity = u('u_opacity')
    const uTime = u('u_time')
    const uR = u('u_r')
    const uC = u('u_c')
    const uMouse = u('u_mouse')
    const uHover = u('u_hover')

    const tex = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, tex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)

    const ripples = new Float32Array(MAX_RIPPLES * 4)
    const splashes = new Float32Array(MAX_SPLASHES * 4)
    let nextSplash = 0
    let lastClick = -10
    let next = 0
    let img = { w: 16, h: 9 }
    let ready = false
    let css = { w: 1, h: 1 }
    const mouse = { x: -9999, y: -9999, hover: 0, target: 0 }
    let last = { x: -9999, y: -9999 }
    let lastMove = 0
    let raf = 0
    let lastFrame = 0
    const t0 = performance.now()
    const now = () => (performance.now() - t0) / 1000

    function size() {
      css = { w: el!.clientWidth || window.innerWidth, h: el!.clientHeight || window.innerHeight }
      let scale = Math.min(window.devicePixelRatio || 1, 3)
      if (css.w * css.h * scale * scale > MAX_PIXELS) scale = Math.sqrt(MAX_PIXELS / (css.w * css.h))
      el!.width = Math.round(css.w * scale)
      el!.height = Math.round(css.h * scale)
      gl!.viewport(0, 0, el!.width, el!.height)
      wake()
    }

    let loadId = 0
    function load() {
      const id = ++loadId
      const wide = window.innerWidth * (window.devicePixelRatio || 1) > 2200
      const image = new Image()
      image.decoding = 'async'
      image.src = wide ? props.current.src : props.current.small
      image
        .decode()
        .then(() => {
          if (id !== loadId) return
          gl!.bindTexture(gl!.TEXTURE_2D, tex)
          gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGB, gl!.RGB, gl!.UNSIGNED_BYTE, image)
          img = { w: image.naturalWidth, h: image.naturalHeight }
          ready = true
          el!.classList.add('is-ready')
          wake()
        })
        .catch(() => {})
    }
    api.current = { load }

    function draw() {
      const t = now()
      // Time based easing, so the lens settles at the same speed at any fps.
      mouse.hover += (mouse.target - mouse.hover) * (1 - Math.exp(-(t - lastFrame) * 6))
      lastFrame = t
      gl!.uniform2f(uCss, css.w, css.h)
      gl!.uniform2f(uImg, img.w, img.h)
      gl!.uniform1f(uOpacity, props.current.opacity)
      gl!.uniform1f(uTime, t)
      gl!.uniform4fv(uR, ripples)
      gl!.uniform4fv(uC, splashes)
      gl!.uniform2f(uMouse, mouse.x, css.h - mouse.y)
      gl!.uniform1f(uHover, mouse.hover)
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
      const busy = t - lastMove < RIPPLE_LIFE || t - lastClick < SPLASH_LIFE || Math.abs(mouse.target - mouse.hover) > 0.002
      raf = busy ? requestAnimationFrame(draw) : 0
    }
    function wake() {
      if (ready && !raf) {
        lastFrame = now()
        raf = requestAnimationFrame(draw)
      }
    }

    function onMove(e: PointerEvent) {
      if (e.pointerType !== 'mouse') return
      mouse.x = e.clientX
      mouse.y = e.clientY
      mouse.target = 1
      lastMove = now()
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      const dist = Math.hypot(dx, dy)
      if (dist > SPAWN_DIST) {
        const strength = Math.min(1, 0.35 + dist / 400)
        ripples.set([e.clientX, css.h - e.clientY, lastMove, strength], next * 4)
        next = (next + 1) % MAX_RIPPLES
        last = { x: e.clientX, y: e.clientY }
      }
      wake()
    }
    function onDown(e: PointerEvent) {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      lastClick = now()
      splashes.set([e.clientX, css.h - e.clientY, lastClick, 1], nextSplash * 4)
      nextSplash = (nextSplash + 1) % MAX_SPLASHES
      wake()
    }
    function onLeave() {
      mouse.target = 0
      lastMove = now()
      wake()
    }

    size()
    load()
    window.addEventListener('resize', size)
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    document.documentElement.addEventListener('pointerleave', onLeave)
    window.addEventListener('blur', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      api.current = null
      window.removeEventListener('resize', size)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      document.documentElement.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('blur', onLeave)
      // Free the GPU objects but keep the context: React's dev mode mounts
      // twice, and a lost context could not be brought back on this canvas.
      gl.deleteTexture(tex)
      gl.deleteBuffer(buf)
      gl.deleteProgram(prog)
      el.classList.remove('is-ready')
    }
  }, [])

  // A new wallpaper from Preferences: upload the new image.
  useEffect(() => {
    api.current?.load()
  }, [src, small])

  return <canvas ref={canvas} className="os-wallpaper-gl" aria-hidden="true" />
}
