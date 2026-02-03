const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;
// Statistiky: počítáme celkové pokusy a celkové úspěchy pro přesný výpočet %
let stats = { totalAttempts: 0, successfulAttempts: 0 }; 

loadTheme();
init();

function loadTheme(){ document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark"); }
document.getElementById("themeBtn").onclick = () => {
  const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n); localStorage.setItem(STORE.THEME, n);
};

function init(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  quizSelect.innerHTML = "";
  Object.keys(all).forEach(n => {
    const o = document.createElement("option");
    o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  const act = localStorage.getItem(STORE.ACTIVE) || Object.keys(all)[0];
  if(act) quizSelect.value = act;
  startQuiz();
}

quizSelect.onchange = (e) => {
  localStorage.setItem(STORE.ACTIVE, e.target.value);
  startQuiz();
};

function startQuiz(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  const act = localStorage.getItem(STORE.ACTIVE);
  const data = all[act] || [];
  
  pool = data.map(q => ({
    type: q.type || "choice",
    question: q.question,
    answers: q.answers || {}, 
    correct: q.correct 
  })).sort(() => Math.random() - 0.5);

  stats = { totalAttempts: 0, successfulAttempts: 0 };
  index = 0; wrongQueue = []; locked = false;
  renderQ();
}

function renderQ(){
  quizDiv.innerHTML = "";
  restartBtn.style.display = "none";

  if(index >= pool.length){
    if(wrongQueue.length){
      // Opravné kolo (chyby se vrací do oběhu)
      pool = wrongQueue.sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
      const banner = document.createElement("div");
      banner.className = "repair-banner";
      banner.innerText = "🔧 Opravné kolo: Procvičujeme chyby";
      quizDiv.appendChild(banner);
    } else {
      // Výpočet procent z celkových pokusů (úspěchy / pokusy)
      const percent = stats.totalAttempts > 0 
        ? Math.round((stats.successfulAttempts / stats.totalAttempts) * 1000) / 10 : 0;
      
      quizDiv.innerHTML = `
        <div class="stats-final">
          <div class="percent-circle">${percent}%</div>
          <h2>Test dokončen!</h2>
          <div class="stats-grid">
            <div class="stat-box"><span>Pokusů celkem</span><strong>${stats.totalAttempts}</strong></div>
            <div class="stat-box"><span>Správně potvrzeno</span><strong>${stats.successfulAttempts}</strong></div>
          </div>
        </div>`;
      restartBtn.style.display = "inline-block";
      return;
    }
  }

  const q = pool[index];
  locked = false;

  const h2 = document.createElement("h2");
  h2.textContent = q.question;
  quizDiv.appendChild(h2);

  const wrap = document.createElement("div");
  wrap.id = "ansWrapper";

  if(q.type === "text"){
    const input = document.createElement("input");
    input.type = "text";
    input.id = "userTextInput";
    input.className = "quiz-input";
    input.placeholder = "Napiš odpověď...";
    input.autocomplete = "off";
    input.addEventListener("keyup", (e) => { if(e.key === "Enter") evaluate(); });
    wrap.appendChild(input);
  } else {
    const grid = document.createElement("div");
    grid.className = "answers-grid";
    Object.keys(q.answers).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.dataset.k = key;
      btn.innerHTML = `<span class="letter">${key.toUpperCase()}</span> ${q.answers[key]}`;
      btn.onclick = () => { if(!locked) btn.classList.toggle("selected"); };
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }
  quizDiv.appendChild(wrap);

  const confirmWrap = document.createElement("div");
  confirmWrap.className = "confirm-wrapper";
  confirmWrap.innerHTML = `<button id="confirmBtn" class="btn primary xl">Potvrdit odpověď</button>`;
  quizDiv.appendChild(confirmWrap);
  document.getElementById("confirmBtn").onclick = evaluate;
  
  if(q.type === "text") setTimeout(() => document.getElementById("userTextInput")?.focus(), 50);
}

function evaluate(){
  if(locked) return;
  const q = pool[index];
  let isCorrect = false;
  const confirmBtn = document.getElementById("confirmBtn");

  if(q.type === "text"){
    const input = document.getElementById("userTextInput");
    const val = input.value.trim().toLowerCase();
    const correctVal = String(q.correct).trim().toLowerCase();
    if(!val) return; 
    
    locked = true;
    isCorrect = (val === correctVal);
    input.classList.add(isCorrect ? "input-correct" : "input-wrong");
    if(!isCorrect){
      const hint = document.createElement("div");
      hint.className = "correct-reveal";
      hint.innerHTML = `Správně: <strong>${q.correct}</strong>`;
      document.getElementById("ansWrapper").appendChild(hint);
    }
  } else {
    const btns = Array.from(document.querySelectorAll(".answer-btn"));
    const selected = btns.filter(b => b.classList.contains("selected")).map(b => b.dataset.k);
    if(!selected.length) return alert("Vyber aspoň jednu možnost.");

    locked = true;
    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    const correctSet = new Set(correctArr);
    const selectedSet = new Set(selected);
    
    isCorrect = (correctSet.size === selectedSet.size) && selected.every(x => correctSet.has(x));

    btns.forEach(b => {
      const k = b.dataset.k;
      if(correctSet.has(k)) {
        b.classList.add("correct");
        if(!selectedSet.has(k)) b.classList.add("missed");
      } else if(selectedSet.has(k)){
        b.classList.add("wrong");
      }
    });
  }

  // LOGIKA STATISTIK
  stats.totalAttempts++; 
  if(isCorrect) {
    stats.successfulAttempts++; 
  } else {
    wrongQueue.push(q); 
  }

  confirmBtn.style.display = "none";

  setTimeout(() => {
    index++;
    renderQ();
  }, isCorrect ? 1200 : 3000);
}

restartBtn.onclick = startQuiz;
