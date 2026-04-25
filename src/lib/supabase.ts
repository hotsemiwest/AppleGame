const BASE = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const HEADERS = {
  apikey: KEY,
  Authorization: `Bearer ${KEY}`,
  'Content-Type': 'application/json',
}

export interface ScoreEntry {
  name: string
  score: number
}

export async function fetchTopScores(): Promise<ScoreEntry[]> {
  const res = await fetch(
    `${BASE}/rest/v1/scores?select=name,score&order=score.desc&limit=10`,
    { headers: HEADERS },
  )
  if (!res.ok) throw new Error('fetch failed')
  return res.json()
}

export async function submitScore(name: string, score: number): Promise<void> {
  const res = await fetch(`${BASE}/rest/v1/scores`, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify({ name, score }),
  })
  if (!res.ok) throw new Error('submit failed')
}
