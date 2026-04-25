import Controls       from '../components/Controls'
import SliderCard     from '../components/SliderCard'
import StateBadge     from '../components/StateBadge'
import ParticleCanvas from '../components/ParticlesCanvas'
import Timeline       from '../components/Timeline'
import Legend         from '../components/Legend'
import { useEEGData } from '../hooks/useEEGData'

const SLIDERS = [
  { label: 'Alpha (8–13 Hz)', channel: 'alpha'   },
  { label: 'Beta (13–30 Hz)', channel: 'beta'    },
  { label: 'SSVEP 9 Hz',      channel: 'ssvep9'  },
  { label: 'SSVEP 12 Hz',     channel: 'ssvep12' },
]

export default function App() {
  const {
    vals, frameIndex, frameData, playing, speed, currentDataset,
    loadDataset, togglePlay, setSpeed, seekTo, setManualVals,
  } = useEEGData()

  return (
    <div className="container">
      <Controls
        currentDataset={currentDataset}
        playing={playing}
        speed={speed}
        onLoad={loadDataset}
        onToggle={togglePlay}
        onSpeed={setSpeed}
      />

      <div className="sliders-grid">
        {SLIDERS.map(({ label, channel }) => (
          <SliderCard
            key={channel}
            label={label}
            channel={channel}
            value={Math.round(vals[channel] * 100)}
            disabled={playing}
            onChange={v => setManualVals(channel, v)}
          />
        ))}
      </div>

      <StateBadge vals={vals} />
      <ParticleCanvas vals={vals} />
      <Timeline frameIndex={frameIndex} frameData={frameData} onSeek={seekTo} />
      <Legend />
    </div>
  )
}