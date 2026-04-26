import { useState, useEffect } from 'react'
import { useGameStore } from '../store/gameStore'
import { useAuthStore } from '../store/authStore'
import { useMultiStore } from '../store/multiStore'
import { AuthModal } from './AuthModal'

const BOARD_HEIGHT = 538

type MultiAfterLogin = 'create' | 'join' | null

export function StartBoard() {
  const { personalBest, startGame } = useGameStore()
  const { user, pendingAuth, setPendingAuth } = useAuthStore()
  const { createRoom, joinRoom, error: multiError, clearError } = useMultiStore()

  const [showAuth, setShowAuth] = useState(false)
  const [authNotice, setAuthNotice] = useState<string | undefined>()
  const [multiAfterLogin, setMultiAfterLogin] = useState<MultiAfterLogin>(null)
  const [codeInput, setCodeInput] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  useEffect(() => {
    if (pendingAuth?.openLogin) {
      setAuthNotice(pendingAuth.notice)
      setShowAuth(true)
      setPendingAuth(null)
    }
  }, [pendingAuth, setPendingAuth])

  function closeAuth() {
    setShowAuth(false)
    setAuthNotice(undefined)
    setMultiAfterLogin(null)
  }

  async function handleAuthSuccess() {
    setShowAuth(false)
    setAuthNotice(undefined)
    const pending = multiAfterLogin
    setMultiAfterLogin(null)
    if (pending === 'create') await doCreate()
    else if (pending === 'join') await doJoin()
  }

  function requireLogin(after: MultiAfterLogin) {
    setMultiAfterLogin(after)
    setAuthNotice('멀티게임은 로그인이 필요합니다')
    setShowAuth(true)
  }

  async function doCreate() {
    setCreating(true)
    await createRoom()
    setCreating(false)
  }

  async function doJoin() {
    const code = codeInput.trim()
    if (code.length !== 6) return
    setJoining(true)
    await joinRoom(code)
    setJoining(false)
  }

  function handleCreate() {
    clearError()
    if (!user) { requireLogin('create'); return }
    doCreate()
  }

  function handleJoin() {
    clearError()
    if (!user) { requireLogin('join'); return }
    doJoin()
  }

  return (
    <>
      <div
        className="flex flex-col items-center justify-between w-full py-10 px-8"
        style={{
          height: BOARD_HEIGHT,
          background: 'rgba(255,255,255,0.02)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        {/* 상단: 타이틀 + 설명 */}
        <div className="text-center w-full max-w-lg">
          <div className="text-5xl mb-5">🍎</div>
          <h2 className="text-3xl font-black text-white mb-1">AppleBox</h2>
          <p className="text-gray-400 mb-7">드래그로 합이 10이 되는 숫자들을 선택하세요</p>

          {personalBest > 0 && (
            <p className="text-yellow-400 font-semibold mt-5">
              개인 최고기록: {personalBest}점
            </p>
          )}
        </div>

        {/* 하단: 버튼 영역 */}
        <div className="flex flex-col gap-3 w-full max-w-lg">
          {/* 혼자 하기 */}
          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl text-xl font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 shadow-lg shadow-green-500/20"
          >
            혼자 하기
          </button>

          {/* 구분선 */}
          <div className="flex items-center gap-3 my-1">
            <div className="flex-1 border-t border-gray-700" />
            <span className="text-gray-500 text-sm whitespace-nowrap">또는 다른 사람과 함께</span>
            <div className="flex-1 border-t border-gray-700" />
          </div>

          {/* 방 만들기 */}
          <button
            onClick={handleCreate}
            disabled={creating}
            className="w-full py-4 rounded-2xl text-xl font-black text-white transition-all active:scale-95 disabled:opacity-60 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)', boxShadow: '0 4px 20px rgba(99,102,241,0.25)' }}
          >
            {creating ? '생성 중...' : '방 만들기'}
          </button>

          {/* 초대코드 입력 + 참여 */}
          <div className="flex gap-2">
            <input
              type="text"
              value={codeInput}
              onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '').slice(0, 6)); clearError() }}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="초대코드 입력"
              className="flex-1 bg-gray-700 text-white rounded-2xl px-4 py-4 text-base outline-none border border-gray-600 focus:border-blue-500 transition-colors text-center tracking-widest font-bold"
              maxLength={6}
            />
            <button
              onClick={handleJoin}
              disabled={joining || codeInput.trim().length !== 6}
              className="px-6 py-4 rounded-2xl text-base font-black text-white transition-all active:scale-95 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}
            >
              {joining ? '...' : '참여'}
            </button>
          </div>

          {multiError && (
            <p className="text-red-400 text-xs text-center">{multiError}</p>
          )}
        </div>
      </div>

      {showAuth && (
        <AuthModal
          notice={authNotice}
          initialTab="login"
          onSuccess={handleAuthSuccess}
          onClose={closeAuth}
        />
      )}
    </>
  )
}
