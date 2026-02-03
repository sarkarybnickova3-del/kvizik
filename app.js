// app.js — Test (spolehlivé vyhodnocení)
// Podpora: choice (i více správných), text (více variant)

const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function normalizeAnswer(s){ return String(s ?? "").trim().toLowerCase(); }

function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  try{
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && parsed.tests) return parsed;
  }catch{}
  const id = uid();
  const state = { theme:"dark", activeTestId:id, tests:{ [id]:{ id, name:"Můj test", questions:[] } } };
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  return state;
}
function saveState(state){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function setTheme(theme){ document.documentElement.setAttribute("data-theme", theme || "dark"); }

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function setsEqual(a,b){
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

const quizSelect = document.getElementById("quizSelect");
const themeBtn = document.getElementById("themeBtn");
const quizRoot = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");

let state = loadState();
setTheme(state.theme);

let pool = [];
let wrongQueue = [];
let idx = 0;
let locked = false;
let autoTimer = null;

function getActiveTest(){ return state.tests[state.activeTestId]; }

function renderSelect(){
  quizSelect.innerHTML = "";
  const tests = Object.values(state.tests).sort((a,b)=>a.name.localeCompare(b.name,"cs"));
  for (const t of tests){
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    quizSelect.appendChild(opt);
  }
  quizSelect.value = state.activeTestId;
}

function loadPool(){
  const t = getActiveTest();
  pool = shuffle([...(t.questions || [])]);
  wrongQueue = [];
  idx = 0;
  locked = false;
  clearTimeout(autoTimer);
}

function ensureHasQuestions(){
  const t = getActiveTest();
  if (!t || !t.questions || t.questions.length === 0){
    quizRoot.innerHTML = `
      <h2 class="quiz-title">V testu „${escapeHtml(t?.name || "—")}“ nejsou otázky</h2>
      <p class="quiz-sub">Přidej je ve Správě.</p>
      <div class="note">Otevři <a href="admin.html">Správu</a> a přidej otázky.</div>
    `;
    restartBtn.disabled = true;
    return false;
  }
  restartBtn.disabled = false;
  return true;
}

function autoAdvance(isWrong){
  if (isWrong) wrongQueue.push(pool[idx]);
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    idx++;
    renderQuestion();
  }, 650);
}

function renderQuestion(){
  if (!ensureHasQuestions()) return;

  locked = false;
  quizRoot.innerHTML = "";

  if (idx >= pool.length){
    if (wrongQueue.length > 0){
      pool = shuffle([...wrongQueue]);
      wrongQueue = [];
      idx = 0;
      alert("Opakují se otázky, které byly špatně.");
    } else {
      quizRoot.innerHTML = `
        <h2 class="quiz-title">🎉 Hotovo!</h2>
        <p class="quiz-sub">Všechny otázky byly zodpovězeny správně.</p>
        <div class="note">Můžeš dát Restart nebo přepnout test v horním menu.</div>
      `;
      locked = true;
      return;
    }
  }

  const q = pool[idx];

  const title = document.createElement("h2");
  title.className = "quiz-title";
  title.textContent = q.prompt || "Otázka";

  const sub = document.createElement("p");
  sub.className = "quiz-sub";
  if (q.type === "text") sub.textContent = "Napiš odpověď a potvrď.";
  else sub.textContent = (Array.isArray(q.correct) && q.correct.length > 1) ? "Vyber všechny správné a potvrď." : "Vyber odpověď.";

  quizRoot.appendChild(title);
  quizRoot.appendChild(sub);

  if (q.type === "text") renderTextQuestion(q);
  else renderChoiceQuestion(q);
}

function renderChoiceQuestion(q){
  const answers = Array.isArray(q.answers) ? q.answers : [];
  const correctSet = new Set(Array.isArray(q.correct) ? q.correct : []);
  const multi = correctSet.size > 1;

  const wrap = document.createElement("div");
  wrap.className = "answer-grid";

  const selected = new Set();

  answers.forEach((ans, i) => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.type = "button";
    btn.dataset.id = ans.id;
    btn.innerHTML = `<span class="letter">${String.fromCharCode(65+i)}</span><span class="txt">${escapeHtml(ans.text)}</span>`;

    btn.addEventListener("click", () => {
      if (locked) return;

      if (!multi){
        selected.clear();
        selected.add(ans.id);
        evaluateChoice(selected, correctSet, wrap);
      } else {
        if (selected.has(ans.id)) selected.delete(ans.id);
        else selected.add(ans.id);
        btn.classList.toggle("selected", selected.has(ans.id));
      }
    });

    wrap.appendChild(btn);
  });

  quizRoot.appendChild(wrap);

  if (multi){
    const row = document.createElement("div");
    row.className = "row";

    const submit = document.createElement("button");
    submit.className = "btn primary";
    submit.type = "button";
    submit.textContent = "Odeslat";
    submit.addEventListener("click", () => {
      if (locked) return;
      if (selected.size === 0) return alert("Vyber aspoň jednu možnost.");
      evaluateChoice(selected, correctSet, wrap);
    });

    const clear = document.createElement("button");
    clear.className = "btn ghost";
    clear.type = "button";
    clear.textContent = "Vymazat výběr";
    clear.addEventListener("click", () => {
      if (locked) return;
      selected.clear();
      wrap.querySelectorAll(".answer-btn").forEach(b => b.classList.remove("selected"));
    });

    row.appendChild(submit);
    row.appendChild(clear);
    quizRoot.appendChild(row);
  }
}

function evaluateChoice(selectedSet, correctSet, wrap){
  locked = true;
  const buttons = [...wrap.querySelectorAll(".answer-btn")];
  buttons.forEach(b => b.disabled = true);

  buttons.forEach(b => {
    const id = b.dataset.id;
    const isCorrect = correctSet.has(id);
    const wasSelected = selectedSet.has(id);

    if (isCorrect) b.classList.add("correct");
    if (wasSelected && !isCorrect) b.classList.add("wrong");
  });

  const ok = setsEqual(selectedSet, correctSet);
  autoAdvance(!ok);
}

function renderTextQuestion(q){
  const acceptable = new Set((Array.isArray(q.correctText) ? q.correctText : [])
    .map(normalizeAnswer)
    .filter(Boolean));

  const row = document.createElement("div");
  row.className = "text-answer";

  const input = document.createElement("input");
  input.placeholder = "Napiš odpověď…";
  input.autocomplete = "off";

  const submit = document.createElement("button");
  submit.className = "btn primary";
  submit.type = "button";
  submit.textContent = "Odeslat";

  const feedback = document.createElement("div");
  feedback.className = "note hidden";

  function evalNow(){
    if (locked) return;
    const v = normalizeAnswer(input.value);
    if (!v) return alert("Napiš odpověď.");
    locked = true;

    const ok = acceptable.size > 0 ? acceptable.has(v) : false;

    feedback.classList.remove("hidden");
    if (ok){
      feedback.textContent = "✅ Správně";
      feedback.style.borderColor = "color-mix(in srgb, var(--ok) 60%, var(--border))";
      feedback.style.color = "color-mix(in srgb, var(--ok) 80%, var(--text))";
    } else {
      feedback.textContent = "❌ Špatně. Správně: " + (q.correctText?.[0] || "—");
      feedback.style.borderColor = "color-mix(in srgb, var(--bad) 60%, var(--border))";
      feedback.style.color = "color-mix(in srgb, var(--bad) 80%, var(--text))";
    }

    input.disabled = true;
    submit.disabled = true;

    autoAdvance(!ok);
  }

  submit.addEventListener("click", evalNow);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") evalNow(); });

  row.appendChild(input);
  row.appendChild(submit);
  quizRoot.appendChild(row);
  quizRoot.appendChild(feedback);
}

/* Events */
quizSelect.addEventListener("change", () => {
  state.activeTestId = quizSelect.value;
  saveState(state);
  loadPool();
  renderQuestion();
});

restartBtn.addEventListener("click", () => {
  state = loadState(); // refresh (admin changes)
  setTheme(state.theme);
  renderSelect();
  loadPool();
  renderQuestion();
});

themeBtn.addEventListener("click", () => {
  state.theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
  setTheme(state.theme);
  saveState(state);
});

/* init */
renderSelect();
loadPool();
renderQuestion();
