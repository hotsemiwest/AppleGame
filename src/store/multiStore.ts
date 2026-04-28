import { create } from 'zustand'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { Board, SelectionRect, GameMode, GAME_DURATION, TIME_ATTACK_TARGET } from '../types/game'
import { generateBoard } from '../utils/boardGenerator'
import { isValidSelection, clearRect, hasAnySolution } from '../utils/gameLogic'
import { supabase, createMultiRoom, joinMultiRoom, startMultiGame, endMultiRoom } from '../lib/supabase'
import { useAuthStore } from './authStore'
import { useGameStore } from './gameStore'

export type MultiPhase = 'off' | 'lobby' | 'waiting' | 'countdown' | 'playing' | 'ended'

export interface MultiState {
  phase: MultiPhase
  roomCode: string | null
  isHost: boolean
  myId: string | null
  myName: string | null
  opponentId: string | null
  opponentName: string | null
  board: Board | null
  myScore: number
  opponentScore: number
  timeLeft: number
  elapsedTime: number
  winner: 'me' | 'opponent' | 'draw' | null
  error: string | null
  deadlockNotice: boolean
  opponentLeft: boolean
  gameMode: GameMode

  openLobby: () => void
  createRoom: () => Promise<void>
  joinRoom: (code: string) => Promise<void>
  setGameMode: (mode: GameMode) => void
  startGame: () => void
  beginPlaying: () => void
  confirmSelection: (rect: SelectionRect) => void
  broadcastDrag: (rect: SelectionRect | null) => void
  tick: () => void
  forfeit: () => void
  rematch: () => void
  leaveRoom: () => void
  clearError: () => void
}

let channel: RealtimeChannel | null = null

// 상대방 드래그를 Zustand state가 아닌 직접 DOM 콜백으로 전달 → 리렌더링 없음
let opponentDragCallback: ((rect: SelectionRect | null) => void) | null = null
export function registerOpponentDragCallback(fn: typeof opponentDragCallback) {
  opponentDragCallback = fn
}

function getMe() {
  const { user, displayName } = useAuthStore.getState()
  return { id: user?.id ?? null, name: displayName }
}

function generateRoomCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

function subscribeChannel(roomCode: string) {
  if (channel) {
    channel.unsubscribe()
    channel = null
  }

  channel = supabase.channel(`multi:${roomCode}`, {
    config: { broadcast: { self: false }, presence: { key: getMe().id ?? '' } },
  })

  const store = useMultiStore.getState()
  const { id: myId } = getMe()

  channel
    .on('broadcast', { event: 'board' }, ({ payload }) => {
      const s = useMultiStore.getState()
      const remoteBoard: Board = payload.board

      const mergedBoard: Board = (s.board && payload.reason !== 'deadlock')
        ? s.board.map((row, r) =>
            row.map((cell, c) => (cell === null || remoteBoard[r]?.[c] === null ? null : cell))
          )
        : remoteBoard

      // 동시 제거 충돌: 내 보드에서 이미 null인 셀을 상대도 제거했다면 → 호스트 우선 적용
      // 호스트: 상대(게스트) 점수에서 중복 제거 셀만큼 차감
      // 게스트: 내 점수에서 중복 제거 셀만큼 차감
      const contested = payload.reason !== 'deadlock'
        ? (payload.cleared_cells as { row: number; col: number }[] | undefined)
            ?.filter(cell => s.board?.[cell.row]?.[cell.col] === null).length ?? 0
        : 0

      const opponentScore = Math.max(0,
        (s.isHost ? payload.guest_score : payload.host_score) - (s.isHost ? contested : 0)
      )
      const myScore = Math.max(0, s.myScore - (s.isHost ? 0 : contested))

      useMultiStore.setState({ board: mergedBoard, opponentScore, myScore })

      if (payload.cleared_cells?.length) {
        useGameStore.getState().spawnOpponentParticles(payload.cleared_cells)
      }

      if (s.gameMode === 'time' && opponentScore >= TIME_ATTACK_TARGET) {
        endGame('opponent')
        return
      }

      if (s.isHost && !hasAnySolution(mergedBoard)) {
        handleDeadlock()
      }
    })
    .on('broadcast', { event: 'countdown_start' }, ({ payload }) => {
      const s = useMultiStore.getState()
      if (s.phase !== 'waiting') return
      useMultiStore.setState({
        board: payload.board as Board,
        gameMode: (payload.gameMode as GameMode) ?? 'score',
        phase: 'countdown',
        myScore: 0,
        opponentScore: 0,
      })
    })
    .on('broadcast', { event: 'game_mode' }, ({ payload }) => {
      useMultiStore.setState({ gameMode: (payload.gameMode as GameMode) ?? 'score' })
    })
    .on('broadcast', { event: 'drag' }, ({ payload }) => {
      if (payload.player_id === myId) return
      opponentDragCallback?.(payload.rect as SelectionRect | null)
    })
    .on('broadcast', { event: 'leave' }, ({ payload }) => {
      if (payload.player_id === myId) return
      const s = useMultiStore.getState()
      if (s.phase === 'playing' || s.phase === 'countdown') {
        endGame('me')
      } else if (s.phase === 'ended') {
        useMultiStore.setState({ opponentLeft: true })
      } else if (s.phase === 'waiting') {
        channel?.unsubscribe()
        channel = null
        useMultiStore.setState({
          phase: 'off', roomCode: null, isHost: false,
          myId: null, myName: null, opponentId: null, opponentName: null,
          board: null, myScore: 0, opponentScore: 0, timeLeft: GAME_DURATION, elapsedTime: 0,
          winner: null, error: '상대방이 게임을 나갔습니다.', deadlockNotice: false,
          opponentLeft: false,
        })
        opponentDragCallback?.(null)
      }
    })
    .on('broadcast', { event: 'rematch' }, () => {
      useMultiStore.setState({
        phase: 'waiting',
        board: null,
        myScore: 0,
        opponentScore: 0,
        timeLeft: GAME_DURATION,
        elapsedTime: 0,
        winner: null,
        deadlockNotice: false,
        opponentLeft: false,
      })
    })
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'multi_rooms', filter: `room_code=eq.${roomCode}` },
      ({ new: row }) => {
        const s = useMultiStore.getState()

        // 호스트: 게스트 입장 감지
        if (s.isHost && row.guest_display_name && !s.opponentName) {
          useMultiStore.setState({
            opponentId: row.guest_id,
            opponentName: row.guest_display_name,
          })
        }

        // 게스트: 게임 시작 감지 (broadcast 못 받은 경우 fallback)
        if (!s.isHost && row.status === 'playing' && s.phase === 'waiting') {
          useMultiStore.setState({
            board: row.board as Board,
            phase: 'countdown',
            myScore: 0,
            opponentScore: 0,
          })
        }
      }
    )
    .on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const s = useMultiStore.getState()
      const opId = s.opponentId
      if (!leftPresences.some((p: Record<string, unknown>) => p['player_id'] === opId)) return
      if (s.phase === 'playing' || s.phase === 'countdown') {
        endGame('me')
      } else if (s.phase === 'ended') {
        useMultiStore.setState({ opponentLeft: true })
      }
    })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const { id } = getMe()
        const isHost = store.isHost
        await channel?.track({ player_id: id, role: isHost ? 'host' : 'guest' })
      }
    })
}

function handleDeadlock() {
  const s = useMultiStore.getState()
  if (!s.board) return
  const newBoard = generateBoard()
  const hostScore = s.isHost ? s.myScore : s.opponentScore
  const guestScore = s.isHost ? s.opponentScore : s.myScore
  useMultiStore.setState({ board: newBoard, deadlockNotice: true })
  channel?.send({
    type: 'broadcast',
    event: 'board',
    payload: { board: newBoard, host_score: hostScore, guest_score: guestScore, reason: 'deadlock' },
  })
  setTimeout(() => useMultiStore.setState({ deadlockNotice: false }), 2000)
}

function endGame(winner: 'me' | 'opponent' | 'draw') {
  const s = useMultiStore.getState()
  if (s.phase === 'ended') return
  const hostScore = s.isHost ? s.myScore : s.opponentScore
  const guestScore = s.isHost ? s.opponentScore : s.myScore
  if (s.roomCode) {
    endMultiRoom(s.roomCode, hostScore, guestScore).catch(() => {})
  }
  useMultiStore.setState({ phase: 'ended', winner })
}

export const useMultiStore = create<MultiState>((set, get) => ({
  phase: 'off',
  roomCode: null,
  isHost: false,
  myId: null,
  myName: null,
  opponentId: null,
  opponentName: null,
  board: null,
  myScore: 0,
  opponentScore: 0,
  timeLeft: GAME_DURATION,
  elapsedTime: 0,
  winner: null,
  error: null,
  deadlockNotice: false,
  opponentLeft: false,
  gameMode: 'score' as GameMode,

  openLobby: () => {
    const { id, name } = getMe()
    set({ phase: 'lobby', myId: id, myName: name, error: null })
  },

  setGameMode: (mode: GameMode) => {
    set({ gameMode: mode })
    channel?.send({ type: 'broadcast', event: 'game_mode', payload: { gameMode: mode } })
  },

  createRoom: async () => {
    const { id, name } = getMe()
    if (!id || !name) return
    const code = generateRoomCode()
    try {
      await createMultiRoom(code, name)
      set({
        phase: 'waiting',
        roomCode: code,
        isHost: true,
        myId: id,
        myName: name,
        opponentId: null,
        opponentName: null,
        myScore: 0,
        opponentScore: 0,
        error: null,
      })
      subscribeChannel(code)
    } catch (e: unknown) {
      set({ error: e instanceof Error ? e.message : '방 생성에 실패했습니다' })
    }
  },

  joinRoom: async (code: string) => {
    const { id, name } = getMe()
    if (!id || !name) return
    try {
      const room = await joinMultiRoom(code, name)
      set({
        phase: 'waiting',
        roomCode: code,
        isHost: false,
        myId: id,
        myName: name,
        opponentId: room.host_id,
        opponentName: room.host_display_name,
        myScore: 0,
        opponentScore: 0,
        error: null,
      })
      subscribeChannel(code)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (msg.includes('room_not_found')) set({ error: '방을 찾을 수 없습니다. 코드를 확인해 주세요.' })
      else set({ error: '방 참가에 실패했습니다' })
    }
  },

  startGame: () => {
    const { roomCode, gameMode } = get()
    if (!roomCode) return
    const board = generateBoard()
    startMultiGame(roomCode, board as unknown as number[][]).catch(() => {})
    channel?.send({
      type: 'broadcast',
      event: 'countdown_start',
      payload: { board, gameMode },
    })
    set({ board, phase: 'countdown', myScore: 0, opponentScore: 0 })
  },

  beginPlaying: () => {
    set({ phase: 'playing', timeLeft: GAME_DURATION, elapsedTime: 0 })
  },

  confirmSelection: (rect: SelectionRect) => {
    const s = get()
    if (!s.board || s.phase !== 'playing') return
    if (!isValidSelection(s.board, rect)) return

    const { newBoard, cleared } = clearRect(s.board, rect)
    useGameStore.getState().spawnParticles(cleared)
    const myScore = s.myScore + cleared.length
    const hostScore = s.isHost ? myScore : s.opponentScore
    const guestScore = s.isHost ? s.opponentScore : myScore

    set({ board: newBoard, myScore })

    channel?.send({
      type: 'broadcast',
      event: 'board',
      payload: { board: newBoard, host_score: hostScore, guest_score: guestScore, cleared_cells: cleared },
    })

    if (s.gameMode === 'time' && myScore >= TIME_ATTACK_TARGET) {
      endGame('me')
      return
    }

    if (s.isHost && !hasAnySolution(newBoard)) {
      handleDeadlock()
    }
  },

  broadcastDrag: (rect: SelectionRect | null) => {
    const { myId } = get()
    channel?.send({
      type: 'broadcast',
      event: 'drag',
      payload: { player_id: myId, rect },
    })
  },

  tick: () => {
    const s = get()
    if (s.gameMode === 'time') {
      set({ elapsedTime: s.elapsedTime + 1 })
    } else {
      if (s.timeLeft <= 1) {
        const winner = s.myScore > s.opponentScore ? 'me' : s.myScore < s.opponentScore ? 'opponent' : 'draw'
        endGame(winner)
      } else {
        set({ timeLeft: s.timeLeft - 1 })
      }
    }
  },

  rematch: () => {
    if (get().opponentLeft) return
    channel?.send({ type: 'broadcast', event: 'rematch', payload: {} })
    set({
      phase: 'waiting',
      board: null,
      myScore: 0,
      opponentScore: 0,
      timeLeft: GAME_DURATION,
      elapsedTime: 0,
      winner: null,
      deadlockNotice: false,
    })
  },

  forfeit: () => {
    const { myId, roomCode } = get()
    if (roomCode) {
      channel?.send({ type: 'broadcast', event: 'leave', payload: { player_id: myId } })
    }
    endGame('opponent')
  },

  leaveRoom: () => {
    const { myId, roomCode } = get()
    if (roomCode) {
      channel?.send({ type: 'broadcast', event: 'leave', payload: { player_id: myId } })
    }
    channel?.unsubscribe()
    channel = null
    set({
      phase: 'off',
      roomCode: null,
      isHost: false,
      myId: null,
      myName: null,
      opponentId: null,
      opponentName: null,
      board: null,
      myScore: 0,
      opponentScore: 0,
      timeLeft: GAME_DURATION,
      elapsedTime: 0,
      winner: null,
      error: null,
      deadlockNotice: false,
      opponentLeft: false,
      gameMode: 'score',
    })
    opponentDragCallback?.(null)
  },

  clearError: () => set({ error: null }),
}))
