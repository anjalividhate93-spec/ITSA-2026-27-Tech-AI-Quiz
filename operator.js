const socket=io();
const $=id=>document.getElementById(id);
let lastBoard=[];

$("loginBtn").onclick=()=>socket.emit("operatorJoin",{password:$("password").value});
socket.on("operatorDenied",()=>$("loginError").textContent="Incorrect operator password.");
socket.on("operatorOk",data=>{
  $("login").classList.add("hidden");
  $("dashboard").classList.remove("hidden");
  $("players").textContent=data.playerCount;
  $("status").textContent=data.gameEnded?"FINISHED":data.gameStarted?"LIVE":"WAITING";
});
$("startBtn").onclick=()=>{
  if(confirm("Start the quiz for all registered students?")) socket.emit("operatorStart");
};
$("resetBtn").onclick=()=>{
  if(confirm("Reset the event and remove all participants from this session?")) socket.emit("operatorReset");
};
socket.on("playerCount",n=>$("players").textContent=n);
socket.on("gameStarted",()=>{
  $("status").textContent="LIVE";
  $("startBtn").disabled=true;
});
socket.on("gameEnded",()=>{
  $("status").textContent="FINISHED";
  $("startBtn").disabled=false;
  showPodium();
});
socket.on("resetGame",()=>{
  $("status").textContent="WAITING";
  $("startBtn").disabled=false;
  $("board").innerHTML="";
  $("empty").style.display="block";
  $("podium").classList.add("hidden");
});
socket.on("leaderboard",board=>{
  lastBoard=board;
  $("empty").style.display=board.length?"none":"block";
  $("board").innerHTML=board.map((p,i)=>`
    <tr><td><b>${i+1}</b></td><td>${esc(p.name)}</td><td>${esc(p.className)}</td>
    <td>${p.correct}</td><td><b>${p.score}</b></td><td>${(p.totalTimeMs/1000).toFixed(1)} s</td></tr>`).join("");
  if(board.length && $("status").textContent==="FINISHED") showPodium();
});
function showPodium(){
  const top=lastBoard.slice(0,3);
  if(!top.length)return;
  $("podium").classList.remove("hidden");
  $("podiumGrid").innerHTML=`<div class="podium-items">${top.map((p,i)=>`
    <div class="podium-item"><div class="rank">RANK ${i+1}</div>
    <div class="pname">${esc(p.name)}</div><div class="muted">${esc(p.className)}</div>
    <div class="pscore">${p.score}</div><div class="muted">marks</div></div>`).join("")}</div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}
