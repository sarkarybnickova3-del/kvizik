// flashcards.js — V5 (super robust)
// - nastaví window.__FLASHCARDS_LOADED__ = true
// - vždy naplní select z localStorage (a vytvoří default test)
// - Umím/Neumím deck

window.__FLASHCARDS_LOADED__ = true;

const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function esc(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;" }[m]));}
function setTheme(t){ document.documentElement.setAttribute("data-theme", t || "dark"); }

function loadState(){
  try{
    const raw = localStorage.getItem(STORE_KEY);
    const s = raw ? JSON.parse(raw) : null;
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
  const jsStatus = document.getElementById("jsStatus");

  const counter = document.getElementById("counter");
  const learnedBadge = document.getElementById("learnedBadge");

  const flipCard = document.getElementById("flipCard");
  const frontText = document.getElementById("frontText");
  const backText = document.getElementById("backText");

  const flipBtn = document.getElementById("flipBtn");
  const knowBtn = document.getElementById("knowBtn");
  const dontBtn = document.getElementById("dontBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const resetBtn = document.getElementById("resetBtn");

  const status = (html) => { if(!jsStatus) return; jsStatus.style.display="block"; jsStatus.innerHTML = html; };
  const hideStatus = () => { if(!jsStatus) return; jsStatus.style.display="none"; };

  let state = loadState();
  setTheme(state.theme);

  let deck = [];
  let idx = 0;
  let learned = 0;

  function ensureTest(){
    if (!state.tests || !Object.keys(state.tests).length){
      const id = uid();
      state.tests = { [id]: { id, name:"Můj test", questions:[] } };
      state.activeTestId = id;
      saveState(state);
    }
    if (!state.tests[state.activeTestId]){
      state.activeTestId = Object.keys(state.tests)[0];
      saveState(state);
    }
  }

  function renderSelect(){
    ensureTest();
    quizSelect.innerHTML = "";
    const tests = Object.values(state.tests).sort((a,b)=>String(a.name).localeCompare(String(b.name)));
    for (const t of tests){
      const opt = document.createElement("option");
      opt.value = t.id;
      opt.textContent = t.name;
      quizSelect.appendChild(opt);
    }
    quizSelect.value = state.activeTestId;
    if (quizSelect.selectedIndex < 0) quizSelect.selectedIndex = 0;

    if (quizSelect.options.length === 0){
      status("Nemám žádné testy – vytvářím defaultní „Můj test“.");
      const id = uid();
      state.tests = { [id]: { id, name:"Můj test", questions:[] } };
      state.activeTestId = id;
      saveState(state);
      const opt = document.createElement("option");
      opt.value = id; opt.textContent = "Můj test";
      quizSelect.appendChild(opt);
      quizSelect.value = id;
    }
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

  function isForCards(q){
    const use = q.use || "both";
    return use === "cards" || use === "both";
  }

  function getTest(){ return state.tests[state.activeTestId]; }

  function loadDeck(){
    ensureTest();
    const t = getTest();
    deck = (t.questions || []).filter(isForCards);
    idx = 0;
    learned = 0;
    unflip();
    renderCard();
  }

  function renderCard(){
    learnedBadge.textContent = `${learned} umím`;

    const t = getTest();
    if (!deck.length){
      counter.textContent = "0 / 0";
      frontText.innerHTML = `<div class="note">V testu „${esc(t?.name || "—")}“ nejsou kartičky.<br/>Ve Správě nastav „Použití: Kartičky“ nebo „Obojí“.</div>`;
      backText.textContent = "";
      knowBtn.disabled = true;
      dontBtn.disabled = true;
      return;
    }

    if (idx < 0) idx = 0;
    if (idx >= deck.length) idx = deck.length - 1;

    const q = deck[idx];
    counter.textContent = `${idx+1} / ${deck.length}`;
    frontText.textContent = q.prompt || "Otázka";
    backText.textContent = answerFor(q);
    knowBtn.disabled = false;
    dontBtn.disabled = false;
  }

  function flip(){ flipCard.classList.toggle("is-flipped"); }
  function unflip(){ flipCard.classList.remove("is-flipped"); }

  function markKnow(){
    if (!deck.length) return;
    deck.splice(idx, 1);
    learned++;
    unflip();
    if (idx >= deck.length) idx = deck.length - 1;
    renderCard();
  }

  function markDontKnow(){
    if (!deck.length) return;
    const [card] = deck.splice(idx, 1);
    deck.push(card);
    unflip();
    if (idx >= deck.length) idx = deck.length - 1;
    renderCard();
  }

  // Events
  flipBtn.addEventListener("click", () => flip());
  flipCard.addEventListener("click", () => flip());

  knowBtn.addEventListener("click", markKnow);
  dontBtn.addEventListener("click", markDontKnow);

  shuffleBtn.addEventListener("click", () => { deck = shuffle(deck); idx = 0; learned = 0; unflip(); renderCard(); });
  resetBtn.addEventListener("click", () => { loadDeck(); });

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
  hideStatus();
});
