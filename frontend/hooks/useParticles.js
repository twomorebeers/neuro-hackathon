import { useEffect, useRef } from 'react'

function boost(v) { return Math.pow(Math.max(v, 0), 0.4) }
function rand(a, b) { return a + Math.random() * (b - a) }

const HUE_RANGE = {
  alpha:   [210, 230],   
  beta:    [22,  42],    
  ssvep9:  [115, 140],   
  ssvep12: [52,  68],    
}

const CHANNELS = ['alpha', 'beta', 'ssvep9', 'ssvep12']

function pickChannel(vals) {
  const weights = CHANNELS.map(ch => Math.max(boost(vals[ch]), 0.01))
  const total   = weights.reduce((a, b) => a + b, 0)
  let r = Math.random() * total
  for (let i = 0; i < CHANNELS.length; i++) {
    r -= weights[i]
    if (r <= 0) return CHANNELS[i]
  }
  return CHANNELS[0]
}

function pickHue(ch) {
  const [min, max] = HUE_RANGE[ch]
  return rand(min, max)
}

// ── Orb ───────────────────────────────────────────────────────────────────────
function makeOrb(W, H, vals) {
  const ch = pickChannel(vals)
  return {
    ch, hue: pickHue(ch),
    x: rand(0, W), y: rand(0, H),
    baseR: rand(40, 130),
    vx: rand(-0.4, 0.4), vy: rand(-0.4, 0.4),
    life: 0, maxLife: rand(180, 380),
    val: boost(vals[ch]),
  }
}

function updateOrb(o, W, H, vals) {
  o.val  = boost(vals[o.ch]) * 0.7 + o.val * 0.3
  o.x   += o.vx
  o.y   += o.vy
  o.life++
  if (o.life > o.maxLife || boost(vals[o.ch]) < 0.02) {
    Object.assign(o, makeOrb(W, H, vals))
  }
}

function drawOrb(ctx, o) {
  const r = o.baseR * Math.max(o.val, 0.05)
  const a = Math.sin((o.life / o.maxLife) * Math.PI) * o.val * 0.5
  if (a < 0.02) return
  const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, r)
  g.addColorStop(0, `hsla(${o.hue},80%,65%,${a})`)
  g.addColorStop(1, 'transparent')
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(o.x, o.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ── Dot ───────────────────────────────────────────────────────────────────────
function makeDot(W, H, vals) {
  const ch = pickChannel(vals)
  return {
    ch, hue: pickHue(ch),
    x: rand(0, W), y: rand(0, H),
    baseR: rand(2, 9),
    vx: rand(-0.8, 0.8), vy: rand(-0.8, 0.8),
    life: 0, maxLife: rand(60, 160),
    val: boost(vals[ch]),
  }
}

function updateDot(d, W, H, vals) {
  d.val  = boost(vals[d.ch]) * 0.7 + d.val * 0.3
  d.x   += d.vx
  d.y   += d.vy
  d.life++
  if (d.life > d.maxLife || boost(vals[d.ch]) < 0.02) {
    Object.assign(d, makeDot(W, H, vals))
  }
}

function drawDot(ctx, d) {
  const r = d.baseR * Math.max(d.val, 0.05)
  const a = Math.sin((d.life / d.maxLife) * Math.PI) * d.val
  if (a < 0.05) return
  ctx.save()
  ctx.globalCompositeOperation = 'screen'
  ctx.globalAlpha = a
  ctx.fillStyle   = `hsl(${d.hue},90%,78%)`
  ctx.shadowBlur  = r * 5
  ctx.shadowColor = `hsl(${d.hue},90%,65%)`
  ctx.beginPath()
  ctx.arc(d.x, d.y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

// ── Hook principal ────────────────────────────────────────────────────────────
export function useParticles(canvasRef, valsRef) {
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let raf = null

    const W = () => canvas.width
    const H = () => canvas.height
    const v = () => valsRef.current

    const orbs = Array.from({ length: 10 }, () => makeOrb(W(), H(), v()))
    const dots  = Array.from({ length: 35 }, () => makeDot(W(), H(), v()))

    function frame() {
      const vals = v()
      const w = W(), h = H()

      ctx.globalCompositeOperation = 'source-over'
      ctx.globalAlpha = 1
      ctx.fillStyle   = 'rgba(6, 4, 16, 0.20)'
      ctx.fillRect(0, 0, w, h)

      for (const o of orbs) { updateOrb(o, w, h, vals); drawOrb(ctx, o) }
      for (const d of dots) { updateDot(d, w, h, vals); drawDot(ctx, d) }

      raf = requestAnimationFrame(frame)
    }

    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [canvasRef, valsRef])
}