// flashcards.js — V2 (opravena nabídka testů + Umím/Neumím)
// Deck logika:
// - Umím: karta se odstraní z balíčku (naučeno)
// - Neumím: karta se přesune na konec (vrátí se později)

const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;" }[m]));}
function setTheme(t){ document.documentElement.setAttribute("data-theme", t || "dark"); }
function norm(s){ return String(s??"").trim().toLowerCase(); }

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
  const learnedBadge = document.getElementById("learnedBadge");

  const flipCard = document.getElementById("flipCard");
  const frontText = document.getElementById("frontText");
  const backText = document.getElementById("backText");

  const flipBtn = document.getElementById("flipBtn");
  const knowBtn = document.getElementById("knowBtn");
  const dontBtn = document.getElementById("dontBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const resetBtn = document.getElementById("resetBtn");

  function fatal(msg){
    console.error(msg);
    frontText.innerHTML = `<div class="note">Chyba: ${escapeHtml(msg)}</div>`;
    backText.textContent = "";
  }

  try{
    let state = loadState();
    setTheme(state.theme);

    // deck = jen otázky pro kartičky (use: cards/both) + otevřené se hodí nejvíc
    let deck = [];
    let idx = 0;
    let learned = 0;

    function getTest(){ return state.tests[state.activeTestId]; }

    function renderSelect(){
      quizSelect.innerHTML = "";
      // Safari někdy vykreslí select bez textu, když je moc úzký – viz CSS fix.
      
      const tests = Object.values(state.tests).sort((a,b)=>a.name.localeCompare(b.name,"cs"));
      if (!tests.length){
        // fallback
        const id = uid();
        state.tests = { [id]: { id, name:"Můj test", questions:[] } };
        state.activeTestId = id;
        saveState(state);
        tests.push(state.tests[id]);
      }
      for (const t of tests){
        const opt = document.createElement("option");
        opt.value = t.id;
        opt.textContent = t.name;
        quizSelect.appendChild(opt);
      }
      if (!state.tests[state.activeTestId]){
        state.activeTestId = tests[0].id;
        saveState(state);
      }
      quizSelect.value = state.activeTestId;
      if (quizSelect.selectedIndex < 0) quizSelect.selectedIndex = 0;
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
      // default (když starý JSON) = both
      const use = q.use || "both";
      return use === "cards" || use === "both";
    }

    function loadDeck(){
      const t = getTest();
      const qs = (t?.questions || []).filter(isForCards);
      deck = [...qs];
      idx = 0;
      learned = 0;
      unflip();
      renderCard();
    }

    function renderCard(){
      const t = getTest();
      learnedBadge.textContent = `${learned} umím`;

      if (!deck.length){
        counter.textContent = "0 / 0";
        frontText.innerHTML = `<div class="note">V testu „${escapeHtml(t?.name || "—")}“ nejsou žádné kartičky. Označ otázky ve Správě jako „Kartičky“ nebo „Obojí“.</div>`;
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
      // odebrat kartu
      deck.splice(idx, 1);
      learned++;
      unflip();
      if (idx >= deck.length) idx = deck.length - 1;
      renderCard();
    }

    function markDontKnow(){
      if (!deck.length) return;
      // přesun na konec
      const [card] = deck.splice(idx, 1);
      deck.push(card);
      unflip();
      // idx zůstává stejné (na stejné pozici je teď další karta)
      if (idx >= deck.length) idx = deck.length - 1;
      renderCard();
    }

    // Events
    flipBtn.addEventListener("click", flip);
    flipCard.addEventListener("click", flip);
    flipCard.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); }
      if (e.key === "ArrowRight") { e.preventDefault(); if (idx < deck.length-1){ idx++; unflip(); renderCard(); } }
      if (e.key === "ArrowLeft") { e.preventDefault(); if (idx > 0){ idx--; unflip(); renderCard(); } }
    });

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
  }catch(e){
    fatal(e?.message || String(e));
  }
});
