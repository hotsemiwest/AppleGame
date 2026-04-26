import { useState } from 'react'
import { useMultiStore } from '../store/multiStore'

export function MultiLobby() {
  const { isHost, roomCode, myName, opponentName, startGame, leaveRoom } = useMultiStore()
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    if (!roomCode) return
    navigator.clipboard.writeText(roomCode).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)' }}
    >
      <div
        className="bg-gray-800 rounded-3xl p-6 w-full mx-4 shadow-2xl border border-gray-700"
        style={{ maxWidth: 380 }}
      >
        {/* 헤더 */}
        <div className="text-center mb-5">
          <div className="text-4xl mb-2">👥</div>
          <h2 className="text-xl font-black text-white">멀티 게임</h2>
          {myName && <p className="text-gray-400 text-sm mt-1">👤 {myName}</p>}
        </div>

        <div className="space-y-4">
          {isHost ? (
            <>
              {/* 방 코드 표시 */}
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <p className="text-gray-400 text-xs uppercase tracking-widest font-semibold mb-2">방 코드</p>
                <p className="text-4xl font-black text-white tracking-widest">{roomCode}</p>
                <button
                  onClick={handleCopy}
                  className="mt-2 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all active:scale-95"
                  style={{
                    background: copied ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.1)',
                    color: copied ? '#86efac' : '#9ca3af',
                  }}
                >
                  {copied ? '✓ 복사됨' : '코드 복사'}
                </button>
              </div>

              {/* 상대방 입장 상태 */}
              {opponentName ? (
                <div
                  className="rounded-2xl p-3 text-center"
                  style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}
                >
                  <p className="text-green-400 text-sm font-bold">👤 {opponentName} 님이 입장했습니다!</p>
                </div>
              ) : (
                <div className="text-center py-2">
                  <p className="text-gray-400 text-sm animate-pulse">상대방 입장 대기 중...</p>
                </div>
              )}

              <button
                onClick={startGame}
                disabled={!opponentName}
                className="w-full py-3.5 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                게임 시작
              </button>
            </>
          ) : (
            <>
              {/* 게스트 대기 화면 */}
              <div
                className="rounded-2xl p-4 text-center"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)' }}
              >
                <p className="text-green-400 text-sm font-bold mb-1">✅ 방에 참가했습니다!</p>
                {opponentName && <p className="text-gray-300 text-sm">상대: {opponentName}</p>}
              </div>
              <div className="text-center py-2">
                <p className="text-gray-400 text-sm animate-pulse">호스트가 게임을 시작할 때까지 대기 중...</p>
              </div>
            </>
          )}

          <button
            onClick={leaveRoom}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-400 hover:text-gray-300 transition-colors"
          >
            나가기
          </button>
        </div>
      </div>
    </div>
  )
}
