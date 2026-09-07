'use strict';

const STORAGE_KEY = 'multiply-practice-settings';
const NEXT_DELAY_MS = 900;
const REVEAL_DELAY_MS = 3000;

const el = {
  settingsScreen: document.getElementById('screen-settings'),
  reviewScreen: document.getElementById('screen-review'),
  quizScreen: document.getElementById('screen-quiz'),
  doneScreen: document.getElementById('screen-done'),

  multiplierGrid: document.getElementById('multiplier-grid'),
  questionCountInput: document.getElementById('question-count'),
  modeButtons: document.querySelectorAll('.mode-btn'),
  settingsError: document.getElementById('settings-error'),
  startBtn: document.getElementById('start-btn'),
  timeLimitEnabled: document.getElementById('time-limit-enabled'),
  timeLimitSeconds: document.getElementById('time-limit-seconds'),

  reviewTables: document.getElementById('review-tables'),
  reviewHomeBtn: document.getElementById('review-home-btn'),
  readyBtn: document.getElementById('ready-btn'),

  quizHomeBtn: document.getElementById('quiz-home-btn'),
  progressLabel: document.getElementById('progress-label'),
  questionLabel: document.getElementById('question-label'),
  timerLabel: document.getElementById('timer-label'),
  feedback: document.getElementById('feedback'),

  keypadArea: document.getElementById('keypad-area'),
  keypadDisplay: document.getElementById('keypad-display'),
  keypadGrid: document.getElementById('keypad-grid'),
  keypadConfirm: document.getElementById('keypad-confirm'),

  choiceArea: document.getElementById('choice-area'),
  choiceGrid: document.getElementById('choice-grid'),

  scoreLabel: document.getElementById('score-label'),
  statsLabel: document.getElementById('stats-label'),
  restartBtn: document.getElementById('restart-btn'),
};

let settings = {
  multipliers: [],
  questionCount: 10,
  mode: 'keypad',
  timeLimitEnabled: false,
  timeLimitSeconds: 10,
};

let quiz = null; // built when practice starts

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.multipliers)) settings.multipliers = parsed.multipliers;
      if (Number.isInteger(parsed.questionCount)) settings.questionCount = parsed.questionCount;
      if (parsed.mode === 'keypad' || parsed.mode === 'choice') settings.mode = parsed.mode;
      if (typeof parsed.timeLimitEnabled === 'boolean') settings.timeLimitEnabled = parsed.timeLimitEnabled;
      if (Number.isInteger(parsed.timeLimitSeconds)) settings.timeLimitSeconds = parsed.timeLimitSeconds;
    }
  } catch (e) {
    // ignore corrupt storage
  }
}

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function showScreen(name) {
  el.settingsScreen.hidden = name !== 'settings';
  el.reviewScreen.hidden = name !== 'review';
  el.quizScreen.hidden = name !== 'quiz';
  el.doneScreen.hidden = name !== 'done';
}

function goHome() {
  clearAttemptTimer();
  showScreen('settings');
}

// ---------- Settings screen ----------

function renderMultiplierGrid() {
  el.multiplierGrid.innerHTML = '';
  for (let n = 2; n <= 9; n++) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(n);
    btn.dataset.value = String(n);
    if (settings.multipliers.includes(n)) btn.classList.add('selected');
    btn.addEventListener('click', () => {
      const idx = settings.multipliers.indexOf(n);
      if (idx === -1) settings.multipliers.push(n);
      else settings.multipliers.splice(idx, 1);
      btn.classList.toggle('selected');
      el.settingsError.hidden = true;
    });
    el.multiplierGrid.appendChild(btn);
  }
}

function renderModeButtons() {
  el.modeButtons.forEach((btn) => {
    btn.classList.toggle('selected', btn.dataset.mode === settings.mode);
    btn.addEventListener('click', () => {
      settings.mode = btn.dataset.mode;
      el.modeButtons.forEach((b) => b.classList.toggle('selected', b === btn));
    });
  });
}

el.timeLimitEnabled.addEventListener('change', () => {
  el.timeLimitSeconds.disabled = !el.timeLimitEnabled.checked;
});

el.startBtn.addEventListener('click', () => {
  const count = parseInt(el.questionCountInput.value, 10);
  settings.questionCount = Number.isFinite(count) && count > 0 ? count : 10;

  settings.timeLimitEnabled = el.timeLimitEnabled.checked;
  const seconds = parseInt(el.timeLimitSeconds.value, 10);
  settings.timeLimitSeconds = Number.isFinite(seconds) && seconds > 0 ? seconds : 10;

  if (settings.multipliers.length === 0) {
    el.settingsError.hidden = false;
    return;
  }

  saveSettings();
  showReview();
});

el.restartBtn.addEventListener('click', () => {
  showScreen('settings');
});

el.reviewHomeBtn.addEventListener('click', goHome);
el.quizHomeBtn.addEventListener('click', goHome);

// ---------- Review screen ----------

function showReview() {
  el.reviewTables.innerHTML = '';
  const sorted = settings.multipliers.slice().sort((a, b) => a - b);

  sorted.forEach((a) => {
    const card = document.createElement('div');
    card.className = 'review-card';

    const heading = document.createElement('h3');
    heading.textContent = `${a} 的乘法表`;
    card.appendChild(heading);

    const list = document.createElement('ul');
    for (let b = 2; b <= 9; b++) {
      const li = document.createElement('li');
      li.textContent = `${a} × ${b} = ${a * b}`;
      list.appendChild(li);
    }
    card.appendChild(list);

    el.reviewTables.appendChild(card);
  });

  showScreen('review');
}

el.readyBtn.addEventListener('click', () => {
  startPractice();
});

// ---------- Question pool ----------

function buildPool() {
  const pool = [];
  for (const a of settings.multipliers) {
    for (let b = 2; b <= 9; b++) {
      pool.push({ a, b, answer: a * b });
    }
  }
  return pool;
}

function sampleWithReplacement(pool, count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return result;
}

// ---------- Practice flow ----------

function startPractice() {
  const pool = buildPool();
  quiz = {
    pool,
    round: 1,
    roundQuestions: sampleWithReplacement(pool, settings.questionCount),
    index: 0,
    attempt: 1,
    wrongThisRound: [],
    correctThisRound: [],
    stats: { totalAsked: 0, totalFirstTryCorrect: 0 },
    timerId: null,
    timeLeft: 0,
  };
  showScreen('quiz');
  renderQuestion();
}

function currentQuestion() {
  return quiz.roundQuestions[quiz.index];
}

function renderQuestion() {
  quiz.attempt = 1;
  el.feedback.hidden = true;
  el.feedback.className = 'feedback';

  el.progressLabel.textContent =
    `第 ${quiz.index + 1} 題 / ${quiz.roundQuestions.length} 題（第 ${quiz.round} 輪）`;

  const q = currentQuestion();
  el.questionLabel.textContent = `${q.a} × ${q.b} = ?`;

  if (settings.mode === 'keypad') {
    el.keypadArea.hidden = false;
    el.choiceArea.hidden = true;
    renderKeypad();
  } else {
    el.keypadArea.hidden = true;
    el.choiceArea.hidden = false;
    renderChoices(q);
  }

  startAttemptTimer();
}

// ---------- Per-attempt countdown ----------

function startAttemptTimer() {
  clearAttemptTimer();

  if (!settings.timeLimitEnabled) {
    el.timerLabel.hidden = true;
    return;
  }

  quiz.timeLeft = settings.timeLimitSeconds;
  el.timerLabel.hidden = false;
  updateTimerLabel();

  quiz.timerId = setInterval(() => {
    quiz.timeLeft -= 1;
    updateTimerLabel();
    if (quiz.timeLeft <= 0) {
      clearAttemptTimer();
      submitAnswer(null);
    }
  }, 1000);
}

function clearAttemptTimer() {
  if (quiz && quiz.timerId) {
    clearInterval(quiz.timerId);
    quiz.timerId = null;
  }
}

function updateTimerLabel() {
  el.timerLabel.textContent = `剩餘時間：${quiz.timeLeft} 秒`;
  el.timerLabel.classList.toggle('timer-low', quiz.timeLeft <= 3);
}

// ---------- Keypad mode ----------

let keypadBuffer = '';

function renderKeypad() {
  keypadBuffer = '';
  el.keypadDisplay.textContent = ' ';
  el.keypadGrid.innerHTML = '';

  for (let d = 1; d <= 9; d++) {
    el.keypadGrid.appendChild(makeKeypadDigitButton(d));
  }
  el.keypadGrid.appendChild(makeKeypadDigitButton(0));

  const clearBtn = document.createElement('button');
  clearBtn.type = 'button';
  clearBtn.textContent = '清除';
  clearBtn.className = 'keypad-clear-btn';
  clearBtn.addEventListener('click', () => {
    keypadBuffer = '';
    el.keypadDisplay.textContent = ' ';
  });
  el.keypadGrid.appendChild(clearBtn);

  setKeypadEnabled(true);
}

function makeKeypadDigitButton(d) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = String(d);
  btn.addEventListener('click', () => {
    if (keypadBuffer.length >= 2) return;
    keypadBuffer += String(d);
    el.keypadDisplay.textContent = keypadBuffer;
  });
  return btn;
}

function setKeypadEnabled(enabled) {
  el.keypadGrid.querySelectorAll('button').forEach((b) => (b.disabled = !enabled));
  el.keypadConfirm.disabled = !enabled;
}

el.keypadConfirm.addEventListener('click', () => {
  if (keypadBuffer === '') return;
  submitAnswer(parseInt(keypadBuffer, 10));
});

// ---------- Choice mode ----------

function renderChoices(q) {
  const options = new Set([q.answer]);
  while (options.size < 4) {
    const offset = Math.floor(Math.random() * 20) - 10; // -10..9
    const candidate = q.answer + offset;
    if (candidate > 0 && candidate !== q.answer) options.add(candidate);
  }
  const shuffled = Array.from(options).sort(() => Math.random() - 0.5);

  el.choiceGrid.innerHTML = '';
  shuffled.forEach((value) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(value);
    btn.addEventListener('click', () => submitAnswer(value));
    el.choiceGrid.appendChild(btn);
  });
  setChoicesEnabled(true);
}

function setChoicesEnabled(enabled) {
  el.choiceGrid.querySelectorAll('button').forEach((b) => (b.disabled = !enabled));
}

// ---------- Answer handling ----------

function submitAnswer(value) {
  clearAttemptTimer();

  const q = currentQuestion();
  const isTimeout = value === null;
  const isCorrect = !isTimeout && value === q.answer;

  if (isCorrect) {
    showFeedback(true, quiz.attempt === 1 ? '答對了！' : '這次對了！');
    disableInputs();
    resolveQuestion(quiz.attempt === 1, q);
    setTimeout(advance, NEXT_DELAY_MS);
    return;
  }

  if (quiz.attempt === 1) {
    quiz.attempt = 2;
    showFeedback(false, isTimeout ? '時間到，再試一次！' : '答錯了，再試一次！');
    if (settings.mode === 'keypad') {
      keypadBuffer = '';
      el.keypadDisplay.textContent = ' ';
    }
    startAttemptTimer();
    return;
  }

  revealAnswer(q);
  disableInputs();
  resolveQuestion(false, q);
  setTimeout(advance, REVEAL_DELAY_MS);
}

function revealAnswer(q) {
  el.feedback.hidden = true;
  el.questionLabel.innerHTML =
    `${q.a} × ${q.b} = <span class="reveal-answer">${q.answer}</span>`;
}

function showFeedback(correct, text) {
  el.feedback.hidden = false;
  el.feedback.textContent = text;
  el.feedback.className = 'feedback ' + (correct ? 'correct' : 'wrong');
}

function disableInputs() {
  setKeypadEnabled(false);
  setChoicesEnabled(false);
}

function resolveQuestion(firstTryCorrect, q) {
  quiz.stats.totalAsked += 1;
  if (firstTryCorrect) {
    quiz.stats.totalFirstTryCorrect += 1;
    quiz.correctThisRound.push(q);
  } else {
    quiz.wrongThisRound.push(q);
  }
}

function advance() {
  quiz.index += 1;
  if (quiz.index < quiz.roundQuestions.length) {
    renderQuestion();
  } else {
    endRound();
  }
}

function endRound() {
  if (quiz.wrongThisRound.length === 0) {
    showDone();
    return;
  }

  // next round doubles: N wrong questions -> 2N total (N wrong + N padding)
  const nextRound = quiz.wrongThisRound.slice();
  const padCount = nextRound.length;
  const padPool = quiz.correctThisRound.length > 0 ? quiz.correctThisRound : quiz.pool;
  nextRound.push(...sampleWithReplacement(padPool, padCount));

  quiz.round += 1;
  quiz.roundQuestions = nextRound;
  quiz.index = 0;
  quiz.wrongThisRound = [];
  quiz.correctThisRound = [];
  renderQuestion();
}

function showDone() {
  const { totalAsked, totalFirstTryCorrect } = quiz.stats;
  const score = totalAsked > 0 ? Math.round((totalFirstTryCorrect / totalAsked) * 100) : 100;
  el.scoreLabel.textContent = `${score} 分`;
  el.statsLabel.innerHTML = `
    總共練習了 ${quiz.round} 輪<br>
    總作答題數：${totalAsked} 題
  `;
  showScreen('done');
}

// ---------- Init ----------

loadSettings();
renderMultiplierGrid();
renderModeButtons();
el.questionCountInput.value = settings.questionCount;
el.timeLimitEnabled.checked = settings.timeLimitEnabled;
el.timeLimitSeconds.value = settings.timeLimitSeconds;
el.timeLimitSeconds.disabled = !settings.timeLimitEnabled;
showScreen('settings');
