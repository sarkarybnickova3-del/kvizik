// admin.js — Správa (3 bloky podle zadání)

const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function norm(s){ return String(s ?? "").trim(); }
function normLower(s){ return String(s ?? "").trim().toLowerCase(); }

function loadState(){
  const raw = localStorage.getItem(STORE_KEY);
  try{
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && typeof parsed === "object" && parsed.tests) return parsed;
  }catch{}
  const id = uid();
  const state = { theme:"dark", activeTestId:id, tests:{ [id]:{ id, name:"Můj test", questions:[] } } };
  localStorage.setItem(STORE_KEY, JSON.stringify(state));
  return state;
}
function saveState(state){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function setTheme(theme){ document.documentElement.setAttribute("data-theme", theme || "dark"); }

const quizSelect = document.getElementById("quizSelect");
const themeBtn = document.getElementById("themeBtn");

const renameInput = document.getElementById("renameInput");
const renameBtn = document.getElementById("renameBtn");
const newQuizName = document.getElementById("newQuizName");
const createQuizBtn = document.getElementById("createQuizBtn");
const deleteQuizBtn = document.getElementById("deleteQuizBtn");

const questionInput = document.getElementById("questionInput");
const qTypeSelect = document.getElementById("qTypeSelect");

const choiceArea = document.getElementById("choiceArea");
const answersContainer = document.getElementById("answersContainer");
const addAnsBtn = document.getElementById("addAnsBtn");
const remAnsBtn = document.getElementById("remAnsBtn");

const textArea = document.getElementById("textArea");
const textCorrectInput = document.getElementById("textCorrectInput");

const saveQuestionBtn = document.getElementById("saveQuestionBtn");

const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

let state = loadState();
setTheme(state.theme);

function ensureAtLeastOneTest(){
  if (!state.tests || Object.keys(state.tests).length === 0){
    const id = uid();
    state.tests = { [id]:{ id, name:"Můj test", questions:[] } };
    state.activeTestId = id;
    saveState(state);
  }
}
function getActiveTest(){ return state.tests[state.activeTestId]; }

function renderSelect(){
  quizSelect.innerHTML = "";
  const tests = Object.values(state.tests).sort((a,b)=>a.name.localeCompare(b.name,"cs"));
  for (const t of tests){
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.name;
    quizSelect.appendChild(opt);
  }
  quizSelect.value = state.activeTestId;
  renameInput.value = getActiveTest()?.name || "";
}

function answerRow(letter){
  const row = document.createElement("div");
  row.className = "ans-row";
  row.dataset.id = uid();

  const tag = document.createElement("div");
  tag.className = "tag";
  tag.textContent = letter;

  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = "Text odpovědi…";

  const check = document.createElement("input");
  check.type = "checkbox";
  check.title = "Správná odpověď";

  row.appendChild(tag);
  row.appendChild(input);
  row.appendChild(check);
  return row;
}
function refreshLetters(){
  [...answersContainer.children].forEach((row, i) => {
    row.querySelector(".tag").textContent = String.fromCharCode(65 + i);
  });
}
function ensureMinOptions(n=4){
  while (answersContainer.children.length < n){
    answersContainer.appendChild(answerRow(String.fromCharCode(65 + answersContainer.children.length)));
  }
  refreshLetters();
}

function setTypeUI(){
  if (qTypeSelect.value === "text"){
    choiceArea.classList.add("hidden");
    textArea.classList.remove("hidden");
  } else {
    textArea.classList.add("hidden");
    choiceArea.classList.remove("hidden");
  }
}

function buildQuestionFromForm(){
  const prompt = norm(questionInput.value);
  const type = qTypeSelect.value;

  if (type === "text"){
    const variants = norm(textCorrectInput.value)
      .split(";")
      .map(s => norm(s))
      .filter(Boolean);
    return { id: uid(), type: "text", prompt, correctText: variants };
  }

  const rows = [...answersContainer.querySelectorAll(".ans-row")];
  const filled = rows.map(row => {
    const id = row.dataset.id;
    const text = norm(row.querySelector('input[type="text"]').value);
    const correct = row.querySelector('input[type="checkbox"]').checked;
    return { id, text, correct };
  }).filter(a => a.text.length > 0);

  return {
    id: uid(),
    type: "choice",
    prompt,
    answers: filled.map(a => ({ id:a.id, text:a.text })),
    correct: filled.filter(a => a.correct).map(a => a.id)
  };
}

function validateQuestion(q){
  if (!norm(q.prompt)) return "Chybí znění otázky.";

  if (q.type === "text"){
    if (!Array.isArray(q.correctText) || q.correctText.length === 0) return "Chybí správná textová odpověď.";
    return null;
  }

  if (!Array.isArray(q.answers) || q.answers.length < 2) return "Musí být alespoň 2 možnosti (s vyplněným textem).";
  if (!Array.isArray(q.correct) || q.correct.length === 0) return "Zaškrtni alespoň jednu správnou odpověď.";

  const ids = new Set(q.answers.map(a => a.id));
  for (const cid of q.correct) if (!ids.has(cid)) return "Některá správná odpověď neexistuje.";
  return null;
}

function clearQuestionForm(){
  questionInput.value = "";
  textCorrectInput.value = "";
  [...answersContainer.querySelectorAll(".ans-row")].forEach(row => {
    row.querySelector('input[type="text"]').value = "";
    row.querySelector('input[type="checkbox"]').checked = false;
  });
  questionInput.focus();
}

function addQuestion(){
  const t = getActiveTest();
  if (!t) return;

  const q = buildQuestionFromForm();
  const err = validateQuestion(q);
  if (err) return alert(err);

  t.questions = t.questions || [];
  t.questions.push(q);

  saveState(state);
  renderAll();
  clearQuestionForm();
}

function renderList(){
  const t = getActiveTest();
  const qs = t?.questions || [];
  countEl.textContent = String(qs.length);

  listEl.innerHTML = "";
  if (qs.length === 0){
    listEl.innerHTML = '<div class="note">Zatím tu nejsou žádné otázky.</div>';
    return;
  }

  qs.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "q-item";

    const head = document.createElement("div");
    head.className = "head";

    const left = document.createElement("div");
    left.innerHTML = `
      <div class="q">${escapeHtml(q.prompt)}</div>
      <div class="meta">#${i+1} • ${q.type === "text" ? "otevřená" : "výběr"}${q.type==="choice" && (q.correct?.length||0)>1 ? " • více správných" : ""}</div>
    `;

    const del = document.createElement("button");
    del.className = "btn danger";
    del.type = "button";
    del.textContent = "Smazat";
    del.addEventListener("click", () => {
      if (!confirm("Smazat tuto otázku?")) return;
      t.questions.splice(i, 1);
      saveState(state);
      renderAll();
    });

    head.appendChild(left);
    head.appendChild(del);

    const chips = document.createElement("div");
    chips.className = "chips";

    const typeChip = document.createElement("span");
    typeChip.className = "chip type";
    typeChip.textContent = q.type === "text" ? "TEXT" : "CHOICE";
    chips.appendChild(typeChip);

    if (q.type === "choice"){
      const correctSet = new Set(q.correct || []);
      (q.answers || []).forEach((a, idx) => {
        const chip = document.createElement("span");
        chip.className = "chip " + (correctSet.has(a.id) ? "ok" : "bad");
        chip.textContent = `${String.fromCharCode(65+idx)}) ${a.text}`;
        chips.appendChild(chip);
      });
    } else {
      const chip = document.createElement("span");
      chip.className = "chip ok";
      chip.textContent = "Správně: " + (q.correctText?.[0] || "—");
      chips.appendChild(chip);
    }

    item.appendChild(head);
    item.appendChild(chips);
    listEl.appendChild(item);
  });
}

function createQuiz(){
  const name = norm(newQuizName.value);
  if (!name) return alert("Zadej název nového testu.");

  const exists = Object.values(state.tests).some(t => normLower(t.name) === normLower(name));
  if (exists) return alert("Test s tímto názvem už existuje.");

  const id = uid();
  state.tests[id] = { id, name, questions: [] };
  state.activeTestId = id;

  newQuizName.value = "";
  saveState(state);
  renderAll();
}

function deleteQuiz(){
  const ids = Object.keys(state.tests);
  if (ids.length <= 1) return alert("Musí zůstat alespoň jeden test.");

  const t = getActiveTest();
  if (!confirm(`Opravdu smazat test „${t.name}“ (včetně otázek)?`)) return;

  delete state.tests[state.activeTestId];
  state.activeTestId = Object.keys(state.tests)[0];

  saveState(state);
  renderAll();
}

function renameQuiz(){
  const t = getActiveTest();
  const name = norm(renameInput.value);
  if (!name) return alert("Název nemůže být prázdný.");
  t.name = name;
  saveState(state);
  renderAll();
}

function slug(s){
  return String(s).toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function exportJson(){
  const t = getActiveTest();
  const payload = { name: t.name, questions: t.questions || [] };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(t.name) || "test"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(url);
}

function importJson(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(String(reader.result || "{}"));

      let questions = null;
      let name = null;

      if (Array.isArray(parsed)){
        questions = parsed;
      } else if (parsed && typeof parsed === "object"){
        if (typeof parsed.name === "string") name = parsed.name;
        if (Array.isArray(parsed.questions)) questions = parsed.questions;
      }

      if (!Array.isArray(questions)) throw new Error("Neplatný JSON. Očekávám {name, questions:[...]} nebo [...].");

      // basic validation
      for (const q of questions){
        if (!q || typeof q !== "object") throw new Error("Neplatná otázka.");
        if (!q.type || !q.prompt) throw new Error("Otázce chybí type/prompt.");
        if (q.type === "choice"){
          if (!Array.isArray(q.answers) || q.answers.length < 2) throw new Error("Choice otázka musí mít answers (min 2).");
          if (!Array.isArray(q.correct) || q.correct.length < 1) throw new Error("Choice otázka musí mít correct (min 1).");
        }
        if (q.type === "text"){
          if (!Array.isArray(q.correctText) || q.correctText.length < 1) throw new Error("Text otázka musí mít correctText.");
        }
      }

      const t = getActiveTest();
      if (!confirm(`Načíst JSON a přepsat otázky v testu „${t.name}“?`)) return;

      t.name = norm(name || t.name);
      t.questions = questions;
      saveState(state);
      renderAll();
      alert("Hotovo. Test byl načten.");
    } catch (e){
      alert("Import selhal: " + (e?.message || e));
    }
  };
  reader.readAsText(file);
}

/* Events */
quizSelect.addEventListener("change", () => {
  state.activeTestId = quizSelect.value;
  saveState(state);
  renderAll();
});

qTypeSelect.addEventListener("change", setTypeUI);

addAnsBtn.addEventListener("click", () => {
  answersContainer.appendChild(answerRow(String.fromCharCode(65 + answersContainer.children.length)));
  refreshLetters();
});

remAnsBtn.addEventListener("click", () => {
  if (answersContainer.children.length <= 2) return alert("Nech aspoň 2 možnosti.");
  answersContainer.lastElementChild.remove();
  refreshLetters();
});

saveQuestionBtn.addEventListener("click", addQuestion);

createQuizBtn.addEventListener("click", createQuiz);
deleteQuizBtn.addEventListener("click", deleteQuiz);
renameBtn.addEventListener("click", renameQuiz);

exportBtn.addEventListener("click", exportJson);
importFile.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importJson(f);
  e.target.value = "";
});

themeBtn.addEventListener("click", () => {
  state.theme = (document.documentElement.getAttribute("data-theme") === "dark") ? "light" : "dark";
  setTheme(state.theme);
  saveState(state);
});

function renderAll(){
  ensureAtLeastOneTest();
  renderSelect();
  ensureMinOptions(4);
  setTypeUI();
  renderList();
}

/* init */
ensureAtLeastOneTest();
renderAll();
