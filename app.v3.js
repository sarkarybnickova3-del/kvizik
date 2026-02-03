// app.js — HOTFIX
// Oprava: nenačítala se nabídka testů (DOM + prázdný stav)

const STORE_KEY = "kvizik_v2";

function uid(){ return Math.random().toString(16).slice(2) + Date.now().toString(16); }
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,m=>({ "&":"&amp;","<":"&lt;",">":"&gt;",""":"&quot;","'":"&#039;" }[m]));}
function norm(s){return String(s??"").trim().toLowerCase();}

function loadState(){
  try{
    const s=JSON.parse(localStorage.getItem(STORE_KEY));
    if(s && s.tests && Object.keys(s.tests).length) return s;
  }catch{}
  const id=uid();
  const s={theme:"dark",activeTestId:id,tests:{[id]:{id,name:"Můj test",questions:[]}}};
  localStorage.setItem(STORE_KEY,JSON.stringify(s));
  return s;
}
function saveState(s){localStorage.setItem(STORE_KEY,JSON.stringify(s));}
function setTheme(t){document.documentElement.setAttribute("data-theme",t||"dark");}

document.addEventListener("DOMContentLoaded",()=>{

const quizSelect=document.getElementById("quizSelect");
const themeBtn=document.getElementById("themeBtn");
const quizRoot=document.getElementById("quiz");
const restartBtn=document.getElementById("restartBtn");

let state=loadState(); 
setTheme(state.theme);

let pool=[],wrong=[],idx=0,locked=false;
let total=0, correct=0;

function getTest(){ return state.tests[state.activeTestId]; }

function renderSelect(){
  quizSelect.innerHTML="";
  const tests=Object.values(state.tests);
  tests.forEach(t=>{
    const o=document.createElement("option");
    o.value=t.id;
    o.textContent=t.name;
    quizSelect.appendChild(o);
  });
  if(!state.tests[state.activeTestId]){
    state.activeTestId=tests[0].id;
  }
  quizSelect.value=state.activeTestId;
}

function start(){
  const t=getTest();
  pool=[...(t.questions||[])];
  wrong=[]; idx=0; total=0; correct=0;
  next();
}

function next(){
  quizRoot.innerHTML="";
  locked=false;

  if(idx>=pool.length){
    if(wrong.length){
      pool=[...wrong]; wrong=[]; idx=0;
      alert("Opravné kolo – špatné otázky");
      next(); return;
    }
    const pct=total?((correct/total)*100).toFixed(1):"0.0";
    quizRoot.innerHTML=`<h2 class="quiz-title">Hotovo</h2>
      <p class="quiz-sub">${correct} z ${total} správně (${pct}%)</p>`;
    return;
  }

  const q=pool[idx];
  quizRoot.innerHTML=`<h2 class="quiz-title">${escapeHtml(q.prompt)}</h2>`;

  const info=document.createElement("p");
  info.className="quiz-sub";
  info.textContent = q.type==="choice"
    ? (q.correct.length>1 ? "Více správných odpovědí" : "Jedna správná odpověď")
    : "Otevřená otázka";
  quizRoot.appendChild(info);

  q.type==="choice" ? renderChoice(q) : renderText(q);
}

function renderChoice(q){
  const sel=new Set();
  const wrap=document.createElement("div");
  wrap.className="answer-grid";

  q.answers.forEach((a,i)=>{
    const b=document.createElement("button");
    b.className="answer-btn";
    b.innerHTML=`<span class="letter">${String.fromCharCode(65+i)}</span><span class="txt">${escapeHtml(a.text)}</span>`;
    b.onclick=()=>{
      if(locked) return;
      if(q.correct.length===1){ sel.clear(); sel.add(a.id); }
      else{ sel.has(a.id)?sel.delete(a.id):sel.add(a.id); b.classList.toggle("selected",sel.has(a.id)); }
    };
    b.dataset.id=a.id;
    wrap.appendChild(b);
  });
  quizRoot.appendChild(wrap);

  controls(q,wrap,sel);
}

function renderText(q){
  const input=document.createElement("input");
  input.placeholder="Napiš odpověď…";
  const wrap=document.createElement("div");wrap.className="text-answer";
  wrap.appendChild(input);
  quizRoot.appendChild(wrap);
  controls(q,wrap,null,input);
}

function controls(q,wrap,sel,input){
  const row=document.createElement("div");row.className="row";
  const evalBtn=document.createElement("button");
  evalBtn.className="btn primary";evalBtn.textContent="Vyhodnotit";
  const nextBtn=document.createElement("button");
  nextBtn.className="btn";nextBtn.textContent="Další";nextBtn.disabled=true;

  evalBtn.onclick=()=>{
    if(locked) return;
    locked=true; total++;
    let ok=false;

    if(q.type==="choice"){
      ok=[...sel].sort().join()===[...q.correct].sort().join();
      [...wrap.children].forEach(b=>{
        const id=b.dataset.id;
        if(q.correct.includes(id)) b.classList.add("correct");
        if(sel.has(id)&&!q.correct.includes(id)) b.classList.add("wrong");
        b.disabled=true;
      });
    }else{
      ok=q.correctText.map(norm).includes(norm(input.value));
      const note=document.createElement("div");
      note.className="note";
      note.textContent=ok?"Správně":"Špatně – "+q.correctText[0];
      quizRoot.appendChild(note);
      input.disabled=true;
    }

    if(ok) correct++; else wrong.push(q);
    nextBtn.disabled=false;
  };

  nextBtn.onclick=()=>{idx++;next();};

  row.append(evalBtn,nextBtn);
  quizRoot.appendChild(row);
}

quizSelect.onchange=()=>{state.activeTestId=quizSelect.value;saveState(state);start();};
restartBtn.onclick=start;
themeBtn.onclick=()=>{state.theme=state.theme==="dark"?"light":"dark";setTheme(state.theme);saveState(state);};

renderSelect(); start();

});
