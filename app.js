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
    const o = document.createElement("option");
    o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  const act = localStorage.getItem(STORE.ACTIVE) || Object.keys(all)[0];
  if(act) quizSelect.value = act;
  document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark");
  startQuiz();
}

document.getElementById("themeBtn").onclick = () => {
  const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem(STORE.THEME, n);
};

quizSelect.onchange = (e) => {
  localStorage.setItem(STORE.ACTIVE, e.target.value);
  startQuiz();
};

function startQuiz(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  const act = localStorage.getItem(STORE.ACTIVE);
  const data = all[act] || [];
  pool = data.sort(() => Math.random() - 0.5);
  stats = { totalAttempts: 0, successfulAttempts: 0 };
  index = 0; wrongQueue = []; locked = false;
  renderQ();
}

function renderQ(){
  quizDiv.innerHTML = "";
  restartBtn.style.display = "none";
  if(index >= pool.length){
    if(wrongQueue.length){
      pool = wrongQueue.sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
      quizDiv.innerHTML = `<div style="text-align:center;color:var(--primary);margin-bottom:15px;font-weight:bold">🔧 Opravné kolo</div>`;
    } else {
      const percent = stats.totalAttempts > 0 ? Math.round((stats.successfulAttempts / stats.totalAttempts) * 1000) / 10 : 0;
      quizDiv.innerHTML = `<div style="text-align:center">
        <h1 style="font-size:4rem;color:var(--primary)">${percent}%</h1>
        <h2>Test dokončen!</h2>
        <p>Pokusů: ${stats.totalAttempts} | Správně: ${stats.successfulAttempts}</p>
      </div>`;
      restartBtn.style.display = "block";
      return;
    }
  }

  const q = pool[index];
  locked = false;
  const h2 = document.createElement("h2");
  h2.className = "quiz-q-title";
  h2.textContent = q.question;
  quizDiv.appendChild(h2);

  const wrap = document.createElement("div");
  wrap.id = "ansWrapper";
  if(q.type === "text"){
    const input = document.createElement("input");
    input.className = "quiz-input big-input";
    input.id = "userTextInput";
    input.placeholder = "Napiš odpověď...";
    input.onkeyup = (e) => { if(e.key === "Enter") evaluate(); };
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
  const actionArea = document.createElement("div");
  actionArea.id = "actionArea";
  actionArea.innerHTML = `<button onclick="evaluate()" class="btn primary xl">Potvrdit odpověď</button>`;
  quizDiv.appendChild(actionArea);
  if(q.type === "text") setTimeout(() => document.getElementById("userTextInput")?.focus(), 50);
}

function evaluate(){
  if(locked) return;
  const q = pool[index];
  let isCorrect = false;
  if(q.type === "text"){
    const input = document.getElementById("userTextInput");
    const val = input.value.trim().toLowerCase();
    isCorrect = (val === String(q.correct).toLowerCase());
    input.classList.add(isCorrect ? "input-correct" : "input-wrong");
    if(!isCorrect) {
      const r = document.createElement("div");
      r.style.cssText = "color:var(--ok); font-weight:bold; text-align:center; margin-top:10px;";
      r.innerText = "Správně: " + q.correct;
      document.getElementById("ansWrapper").appendChild(r);
    }
  } else {
    const btns = Array.from(document.querySelectorAll(".answer-btn"));
    const selected = btns.filter(b => b.classList.contains("selected")).map(b => b.dataset.k);
    if(!selected.length) return alert("Vyber odpověď!");
    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    isCorrect = (correctArr.length === selected.length && selected.every(v => correctArr.includes(v)));
    btns.forEach(b => {
      const k = b.dataset.k;
      if(correctArr.includes(k)) b.classList.add("correct");
      else if(selected.includes(k)) b.classList.add("wrong");
    });
  }
  locked = true;
  stats.totalAttempts++;
  if(isCorrect) stats.successfulAttempts++; else wrongQueue.push(q);
  document.getElementById("actionArea").innerHTML = `<button onclick="nextQ()" class="btn primary xl" style="background:var(--ok)">Další otázka ➔</button>`;
}

function nextQ(){ index++; renderQ(); }
restartBtn.onclick = startQuiz;
init();
