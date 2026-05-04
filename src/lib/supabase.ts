import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const supabase = createClient(url, key)

export interface UserSettings {
  theme?: string
  tileShape?: string
  tileColorId?: string
  showHintCount?: boolean
  showDifficulty?: boolean
  soloBoardDifficulty?: number
  showDragSelectionSum?: boolean
  showDragSelectionRangeColor?: boolean
  devMode?: boolean
}

export async function fetchUserSettings(): Promise<UserSettings | null> {
  const { data } = await supabase
    .from('user_settings')
    .select('settings')
    .maybeSingle()
  return (data?.settings as UserSettings) ?? null
}

export async function upsertUserSettings(settings: UserSettings): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  await supabase.from('user_settings').upsert({
    user_id: user.id,
    settings,
    updated_at: new Date().toISOString(),
  })
}

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

export async function checkDisplayNameTaken(name: string, excludeUserId?: string): Promise<boolean> {
  let query = supabase
    .from('scores')
    .select('user_id', { count: 'exact', head: true })
    .ilike('display_name', name)
  if (excludeUserId) {
    query = query.neq('user_id', excludeUserId)
  }
  const { count } = await query
  return (count ?? 0) > 0
}

export async function updateDisplayName(newName: string): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.updateUser({
    data: { display_name: newName },
  })
  if (authError) throw authError
  if (user) {
    await supabase.from('scores').update({ display_name: newName }).eq('user_id', user.id)
  }
}

export async function submitScore(displayName: string, score: number): Promise<void> {
  if (score < 1 || score > 170) return
  const { error } = await supabase.rpc('submit_score', {
    p_display_name: displayName,
    p_score: score,
  })
  if (error && error.message !== 'rate_limit_exceeded') throw error
}

export interface TimeAttackEntry {
  user_id: string
  display_name: string
  best_time_seconds: number
}

export async function fetchTopTimeAttackScores(): Promise<TimeAttackEntry[]> {
  const { data, error } = await supabase
    .from('time_attack_scores')
    .select('user_id, display_name, best_time_seconds')
    .order('best_time_seconds', { ascending: true })
    .limit(10)
  if (error) throw error
  return data ?? []
}

export async function submitTimeAttackScore(displayName: string, timeSeconds: number): Promise<void> {
  if (timeSeconds < 1) return
  const { error } = await supabase.rpc('submit_time_attack_score', {
    p_display_name: displayName,
    p_time_seconds: timeSeconds,
  })
  if (error && error.message !== 'rate_limit_exceeded') throw error
}

export interface ProfileData {
  bestScore: number | null
  rank: number | null
  playCount: number
  history: { score: number; played_at: string }[]
  bestTimeSeconds: number | null
  timeAttackRank: number | null
  timeAttackPlayCount: number
  timeAttackHistory: { time_seconds: number; played_at: string }[]
}

async function fetchProfileByUserId(userId: string): Promise<ProfileData> {
  const [scoreRes, historyRes, countRes, taScoreRes, taHistoryRes, taCountRes] = await Promise.all([
    supabase.from('scores').select('score').eq('user_id', userId).maybeSingle(),
    supabase.from('score_history').select('score, played_at').eq('user_id', userId).order('played_at', { ascending: true }).limit(30),
    supabase.from('score_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('time_attack_scores').select('best_time_seconds').eq('user_id', userId).maybeSingle(),
    supabase.from('time_attack_history').select('time_seconds, played_at').eq('user_id', userId).order('played_at', { ascending: true }).limit(30),
    supabase.from('time_attack_history').select('*', { count: 'exact', head: true }).eq('user_id', userId),
  ])

  const bestScore = scoreRes.data?.score ?? null
  const bestTimeSeconds = taScoreRes.data?.best_time_seconds ?? null

  let rank: number | null = null
  if (bestScore !== null) {
    const { count } = await supabase
      .from('scores')
      .select('*', { count: 'exact', head: true })
      .gt('score', bestScore)
    rank = (count ?? 0) + 1
  }

  let timeAttackRank: number | null = null
  if (bestTimeSeconds !== null) {
    const { count } = await supabase
      .from('time_attack_scores')
      .select('*', { count: 'exact', head: true })
      .lt('best_time_seconds', bestTimeSeconds)
    timeAttackRank = (count ?? 0) + 1
  }

  return {
    bestScore,
    rank,
    playCount: countRes.count ?? 0,
    history: historyRes.data ?? [],
    bestTimeSeconds,
    timeAttackRank,
    timeAttackPlayCount: taCountRes.count ?? 0,
    timeAttackHistory: taHistoryRes.data ?? [],
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

export interface MultiRoomData {
  id: string
  room_code: string
  host_id: string
  host_display_name: string
  guest_id: string
  guest_display_name: string
  status: string
  board: number[][] | null
  host_score: number
  guest_score: number
  started_at: string | null
}

export async function createMultiRoom(roomCode: string, hostDisplayName: string): Promise<void> {
  const { error } = await supabase.rpc('create_multi_room', {
    p_room_code: roomCode,
    p_host_display_name: hostDisplayName,
  })
  if (error) throw error
}

export async function joinMultiRoom(roomCode: string, guestDisplayName: string): Promise<MultiRoomData> {
  const { data, error } = await supabase.rpc('join_multi_room', {
    p_room_code: roomCode,
    p_guest_display_name: guestDisplayName,
  })
  if (error) throw error
  return data as MultiRoomData
}

export async function startMultiGame(roomCode: string, board: number[][]): Promise<void> {
  const { error } = await supabase.rpc('start_multi_game', {
    p_room_code: roomCode,
    p_board: board,
  })
  if (error) throw error
}

export async function endMultiRoom(roomCode: string, hostScore: number, guestScore: number): Promise<void> {
  const { error } = await supabase.rpc('end_multi_room', {
    p_room_code: roomCode,
    p_host_score: hostScore,
    p_guest_score: guestScore,
  })
  if (error) throw error
}
