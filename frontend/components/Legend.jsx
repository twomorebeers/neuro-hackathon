const ITEMS = [
  { color: '#3B82F6', label: 'Alpha — Relaxation',  desc: 'Large slow blue blobs. Dominant when eyes are closed or meditating.' },
  { color: '#F97316', label: 'Beta — Focus',         desc: 'Orange blobs. Increase during concentration or stress.' },
  { color: '#22C55E', label: 'SSVEP 9 Hz',           desc: 'Green dots. Brain response to a 9Hz flickering visual stimulus.' },
  { color: '#EAB308', label: 'SSVEP 12 Hz',          desc: 'Yellow dots. Brain response to a 12Hz flickering visual stimulus.' },
]

export default function Legend() {
  return (
    <div className="legend">
      <p className="legend-title">How to read the visualization</p>
      <div className="legend-grid">
        {ITEMS.map(item => (
          <div key={item.label} className="legend-item">
            <div className="legend-dot" style={{ background: item.color, boxShadow: `0 0 8px ${item.color}` }} />
            <div>
              <div className="legend-label">{item.label}</div>
              <div className="legend-desc">{item.desc}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="legend-hint">
        Size and number of elements = signal intensity.<br />
        Colors overlap when multiple signals are active simultaneously.
      </p>
    </div>
  )
}