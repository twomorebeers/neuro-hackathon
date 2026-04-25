import { useRef, useEffect, useLayoutEffect } from 'react'
import { useParticles } from '../hooks/useParticles'

export default function ParticleCanvas({ vals }) {
  const canvasRef = useRef(null)
  const valsRef   = useRef(vals)

  useEffect(() => { valsRef.current = vals }, [vals])

  useLayoutEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const resize = () => {
      canvas.width  = canvas.parentElement.clientWidth
      canvas.height = Math.round(canvas.parentElement.clientWidth * 0.52)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useParticles(canvasRef, valsRef)

  return <canvas ref={canvasRef} className="particle-canvas" />
}