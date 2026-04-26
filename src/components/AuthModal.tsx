import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useAuthStore } from '../store/authStore'
import { checkDisplayNameTaken } from '../lib/supabase'

interface Props {
  onSuccess: () => void
  onClose: () => void
  onSignupDone?: () => void
  initialTab?: 'login' | 'signup'
  notice?: string
}

type Tab = 'login' | 'signup'

export function AuthModal({ onSuccess, onClose, onSignupDone, initialTab = 'login', notice }: Props) {
  const { signIn, signUp } = useAuthStore()
  const [tab, setTab] = useState<Tab>(initialTab)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [nameError, setNameError] = useState('')
  const [nameAvailable, setNameAvailable] = useState(false)
  const [nameChecking, setNameChecking] = useState(false)
  const [signedUp, setSignedUp] = useState(false)
  const [internalNotice, setInternalNotice] = useState('')

  const activeNotice = notice ?? internalNotice

  async function handleNameBlur() {
    const trimmed = displayName.trim()
    if (!trimmed) return
    setNameChecking(true)
    const taken = await checkDisplayNameTaken(trimmed)
    setNameChecking(false)
    setNameError(taken ? '이미 사용 중인 닉네임입니다' : '')
    setNameAvailable(!taken)
  }

  async function handleSubmit() {
    setError('')
    if (!email.trim() || !password.trim()) return
    if (tab === 'signup' && !displayName.trim()) return
    if (tab === 'signup' && nameError) return
    setLoading(true)
    try {
      if (tab === 'signup') {
        await signUp(email.trim(), password, displayName.trim().slice(0, 16))
        setSignedUp(true)
      } else {
        await signIn(email.trim(), password)
        onSuccess()
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : '오류가 발생했습니다'
      if (msg.includes('Invalid login')) setError('이메일 또는 비밀번호를 확인해 주세요')
      else if (msg.includes('already registered')) setError('이메일 또는 비밀번호를 확인해 주세요')
      else if (msg.includes('Password should')) setError('비밀번호는 6자 이상이어야 합니다')
      else setError('오류가 발생했습니다. 다시 시도해 주세요')
    } finally {
      setLoading(false)
    }
  }

  function handleGoToLogin() {
    setSignedUp(false)
    setTab('login')
    setInternalNotice('📧 인증 메일을 확인 후 로그인해 주세요.')
    setEmail('')
    setPassword('')
    onSignupDone?.()
  }

  function switchTab(t: Tab) {
    setTab(t)
    setError('')
    setNameError('')
    setNameAvailable(false)
    setInternalNotice('')
  }

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-3xl p-6 w-full mx-4 shadow-2xl border border-gray-700"
        style={{ maxWidth: 360 }}
        onClick={e => e.stopPropagation()}
      >
        {signedUp ? (
          /* 회원가입 완료 화면 */
          <div className="text-center py-2">
            <div className="text-5xl mb-4">✉️</div>
            <p className="text-white font-black text-xl mb-2">인증 메일을 발송했습니다!</p>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              메일함에서 인증 링크를 클릭한 후<br />로그인해 주세요.
            </p>
            <button
              onClick={handleGoToLogin}
              className="w-full py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95"
            >
              로그인하러 가기
            </button>
          </div>
        ) : (
          <>
            {/* 탭 */}
            <div className="flex rounded-xl overflow-hidden mb-5" style={{ background: '#1f2937' }}>
              {(['login', 'signup'] as Tab[]).map(t => (
                <button
                  key={t}
                  onClick={() => switchTab(t)}
                  className={`flex-1 py-2.5 text-sm font-black transition-all ${
                    tab === t
                      ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white'
                      : 'text-gray-400'
                  }`}
                >
                  {t === 'login' ? '로그인' : '회원가입'}
                </button>
              ))}
            </div>

            {/* 안내 배너 */}
            {activeNotice && tab === 'login' && (
              <div
                className="rounded-xl px-4 py-2.5 mb-4 text-xs font-semibold text-green-300 text-center"
                style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                {activeNotice}
              </div>
            )}

            <div className="space-y-3">
              {tab === 'signup' && (
                <div>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => { setDisplayName(e.target.value.slice(0, 16)); setNameError(''); setNameAvailable(false) }}
                    onBlur={handleNameBlur}
                    placeholder="닉네임 (최대 16자)"
                    className={`w-full bg-gray-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none border transition-colors ${nameError ? 'border-red-500' : 'border-gray-600 focus:border-green-500'}`}
                    autoFocus
                  />
                  {nameChecking && <p className="text-gray-400 text-xs mt-1 pl-1">확인 중...</p>}
                  {!nameChecking && nameError && <p className="text-red-400 text-xs mt-1 pl-1">{nameError}</p>}
                  {!nameChecking && nameAvailable && <p className="text-green-400 text-xs mt-1 pl-1">사용할 수 있는 닉네임입니다</p>}
                </div>
              )}
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="이메일"
                className="w-full bg-gray-700 text-white rounded-xl px-4 py-2.5 text-sm outline-none border border-gray-600 focus:border-green-500 transition-colors"
                autoFocus={tab === 'login'}
              />
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="비밀번호 (6자 이상)"
                  className="w-full bg-gray-700 text-white rounded-xl px-4 py-2.5 pr-12 text-sm outline-none border border-gray-600 focus:border-green-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors text-xs font-semibold"
                >
                  {showPassword ? '숨기기' : '보기'}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-xs mt-3 text-center">{error}</p>
            )}

            <div className="flex gap-2 mt-4">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all active:scale-95"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? '처리 중...' : tab === 'login' ? '로그인' : '가입하기'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  )
}
