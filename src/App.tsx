import { useEffect } from 'react'
import { useGameStore } from './store/gameStore'
import { useAuthStore } from './store/authStore'
import { useMultiStore } from './store/multiStore'
import { Header } from './components/Header'
import { GameBoard } from './components/GameBoard'
import { GameOverModal } from './components/GameOverModal'
import { StartBoard } from './components/StartBoard'
import { MultiLobby } from './components/MultiLobby'
import { MultiGame } from './components/MultiGame'
import { MultiGameOver } from './components/MultiGameOver'
import { MultiCountdown } from './components/MultiCountdown'

const BOARD_WIDTH = 916

export default function App() {
  const { gamePhase, tick } = useGameStore()
  const { initialize, pendingAuth, setPendingAuth } = useAuthStore()
  const multiPhase = useMultiStore(s => s.phase)

  useEffect(() => { initialize() }, [initialize])

  useEffect(() => {
    if (!pendingAuth || pendingAuth.openLogin) return
    const id = setTimeout(() => setPendingAuth(null), 5000)
    return () => clearTimeout(id)
  }, [pendingAuth, setPendingAuth])

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
      {pendingAuth && !pendingAuth.openLogin && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-2xl text-sm font-semibold text-white shadow-xl"
          style={{
            background: 'linear-gradient(135deg,#166534,#065f46)',
            border: '1px solid rgba(255,255,255,0.15)',
            whiteSpace: 'nowrap',
          }}
        >
          {pendingAuth.notice}
        </div>
      )}

      <div className="board-scaler" style={{ width: BOARD_WIDTH }}>
        {multiPhase === 'playing' ? (
          <MultiGame />
        ) : (
          <>
            <Header />
            {gamePhase === 'start' ? <StartBoard /> : <GameBoard />}
          </>
        )}
      </div>

      {gamePhase === 'ended' && multiPhase === 'off' && <GameOverModal />}

      {multiPhase === 'waiting' && <MultiLobby />}
      {multiPhase === 'countdown' && <MultiCountdown />}
      {multiPhase === 'ended' && <MultiGameOver />}
    </div>
  )
}
