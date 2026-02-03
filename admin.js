const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const LETTERS = ["a","b","c","d","e","f","g","h"];
let currentAnswerCount = 4;

function loadQuizzes(){ return JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}"); }
function saveQuizzes(d){ localStorage.setItem(STORE.QUIZZES, JSON.stringify(d)); render(); }
function getActive(){ return localStorage.getItem(STORE.ACTIVE) || ""; }

document.getElementById("createQuizBtn").onclick = () => {
  const n = document.getElementById("newQuizName").value.trim();
  if(!n) return; const q = loadQuizzes(); q[n] = [];
  localStorage.setItem(STORE.ACTIVE, n); saveQuizzes(q);
};

document.getElementById("deleteQuizBtn").onclick = () => {
  const a = getActive(); if(!a || !confirm("Smazat celý test?")) return;
  const q = loadQuizzes(); delete q[a];
  const keys = Object.keys(q); localStorage.setItem(STORE.ACTIVE, keys[0] || "");
  saveQuizzes(q);
};

document.getElementById("saveQuestionBtn").onclick = () => {
  const qText = document.getElementById("questionInput").value.trim();
  const active = getActive(); if(!qText || !active) return;
  const all = loadQuizzes();
  const type = document.getElementById("qTypeSelect").value;
  let newQ = { question: qText, type: type };

  if(type === "choice"){
    let ans = {}, corr = [];
    document.querySelectorAll("#answersContainer > div").forEach((div, i) => {
      const val = div.querySelector("input[type=text]").value.trim();
      if(val){
        ans[LETTERS[i]] = val;
        if(div.querySelector("input[type=checkbox]").checked) corr.push(LETTERS[i]);
      }
    });
    newQ.answers = ans; newQ.correct = corr;
  } else {
    newQ.correct = document.getElementById("textCorrectInput").value.trim();
  }
  all[active].push(newQ); saveQuizzes(all);
  document.getElementById("questionInput").value = "";
};

function render(){
  const all = loadQuizzes(); const act = getActive();
  const sel = document.getElementById("quizSelect"); sel.innerHTML = "";
  Object.keys(all).forEach(k => {
    const o = document.createElement("option"); o.value = k; o.innerText = k; sel.appendChild(o);
  });
  sel.value = act;
  const list = all[act] || []; document.getElementById("count").innerText = list.length;
  const listEl = document.getElementById("list"); listEl.innerHTML = "";
  list.forEach((q, i) => {
    const d = document.createElement("div"); d.style.cssText = "background:rgba(255,255,255,0.05); padding:10px; margin-bottom:5px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;";
    d.innerHTML = `<span>${q.question}</span><button class="btn" onclick="deleteQ(${i})" style="background:#ef4444; color:white; padding:5px 10px">Smazat</button>`;
    listEl.appendChild(d);
  });
}

window.deleteQ = (i) => { const q = loadQuizzes(); q[getActive()].splice(i,1); saveQuizzes(q); };

document.getElementById("exportBtn").onclick = () => {
  const all = loadQuizzes(); const act = getActive();
  const blob = new Blob([JSON.stringify(all[act], null, 2)], {type: "application/json"});
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `${act}.json`; a.click();
};

document.getElementById("importFile").onchange = (e) => {
  const reader = new FileReader();
  reader.onload = (ev) => {
    const all = loadQuizzes(); all[getActive()] = JSON.parse(ev.target.result); saveQuizzes(all);
  };
  reader.readAsText(e.target.files[0]);
};

document.getElementById("qTypeSelect").onchange = (e) => {
  document.getElementById("choiceArea").classList.toggle("hidden", e.target.value !== "choice");
  document.getElementById("textArea").classList.toggle("hidden", e.target.value !== "text");
};

function renderAnsInputs(){
  const c = document.getElementById("answersContainer"); c.innerHTML = "";
  for(let i=0; i<currentAnswerCount; i++){
    const d = document.createElement("div"); d.style.display="flex"; d.style.gap="10px"; d.style.marginBottom="5px";
    d.innerHTML = `<input type="checkbox" style="width:25px"> <input type="text" placeholder="Možnost ${LETTERS[i].toUpperCase()}" style="flex:1; padding:10px; background:var(--bg); color:white; border:1px solid var(--border); border-radius:8px;">`;
    c.appendChild(d);
  }
}
document.getElementById("addAnsBtn").onclick = () => { currentAnswerCount++; renderAnsInputs(); };
document.getElementById("quizSelect").onchange = (e) => { localStorage.setItem(STORE.ACTIVE, e.target.value); render(); };

renderAnsInputs(); render();
