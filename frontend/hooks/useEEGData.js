import { useState, useEffect, useRef, useCallback } from 'react'

const INITIAL_VALS = { alpha: 0.35, beta: 0.12, ssvep9: 0.20, ssvep12: 0.08 }

export function useEEGData() {
  const cache        = useRef({})
  const frameDataRef = useRef([])
  const frameMaxRef  = useRef({ alpha: 1, beta: 1, ssvep9: 1, ssvep12: 1 })

  const [currentDataset, setCurrentDataset] = useState(1)
  const [frameIndex, setFrameIndex]         = useState(0)
  const [frameData, setFrameData]           = useState([])
  const [playing, setPlaying]               = useState(false)
  const [speed, setSpeedState]              = useState(5)
  const [vals, setVals]                     = useState(INITIAL_VALS)

  const valsFromFrame = useCallback((idx) => {
    const f   = frameDataRef.current[idx]
    const max = frameMaxRef.current
    if (!f) return
    setVals({
      alpha:   f.alpha_power / max.alpha,
      beta:    f.beta_power  / max.beta,
      ssvep9:  f.ssvep_9Hz   / max.ssvep9,
      ssvep12: f.ssvep_12Hz  / max.ssvep12,
    })
  }, [])

  const loadDataset = useCallback(async (num) => {
    setCurrentDataset(num)

    const apply = (ds) => {
      frameDataRef.current = ds.data
      frameMaxRef.current  = { alpha: ds.maxA, beta: ds.maxB, ssvep9: ds.maxS9, ssvep12: ds.maxS12 }
      setFrameData(ds.data)
      setFrameIndex(0)
      const f = ds.data[0]
      if (f) setVals({
        alpha:   f.alpha_power / ds.maxA,
        beta:    f.beta_power  / ds.maxB,
        ssvep9:  f.ssvep_9Hz   / ds.maxS9,
        ssvep12: f.ssvep_12Hz  / ds.maxS12,
      })
    }

    if (cache.current[num]) { apply(cache.current[num]); return }

    try {
      const raw  = await (await fetch(`/data${num}.json`)).json()
      const data = raw.slice(1)
      const maxOf = k => Math.max(...data.map(d => d[k])) || 1
      const ds = {
        data,
        maxA:  maxOf('alpha_power'),
        maxB:  maxOf('beta_power'),
        maxS9: maxOf('ssvep_9Hz'),
        maxS12:maxOf('ssvep_12Hz'),
      }
      cache.current[num] = ds
      apply(ds)
    } catch (e) {
      console.error('Eroare la încărcare:', e)
    }
  }, [])

  useEffect(() => {
    if (!playing) return
    const id = setInterval(() => {
      setFrameIndex(prev => {
        const total = frameDataRef.current.length
        if (!total) return prev
        const next = (prev + 1) % total
        const f    = frameDataRef.current[next]
        const max  = frameMaxRef.current
        if (f) setVals({
          alpha:   f.alpha_power / max.alpha,
          beta:    f.beta_power  / max.beta,
          ssvep9:  f.ssvep_9Hz   / max.ssvep9,
          ssvep12: f.ssvep_12Hz  / max.ssvep12,
        })
        return next
      })
    }, 1000 / speed)
    return () => clearInterval(id)
  }, [playing, speed])

  const togglePlay    = () => setPlaying(p => !p)
  const setSpeed      = (v) => setSpeedState(v)
  const seekTo        = (idx) => { setFrameIndex(idx); valsFromFrame(idx) }
  const setManualVals = (key, v) => {
    if (playing) return
    setVals(prev => ({ ...prev, [key]: v / 100 }))
  }

  useEffect(() => { loadDataset(1) }, [loadDataset])

  return {
    vals, frameIndex, frameData, playing, speed, currentDataset,
    loadDataset, togglePlay, setSpeed, seekTo, setManualVals,
  }
}