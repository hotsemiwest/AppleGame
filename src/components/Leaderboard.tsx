import { useEffect, useState } from 'react'
import { fetchTopScores, ScoreEntry } from '../lib/supabase'

const MEDALS = ['🥇', '🥈', '🥉']

interface Props {
  highlightName?: string
  highlightScore?: number
  onUserClick?: (entry: ScoreEntry) => void
}

export function Leaderboard({ highlightName, highlightScore, onUserClick }: Props) {
  const [scores, setScores] = useState<ScoreEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    fetchTopScores()
      .then(setScores)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="text-center text-gray-400 py-6 text-sm">불러오는 중...</div>
    )
  }

  if (error) {
    return (
      <div className="text-center text-red-400 py-6 text-sm">랭킹을 불러올 수 없습니다</div>
    )
  }

  if (scores.length === 0) {
    return (
      <div className="text-center text-gray-400 py-6 text-sm">아직 등록된 기록이 없습니다</div>
    )
  }

  return (
    <div className="space-y-1.5">
      {scores.map((entry, i) => {
        const isMe =
          highlightName !== undefined &&
          highlightScore !== undefined &&
          entry.display_name === highlightName &&
          entry.score === highlightScore
        return (
          <div
            key={i}
            className={`flex items-center rounded-xl px-3 py-2 text-sm gap-2 ${
              isMe
                ? 'bg-yellow-500/20 border border-yellow-400/40'
                : 'bg-gray-700/60'
            }`}
          >
            <span className="w-7 text-center flex-shrink-0 text-base">
              {MEDALS[i] ?? <span className="text-gray-400 font-bold">{i + 1}</span>}
            </span>
            {onUserClick ? (
              <button
                onClick={() => onUserClick(entry)}
                className={`flex-1 font-semibold truncate text-left hover:underline ${
                  isMe ? 'text-yellow-300' : 'text-white'
                }`}
              >
                {entry.display_name}
              </button>
            ) : (
              <span
                className={`flex-1 font-semibold truncate ${
                  isMe ? 'text-yellow-300' : 'text-white'
                }`}
              >
                {entry.display_name}
              </span>
            )}
            <span
              className={`font-black tabular-nums ${
                isMe ? 'text-yellow-300' : 'text-white'
              }`}
            >
              {entry.score}
            </span>
          </div>
        )
      })}
    </div>
  )
}
