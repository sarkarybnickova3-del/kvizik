const STORE = { QUIZZES: "quizzes_v2", ACTIVE: "active_quiz_v2", THEME: "theme_v2" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;

// Init
loadTheme();
init();

function loadTheme(){ document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark"); }
document.getElementById("themeBtn").onclick = () => {
  const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n); localStorage.setItem(STORE.THEME, n);
};

function init(){
  const all = JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}");
  
  // Fill Select
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
  
  // Normalizace dat (pro případ starých formátů)
  pool = data.map(q => ({
    question: q.question,
    answers: q.answers || {a:q.a, b:q.b, c:q.c, d:q.d}, // fallback
    correct: Array.isArray(q.correct) ? q.correct : [q.correct]
  })).sort(() => Math.random() - 0.5);

  index = 0; wrongQueue = []; locked = false;
  renderQ();
}

function renderQ(){
  quizDiv.innerHTML = "";
  restartBtn.style.display = "none";

  if(index >= pool.length){
    if(wrongQueue.length){
      alert("Opakování chyb.");
      pool = wrongQueue.sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
    } else {
      quizDiv.innerHTML = "<div style='text-align:center; padding:40px'><h2>Hotovo! 🎉</h2></div>";
      restartBtn.style.display = "inline-block";
      return;
    }
  }

  const q = pool[index];
  locked = false;

  const h2 = document.createElement("h2");
  h2.textContent = q.question;
  quizDiv.appendChild(h2);

  const sub = document.createElement("p");
  sub.className = "sub";
  sub.innerText = q.correct.length > 1 ? "Více správných odpovědí" : "Jedna správná odpověď";
  quizDiv.appendChild(sub);

  const grid = document.createElement("div");
  grid.className = "answers-grid";
  
  Object.keys(q.answers).forEach(key => {
    const btn = document.createElement("button");
    btn.className = "answer-btn";
    btn.dataset.k = key;
    btn.innerHTML = `<span class="letter">${key.toUpperCase()}</span> ${q.answers[key]}`;
    btn.onclick = () => {
      if(locked) return;
      btn.classList.toggle("selected");
    };
    grid.appendChild(btn);
  });
  quizDiv.appendChild(grid);

  const wrap = document.createElement("div");
  wrap.className = "confirm-wrapper";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn primary xl";
  confirmBtn.innerText = "Potvrdit";
  confirmBtn.onclick = evaluate;
  wrap.appendChild(confirmBtn);
  quizDiv.appendChild(wrap);
}

function evaluate(){
  if(locked) return;
  const q = pool[index];
  const btns = Array.from(document.querySelectorAll(".answer-btn"));
  const selected = btns.filter(b => b.classList.contains("selected")).map(b => b.dataset.k);
  
  if(!selected.length) return alert("Vyber něco.");
  
  locked = true;
  document.querySelector(".confirm-wrapper").remove(); // Skrýt potvrdit

  const correctSet = new Set(q.correct);
  const selectedSet = new Set(selected);
  
  let isPerfect = (correctSet.size === selectedSet.size) && selected.every(x => correctSet.has(x));

  btns.forEach(b => {
    const k = b.dataset.k;
    if(correctSet.has(k)) {
      b.classList.add("correct");
      if(!selectedSet.has(k)) b.classList.add("missed"); // Měl vybrat, ale nevybral
    } else if(selectedSet.has(k)){
      b.classList.add("wrong"); // Vybral, ale neměl
    }
  });

  if(!isPerfect) wrongQueue.push(q);

  setTimeout(() => {
    index++;
    renderQ();
  }, 2500);
}

restartBtn.onclick = startQuiz;
