import { songs } from './songs';
import { type QuizState, initQuiz, startQuiz, submitGuess, nextRound } from './quiz';
import './style.css';

const app = document.getElementById('app')!;
let state: QuizState;

// Sort songs alphabetically for dropdown
const sortedSongs = [...songs].sort((a, b) =>
  `${a.artist} - ${a.name}`.localeCompare(`${b.artist} - ${b.name}`)
);

function render() {
  switch (state.phase) {
    case 'start':
      renderStart();
      break;
    case 'playing':
      renderPlaying();
      break;
    case 'answered':
      renderAnswered();
      break;
    case 'results':
      renderResults();
      break;
  }
}

function renderStart() {
  app.innerHTML = `
    <div class="card">
      <h1>6 Minutes Song Quiz</h1>
      <p class="subtitle">Listen to the clip and guess the song.<br>3 rounds. How well do you know your music?</p>
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
      <div class="round-label">Round ${state.currentRound + 1} of 3</div>
      <div class="embed-container" id="embed-container">
        <iframe
          id="spotify-embed"
          src="https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="eager"
        ></iframe>
      </div>
      <select id="guess-select">
        <option value="">Choose a song...</option>
        ${sortedSongs.map((s) => `<option value="${s.id}">${s.artist} - ${s.name}</option>`).join('')}
      </select>
      <div class="buttons">
        <button class="btn-primary" id="submit-btn" disabled>Submit Guess</button>
      </div>
    </div>
  `;

  const select = document.getElementById('guess-select') as HTMLSelectElement;
  const submitBtn = document.getElementById('submit-btn') as HTMLButtonElement;

  select.addEventListener('change', () => {
    submitBtn.disabled = !select.value;
  });

  submitBtn.addEventListener('click', () => {
    if (!select.value) return;
    state = submitGuess(state, select.value);
    render();
  });
}

function renderAnswered() {
  const round = state.rounds[state.currentRound];
  const guessedSong = songs.find((s) => s.id === round.guessId);
  const isLast = state.currentRound >= state.rounds.length - 1;

  app.innerHTML = `
    <div class="card">
      <div class="round-label">Round ${state.currentRound + 1} of 3</div>
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
      <p class="score-display">Score: ${state.score}/${state.currentRound + 1}</p>
      <div class="buttons">
        <button class="btn-primary" id="next-btn">${isLast ? 'See Results' : 'Next Round'}</button>
      </div>
    </div>
  `;

  document.getElementById('next-btn')!.addEventListener('click', () => {
    state = nextRound(state);
    render();
  });
}

function renderResults() {
  app.innerHTML = `
    <div class="card">
      <div class="round-label">Final Results</div>
      <div class="results-score">${state.score}/3</div>
      <p class="results-label">${getResultMessage(state.score)}</p>
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

function getResultMessage(score: number): string {
  if (score === 3) return 'Perfect score! You really know your music!';
  if (score === 2) return 'Great job! Almost perfect!';
  if (score === 1) return 'Not bad, keep listening!';
  return 'Better luck next time!';
}

// Initialize
state = initQuiz(songs);
render();
