const STORE = { QUIZZES: "quizzes_v3", ACTIVE: "active_quiz_v3", THEME: "theme_v3" };
const LETTERS = ["a","b","c","d","e","f","g","h"];
let currentAnswerCount = 4;

function loadQuizzes(){ return JSON.parse(localStorage.getItem(STORE.QUIZZES) || "{}"); }
function saveQuizzes(d){ localStorage.setItem(STORE.QUIZZES, JSON.stringify(d)); render(); }
function getActive(){ return localStorage.getItem(STORE.ACTIVE) || ""; }

// PŘEPÍNÁNÍ TYPU OTÁZKY
const qTypeSelect = document.getElementById("qTypeSelect");
qTypeSelect.onchange = () => {
  document.getElementById("choiceArea").classList.toggle("hidden", qTypeSelect.value !== "choice");
  document.getElementById("textArea").classList.toggle("hidden", qTypeSelect.value !== "text");
};

// VYTVOŘENÍ TESTU
document.getElementById("createQuizBtn").onclick = () => {
  const n = document.getElementById("newQuizName").value.trim();
  if(!n) return alert("Zadej název testu");
  const q = loadQuizzes();
  if(q[n]) return alert("Test s tímto názvem už existuje");
  q[n] = [];
  localStorage.setItem(STORE.ACTIVE, n);
  saveQuizzes(q);
  document.getElementById("newQuizName").value = "";
};

// SMAZÁNÍ CELÉHO TESTU (OPRAVENO)
document.getElementById("deleteQuizBtn").onclick = () => {
  const active = getActive();
  if(!active) return;
  if(!confirm(`Opravdu chceš smazat celý test "${active}" i se všemi otázkami?`)) return;
  
  const all = loadQuizzes();
  delete all[active];
  
  const zbyleKlice = Object.keys(all);
  const novyActive = zbyleKlice.length > 0 ? zbyleKlice[0] : "";
  localStorage.setItem(STORE.ACTIVE, novyActive);
  saveQuizzes(all);
};

// ULOŽENÍ OTÁZKY
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
    if(corr.length === 0) return alert("Označ aspoň jednu správnou odpověď!");
    newQ.answers = ans; newQ.correct = corr;
  } else {
    const txtCorr = document.getElementById("textCorrectInput").value.trim();
    if(!txtCorr) return alert("Zadej správnou textovou odpověď!");
    newQ.correct = txtCorr;
  }

  all[active].push(newQ);
  saveQuizzes(all);
  document.getElementById("questionInput").value = "";
  document.getElementById("textCorrectInput").value = "";
};

// RENDER SEZNAMU A SELECTU
function render(){
  const all = loadQuizzes();
  const act = getActive();
  
  const sel = document.getElementById("quizSelect");
  sel.innerHTML = "";
  
  const klice = Object.keys(all);
  if(klice.length === 0) {
    sel.innerHTML = "<option value=''>Žádný test</option>";
    document.getElementById("list").innerHTML = "Žádné otázky";
    document.getElementById("count").innerText = "0";
    return;
  }

  klice.forEach(k => {
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
    d.style.cssText = "background:rgba(0,0,0,0.2); padding:15px; border-radius:12px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center";
    d.innerHTML = `<span>${q.question}</span><button class="btn" onclick="deleteQ(${i})" style="background:#ef4444; color:white; padding:5px 15px">Smazat</button>`;
    listEl.appendChild(d);
  });
}

window.deleteQ = (i) => {
  const all = loadQuizzes();
  all[getActive()].splice(i, 1);
  saveQuizzes(all);
};

// EXPORT JSON (OPRAVENO)
document.getElementById("exportBtn").onclick = () => {
  const all = loadQuizzes();
  const active = getActive();
  if(!active || !all[active]) return alert("Není co exportovat");
  
  const blob = new Blob([JSON.stringify(all[active], null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; 
  a.download = `test-${active}.json`; 
  a.click();
  URL.revokeObjectURL(url);
};

// IMPORT JSON
document.getElementById("importFile").onchange = (e) => {
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const data = JSON.parse(ev.target.result);
      const all = loadQuizzes();
      const active = getActive();
      if(!active) return alert("Nejdřív vytvoř nebo vyber test, do kterého chceš data nahrát.");
      all[active] = data;
      saveQuizzes(all);
      alert("Import úspěšný!");
    } catch(err) { alert("Chyba při čtení JSON souboru"); }
  };
  reader.readAsText(file);
};

// ZMĚNA TESTU V SELECTU
document.getElementById("quizSelect").onchange = (e) => {
  localStorage.setItem(STORE.ACTIVE, e.target.value);
  render();
};

function renderAnsInputs(){
  const cont = document.getElementById("answersContainer");
  cont.innerHTML = "";
  for(let i=0; i<currentAnswerCount; i++){
    const d = document.createElement("div");
    d.style.display = "flex"; d.style.gap = "15px"; d.style.marginBottom = "10px";
    d.innerHTML = `<input type="checkbox" style="width:30px; height:30px; margin-top:5px"> <input type="text" placeholder="Možnost ${LETTERS[i].toUpperCase()}" style="margin-bottom:0">`;
    cont.appendChild(d);
  }
}

document.getElementById("addAnsBtn").onclick = () => { currentAnswerCount++; renderAnsInputs(); };
document.getElementById("remAnsBtn").onclick = () => { if(currentAnswerCount>1) currentAnswerCount--; renderAnsInputs(); };

// Téme toggle
document.getElementById("themeBtn").onclick = () => {
  const n = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", n);
  localStorage.setItem(STORE.THEME, n);
};

renderAnsInputs();
render();
