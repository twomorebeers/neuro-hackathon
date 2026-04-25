export default function Controls({ currentDataset, playing, speed, onLoad, onToggle, onSpeed }) {
  return (
    <div className="controls">
      <span className="controls-label">Dataset:</span>
      {[1, 2, 3, 4].map(n => (
        <button
          key={n}
          className={`ds-btn${currentDataset === n ? ' active' : ''}`}
          onClick={() => onLoad(n)}
        >
          {n}
        </button>
      ))}

      <div className="sep" />

      <button className="play-btn" onClick={onToggle}>
        {playing ? '⏸ Pause' : '▶ Play'}
      </button>

      <span className="controls-label">Speed:</span>
      <select className="speed-select" value={speed} onChange={e => onSpeed(+e.target.value)}>
        <option value={1}>1×</option>
        <option value={2}>2×</option>
        <option value={5}>5×</option>
        <option value={10}>10×</option>
      </select>
    </div>
  )
}