// flashcards.js — kartičky (front = otázka, back = odpověď)
const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;" }[m]));}
function setTheme(t){ document.documentElement.setAttribute("data-theme", t || "dark"); }

function loadState(){
  try{
    const s = JSON.parse(localStorage.getItem(STORE_KEY));
    if (s && s.tests && Object.keys(s.tests).length) return s;
  }catch{}
  const id = uid();
  const s = { theme:"dark", activeTestId:id, tests:{ [id]:{ id, name:"Můj test", questions:[] } } };
  localStorage.setItem(STORE_KEY, JSON.stringify(s));
  return s;
}
function saveState(s){ localStorage.setItem(STORE_KEY, JSON.stringify(s)); }

function shuffle(arr){
  for(let i=arr.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [arr[i],arr[j]]=[arr[j],arr[i]];
  }
  return arr;
}

document.addEventListener("DOMContentLoaded", () => {
  const quizSelect = document.getElementById("quizSelect");
  const themeBtn = document.getElementById("themeBtn");

  const counter = document.getElementById("counter");
  const flipCard = document.getElementById("flipCard");
  const frontText = document.getElementById("frontText");
  const backText = document.getElementById("backText");

  const flipBtn = document.getElementById("flipBtn");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const resetBtn = document.getElementById("resetBtn");

  let state = loadState();
  setTheme(state.theme);

  let deck = [];
  let idx = 0;

  function getTest(){ return state.tests[state.activeTestId]; }

  function renderSelect(){
    quizSelect.innerHTML = "";
    const tests = Object.values(state.tests).sort((a,b)=>a.name.localeCompare(b.name,"cs"));
    for (const t of tests){
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      quizSelect.appendChild(opt);
    }
    if (!state.tests[state.activeTestId] && tests.length){
      state.activeTestId = tests[0].id;
      saveState(state);
    }
    quizSelect.value = state.activeTestId;
  }

  function answerFor(q){
    if (q.type === "text"){
      const arr = Array.isArray(q.correctText) ? q.correctText : [];
      return arr.length ? arr.join(" / ") : "—";
    }
    const answers = Array.isArray(q.answers) ? q.answers : [];
    const correct = new Set(Array.isArray(q.correct) ? q.correct : []);
    const corrTexts = answers.filter(a=>correct.has(a.id)).map(a=>a.text);
    return corrTexts.length ? corrTexts.join(" / ") : "—";
  }

  function loadDeck(){
    const t = getTest();
    deck = [...(t.questions || [])];
    idx = 0;
    unflip();
    renderCard();
  }

  function renderCard(){
    const t = getTest();
    if (!deck.length){
      counter.textContent = "0 / 0";
      frontText.innerHTML = `<div class="note">V testu „${escapeHtml(t.name)}“ nejsou otázky. Přidej je ve Správě.</div>`;
      backText.textContent = "";
      prevBtn.disabled = true;
      nextBtn.disabled = true;
      return;
    }
    const q = deck[idx];
    counter.textContent = `${idx+1} / ${deck.length}`;
    frontText.textContent = q.prompt || "Otázka";
    backText.textContent = answerFor(q);
    prevBtn.disabled = (idx === 0);
    nextBtn.disabled = (idx === deck.length - 1);
  }

  function flip(){ flipCard.classList.toggle("is-flipped"); }
  function unflip(){ flipCard.classList.remove("is-flipped"); }

  flipBtn.addEventListener("click", flip);
  flipCard.addEventListener("click", flip);
  flipCard.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
    if (e.key === "ArrowRight") { e.preventDefault(); if (idx < deck.length-1){ idx++; unflip(); renderCard(); } }
    if (e.key === "ArrowLeft") { e.preventDefault(); if (idx > 0){ idx--; unflip(); renderCard(); } }
  });

  nextBtn.addEventListener("click", () => { if (idx < deck.length-1){ idx++; unflip(); renderCard(); } });
  prevBtn.addEventListener("click", () => { if (idx > 0){ idx--; unflip(); renderCard(); } });

  shuffleBtn.addEventListener("click", () => { deck = shuffle(deck); idx = 0; unflip(); renderCard(); });
  resetBtn.addEventListener("click", () => { idx = 0; unflip(); renderCard(); });

  quizSelect.addEventListener("change", () => {
    state.activeTestId = quizSelect.value;
    saveState(state);
    loadDeck();
  });

  themeBtn.addEventListener("click", () => {
    state.theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
    setTheme(state.theme);
    saveState(state);
  });

  renderSelect();
  loadDeck();
});
