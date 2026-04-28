import { useEffect, useState } from 'react'
import { fetchTopScores, fetchTopTimeAttackScores, ScoreEntry, TimeAttackEntry } from '../lib/supabase'
import { C } from '../theme/tokens'
import { formatTime } from '../utils/gameLogic'

const MEDALS = ['🥇', '🥈', '🥉']

type LeaderboardUser = { user_id: string; display_name: string }

interface Props {
  mode?: 'score' | 'time'
  highlightName?: string
  highlightScore?: number
  highlightTime?: number  // seconds
  onUserClick?: (entry: LeaderboardUser) => void
}

export function Leaderboard({ mode = 'score', highlightName, highlightScore, highlightTime, onUserClick }: Props) {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [timeScores, setTimeScores] = useState<TimeAttackEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(false)
    const fetch = mode === 'time' ? fetchTopTimeAttackScores() : fetchTopScores()
    fetch
      .then(data => {
        if (mode === 'time') setTimeScores(data as TimeAttackEntry[])
        else setScores(data as ScoreEntry[])
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [mode])

  if (loading) return <div className="text-center text-gray-400 py-6 text-sm">불러오는 중...</div>
  if (error) return <div className="text-center text-red-400 py-6 text-sm">랭킹을 불러올 수 없습니다</div>

  if (mode === 'time') {
    if (timeScores.length === 0) return <div className="text-center text-gray-400 py-6 text-sm">아직 등록된 기록이 없습니다</div>
    return (
      <div className="space-y-1.5">
        {timeScores.map((entry, i) => {
          const isMe = highlightName !== undefined && highlightTime !== undefined &&
            entry.display_name === highlightName && entry.best_time_seconds === highlightTime
          return (
            <div
              key={i}
              className={`flex items-center rounded-xl px-3 py-2 text-sm gap-2 ${isMe ? 'bg-yellow-500/20 border border-yellow-400/40' : ''}`}
              style={isMe ? {} : { background: C.surfaceRaised }}
            >
              <span className="w-7 text-center flex-shrink-0 text-base">
                {MEDALS[i] ?? <span className="text-gray-400 font-bold">{i + 1}</span>}
              </span>
              {onUserClick ? (
                <button onClick={() => onUserClick(entry)} className="flex-1 font-semibold truncate text-left hover:underline" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
                  {entry.display_name}
                </button>
              ) : (
                <span className="flex-1 font-semibold truncate" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
                  {entry.display_name}
                </span>
              )}
              <span className="font-bold tabular-nums" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
                {formatTime(entry.best_time_seconds)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  if (scores.length === 0) return <div className="text-center text-gray-400 py-6 text-sm">아직 등록된 기록이 없습니다</div>
  return (
    <div className="space-y-1.5">
      {scores.map((entry, i) => {
        const isMe = highlightName !== undefined && highlightScore !== undefined &&
          entry.display_name === highlightName && entry.score === highlightScore
        return (
          <div
            key={i}
            className={`flex items-center rounded-xl px-3 py-2 text-sm gap-2 ${isMe ? 'bg-yellow-500/20 border border-yellow-400/40' : ''}`}
            style={isMe ? {} : { background: C.surfaceRaised }}
          >
            <span className="w-7 text-center flex-shrink-0 text-base">
              {MEDALS[i] ?? <span className="text-gray-400 font-bold">{i + 1}</span>}
            </span>
            {onUserClick ? (
              <button onClick={() => onUserClick(entry)} className="flex-1 font-semibold truncate text-left hover:underline" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
                {entry.display_name}
              </button>
            ) : (
              <span className="flex-1 font-semibold truncate" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
                {entry.display_name}
              </span>
            )}
            <span className="font-bold tabular-nums" style={{ color: isMe ? C.accentYellow : C.textPrimary }}>
              {entry.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
