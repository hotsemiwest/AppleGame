import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(url, key)

export interface ScoreEntry {
  user_id: string
  display_name: string
  score: number
}

export async function fetchTopScores(): Promise<ScoreEntry[]> {
  const { data, error } = await supabase
    .from('scores')
    .select('user_id, display_name, score')
    .order('score', { ascending: false })
    .limit(10)
  if (error) throw error
  return data ?? []
}

export async function submitScore(displayName: string, score: number): Promise<void> {
  const { error } = await supabase.rpc('submit_score', {
    p_display_name: displayName,
    p_score: score,
  })
  if (error) throw error
}

export interface ProfileData {
  bestScore: number | null
  rank: number | null
  playCount: number
  history: { score: number; played_at: string }[]
}

async function fetchProfileByUserId(userId: string): Promise<ProfileData> {
  const [scoreRes, historyRes, countRes] = await Promise.all([
    supabase.from('scores').select('score').eq('user_id', userId).maybeSingle(),
    supabase.from('score_history').select('score, played_at').eq('user_id', userId).order('played_at', { ascending: true }).limit(30),
    supabase.from('score_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const bestScore = scoreRes.data?.score ?? null

  let rank: number | null = null
  if (bestScore !== null) {
    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .gt('score', bestScore)
    rank = (count ?? 0) + 1
  }

  return {
    bestScore,
    rank,
    playCount: countRes.count ?? 0,
    history: historyRes.data ?? [],
  }
}

export async function fetchProfile(): Promise<ProfileData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')
  return fetchProfileByUserId(user.id)
}

export async function fetchPublicProfile(userId: string): Promise<ProfileData> {
  return fetchProfileByUserId(userId)
}
