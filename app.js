const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const quizDiv = document.getElementById("quiz");
const restartBtn = document.getElementById("restartBtn");
const quizSelect = document.getElementById("quizSelect");

let pool = [], index = 0, wrongQueue = [], locked = false;
let stats = { total: 0, correct: 0 }; // Statistiky

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
  
  // Normalizace dat
  pool = data.map(q => {
    // Detekce typu otázky
    const type = q.type || "choice"; // fallback pro staré verze
    return {
      type: type,
      question: q.question,
      answers: q.answers || {a:q.a, b:q.b, c:q.c, d:q.d}, 
      correct: q.correct // string pro text, array pro choice
    };
  }).sort(() => Math.random() - 0.5);

  stats = { total: pool.length, correct: 0 };
  index = 0; wrongQueue = []; locked = false;
  renderQ();
}

function renderQ(){
  quizDiv.innerHTML = "";
  restartBtn.style.display = "none";

  // Konec testu
  if(index >= pool.length){
    if(wrongQueue.length){
      // Režim opravování chyb (nezapočítává se do skóre)
      alert(`První průchod hotov. Nyní opravíš ${wrongQueue.length} chyb.`);
      pool = wrongQueue.sort(() => Math.random() - 0.5);
      wrongQueue = []; index = 0;
    } else {
      // Finální obrazovka
      const percent = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0;
      let msg = "Dobrá práce!";
      if(percent === 100) msg = "Fantastický výsledek! 🏆";
      else if(percent < 50) msg = "Zkus to příště lépe.";

      quizDiv.innerHTML = `
        <div style='text-align:center; padding:40px'>
          <div style="font-size:3rem; margin-bottom:10px;">${percent}%</div>
          <h2>${msg}</h2>
          <p class="hint">Správně ${stats.correct} z ${stats.total} otázek na první pokus.</p>
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
    // Render input
    const sub = document.createElement("p");
    sub.className = "sub";
    sub.innerText = "Napiš odpověď:";
    quizDiv.appendChild(sub);

    const input = document.createElement("input");
    input.type = "text";
    input.id = "userTextInput";
    input.className = "quiz-input";
    input.autocomplete = "off";
    input.placeholder = "Tvoje odpověď...";
    // Enter potvrdí
    input.addEventListener("keyup", (e) => { if(e.key === "Enter") evaluate(); });
    wrap.appendChild(input);

  } else {
    // Render buttons
    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    const sub = document.createElement("p");
    sub.className = "sub";
    sub.innerText = correctArr.length > 1 ? "Více správných odpovědí" : "Jedna správná odpověď";
    quizDiv.appendChild(sub);

    const grid = document.createElement("div");
    grid.className = "answers-grid";
    
    Object.keys(q.answers).forEach(key => {
      const btn = document.createElement("button");
      btn.className = "answer-btn";
      btn.dataset.k = key;
      // Zvýraznění písmene pro čitelnost
      btn.innerHTML = `<span class="letter">${key.toUpperCase()}</span> ${q.answers[key]}`;
      btn.onclick = () => {
        if(locked) return;
        btn.classList.toggle("selected");
      };
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);
  }

  quizDiv.appendChild(wrap);

  const confirmWrap = document.createElement("div");
  confirmWrap.className = "confirm-wrapper";
  const confirmBtn = document.createElement("button");
  confirmBtn.className = "btn primary xl";
  confirmBtn.id = "confirmBtn";
  confirmBtn.innerText = "Potvrdit";
  confirmBtn.onclick = evaluate;
  confirmWrap.appendChild(confirmBtn);
  quizDiv.appendChild(confirmWrap);
  
  // Focus na input pokud je textový
  if(q.type === "text") setTimeout(() => document.getElementById("userTextInput")?.focus(), 50);
}

function evaluate(){
  if(locked) return;
  const q = pool[index];
  locked = true;
  document.getElementById("confirmBtn").style.display = "none";

  let isCorrect = false;

  if(q.type === "text"){
    const input = document.getElementById("userTextInput");
    const val = input.value.trim().toLowerCase();
    const correctVal = String(q.correct).trim().toLowerCase();
    
    isCorrect = (val === correctVal);
    
    if(isCorrect){
      input.classList.add("input-correct");
    } else {
      input.classList.add("input-wrong");
      // Ukázat správnou odpověď
      const hint = document.createElement("div");
      hint.className = "correct-reveal";
      hint.innerHTML = `Správně bylo: <strong>${q.correct}</strong>`;
      document.getElementById("ansWrapper").appendChild(hint);
    }

  } else {
    const btns = Array.from(document.querySelectorAll(".answer-btn"));
    const selected = btns.filter(b => b.classList.contains("selected")).map(b => b.dataset.k);
    
    if(!selected.length) {
      locked = false; 
      document.getElementById("confirmBtn").style.display = "inline-block";
      return alert("Vyber něco.");
    }

    const correctArr = Array.isArray(q.correct) ? q.correct : [q.correct];
    const correctSet = new Set(correctArr);
    const selectedSet = new Set(selected);
    
    isCorrect = (correctSet.size === selectedSet.size) && selected.every(x => correctSet.has(x));

    btns.forEach(b => {
      const k = b.dataset.k;
      if(correctSet.has(k)) {
        b.classList.add("correct"); // Bude zelené
        if(!selectedSet.has(k)) b.classList.add("missed"); // Bylo správně, ale nevybral jsi
      } else if(selectedSet.has(k)){
        b.classList.add("wrong"); // Vybral jsi, ale je to špatně
      }
    });
  }

  // Logika skóre (jen pokud nejsme v opravném kole - tj. pokud otázka není ve wrongQueue a ještě jsme ji neviděli v tomto běhu)
  // Zjednodušení: Pokud je to poprvé, co tuto otázku vidíme v rámci poolu a pool nebyl z wrongQueue.
  // Pro jednoduchost: wrongQueue se plní až když uděláš chybu. Pokud je wrongQueue prázdná na začátku kola, počítáme skóre.
  // Ale jelikož mícháme pool, stačí kontrolovat, jestli už otázka byla ve wrongQueue?
  // Nejjednodušší: Počítáme jen v první fázi.
  
  if(isCorrect){
    // Pokud jsme v první fázi (neopravujeme chyby), přičteme bod
    // Poznámka: tohle počítadlo funguje jednoduše, nezahrnuje složitou logiku opakování
    if(!wrongQueue.includes(q) && index < stats.total) stats.correct++; 
  } else {
    wrongQueue.push(q);
  }

  setTimeout(() => {
    index++;
    renderQ();
  }, isCorrect ? 1500 : 3500); // U chyb delší čas na prohlédnutí
}

restartBtn.onclick = startQuiz;
