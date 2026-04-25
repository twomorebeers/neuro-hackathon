const STATES = [
  { key: 'alpha',   label: 'Relaxed / Alpha',     bg: '#3B82F615', border: '#3B82F6', color: '#60A5FA' },
  { key: 'beta',    label: 'Focused / Beta',       bg: '#F9731615', border: '#F97316', color: '#FB923C' },
  { key: 'ssvep9',  label: 'SSVEP 9 Hz active',   bg: '#22C55E15', border: '#22C55E', color: '#4ADE80' },
  { key: 'ssvep12', label: 'SSVEP 12 Hz active',  bg: '#EAB30815', border: '#EAB308', color: '#FDE047' },
]

function detectState(vals) {
  const max = Math.max(vals.alpha, vals.beta, vals.ssvep9, vals.ssvep12)
  if (max < 0.05) return { label: 'Inactive', bg: '#ffffff08', border: '#333', color: '#555' }
  return STATES.find(s => vals[s.key] === max) ?? STATES[0]
}

export default function StateBadge({ vals }) {
  const state = detectState(vals)
  return (
    <div className="state-row">
      <span className="state-label">Detected state:</span>
      <span
        className="state-badge"
        style={{ background: state.bg, borderColor: state.border, color: state.color }}
      >
        {state.label}
      </span>
    </div>
  )
}