import { useEffect, useRef } from 'react'
import { createSky, type SceneId, type SkyController } from '../sky'

// The canvas behind the desktop. Without WebGL it stays empty and hidden, and the
// workspace keeps its gradient wallpaper.
export default function Sky({ scene, drift }: { scene: SceneId; drift: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const skyRef = useRef<SkyController | null>(null)
  const sceneRef = useRef(scene)
  sceneRef.current = scene

  useEffect(() => {
    const canvas = canvasRef.current
    const root = canvas?.closest<HTMLElement>('.workspace')
    if (!canvas || !root) return
    const sky = createSky(canvas, root, sceneRef.current)
    if (!sky) return
    skyRef.current = sky
    canvas.dataset.ready = 'true'
    return () => {
      sky.destroy()
      skyRef.current = null
    }
  }, [])

  useEffect(() => {
    skyRef.current?.setScene(scene)
  }, [scene])

  useEffect(() => {
    skyRef.current?.setDrift(drift)
  }, [drift])

  return <canvas ref={canvasRef} className="sky" aria-hidden="true" />
}
