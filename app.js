const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;
let stats = { totalAttempts: 0, successfulAttempts: 0 }; 

function init(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  quizSelect.innerHTML = "";
  Object.keys(all).forEach(n => {
    const o = document.createElement("option"); o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  const act = localStorage.getItem(STORE.ACTIVE) || Object.keys(all)[0];
  if(act) quizSelect.value = act;
  document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark");
  startQuiz();
}

quizSelect.onchange = (e) => { localStorage.setItem(STORE.ACTIVE, e.target.value); startQuiz(); };

function startQuiz(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  const data = all[quizSelect.value] || [];
  pool = [...data].sort(() => Math.random() - 0.5);
  stats = { totalAttempts: 0, successfulAttempts: 0 };
  index = 0; wrongQueue = []; locked = false;
  renderQ();
}

function renderQ(){
  quizDiv.innerHTML = ""; restartBtn.classList.add("hidden");
  if(index >= pool.length){
    if(wrongQueue.length){
      pool = [...wrongQueue].sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
      quizDiv.innerHTML = `<div style="text-align:center; color:var(--primary); font-weight:bold; margin-bottom:20px;">🔧 OPRAVNÉ KOLO</div>`;
    } else {
      const p = stats.totalAttempts > 0 ? Math.round((stats.successfulAttempts / stats.totalAttempts) * 1000) / 10 : 0;
      quizDiv.innerHTML = `
        <div class="stats-final">
          <span class="percent-display">${p}%</span>
          <div class="stats-sub">TEST DOKONČEN</div>
          <div class="stats-grid">
            <div class="stat-box"><strong>${stats.successfulAttempts}</strong><span>Správně</span></div>
            <div class="stat-box"><strong>${stats.totalAttempts}</strong><span>Pokusů</span></div>
          </div>
        </div>`;
      restartBtn.classList.remove("hidden"); return;
    }
  }

  const q = pool[index]; locked = false;
  const h2 = document.createElement("h2"); h2.className = "quiz-q-title"; h2.textContent = q.question;
  quizDiv.appendChild(h2);

  const wrap = document.createElement("div"); wrap.id = "ansWrapper";
  if(q.type === "text"){
    const input = document.createElement("input"); input.className = "answer-btn"; style="text-align:center";
    input.id = "userTextInput"; input.placeholder = "Napiš odpověď a potvrď...";
    input.onkeyup = (e) => { if(e.key === "Enter") evaluate(); };
    wrap.appendChild(input);
  } else {
    Object.keys(q.answers).forEach(k => {
      const b = document.createElement("button"); b.className = "answer-btn";
      b.innerHTML = `<span class="letter">${k.toUpperCase()}</span> ${q.answers[k]}`;
      b.onclick = () => { if(!locked) b.classList.toggle("selected"); };
      b.dataset.k = k; wrap.appendChild(b);
    });
  }
  quizDiv.appendChild(wrap);
  const foot = document.createElement("div"); foot.id = "actionArea";
  foot.innerHTML = `<button onclick="evaluate()" class="btn primary xl">Potvrdit odpověď</button>`;
  quizDiv.appendChild(foot);
}

function evaluate(){
  if(locked) return; const q = pool[index]; let ok = false;
  if(q.type === "text"){
    const i = document.getElementById("userTextInput");
    ok = (i.value.trim().toLowerCase() === String(q.correct).toLowerCase());
    i.style.borderColor = ok ? "var(--ok)" : "var(--bad)";
  } else {
    const sel = [...document.querySelectorAll(".answer-btn.selected")].map(b => b.dataset.k);
    if(!sel.length) return;
    const corr = Array.isArray(q.correct) ? q.correct : [q.correct];
    ok = (corr.length === sel.length && sel.every(v => corr.includes(v)));
    document.querySelectorAll(".answer-btn").forEach(b => {
      if(corr.includes(b.dataset.k)) b.classList.add("correct");
      else if(sel.includes(b.dataset.k)) b.classList.add("wrong");
    });
  }
  locked = true; stats.totalAttempts++; if(ok) stats.successfulAttempts++; else wrongQueue.push(q);
  document.getElementById("actionArea").innerHTML = `<button onclick="index++; renderQ();" class="btn primary xl" style="background:var(--ok)">Další otázka ➔</button>`;
}

init();
