const socket = io();
const $ = id => document.getElementById(id);
let current = null, timer = null, endAt = 0, submitted = false;

$("joinBtn").onclick = () => {
  $("joinError").textContent = "";
  socket.emit("joinQuiz", {name:$("name").value, className:$("className").value});
};

socket.on("joinError", msg => $("joinError").textContent = msg);
socket.on("joined", data => {
  $("join").classList.add("hidden");
  $("welcome").textContent = `${data.name} · ${data.className}`;
  if (data.gameStarted && !data.gameEnded) $("quiz").classList.remove("hidden");
  else $("waiting").classList.remove("hidden");
});
socket.on("gameStarted", () => {
  $("waiting").classList.add("hidden");
  $("quiz").classList.remove("hidden");
});
socket.on("question", q => {
  current=q; submitted=false;
  $("result").className="result hidden";
  $("qNo").textContent=q.number;
  $("qTotal").textContent=q.total;
  $("questionText").textContent=q.text;
  const box=$("options"); box.innerHTML="";
  q.options.forEach((opt,i)=>{
    const b=document.createElement("button");
    b.className="option";
    b.innerHTML=`<span>${String.fromCharCode(65+i)}</span>${opt}`;
    b.onclick=()=>answer(String.fromCharCode(65+i), b);
    box.appendChild(b);
  });
  startTimer(q.timeLimit);
});
function startTimer(seconds){
  clearInterval(timer);
  endAt=Date.now()+seconds*1000;
  tick();
  timer=setInterval(tick,100);
}
function tick(){
  const left=Math.max(0,endAt-Date.now());
  const sec=Math.ceil(left/1000);
  $("timer").textContent=sec;
  $("timerFill").style.width=(left/(current.timeLimit*1000)*100)+"%";
  if(left<=0){clearInterval(timer); if(!submitted) submitAnswer(null);}
}
function answer(option, button){ if(submitted)return; submitAnswer(option); }
function submitAnswer(option){
  if(submitted)return;
  submitted=true;
  document.querySelectorAll(".option").forEach(b=>b.disabled=true);
  socket.emit("answer",{questionId:current.id,option});
}
socket.on("answerResult", r=>{
  $("result").className="result "+(r.correct?"ok":"no");
  $("result").textContent=r.correct ? `Correct — ${r.score} marks total.` : `Answer recorded.`;
});
socket.on("playerFinished",()=>{
  clearInterval(timer);
  $("quiz").classList.add("hidden");
  $("finished").classList.remove("hidden");
});
socket.on("resetGame",()=>location.reload());
