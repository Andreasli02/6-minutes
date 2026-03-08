import { songs } from './songs';
import { type QuizState, initQuiz, startQuiz, submitGuess, nextRound } from './quiz';
import './style.css';

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: any) => void;
  }
}

const app = document.getElementById('app')!;
let state: QuizState;
let spotifyAPI: any = null;
let currentController: any = null;

// Capture the Spotify IFrame API when it's ready
if ((window as any).SpotifyIframeApi) {
  spotifyAPI = (window as any).SpotifyIframeApi;
} else {
  window.onSpotifyIframeApiReady = (IFrameAPI: any) => {
    spotifyAPI = IFrameAPI;
  };
}

// Sort songs alphabetically for dropdown
const sortedSongs = [...songs].sort((a, b) =>
  `${a.artist} - ${a.name}`.localeCompare(`${b.artist} - ${b.name}`)
);

function livesDisplay(lives: number): string {
  return '<span class="hearts">' + '&#9829;'.repeat(lives) + '<span class="hearts-lost">' + '&#9829;'.repeat(3 - lives) + '</span></span>';
}

function render() {
  switch (state.phase) {
    case 'start': renderStart(); break;
    case 'playing': renderPlaying(); break;
    case 'answered': renderAnswered(); break;
    case 'results': renderResults(); break;
  }
}

function renderStart() {
  app.innerHTML = `
    <div class="card">
      <h1>6 Minutes Song Quiz</h1>
      <p class="subtitle">Listen to the clip and guess the song.<br>You have 3 lives — keep going until you're out!</p>
      <button class="btn-primary" id="start-btn">Start Quiz</button>
    </div>
  `;
  document.getElementById('start-btn')!.addEventListener('click', () => {
    state = startQuiz(state);
    render();
  });
}

function renderPlaying() {
  const round = state.rounds[state.currentRound];
  const trackId = round.song.id;

  app.innerHTML = `
    <div class="card">
      <div class="status-bar">
        <span class="round-label">Round ${state.currentRound + 1}</span>
        <span class="lives-display">${livesDisplay(state.lives)}</span>
      </div>
      <div class="timer-bar"><div class="timer-fill" id="timer-fill"></div></div>
      <div class="timer-label" id="timer-label">0:30</div>
      <div class="embed-container" id="embed-container">
        <div id="spotify-embed"></div>
      </div>
      <div class="autocomplete">
        <input type="text" id="guess-input" placeholder="Start typing a song or artist..." autocomplete="off" />
        <ul id="suggestions" class="suggestions"></ul>
      </div>
      <div class="buttons">
        <button class="btn-primary" id="submit-btn" disabled>Submit Guess</button>
      </div>
    </div>
  `;

  // Create Spotify embed via IFrame API and autoplay
  const embedElement = document.getElementById('spotify-embed')!;
  if (spotifyAPI) {
    spotifyAPI.createController(embedElement, {
      uri: `spotify:track:${trackId}`,
      height: 152,
      width: '100%',
    }, (controller: any) => {
      currentController = controller;
      controller.play();
    });
  }

  const input = document.getElementById('guess-input') as HTMLInputElement;
  const suggestionsList = document.getElementById('suggestions') as HTMLUListElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;
  let selectedId: string | null = null;

  function updateSuggestions() {
    const query = input.value.toLowerCase();
    selectedId = null;
    submitBtn.disabled = true;

    if (!query) {
      suggestionsList.innerHTML = '';
      return;
    }

    const matches = sortedSongs.filter((s) =>
      `${s.artist} - ${s.name}`.toLowerCase().includes(query)
    ).slice(0, 8);

    suggestionsList.innerHTML = matches.map((s) =>
      `<li data-id="${s.id}">${s.artist} - ${s.name}</li>`
    ).join('');
  }

  input.addEventListener('input', updateSuggestions);

  suggestionsList.addEventListener('click', (e) => {
    const li = (e.target as HTMLElement).closest('li');
    if (!li) return;
    selectedId = li.dataset.id!;
    input.value = li.textContent!;
    suggestionsList.innerHTML = '';
    submitBtn.disabled = false;
  });

  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!(e.target as HTMLElement).closest('.autocomplete')) {
      suggestionsList.innerHTML = '';
    }
  });

  // Re-show on focus if there's text
  input.addEventListener('focus', () => {
    if (input.value) updateSuggestions();
  });

  submitBtn.addEventListener('click', () => {
    if (!selectedId) return;
    clearInterval(timerId);
    if (currentController) { currentController.destroy(); currentController = null; }
    state = submitGuess(state, selectedId);
    render();
  });

  // 30-second countdown timer
  const TIMER_SECONDS = 30;
  let remaining = TIMER_SECONDS;
  const timerFill = document.getElementById('timer-fill')!;
  const timerLabel = document.getElementById('timer-label')!;

  const timerId = setInterval(() => {
    remaining--;
    const pct = (remaining / TIMER_SECONDS) * 100;
    timerFill.style.width = `${pct}%`;
    if (remaining <= 10) timerFill.classList.add('timer-urgent');
    const secs = remaining % 60;
    timerLabel.textContent = `0:${secs.toString().padStart(2, '0')}`;

    if (remaining <= 0) {
      clearInterval(timerId);
      // Destroy the controller to stop playback
      if (currentController) { currentController.destroy(); currentController = null; }
      const container = document.getElementById('embed-container');
      if (container) { container.remove(); }
      timerLabel.textContent = '';
      const timeUp = document.createElement('div');
      timeUp.className = 'time-up';
      timeUp.textContent = "Time's up!";
      timerLabel.after(timeUp);
      timerLabel.textContent = '0:00';
    }
  }, 1000);
}

function renderAnswered() {
  const round = state.rounds[state.currentRound];
  const guessedSong = songs.find((s) => s.id === round.guessId);
  const gameOver = !round.isCorrect && state.lives <= 0;

  app.innerHTML = `
    <div class="card">
      <div class="status-bar">
        <span class="round-label">Round ${state.currentRound + 1}</span>
        <span class="lives-display">${livesDisplay(state.lives)}</span>
      </div>
      <div class="feedback ${round.isCorrect ? 'correct' : 'incorrect'}">
        ${round.isCorrect ? 'Correct!' : 'Wrong!'}
      </div>
      <p class="answer-detail">
        ${round.isCorrect
          ? `It was <strong>${round.song.artist} - ${round.song.name}</strong>`
          : `You guessed: <strong>${guessedSong?.artist} - ${guessedSong?.name}</strong><br>
             Correct answer: <strong>${round.song.artist} - ${round.song.name}</strong>`
        }
      </p>
      <p class="score-display">Score: ${state.score}</p>
      <div class="buttons">
        <button class="btn-primary" id="next-btn">${gameOver ? 'See Results' : 'Next Round'}</button>
      </div>
    </div>
  `;

  document.getElementById('next-btn')!.addEventListener('click', () => {
    state = nextRound(state);
    render();
  });
}

function renderResults() {
  const totalRounds = state.rounds.length;

  app.innerHTML = `
    <div class="card">
      <div class="round-label">Game Over</div>
      <div class="results-score">${state.score}</div>
      <p class="results-label">${state.score === totalRounds ? 'Flawless! You never missed!' : `You got ${state.score} out of ${totalRounds} right.`}</p>
      <div class="breakdown">
        ${state.rounds.map((round) => `
          <div class="breakdown-item">
            <span class="breakdown-icon">${round.isCorrect ? '&#10003;' : '&#10007;'}</span>
            <div class="breakdown-song">
              <span class="song-name">${round.song.name}</span><br>
              <span class="artist-name">${round.song.artist}</span>
            </div>
          </div>
        `).join('')}
      </div>
      <button class="btn-primary" id="replay-btn">Play Again</button>
    </div>
  `;

  document.getElementById('replay-btn')!.addEventListener('click', () => {
    state = initQuiz(songs);
    state = startQuiz(state);
    render();
  });
}

// Initialize
state = initQuiz(songs);
render();
