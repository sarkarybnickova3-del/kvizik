const STORE = { QUIZZES: "quizzes_v2", ACTIVE: "active_quiz_v2", THEME: "theme_v2" };
const LETTERS = ["a","b","c","d","e","f","g","h"];
const MAX_ANSWERS = 8;
let currentAnswerCount = 2;

// Elements
const quizSelect = document.getElementById("quizSelect");
const newQuizName = document.getElementById("newQuizName");
const createQuizBtn = document.getElementById("createQuizBtn");
const deleteQuizBtn = document.getElementById("deleteQuizBtn");
const questionInput = document.getElementById("questionInput");
const answersContainer = document.getElementById("answersContainer");
const addAnsBtn = document.getElementById("addAnsBtn");
const remAnsBtn = document.getElementById("remAnsBtn");
const saveQuestionBtn = document.getElementById("saveQuestionBtn");
const seedBtn = document.getElementById("seedBtn");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

// Init
loadTheme();
ensureDefaultQuiz();
renderAnswerInputs();
render();

// --- Functions ---

function loadTheme(){ document.documentElement.setAttribute("data-theme", localStorage.getItem(STORE.THEME) || "dark"); }
document.getElementById("themeBtn").onclick = () => {
  const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n); localStorage.setItem(STORE.THEME, n);
};

function loadQuizzes(){ return JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}"); }
function saveQuizzes(d){ localStorage.setItem(STORE.QUIZZES, JSON.stringify(d)); render(); }
function getActive(){ return localStorage.getItem(STORE.ACTIVE) || ""; }
function setActive(n){ localStorage.setItem(STORE.ACTIVE, n); }

function ensureDefaultQuiz(){
  let q = loadQuizzes();
  if(!Object.keys(q).length) { q["Obecný test"] = []; saveQuizzes(q); }
  if(!getActive() || !q[getActive()]) setActive(Object.keys(q)[0]);
}

// UI for Answers
function renderAnswerInputs(){
  // Zachovat hodnoty
  const oldVals = {};
  answersContainer.querySelectorAll("input[type=text]").forEach((inp, i) => oldVals[LETTERS[i]] = inp.value);
  const oldChecks = {};
  answersContainer.querySelectorAll("input[type=checkbox]").forEach((inp, i) => oldChecks[LETTERS[i]] = inp.checked);

  answersContainer.innerHTML = "";
  for(let i=0; i<currentAnswerCount; i++){
    const l = LETTERS[i];
    const row = document.createElement("div");
    row.className = "answer-row";
    row.innerHTML = `
      <div class="ans-badge">${l.toUpperCase()}</div>
      <input type="text" data-l="${l}" placeholder="Odpověď" value="${oldVals[l]||''}">
      <label class="check-label"><input type="checkbox" ${oldChecks[l]?'checked':''}> Správně</label>
    `;
    answersContainer.appendChild(row);
  }
  addAnsBtn.disabled = currentAnswerCount >= MAX_ANSWERS;
  remAnsBtn.disabled = currentAnswerCount <= 2;
}

addAnsBtn.onclick = () => { if(currentAnswerCount < MAX_ANSWERS) { currentAnswerCount++; renderAnswerInputs(); }};
remAnsBtn.onclick = () => { if(currentAnswerCount > 2) { currentAnswerCount--; renderAnswerInputs(); }};

// Logic
saveQuestionBtn.onclick = () => {
  const qText = questionInput.value.trim();
  if(!qText) return alert("Chybí otázka!");
  
  const answers = {}, correct = [];
  const inputs = answersContainer.querySelectorAll("input[type=text]");
  const checks = answersContainer.querySelectorAll("input[type=checkbox]");
  
  let filled = 0;
  inputs.forEach((inp, i) => {
    if(inp.value.trim()){
      answers[LETTERS[i]] = inp.value.trim();
      if(checks[i].checked) correct.push(LETTERS[i]);
      filled++;
    }
  });

  if(filled < 2) return alert("Vyplň aspoň 2 odpovědi.");
  if(correct.length === 0) return alert("Označ aspoň jednu správnou.");

  const q = loadQuizzes();
  q[getActive()].push({ question: qText, answers, correct });
  saveQuizzes(q);
  
  questionInput.value = "";
  currentAnswerCount = 2; renderAnswerInputs();
};

createQuizBtn.onclick = () => {
  const n = newQuizName.value.trim();
  if(!n) return;
  const q = loadQuizzes();
  if(q[n]) return alert("Už existuje.");
  q[n] = []; saveQuizzes(q); setActive(n); newQuizName.value = "";
};

deleteQuizBtn.onclick = () => {
  if(!confirm("Smazat?")) return;
  const q = loadQuizzes();
  delete q[getActive()];
  if(!Object.keys(q).length) q["Nový test"] = [];
  saveQuizzes(q); setActive(Object.keys(q)[0]);
};

function render(){
  const q = loadQuizzes();
  const act = getActive();
  
  quizSelect.innerHTML = "";
  Object.keys(q).forEach(n => {
    const o = document.createElement("option");
    o.value = n; o.innerText = n;
    quizSelect.appendChild(o);
  });
  quizSelect.value = act;

  const list = q[act] || [];
  countEl.innerText = list.length;
  listEl.innerHTML = "";
  
  list.slice().reverse().forEach((item, revI) => {
    const realI = list.length - 1 - revI;
    const div = document.createElement("div");
    div.className = "item";
    let badges = "";
    Object.keys(item.answers).forEach(k => {
      const isOk = item.correct.includes(k);
      badges += `<span class="pill ${isOk?'ok':''}">${k}) ${item.answers[k]}</span>`;
    });
    div.innerHTML = `<div class="item-head"><strong>${item.question}</strong><button class="btn danger small" onclick="delQ(${realI})">X</button></div><div>${badges}</div>`;
    listEl.appendChild(div);
  });
}

window.delQ = (i) => {
  const q = loadQuizzes(); q[getActive()].splice(i,1); saveQuizzes(q);
};
quizSelect.onchange = (e) => { setActive(e.target.value); render(); };

seedBtn.onclick = () => {
  const q = loadQuizzes();
  q[getActive()] = [
    { question: "Co je ovoce?", answers: {a:"Jablko",b:"Auto",c:"Hruška"}, correct: ["a","c"] },
    { question: "Kolik je 1+1?", answers: {a:"3",b:"2"}, correct: ["b"] }
  ];
  saveQuizzes(q);
};

exportBtn.onclick = () => {
  const d = { name: getActive(), questions: loadQuizzes()[getActive()] };
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([JSON.stringify(d)], {type:"application/json"}));
  a.download = "test.json"; a.click();
};

importFile.onchange = (e) => {
  const r = new FileReader();
  r.onload = (ev) => {
    const d = JSON.parse(ev.target.result);
    const q = loadQuizzes();
    q[d.name || "Import"] = d.questions;
    saveQuizzes(q); setActive(d.name); alert("Nahráno!");
  };
  r.readAsText(e.target.files[0]);
};
