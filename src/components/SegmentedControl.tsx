import { C } from '../theme/tokens'

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  const idx = options.findIndex(o => o.value === value)
  const n = options.length

  return (
    <div
      className="relative flex"
      style={{ background: C.surfaceRaised, borderRadius: 12, padding: 4 }}
    >
      <div
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          borderRadius: 8,
          background: C.surface,
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)',
          left: `calc(${idx} * (100% - 8px) / ${n} + 4px)`,
          width: `calc((100% - 8px) / ${n})`,
          transition: 'left 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
          pointerEvents: 'none',
        }}
      />
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className="relative flex-1 py-2 text-sm font-bold z-10"
          style={{
            color: opt.value === value ? C.textPrimary : C.textMuted,
            transition: 'color 0.18s ease',
            borderRadius: 8,
            background: 'transparent',
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
