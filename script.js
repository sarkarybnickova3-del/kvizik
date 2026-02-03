// Quiz logika: špatné otázky se opakují, dokud nejsou správně.

const STORAGE_KEY = "quiz_v1";

let pool = loadQuiz();
let index = 0;
let wrongQueue = [];

const quizDiv = document.getElementById("quiz");
const nextBtn = document.getElementById("nextBtn");
const restartBtn = document.getElementById("restartBtn");

function loadQuiz() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQuiz(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function ensureQuestions() {
  if (!pool.length) {
    quizDiv.innerHTML = `
      <h2>Nejsou uložené žádné otázky</h2>
      <p>Nejdřív si je vytvoř ve <a href="admin.html">Správě</a>.</p>
    `;
    nextBtn.style.display = "none";
    restartBtn.style.display = "none";
    return false;
  }
  nextBtn.style.display = "";
  restartBtn.style.display = "";
  return true;
}

function renderQuestion() {
  if (!ensureQuestions()) return;

  nextBtn.disabled = true;
  quizDiv.innerHTML = "";

  // konec kola
  if (index >= pool.length) {
    if (wrongQueue.length > 0) {
      pool = shuffle([...wrongQueue]);
      wrongQueue = [];
      index = 0;
      alert("Opakují se otázky, které byly špatně.");
    } else {
      quizDiv.innerHTML = `<h2>🎉 Test hotový!</h2><p>Všechny otázky byly zodpovězeny správně.</p>`;
      nextBtn.disabled = true;
      return;
    }
  }

  const q = pool[index];

  const title = document.createElement("h2");
  title.className = "q-title";
  title.textContent = q.question;

  const answersWrap = document.createElement("div");
  answersWrap.className = "answers";

  const letters = ["a", "b", "c", "d"];

  letters.forEach((letter, i) => {
    const btn = document.createElement("button");
    btn.className = "answer";
    btn.innerHTML = `<small>${letter.toUpperCase()})</small> ${q[letter]}`;
    btn.addEventListener("click", () => handleAnswer(btn, letter, q.correct));
    answersWrap.appendChild(btn);
  });

  quizDiv.appendChild(title);
  quizDiv.appendChild(answersWrap);
}

function handleAnswer(clickedBtn, selected, correct) {
  const buttons = [...quizDiv.querySelectorAll("button.answer")];

  // zamknout odpovědi
  buttons.forEach(b => (b.disabled = true));

  // vyznačit správnou
  const q = pool[index];
  const correctText = q[correct];

  buttons.forEach(b => {
    const text = b.textContent.replace(/^\s*[A-D]\)\s*/i, "").trim();
    if (text === correctText) b.classList.add("correct");
  });

  if (selected !== correct) {
    clickedBtn.classList.add("wrong");
    wrongQueue.push(q);
  }

  nextBtn.disabled = false;
}

nextBtn.addEventListener("click", () => {
  index++;
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  pool = shuffle(loadQuiz());
  index = 0;
  wrongQueue = [];
  renderQuestion();
});

// start
pool = shuffle(pool);
renderQuestion();
