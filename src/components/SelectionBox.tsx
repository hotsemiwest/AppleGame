import { forwardRef, useRef, useImperativeHandle } from 'react'
import { NormalizedRect } from '../types/game'
import { C } from '../theme/tokens'

const TILE_SIZE = 52
const GAP = 2
const CELL = TILE_SIZE + GAP

export interface SelectionBoxHandle {
  show: (rect: NormalizedRect, sum: number) => void
  hide: () => void
}

interface Props {
  showSum?: boolean
  showRangeColor?: boolean
}

export const SelectionBox = forwardRef<SelectionBoxHandle, Props>(function SelectionBox({
  showSum = true,
  showRangeColor = true,
}, ref) {
  const boxRef = useRef<HTMLDivElement>(null)
  const sumRef = useRef<HTMLSpanElement>(null)

  useImperativeHandle(ref, () => ({
    show(rect, sum) {
      const el = boxRef.current
      if (!el) return

      const isExact = sum === 10
      const isOver = sum > 10
      const borderColor = showRangeColor
        ? (isExact ? C.green : isOver ? C.red : C.blue)
        : C.blue
      const bgColor = showRangeColor
        ? (isExact ? C.exactBg : isOver ? C.overBg : C.neutralBg)
        : C.neutralBg

      const x = rect.minCol * CELL
      const y = rect.minRow * CELL
      const w = (rect.maxCol - rect.minCol + 1) * CELL - GAP
      const h = (rect.maxRow - rect.minRow + 1) * CELL - GAP

      el.style.display = 'block'
      el.style.transform = `translate(${x}px, ${y}px)`
      el.style.width = `${w}px`
      el.style.height = `${h}px`
      el.style.borderColor = borderColor
      el.style.background = bgColor

      if (sumRef.current) {
        sumRef.current.textContent = showSum && sum > 0 ? String(sum) : ''
        sumRef.current.style.background = borderColor
        sumRef.current.style.display = showSum && sum > 0 ? 'block' : 'none'
      }
    },

    hide() {
      if (boxRef.current) boxRef.current.style.display = 'none'
    },
  }), [showRangeColor, showSum])

  return (
    <div
      ref={boxRef}
      style={{
        display: 'none',
        position: 'absolute',
        left: 0,
        top: 0,
        borderRadius: 12,
        border: '2.5px solid transparent',
        zIndex: 10,
        boxSizing: 'border-box',
        pointerEvents: 'none',
        willChange: 'transform',
      }}
    >
      <span
        ref={sumRef}
        style={{
          display: 'none',
          position: 'absolute',
          top: -24,
          left: '50%',
          transform: 'translateX(-50%)',
          borderRadius: 9999,
          padding: '2px 8px',
          fontSize: 12,
          fontWeight: 700,
          color: 'white',
          whiteSpace: 'nowrap',
        }}
      />
    </div>
  )
})
