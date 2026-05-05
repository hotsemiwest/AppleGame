import { C } from '../theme/tokens'

const ARROW_SVG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2 4l4 4 4-4' stroke='%23999' stroke-width='1.5' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`

export function StyledSelect<T extends string>({
  label,
  value,
  onChange,
  options,
  disabled = false,
  dimmed = false,
}: {
  label: string
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  disabled?: boolean
  dimmed?: boolean
}) {
  return (
    <div style={{ opacity: dimmed ? 0.5 : 1, transition: 'opacity 0.2s' }}>
      <div
        className="text-xs font-bold uppercase tracking-widest mb-1.5"
        style={{ color: C.textSub }}
      >
        {label}
      </div>
      <select
        value={value}
        onChange={e => onChange(e.target.value as T)}
        disabled={disabled}
        className="w-full text-xs font-semibold"
        style={{
          height: 40,
          background: C.surfaceRaised,
          border: `1px solid ${C.borderFaint}`,
          color: dimmed ? C.textSub : C.textPrimary,
          outline: 'none',
          borderRadius: 8,
          appearance: 'none',
          WebkitAppearance: 'none',
          paddingLeft: 12,
          paddingRight: 32,
          backgroundImage: ARROW_SVG,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 10px center',
        }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
