const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const LETTERS = ["a","b","c","d","e","f","g","h"];
let currentAnswerCount = 4;

function loadQuizzes(){ return JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}"); }
function saveQuizzes(d){ localStorage.setItem(STORE.QUIZZES, JSON.stringify(d)); render(); }
function getActive(){ return localStorage.getItem(STORE.ACTIVE) || ""; }

const qTypeSelect = document.getElementById("qTypeSelect");
qTypeSelect.onchange = () => {
  document.getElementById("choiceArea").classList.toggle("hidden", qTypeSelect.value !== "choice");
  document.getElementById("textArea").classList.toggle("hidden", qTypeSelect.value !== "text");
};

function renderAnsInputs(){
  const cont = document.getElementById("answersContainer");
  cont.innerHTML = "";
  for(let i=0; i<currentAnswerCount; i++){
    const d = document.createElement("div");
    d.style.display = "flex"; d.style.gap = "15px"; d.style.marginBottom = "10px";
    d.innerHTML = `
      <input type="checkbox" style="width:30px; height:30px; margin-top:15px"> 
      <input type="text" placeholder="Možnost ${LETTERS[i].toUpperCase()}" style="margin-bottom:0">`;
    cont.appendChild(d);
  }
}

document.getElementById("saveQuestionBtn").onclick = () => {
  const text = document.getElementById("questionInput").value.trim();
  const all = loadQuizzes();
  const active = getActive();
  if(!text || !active) return alert("Chybí otázka nebo vybraný test!");

  let newQ = { question: text, type: qTypeSelect.value };
  if(qTypeSelect.value === "choice"){
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

  all[active].push(newQ);
  saveQuizzes(all);
  document.getElementById("questionInput").value = "";
};

function render(){
  const all = loadQuizzes();
  const act = getActive() || Object.keys(all)[0];
  const sel = document.getElementById("quizSelect");
  sel.innerHTML = "";
  Object.keys(all).forEach(k => {
    const o = document.createElement("option"); o.value = k; o.innerText = k;
    sel.appendChild(o);
  });
  sel.value = act;
  
  const list = all[act] || [];
  document.getElementById("count").innerText = list.length;
  const listEl = document.getElementById("list");
  listEl.innerHTML = "";
  list.forEach((q, i) => {
    const d = document.createElement("div");
    d.style.cssText = "background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between";
    d.innerHTML = `<span>${q.question}</span><button class="btn" onclick="deleteQ(${i})" style="background:#ef4444; color:white; padding:5px 15px">Smazat</button>`;
    listEl.appendChild(d);
  });
}

window.deleteQ = (i) => {
  const all = loadQuizzes();
  all[getActive()].splice(i, 1);
  saveQuizzes(all);
};

document.getElementById("createQuizBtn").onclick = () => {
  const n = document.getElementById("newQuizName").value.trim();
  if(!n) return;
  const q = loadQuizzes(); q[n] = [];
  localStorage.setItem(STORE.ACTIVE, n);
  saveQuizzes(q);
};

document.getElementById("addAnsBtn").onclick = () => { currentAnswerCount++; renderAnsInputs(); };
document.getElementById("remAnsBtn").onclick = () => { if(currentAnswerCount>1) currentAnswerCount--; renderAnsInputs(); };

document.getElementById("quizSelect").onchange = (e) => {
  localStorage.setItem(STORE.ACTIVE, e.target.value);
  render();
};

renderAnsInputs();
render();
