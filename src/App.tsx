import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { GameOverModal } from './components/GameOverModal'
import { StartBoard } from './components/StartBoard'

const BOARD_WIDTH = 916

export default function App() {
  const { gamePhase, tick } = useGameStore()
  const initialize = useAuthStore(state => state.initialize)

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    if (gamePhase !== 'playing') return
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [gamePhase, tick])

  return (
    <div
      className="min-h-screen bg-gray-900 flex flex-col items-center justify-center py-6 overflow-x-hidden"
      style={{ userSelect: 'none' }}
    >
      <div className="board-scaler" style={{ width: BOARD_WIDTH }}>
        <Header />
        {gamePhase === 'start' ? <StartBoard /> : <GameBoard />}
      </div>

      {gamePhase === 'ended' && <GameOverModal />}
    </div>
  )
}
