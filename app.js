const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;
let stats = { total: 0, ok: 0 };

function init() {
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  quizSelect.innerHTML = Object.keys(all).length ? "" : "<option>Žádné testy</option>";
  Object.keys(all).forEach(n => {
    const o = document.createElement("option"); o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  
  const act = localStorage.getItem(STORE.ACTIVE) || Object.keys(all)[0];
  if(act) { quizSelect.value = act; startQuiz(); }
  document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark");
}

function startQuiz() {
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  const data = all[quizSelect.value] || [];
  pool = [...data].sort(() => Math.random() - 0.5);
  stats = { total: 0, ok: 0 };
  index = 0; wrongQueue = [];
  renderQ();
}

function renderQ() {
  quizDiv.innerHTML = "";
  restartBtn.classList.add("hidden");
  
  if(index >= pool.length) {
    if(wrongQueue.length) {
      pool = [...wrongQueue].sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
      quizDiv.innerHTML = `<h3 style="text-align:center; color:var(--primary)">🔧 Opravné kolo (chyby)</h3>`;
    } else {
      const score = stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0;
      quizDiv.innerHTML = `<div style="text-align:center"><h2>Hotovo!</h2><h1 style="font-size:3rem">${score}%</h1><p>Správně: ${stats.ok} z ${stats.total}</p></div>`;
      restartBtn.classList.remove("hidden");
      return;
    }
  }

  const q = pool[index];
  locked = false;
  
  const title = document.createElement("h2");
  title.className = "quiz-q-title";
  title.textContent = q.question;
  quizDiv.appendChild(title);

  const wrap = document.createElement("div");
  wrap.id = "ansWrapper";

  if(q.type === "text") {
    const input = document.createElement("input");
    input.className = "big-input";
    input.id = "userTextInput";
    input.placeholder = "Napište odpověď...";
    input.onkeyup = (e) => { if(e.key === "Enter") evaluate(); };
    wrap.appendChild(input);
  } else {
    Object.keys(q.answers).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.innerHTML = `<b style="margin-right:15px">${key.toUpperCase()}</b> ${q.answers[key]}`;
      btn.onclick = () => { if(!locked) btn.classList.toggle("selected"); };
      btn.dataset.key = key;
      wrap.appendChild(btn);
    });
  }
  
  quizDiv.appendChild(wrap);
  const btnArea = document.createElement("div");
  btnArea.id = "btnArea";
  btnArea.innerHTML = `<button onclick="evaluate()" class="btn primary xl">Potvrdit</button>`;
  quizDiv.appendChild(btnArea);
}

function evaluate() {
  if(locked) return;
  const q = pool[index];
  let isCorrect = false;

  if(q.type === "text") {
    const input = document.getElementById("userTextInput");
    isCorrect = input.value.trim().toLowerCase() === q.correct.toLowerCase();
    input.classList.add(isCorrect ? "input-correct" : "input-wrong");
    if(!isCorrect) {
      const info = document.createElement("p");
      info.innerHTML = `Správná odpověď: <b style="color:var(--ok)">${q.correct}</b>`;
      info.style.textAlign = "center";
      document.getElementById("ansWrapper").appendChild(info);
    }
  } else {
    const btns = document.querySelectorAll(".answer-btn");
    const selected = Array.from(btns).filter(b => b.classList.contains("selected")).map(b => b.dataset.key);
    if(!selected.length) return alert("Vyber aspoň jednu možnost!");
    
    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    isCorrect = selected.length === correctArr.length && selected.every(v => correctArr.includes(v));
    
    btns.forEach(b => {
      if(correctArr.includes(b.dataset.key)) b.classList.add("correct");
      else if(b.classList.contains("selected")) b.classList.add("wrong");
    });
  }

  locked = true;
  stats.total++;
  if(isCorrect) stats.ok++; else wrongQueue.push(q);
  
  document.getElementById("btnArea").innerHTML = `<button onclick="index++; renderQ()" class="btn primary xl" style="background:var(--ok)">Další otázka ➔</button>`;
}

document.getElementById("themeBtn").onclick = () => {
  const t = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", t);
  localStorage.setItem(STORE.THEME, t);
};

quizSelect.onchange = (e) => { localStorage.setItem(STORE.ACTIVE, e.target.value); startQuiz(); };
restartBtn.onclick = startQuiz;
init();
