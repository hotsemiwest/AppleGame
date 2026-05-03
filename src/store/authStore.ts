import { create } from 'zustand'
import type { User } from '@supabase/supabase-js'
import { supabase, updateDisplayName as apiUpdateDisplayName } from '../lib/supabase'
import { setPersonalBestPersistence, useGameStore } from './gameStore'
import { useThemeStore } from './themeStore'

async function restorePersonalBest(userId: string) {
  const { data } = await supabase
    .from('scores')
    .select('score')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.score) {
    useGameStore.getState().setPersonalBest(data.score)
  }
}

async function restoreTimeAttackBest(userId: string) {
  const { data } = await supabase
    .from('time_attack_scores')
    .select('best_time_seconds')
    .eq('user_id', userId)
    .maybeSingle()
  if (data?.best_time_seconds) {
    useGameStore.getState().setPersonalBestTime(data.best_time_seconds)
  }
}

export interface PendingAuth {
  notice: string
  openLogin: boolean
}

interface AuthState {
  user: User | null
  displayName: string | null
  isLoading: boolean
  pendingAuth: PendingAuth | null

  initialize: () => void
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  updateDisplayName: (newName: string) => Promise<void>
  setPendingAuth: (cfg: PendingAuth | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  displayName: null,
  isLoading: true,
  pendingAuth: null,

  setPendingAuth: (cfg) => set({ pendingAuth: cfg }),

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user ?? null
      setPersonalBestPersistence(!!user)
      if (user) { restorePersonalBest(user.id); restoreTimeAttackBest(user.id) }
      set({
        user,
        displayName: user?.user_metadata?.display_name ?? null,
        isLoading: false,
      })
    })

    supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user ?? null
      setPersonalBestPersistence(!!user)
      if (user) { restorePersonalBest(user.id); restoreTimeAttackBest(user.id) }
      const update: Partial<AuthState> = {
        user,
        displayName: user?.user_metadata?.display_name ?? null,
      }
      if (event === 'SIGNED_IN' && window.location.hash.includes('type=signup')) {
        window.history.replaceState(null, '', window.location.pathname)
        update.pendingAuth = { notice: '✅ 이메일 인증이 완료되었습니다! 환영합니다 🎉', openLogin: false }
      }
      set(update)
    })
  },

  signUp: async (email, password, displayName) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    })
    if (error) throw error
  },

  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
  },

  signOut: async () => {
    await supabase.auth.signOut()
    useGameStore.getState().resetPersonalBest()
    useThemeStore.getState().setDevMode(false)
  },

  updateDisplayName: async (newName: string) => {
    await apiUpdateDisplayName(newName)
    set({ displayName: newName })
  },
}))
