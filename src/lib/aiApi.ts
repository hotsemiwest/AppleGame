export const AI_API_BASE = import.meta.env.VITE_AI_API_URL ?? 'http://localhost:8000'

export function aiHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    ...extra,
  }
}
