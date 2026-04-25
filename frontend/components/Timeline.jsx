export default function Timeline({ frameIndex, frameData, onSeek }) {
  const total = frameData.length
  const pct   = total > 1 ? (frameIndex / (total - 1)) * 100 : 0

  function handleClick(e) {
    if (!total) return
    const rect = e.currentTarget.getBoundingClientRect()
    const p    = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(Math.round(p * (total - 1)))
  }

  const current = frameData[frameIndex]?.timestamp_sec ?? 0
  const last    = frameData[total - 1]?.timestamp_sec ?? 0

  return (
    <div className="timeline">
      <div className="timeline-track" onClick={handleClick}>
        <div className="timeline-fill" style={{ width: `${pct}%` }} />
        <div className="timeline-thumb" style={{ left: `${pct}%` }} />
      </div>
      <div className="timeline-labels">
        <span>{Math.round(current)}s</span>
        <span>{Math.round(last)}s</span>
      </div>
    </div>
  )
}