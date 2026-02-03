// admin.js — Správa (více testů + větší tlačítka + uložit/načíst test + theme toggle)

const STORE = {
  QUIZZES: "quizzes_v1",
  ACTIVE: "active_quiz_v1",
  THEME: "theme_v1"
};

const quizSelect = document.getElementById("quizSelect");
const themeBtn = document.getElementById("themeBtn");

const newQuizName = document.getElementById("newQuizName");
const createQuizBtn = document.getElementById("createQuizBtn");
const deleteQuizBtn = document.getElementById("deleteQuizBtn");

const elQ = document.getElementById("question");
const elA = document.getElementById("a");
const elB = document.getElementById("b");
const elC = document.getElementById("c");
const elD = document.getElementById("d");
const elCorrect = document.getElementById("correct");

const addBtn = document.getElementById("addBtn");
const seedBtn = document.getElementById("seedBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const clearQuestionsBtn = document.getElementById("clearQuestionsBtn");

const countEl = document.getElementById("count");
const listEl = document.getElementById("list");

function loadTheme(){
  const t = localStorage.getItem(STORE.THEME) || "dark";
  document.documentElement.setAttribute("data-theme", t);
}
function toggleTheme(){
  const curr = document.documentElement.getAttribute("data-theme") || "dark";
  const next = curr === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem(STORE.THEME, next);
}

function loadQuizzes(){
  const raw = localStorage.getItem(STORE.QUIZZES);
  try{
    const parsed = raw ? JSON.parse(raw) : {};
    return (parsed && typeof parsed === "object") ? parsed : {};
  }catch{
    return {};
  }
}
function saveQuizzes(obj){
  localStorage.setItem(STORE.QUIZZES, JSON.stringify(obj));
  render();
}
function getActiveName(){
  return localStorage.getItem(STORE.ACTIVE) || "";
}
function setActiveName(name){
  localStorage.setItem(STORE.ACTIVE, name);
}

function ensureDefaultQuiz(){
  const quizzes = loadQuizzes();
  const keys = Object.keys(quizzes);
  if (keys.length === 0){
    quizzes["Můj test"] = [];
    localStorage.setItem(STORE.QUIZZES, JSON.stringify(quizzes));
  }
  if (!getActiveName() || !(getActiveName() in quizzes)){
    setActiveName(Object.keys(quizzes)[0]);
  }
}

function renderQuizSelect(){
  const quizzes = loadQuizzes();
  const names = Object.keys(quizzes);
  quizSelect.innerHTML = "";
  names.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n;
    opt.textContent = n;
    quizSelect.appendChild(opt);
  });
  quizSelect.value = getActiveName();
}

function validateQuestion(q){
  if (!q.question?.trim()) return "Chybí otázka.";
  for (const k of ["a","b","c","d"]){
    if (!q[k]?.trim()) return `Chybí odpověď ${k.toUpperCase()}.`;
  }
  if (!["a","b","c","d"].includes(q.correct)) return "Špatně zvolená správná odpověď.";
  return null;
}

function clearInputs(){
  elQ.value = "";
  elA.value = "";
  elB.value = "";
  elC.value = "";
  elD.value = "";
  elCorrect.value = "a";
  elQ.focus();
}

function addQuestion(){
  const q = {
    question: elQ.value.trim(),
    a: elA.value.trim(),
    b: elB.value.trim(),
    c: elC.value.trim(),
    d: elD.value.trim(),
    correct: elCorrect.value
  };

  const err = validateQuestion(q);
  if (err) return alert(err);

  const quizzes = loadQuizzes();
  const name = getActiveName();
  quizzes[name] = quizzes[name] || [];
  quizzes[name].push(q);
  saveQuizzes(quizzes);
  clearInputs();
}

function clearQuestions(){
  const name = getActiveName();
  if (!confirm(`Smazat všechny otázky v testu „${name}“?`)) return;
  const quizzes = loadQuizzes();
  quizzes[name] = [];
  saveQuizzes(quizzes);
}

function createQuiz(){
  const name = (newQuizName.value || "").trim();
  if (!name) return alert("Zadej název nového testu.");
  const quizzes = loadQuizzes();
  if (name in quizzes) return alert("Test s tímto názvem už existuje.");

  quizzes[name] = [];
  saveQuizzes(quizzes);
  setActiveName(name);
  render();
  newQuizName.value = "";
}

function deleteQuiz(){
  const quizzes = loadQuizzes();
  const name = getActiveName();
  const keys = Object.keys(quizzes);

  if (keys.length <= 1){
    return alert("Musí zůstat alespoň jeden test.");
  }
  if (!confirm(`Opravdu smazat test „${name}“ (včetně otázek)?`)) return;

  delete quizzes[name];
  const next = Object.keys(quizzes)[0];
  setActiveName(next);
  saveQuizzes(quizzes);
}

function exportQuiz(){
  const quizzes = loadQuizzes();
  const name = getActiveName();
  const data = quizzes[name] || [];

  const blob = new Blob([JSON.stringify({ name, questions: data }, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${slug(name) || "test"}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importQuiz(file){
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(String(reader.result || "{}"));

      // podporujeme 2 formáty:
      // 1) { name, questions:[...] }
      // 2) rovnou pole otázek [...]
      let name = getActiveName();
      let questions = null;

      if (Array.isArray(parsed)){
        questions = parsed;
      } else if (parsed && typeof parsed === "object"){
        if (typeof parsed.name === "string" && parsed.name.trim()){
          name = parsed.name.trim();
        }
        if (Array.isArray(parsed.questions)) questions = parsed.questions;
      }

      if (!Array.isArray(questions)) throw new Error("Neplatný JSON. Očekávám {name, questions:[...]} nebo [...].");

      for (const q of questions){
        const err = validateQuestion(q);
        if (err) throw new Error("Neplatná otázka: " + err);
      }

      const quizzes = loadQuizzes();
      // když import obsahuje jiný název, založíme test automaticky
      if (!(name in quizzes)) quizzes[name] = [];
      quizzes[name] = questions;

      saveQuizzes(quizzes);
      setActiveName(name);
      render();
      alert("Načteno. Test byl přepsán importovanými otázkami.");
    }catch(e){
      alert("Import selhal: " + (e?.message || e));
    }
  };
  reader.readAsText(file);
}

function seed20(){
  const sample = [
    { question: "Kolik je 2 + 2?", a: "3", b: "4", c: "5", d: "22", correct: "b" },
    { question: "Hlavní město ČR je…", a: "Brno", b: "Ostrava", c: "Praha", d: "Plzeň", correct: "c" },
    { question: "Jaká je barva chlorofylu?", a: "Zelená", b: "Modrá", c: "Červená", d: "Černá", correct: "a" },
    { question: "1 hodina má…", a: "30 minut", b: "60 minut", c: "90 minut", d: "120 minut", correct: "b" },
    { question: "HTML je…", a: "Programovací jazyk", b: "Značkovací jazyk", c: "Databáze", d: "Operační systém", correct: "b" },
    { question: "CSS slouží pro…", a: "Stylování webu", b: "Ukládání dat", c: "Kompilaci", d: "Tisk dokumentů", correct: "a" },
    { question: "JavaScript běží hlavně…", a: "v prohlížeči", b: "jen na serveru", c: "jen v databázi", d: "v BIOSu", correct: "a" },
    { question: "HTTP je…", a: "protokol", b: "editor", c: "grafická karta", d: "soubor", correct: "a" },
    { question: "GitHub Pages slouží k…", a: "hostingu webu", b: "psaní e-mailů", c: "tisku", d: "renderu videa", correct: "a" },
    { question: "LocalStorage ukládá data…", a: "na server", b: "do prohlížeče", c: "do RAM navždy", d: "na flashku", correct: "b" },

    { question: "Které číslo je prvočíslo?", a: "9", b: "21", c: "13", d: "15", correct: "c" },
    { question: "RGB znamená…", a: "Red Green Blue", b: "Run Get Build", c: "Rapid Great Byte", d: "Ready Go Button", correct: "a" },
    { question: "Soubor se stylem má koncovku…", a: ".html", b: ".css", c: ".js", d: ".png", correct: "b" },
    { question: "V JavaScriptu pro výpis do konzole použiješ…", a: "print()", b: "console.log()", c: "echo", d: "printf", correct: "b" },
    { question: "Který tag je pro odkaz?", a: "<div>", b: "<a>", c: "<p>", d: "<img>", correct: "b" },
    { question: "Který tag je pro obrázek?", a: "<img>", b: "<link>", c: "<script>", d: "<ul>", correct: "a" },
    { question: "CSS vlastnost pro barvu textu je…", a: "font-style", b: "text-color", c: "color", d: "ink", correct: "c" },
    { question: "Která hodnota v CSS nastaví šířku?", a: "height", b: "width", c: "size", d: "length", correct: "b" },
    { question: "K čemu slouží 'button:disabled'?", a: "pro animaci", b: "pro zakázané tlačítko", c: "pro barvu pozadí", d: "pro výšku", correct: "b" },
    { question: "JSON je…", a: "formát dat", b: "kompresní algoritmus", c: "grafická knihovna", d: "procesor", correct: "a" }
  ];

  const name = getActiveName();
  if (!confirm(`Nahrát ukázkových 20 otázek do testu „${name}“? (přepíše existující otázky)`)) return;

  const quizzes = loadQuizzes();
  quizzes[name] = sample;
  saveQuizzes(quizzes);
}

function render(){
  ensureDefaultQuiz();
  renderQuizSelect();

  const quizzes = loadQuizzes();
  const name = getActiveName();
  const list = quizzes[name] || [];
  countEl.textContent = String(list.length);

  listEl.innerHTML = "";
  if (!list.length){
    listEl.innerHTML = '<p class="hint">Zatím tu nic není. Přidej otázku nebo nahraj ukázkových 20.</p>';
    return;
  }

  list.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "item";

    const head = document.createElement("div");
    head.className = "item-head";

    const left = document.createElement("div");
    left.innerHTML = `<div class="meta">#${i+1}</div><div><q>${escapeHtml(q.question)}</q></div>`;

    const del = document.createElement("button");
    del.className = "btn danger";
    del.textContent = "Smazat otázku";
    del.addEventListener("click", () => removeAt(i));

    head.appendChild(left);
    head.appendChild(del);

    const row = document.createElement("div");
    row.className = "row";

    ["a","b","c","d"].forEach(letter => {
      const pill = document.createElement("span");
      pill.className = "pill " + (q.correct === letter ? "ok" : "bad");
      pill.textContent = `${letter.toUpperCase()}) ${q[letter]}`;
      row.appendChild(pill);
    });

    item.appendChild(head);
    item.appendChild(row);
    listEl.appendChild(item);
  });
}

function removeAt(idx){
  const quizzes = loadQuizzes();
  const name = getActiveName();
  const list = quizzes[name] || [];
  list.splice(idx, 1);
  quizzes[name] = list;
  saveQuizzes(quizzes);
}

function slug(s){
  return String(s).toLowerCase()
    .normalize("NFD").replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function escapeHtml(str){
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* events */
quizSelect.addEventListener("change", () => {
  setActiveName(quizSelect.value);
  render();
});

createQuizBtn.addEventListener("click", createQuiz);
deleteQuizBtn.addEventListener("click", deleteQuiz);

addBtn.addEventListener("click", addQuestion);
seedBtn.addEventListener("click", seed20);

exportBtn.addEventListener("click", exportQuiz);

importFile.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importQuiz(f);
  e.target.value = "";
});

clearQuestionsBtn.addEventListener("click", clearQuestions);

themeBtn.addEventListener("click", toggleTheme);

/* init */
loadTheme();
ensureDefaultQuiz();
render();
