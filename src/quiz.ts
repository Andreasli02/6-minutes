import type { Song } from './songs';

export type QuizPhase = 'start' | 'playing' | 'answered' | 'results';

export interface Round {
  song: Song;
  guessId: string | null;
  isCorrect: boolean | null;
}

export interface QuizState {
  phase: QuizPhase;
  rounds: Round[];
  currentRound: number;
  score: number;
}

/** Fisher-Yates shuffle (returns new array) */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function initQuiz(songs: Song[]): QuizState {
  const picked = shuffle(songs).slice(0, 3);
  return {
    phase: 'start',
    rounds: picked.map((song) => ({ song, guessId: null, isCorrect: null })),
    currentRound: 0,
    score: 0,
  };
}

export function startQuiz(state: QuizState): QuizState {
  return { ...state, phase: 'playing' };
}

export function submitGuess(state: QuizState, songId: string): QuizState {
  const round = state.rounds[state.currentRound];
  const isCorrect = songId === round.song.id;
  const newRounds = [...state.rounds];
  newRounds[state.currentRound] = { ...round, guessId: songId, isCorrect };
  return {
    ...state,
    phase: 'answered',
    rounds: newRounds,
    score: state.score + (isCorrect ? 1 : 0),
  };
}

export function nextRound(state: QuizState): QuizState {
  const next = state.currentRound + 1;
  if (next >= state.rounds.length) {
    return { ...state, phase: 'results' };
  }
  return { ...state, phase: 'playing', currentRound: next };
}
