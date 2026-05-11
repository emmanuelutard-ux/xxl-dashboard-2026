import { ChannelLogo } from './ChannelLogo'
import { PacingBar, type PacingStatus } from './PacingBar'

type Props = {
  channel:    'google' | 'meta'
  timePct?:   number
  budgetPct?: number
  status?:    PacingStatus
  notActive?: boolean
}

export function ChannelPacingRow({
  channel,
  timePct   = 0,
  budgetPct = 0,
  status    = 'on-track',
  notActive = false,
}: Props) {
  if (notActive) {
    return (
      <div className="flex items-center gap-2 font-mono text-[11px] text-sand-400">
        <ChannelLogo channel={channel} size={14} />
        <span className="italic">
          {channel === 'google' ? 'Google Ads · non activé' : 'Meta Ads · non activé'}
        </span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2.5">
      <ChannelLogo channel={channel} size={14} />
      <div className="flex-1 min-w-0">
        <PacingBar timePct={timePct} budgetPct={budgetPct} status={status} />
      </div>
    </div>
  )
}

export default ChannelPacingRow
