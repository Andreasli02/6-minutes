import type { Song } from './songs';

export type QuizPhase = 'start' | 'playing' | 'answered' | 'results';

export interface Round {
  song: Song;
  guessId: string | null;
  isCorrect: boolean | null;
}

export interface QuizState {
  phase: QuizPhase;
  allSongs: Song[];       // shuffled pool of remaining songs
  rounds: Round[];         // completed + current rounds
  currentRound: number;
  lives: number;           // starts at 3, lose one per wrong answer
  score: number;           // correct guesses
}

const MAX_LIVES = 3;

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
  const shuffled = shuffle(songs);
  const firstSong = shuffled[0];
  return {
    phase: 'start',
    allSongs: shuffled.slice(1),
    rounds: [{ song: firstSong, guessId: null, isCorrect: null }],
    currentRound: 0,
    lives: MAX_LIVES,
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
  const newLives = isCorrect ? state.lives : state.lives - 1;
  return {
    ...state,
    phase: 'answered',
    rounds: newRounds,
    lives: newLives,
    score: state.score + (isCorrect ? 1 : 0),
  };
}

export function nextRound(state: QuizState): QuizState {
  // Game over if no lives left or no songs remaining
  if (state.lives <= 0 || state.allSongs.length === 0) {
    return { ...state, phase: 'results' };
  }
  const nextSong = state.allSongs[0];
  return {
    ...state,
    phase: 'playing',
    currentRound: state.currentRound + 1,
    allSongs: state.allSongs.slice(1),
    rounds: [...state.rounds, { song: nextSong, guessId: null, isCorrect: null }],
  };
}
