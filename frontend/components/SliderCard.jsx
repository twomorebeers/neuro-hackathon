export default function SliderCard({ label, channel, value, disabled, onChange }) {
  return (
    <div className="slider-card">
      <div className="slider-header">
        <div className="slider-label">
          <span className={`dot dot-${channel}`} />
          {label}
        </div>
        <div className="slider-value">{value}</div>
      </div>
      <input
        type="range"
        className={`slider-${channel}`}
        min={0}
        max={100}
        value={value}
        disabled={disabled}
        onChange={e => onChange(+e.target.value)}
      />
    </div>
  )
}