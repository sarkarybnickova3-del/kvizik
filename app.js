// app.js — Testování (více testů + auto přepínání + theme toggle)

const STORE = {
  QUIZZES: "quizzes_v1",          // { [name]: Question[] }
  ACTIVE: "active_quiz_v1",       // string
  THEME: "theme_v1"               // "dark" | "light"
};

const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");
const themeBtn = document.getElementById("themeBtn");

let pool = [];
let index = 0;
let wrongQueue = [];
let locked = false;
let autoTimer = null;

function loadTheme(){
  const t = localStorage.getItem(STORE.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", t);
}
function toggleTheme(){
  const curr = document.documentElement.getAttribute("data-theme") || "dark";
  const next = curr === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORE.THEME, next);
}

function loadQuizzes(){
  const raw = localStorage.getItem(STORE.QUIZZES);
  try{
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === "object") ? parsed : {};
  }catch{
    return {};
  }
}

function saveQuizzes(obj){
  localStorage.setItem(STORE.QUIZZES, JSON.stringify(obj));
}

function getActiveQuizName(){
  return localStorage.getItem(STORE.ACTIVE) || "";
}
function setActiveQuizName(name){
  localStorage.setItem(STORE.ACTIVE, name);
}

function ensureDefaultQuiz(){
  const quizzes = loadQuizzes();
  const keys = Object.keys(quizzes);
  if (keys.length === 0){
    quizzes["Můj test"] = [];
    saveQuizzes(quizzes);
  }
  if (!getActiveQuizName() || !(getActiveQuizName() in quizzes)){
    setActiveQuizName(Object.keys(quizzes)[0]);
  }
}

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function renderQuizSelect(){
  const quizzes = loadQuizzes();
  const names = Object.keys(quizzes);

  quizSelect.innerHTML = "";
  names.forEach(name => {
    const opt = document.createElement("option");
    opt.value = name;
    opt.textContent = name;
    quizSelect.appendChild(opt);
  });

  quizSelect.value = getActiveQuizName();
}

function loadActivePool(){
  const quizzes = loadQuizzes();
  const name = getActiveQuizName();
  const list = quizzes[name] || [];
  pool = shuffle([...list]);
  index = 0;
  wrongQueue = [];
  locked = false;
  clearTimeout(autoTimer);
}

function ensureQuestions(){
  const quizzes = loadQuizzes();
  const name = getActiveQuizName();
  const list = quizzes[name] || [];

  if (!list.length){
    quizDiv.innerHTML = `
      <h2>V testu „${escapeHtml(name)}“ nejsou žádné otázky</h2>
      <p class="hint">Přidej je ve <a href="admin.html">Správě</a>.</p>
    `;
    restartBtn.disabled = true;
    return false;
  }
  restartBtn.disabled = false;
  return true;
}

function renderQuestion(){
  if (!ensureQuestions()) return;

  locked = false;
  quizDiv.innerHTML = "";

  // konec kola
  if (index >= pool.length){
    if (wrongQueue.length > 0){
      pool = shuffle([...wrongQueue]);
      wrongQueue = [];
      index = 0;
      alert("Opakují se otázky, které byly špatně.");
    } else {
      quizDiv.innerHTML = `<h2>🎉 Hotovo!</h2><p class="hint">Všechny otázky byly zodpovězeny správně.</p>`;
      locked = true;
      return;
    }
  }

  const q = pool[index];

  const title = document.createElement("h2");
  title.className = "q-title";
  title.textContent = q.question;

  const wrap = document.createElement("div");
  wrap.className = "answers";

  const letters = ["a","b","c","d"];
  letters.forEach(letter => {
    const btn = document.createElement("button");
    btn.className = "btn answer";
    btn.innerHTML = `<span class="letter">${letter.toUpperCase()}</span><span class="txt">${escapeHtml(q[letter])}</span>`;
    btn.addEventListener("click", () => handleAnswer(btn, letter, q.correct));
    wrap.appendChild(btn);
  });

  quizDiv.appendChild(title);
  quizDiv.appendChild(wrap);
}

function handleAnswer(clickedBtn, selected, correct){
  if (locked) return;
  locked = true;

  const q = pool[index];
  const buttons = [...quizDiv.querySelectorAll("button.answer")];

  // zamknout tlačítka
  buttons.forEach(b => b.disabled = true);

  // zvýraznit správnou
  const correctText = q[correct];
  buttons.forEach(b => {
    const txt = b.querySelector(".txt")?.textContent?.trim();
    if (txt === correctText) {
      b.classList.add("correct");
      b.insertAdjacentHTML("beforeend", ` <span aria-hidden="true">✅</span>`);
    }
  });

  // když špatně, zvýraznit kliknutou
  if (selected !== correct){
    clickedBtn.classList.add("wrong");
    clickedBtn.insertAdjacentHTML("beforeend", ` <span aria-hidden="true">❌</span>`);
    wrongQueue.push(q);
  }

  // auto přepnutí na další otázku
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    index++;
    renderQuestion();
  }, 650);
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* Events */
quizSelect.addEventListener("change", () => {
  setActiveQuizName(quizSelect.value);
  loadActivePool();
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  loadActivePool();
  renderQuestion();
});

themeBtn.addEventListener("click", toggleTheme);

/* init */
loadTheme();
ensureDefaultQuiz();
renderQuizSelect();
loadActivePool();
renderQuestion();
