
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const progress=JSON.parse(localStorage.getItem('deutschProgress')||'{}');
let lesson=null, words=[], flashIndex=0, revealed=false, quizCurrent=null, articleCurrent=null;
const save=()=>localStorage.setItem('deutschProgress',JSON.stringify(progress));
function levelOf(id){return Number(id.slice(1))<=6?'A1.1':'A1.2'}
function article(w){return ['der','die','das'].includes(String(w.Gender).toLowerCase())?String(w.Gender).toLowerCase():''}
function german(w){return article(w)?`${article(w)} ${w.Word_German}`:w.Word_German}
function mark(w,ok){progress[w.Vocab_ID]??={right:0,wrong:0};progress[w.Vocab_ID][ok?'right':'wrong']++;save();renderStats()}
function renderStats(){
 $('#totalWords').textContent=VOCABULARY.length;
 $('#learnedWords').textContent=Object.values(progress).filter(x=>x.right>0).length;
 $('#wrongWords').textContent=Object.values(progress).filter(x=>x.wrong>x.right).length;
}
function renderLessons(){
 const f=$('#levelFilter').value; $('#lessonGrid').innerHTML='';
 LESSONS.filter(l=>f==='all'||levelOf(l.Lesson_ID)===f).forEach(l=>{
   const count=VOCABULARY.filter(v=>v.Lesson_ID===l.Lesson_ID).length;
   const done=VOCABULARY.filter(v=>v.Lesson_ID===l.Lesson_ID && progress[v.Vocab_ID]?.right>0).length;
   const el=document.createElement('div'); el.className='lesson';
   el.innerHTML=`<div class="num">${levelOf(l.Lesson_ID)} · ${l.Lektion_No}</div><h3>${l.Title_German}</h3><p>${l.Title_Thai||''}</p><div class="meta"><span>${count} คำ</span><span>เคยตอบถูก ${done}</span></div>`;
   el.onclick=()=>openLesson(l); $('#lessonGrid').appendChild(el);
 });
}
function openLesson(l){
 lesson=l; words=VOCABULARY.filter(v=>v.Lesson_ID===l.Lesson_ID); flashIndex=0;
 $('#homeView').classList.add('hidden'); $('#practiceView').classList.remove('hidden');
 $('#practiceLevel').textContent=`${levelOf(l.Lesson_ID)} · ${l.Lektion_No}`;
 $('#practiceTitle').textContent=l.Title_German; $('#practiceThai').textContent=l.Title_Thai||'';
 showMode('flash'); renderFlash(); newQuiz(); newArticle();
}
function home(){ $('#practiceView').classList.add('hidden');$('#homeView').classList.remove('hidden');renderLessons();renderStats()}
function renderFlash(){
 if(!words.length)return; const w=words[flashIndex%words.length]; revealed=false;
 $('#flashGerman').textContent=german(w); $('#flashThai').textContent=w.Word_Thai;
 $('#flashCategory').textContent=w.Category||''; $('#flashExtra').textContent=(w.Plural&&w.Plural!=='-')?`Plural: ${w.Plural}`:'';
 $('#flashAnswer').classList.add('hidden'); $('#tapHint').classList.remove('hidden');
 $('#flashProgress').style.width=`${((flashIndex%words.length)+1)/words.length*100}%`;
}
function reveal(){revealed=true;$('#flashAnswer').classList.remove('hidden');$('#tapHint').classList.add('hidden')}
function nextFlash(ok){const w=words[flashIndex%words.length];mark(w,ok);flashIndex=(flashIndex+1)%words.length;renderFlash()}
function shuffled(a){return [...a].sort(()=>Math.random()-.5)}
function newQuiz(){
 if(!words.length)return; quizCurrent=words[Math.floor(Math.random()*words.length)];
 $('#quizQuestion').textContent=quizCurrent.Word_Thai; $('#quizFeedback').textContent=''; $('#nextQuiz').classList.add('hidden');
 let pool=shuffled(VOCABULARY.filter(v=>v.Vocab_ID!==quizCurrent.Vocab_ID)).slice(0,3).concat(quizCurrent); pool=shuffled(pool);
 $('#quizOptions').innerHTML=''; pool.forEach(w=>{let b=document.createElement('button');b.textContent=german(w);b.onclick=()=>answerQuiz(b,w);$('#quizOptions').appendChild(b)});
}
function answerQuiz(btn,w){
 $$('#quizOptions button').forEach(b=>b.disabled=true);
 const ok=w.Vocab_ID===quizCurrent.Vocab_ID; btn.classList.add(ok?'correct':'wrong');
 if(!ok) [...$('#quizOptions').children].find(b=>b.textContent===german(quizCurrent))?.classList.add('correct');
 $('#quizFeedback').textContent=ok?'✓ ถูกต้อง':`คำตอบ: ${german(quizCurrent)}`; mark(quizCurrent,ok); $('#nextQuiz').classList.remove('hidden');
}
function eligibleArticles(){return words.filter(w=>article(w))}
function newArticle(){
 const pool=eligibleArticles(); $('#articleFeedback').textContent=''; $('#nextArticle').classList.add('hidden');
 $$('#articleOptions button').forEach(b=>{b.disabled=false;b.className=''});
 if(!pool.length){$('#articleWord').textContent='บทนี้ไม่มีคำนามที่มี Artikel';$('#articleThai').textContent='';$('#articleOptions').classList.add('hidden');return}
 $('#articleOptions').classList.remove('hidden'); articleCurrent=pool[Math.floor(Math.random()*pool.length)];
 $('#articleWord').textContent=articleCurrent.Word_German; $('#articleThai').textContent=articleCurrent.Word_Thai;
}
$$('#articleOptions button').forEach(b=>b.onclick=()=>{
 if(!articleCurrent)return; const ok=b.textContent===article(articleCurrent); $$('#articleOptions button').forEach(x=>{x.disabled=true;if(x.textContent===article(articleCurrent))x.classList.add('correct')}); if(!ok)b.classList.add('wrong');
 $('#articleFeedback').textContent=ok?'✓ ถูกต้อง':`คำตอบ: ${article(articleCurrent)} ${articleCurrent.Word_German}`; mark(articleCurrent,ok); $('#nextArticle').classList.remove('hidden');
});
function showMode(m){
 $$('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));
 ['flash','quiz','article'].forEach(x=>$(`#${x}Panel`).classList.toggle('hidden',x!==m));
}
$('#levelFilter').onchange=renderLessons; $('#backBtn').onclick=home; $('#homeBtn').onclick=home;
$('#flashCard').onclick=reveal; $('#flashCard').onkeydown=e=>{if(e.key==='Enter'||e.key===' ')reveal()};
$('#againBtn').onclick=()=>nextFlash(false); $('#knowBtn').onclick=()=>nextFlash(true);
$('#nextQuiz').onclick=newQuiz; $('#nextArticle').onclick=newArticle;
$$('.mode').forEach(b=>b.onclick=()=>showMode(b.dataset.mode));
renderStats();renderLessons();
