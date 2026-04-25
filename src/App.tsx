import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { StartScreen } from './components/StartScreen'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { GameOverModal } from './components/GameOverModal'

// Must match GameBoard constants: COLS * (TILE_SIZE + GAP) - GAP
const BOARD_WIDTH = 916

export default function App() {
  const { gamePhase, tick } = useGameStore()

  useEffect(() => {
    if (gamePhase !== 'playing') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [gamePhase, tick])

  if (gamePhase === 'start') {
    return <StartScreen />
  }

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-6 overflow-x-hidden"
      style={{ userSelect: 'none' }}
    >
      <div className="board-scaler" style={{ width: BOARD_WIDTH }}>
        <Header />
        <GameBoard />
      </div>

      {gamePhase === 'ended' && <GameOverModal />}
    </div>
  )
}
