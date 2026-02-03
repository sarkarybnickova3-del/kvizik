// Správa testu: přidávání, mazání, export/import JSON + ukázkových 20 otázek.

const STORAGE_KEY = "quiz_v1";

const elQ = document.getElementById("question");
const elA = document.getElementById("a");
const elB = document.getElementById("b");
const elC = document.getElementById("c");
const elD = document.getElementById("d");
const elCorrect = document.getElementById("correct");

const addBtn = document.getElementById("addBtn");
const seedBtn = document.getElementById("seedBtn");
const clearBtn = document.getElementById("clearBtn");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");

const countEl = document.getElementById("count");
const listEl = document.getElementById("list");

function loadQuiz() {
  const raw = localStorage.getItem(STORAGE_KEY);
  try {
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveQuiz(arr) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  render();
}

function validate(q) {
  if (!q.question?.trim()) return "Chybí otázka.";
  for (const k of ["a","b","c","d"]) {
    if (!q[k]?.trim()) return `Chybí odpověď ${k.toUpperCase()}.`;
  }
  if (!["a","b","c","d"].includes(q.correct)) return "Špatně zvolená správná odpověď.";
  return null;
}

function clearInputs() {
  elQ.value = "";
  elA.value = "";
  elB.value = "";
  elC.value = "";
  elD.value = "";
  elCorrect.value = "a";
  elQ.focus();
}

function addQuestion() {
  const q = {
    question: elQ.value.trim(),
    a: elA.value.trim(),
    b: elB.value.trim(),
    c: elC.value.trim(),
    d: elD.value.trim(),
    correct: elCorrect.value
  };

  const err = validate(q);
  if (err) return alert(err);

  const quiz = loadQuiz();
  quiz.push(q);
  saveQuiz(quiz);
  clearInputs();
  alert("Otázka přidána.");
}

function clearQuiz() {
  if (!confirm("Opravdu smazat celý test?")) return;
  localStorage.removeItem(STORAGE_KEY);
  render();
}

function render() {
  const quiz = loadQuiz();
  countEl.textContent = String(quiz.length);

  listEl.innerHTML = "";
  if (!quiz.length) {
    listEl.innerHTML = "<p class=\"hint\">Zatím tu nic není. Přidej otázku nebo nahraj ukázkových 20.</p>";
    return;
  }

  quiz.forEach((q, i) => {
    const item = document.createElement("div");
    item.className = "item";

    const head = document.createElement("div");
    head.className = "item-head";

    const left = document.createElement("div");
    left.innerHTML = `<div class="meta">#${i+1}</div><div><q>${escapeHtml(q.question)}</q></div>`;

    const del = document.createElement("button");
    del.className = "danger";
    del.textContent = "Smazat";
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

function removeAt(idx) {
  const quiz = loadQuiz();
  const removed = quiz.splice(idx, 1);
  saveQuiz(quiz);
}

function exportJson() {
  const quiz = loadQuiz();
  const blob = new Blob([JSON.stringify(quiz, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "quiz.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function importJson(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(parsed)) throw new Error("JSON musí být pole otázek.");

      for (const q of parsed) {
        const err = validate(q);
        if (err) throw new Error(`Neplatná otázka: ${err}`);
      }

      saveQuiz(parsed);
      alert("Import hotový.");
    } catch (e) {
      alert("Import selhal: " + (e?.message || e));
    }
  };
  reader.readAsText(file);
}

function seed20() {
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
    { question: "Soubor se stylem má typicky koncovku…", a: ".html", b: ".css", c: ".js", d: ".png", correct: "b" },
    { question: "V JavaScriptu pro výpis do konzole použiješ…", a: "print()", b: "console.log()", c: "echo", d: "printf", correct: "b" },
    { question: "Který tag je pro odkaz?", a: "<div>", b: "<a>", c: "<p>", d: "<img>", correct: "b" },
    { question: "Který tag je pro obrázek?", a: "<img>", b: "<link>", c: "<script>", d: "<ul>", correct: "a" },
    { question: "CSS vlastnost pro barvu textu je…", a: "font-style", b: "text-color", c: "color", d: "ink", correct: "c" },
    { question: "Která hodnota v CSS nastaví šířku?", a: "height", b: "width", c: "size", d: "length", correct: "b" },
    { question: "K čemu slouží 'button:disabled'?", a: "pro animaci", b: "pro zakázané tlačítko", c: "pro barvu pozadí", d: "pro výšku", correct: "b" },
    { question: "JSON je…", a: "formát dat", b: "kompresní algoritmus", c: "grafická knihovna", d: "procesor", correct: "a" }
  ];

  const quiz = loadQuiz();
  if (quiz.length && !confirm("Už máš nějaké otázky. Přepsat ukázkovými 20?")) return;

  saveQuiz(sample);
  alert("Nahráno 20 ukázkových otázek.");
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

addBtn.addEventListener("click", addQuestion);
seedBtn.addEventListener("click", seed20);
clearBtn.addEventListener("click", clearQuiz);
exportBtn.addEventListener("click", exportJson);

importFile.addEventListener("change", (e) => {
  const f = e.target.files?.[0];
  if (f) importJson(f);
  e.target.value = "";
});

render();
