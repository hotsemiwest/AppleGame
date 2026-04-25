import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { fetchProfile, fetchPublicProfile, ProfileData } from '../lib/supabase'

interface Props {
  onClose: () => void
  /** 다른 유저의 프로필을 볼 때 전달 */
  targetUserId?: string
  targetDisplayName?: string
}

const RANK_MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function rankLabel(rank: number) {
  if (rank <= 3) return RANK_MEDALS[rank]
  if (rank <= 10) return `#${rank}위`
  return `#${rank}위`
}

function rankColor(rank: number) {
  if (rank === 1) return '#FFD700'
  if (rank === 2) return '#C0C0C0'
  if (rank === 3) return '#CD7F32'
  if (rank <= 10) return '#22c55e'
  return '#6b7280'
}

// ─── SVG 꺾은 선 그래프 ───────────────────────────────────────────
function ScoreChart({ history }: { history: { score: number; played_at: string }[] }) {
  if (history.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-6">
        플레이 기록이 없습니다
      </div>
    )
  }

  const W = 300, H = 110
  const PL = 30, PR = 10, PT = 8, PB = 20
  const chartW = W - PL - PR
  const chartH = H - PT - PB

  const scores = history.map(d => d.score)
  const n = scores.length
  const maxS = Math.max(...scores, 1)
  const minS = Math.min(...scores, 0)
  const range = maxS - minS || 1

  const cx = (i: number) => PL + (n === 1 ? chartW / 2 : (i / (n - 1)) * chartW)
  const cy = (s: number) => PT + chartH - ((s - minS) / range) * chartH

  const pathD = scores
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${cx(i).toFixed(1)} ${cy(s).toFixed(1)}`)
    .join(' ')

  const bestScore = Math.max(...scores)
  const bestIdx = scores.lastIndexOf(bestScore)

  const yTicks = Array.from(new Set([minS, Math.round((minS + maxS) / 2), maxS]))

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
      {/* 가로 그리드 */}
      {yTicks.map(s => (
        <line key={s} x1={PL} x2={W - PR} y1={cy(s)} y2={cy(s)}
          stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}

      {/* Y 축 레이블 */}
      {yTicks.map(s => (
        <text key={s} x={PL - 4} y={cy(s)} textAnchor="end" dominantBaseline="middle"
          fill="rgba(255,255,255,0.3)" fontSize={9}>
          {s}
        </text>
      ))}

      {/* X 축 레이블 */}
      <text x={cx(0)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>1</text>
      {n > 1 && (
        <text x={cx(n - 1)} y={H - 4} textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize={9}>{n}</text>
      )}

      {/* 라인 */}
      {n > 1 && (
        <path d={pathD} fill="none" stroke="#22c55e" strokeWidth={2}
          strokeLinejoin="round" strokeLinecap="round" />
      )}

      {/* 점 */}
      {scores.map((s, i) => (
        <circle key={i} cx={cx(i)} cy={cy(s)}
          r={i === bestIdx ? 5 : 3}
          fill={i === bestIdx ? '#FFD700' : '#22c55e'}
          stroke={i === bestIdx ? 'rgba(255,255,255,0.8)' : 'none'}
          strokeWidth={i === bestIdx ? 1.5 : 0}
        />
      ))}
    </svg>
  )
}

// ─── 프로필 모달 ─────────────────────────────────────────────────
export function ProfileModal({ onClose, targetUserId, targetDisplayName }: Props) {
  const { user, displayName } = useAuthStore()
  const [data, setData] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const isOwnProfile = !targetUserId
  const shownName = isOwnProfile ? displayName : targetDisplayName

  useEffect(() => {
    const fetch = isOwnProfile
      ? fetchProfile()
      : fetchPublicProfile(targetUserId!)
    fetch
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [isOwnProfile, targetUserId])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-[60]"
      style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-3xl p-6 w-full mx-4 shadow-2xl border border-gray-700 flex flex-col gap-4"
        style={{ maxWidth: 380, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 계정 정보 */}
        <div className="text-center">
          <div className="text-4xl mb-2">👤</div>
          <div className="text-xl font-black text-white">{shownName}</div>
          {isOwnProfile && (
            <div className="text-xs text-gray-400 mt-0.5">{user?.email}</div>
          )}
        </div>

        {loading && (
          <div className="text-center text-gray-400 text-sm py-4">불러오는 중...</div>
        )}

        {error && (
          <div className="text-center text-red-400 text-sm py-4">데이터를 불러올 수 없습니다</div>
        )}

        {data && !loading && (
          <>
            {/* 랭킹 */}
            {data.rank !== null ? (
              <div className="text-center py-2">
                <div
                  className="text-5xl font-black"
                  style={{ color: rankColor(data.rank) }}
                >
                  {data.rank <= 3 ? RANK_MEDALS[data.rank] : null}
                  {data.rank > 3 ? rankLabel(data.rank) : null}
                </div>
                {data.rank <= 3 && (
                  <div className="text-lg font-black mt-1" style={{ color: rankColor(data.rank) }}>
                    #{data.rank}위
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">글로벌 랭킹</div>
              </div>
            ) : (
              <div className="text-center text-gray-500 text-sm py-2">아직 랭킹이 없습니다</div>
            )}

            {/* 스탯 */}
            <div className="flex gap-3">
              <div className="flex-1 bg-gray-700 rounded-2xl py-4 text-center">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">최고 점수</div>
                <div className="text-3xl font-black text-white">
                  {data.bestScore ?? '-'}
                </div>
              </div>
              <div className="flex-1 bg-gray-700 rounded-2xl py-4 text-center">
                <div className="text-xs text-gray-400 uppercase tracking-widest mb-1">플레이 횟수</div>
                <div className="text-3xl font-black text-white">
                  {data.playCount}
                  <span className="text-base font-semibold text-gray-400 ml-1">회</span>
                </div>
              </div>
            </div>

            {/* 점수 히스토리 */}
            <div>
              <div className="text-xs text-gray-400 uppercase tracking-widest font-semibold mb-3">
                점수 히스토리
              </div>
              <div
                className="rounded-2xl p-3"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <ScoreChart history={data.history} />
              </div>
              {data.history.length > 0 && (
                <div className="text-xs text-gray-600 text-right mt-1.5">
                  ★ 최고점 &nbsp;• 최근 {data.history.length}게임
                </div>
              )}
            </div>
          </>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 rounded-2xl text-sm font-bold text-gray-300 bg-gray-700 hover:bg-gray-600 transition-all active:scale-95 mt-auto"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
