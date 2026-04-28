import { useState } from 'react'
import { C } from '../theme/tokens'
import { SettingsModal } from './SettingsModal'

export function SettingsButton() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95"
        style={{ background: C.surfaceRaised, color: C.textSub, border: `1px solid ${C.borderGhost}` }}
      >
        ⚙️ 설정
      </button>
      {open && <SettingsModal onClose={() => setOpen(false)} />}
    </>
  )
}
