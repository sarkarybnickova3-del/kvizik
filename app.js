const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;
let stats = { total: 0, ok: 0 };

function init() {
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  Object.keys(all).forEach(n => {
    const o = document.createElement("option"); o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  const act = localStorage.getItem(STORE.ACTIVE) || Object.keys(all)[0];
  if(act) { quizSelect.value = act; startQuiz(); }
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
      quizDiv.innerHTML = `<h3 style="text-align:center; color:var(--primary)">🔧 Opravné kolo</h3>`;
    } else {
      const score = stats.total > 0 ? Math.round((stats.ok / stats.total) * 100) : 0;
      quizDiv.innerHTML = `<div style="text-align:center"><h2>Hotovo! Skóre: ${score}%</h2></div>`;
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
    wrap.appendChild(input);
  } else {
    Object.keys(q.answers).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.innerHTML = `<b>${key.toUpperCase()}</b>: ${q.answers[key]}`;
      btn.onclick = () => { if(!locked) btn.classList.toggle("selected"); };
      btn.dataset.key = key;
      wrap.appendChild(btn);
    });
  }
  
  quizDiv.appendChild(wrap);
  const actionArea = document.createElement("div");
  actionArea.id = "actionArea";
  actionArea.innerHTML = `<button onclick="evaluate()" class="btn primary xl">Potvrdit odpověď</button>`;
  quizDiv.appendChild(actionArea);
}

function evaluate() {
  if(locked) return;
  const q = pool[index];
  let isCorrect = false;

  if(q.type === "text") {
    const input = document.getElementById("userTextInput");
    const val = input.value.trim().toLowerCase();
    isCorrect = (val === String(q.correct).toLowerCase());
    input.classList.add(isCorrect ? "input-correct" : "input-wrong");
    if(!isCorrect) {
      const hint = document.createElement("p");
      hint.innerHTML = `Správně: <b style="color:var(--ok)">${q.correct}</b>`;
      hint.style.textAlign = "center";
      document.getElementById("ansWrapper").appendChild(hint);
    }
  } else {
    const btns = document.querySelectorAll(".answer-btn");
    const selected = Array.from(btns).filter(b => b.classList.contains("selected")).map(b => b.dataset.key);
    if(!selected.length) return alert("Vyberte odpověď!");

    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    isCorrect = (selected.length === correctArr.length && selected.every(v => correctArr.includes(v)));
    
    btns.forEach(b => {
      if(correctArr.includes(b.dataset.key)) b.classList.add("correct");
      else if(b.classList.contains("selected")) b.classList.add("wrong");
    });
  }

  locked = true;
  stats.total++;
  if(isCorrect) stats.ok++; else wrongQueue.push(q);
  
  document.getElementById("actionArea").innerHTML = `<button onclick="index++; renderQ()" class="btn primary xl" style="background:var(--ok)">Další otázka ➔</button>`;
}

quizSelect.onchange = (e) => { localStorage.setItem(STORE.ACTIVE, e.target.value); startQuiz(); };
restartBtn.onclick = startQuiz;
init();
