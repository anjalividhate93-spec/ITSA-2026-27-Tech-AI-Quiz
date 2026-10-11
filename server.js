const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const crypto = require("crypto");
const config = require("./quiz-config");
const questions = require("./questions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.join(__dirname, "public")));

const players = new Map();
let gameStarted = false;
let gameEnded = false;
let questionIndex = 0;
let questionStartedAt = 0;
const sessionId = crypto.randomBytes(3).toString("hex").toUpperCase();

function shuffled(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function publicQuestion(player) {
  const qid = player.order[player.position];
  const q = questions.find(x => x.id === qid);
  if (!q) return null;
  return {
    id: q.id,
    number: player.position + 1,
    total: player.order.length,
    text: q.text,
    options: q.options,
    timeLimit: config.timeLimitSeconds
  };
}

function leaderboard() {
  return [...players.values()]
    .map(p => ({
      name: p.name,
      className: p.className,
      score: p.score,
      correct: p.correct,
      answered: p.answered,
      totalTimeMs: p.totalTimeMs
    }))
    .sort((a,b) => b.score - a.score || a.totalTimeMs - b.totalTimeMs || a.name.localeCompare(b.name));
}

function sendCurrentQuestion(player) {
  const q = publicQuestion(player);
  if (!q) return;
  player.questionStartedAt = Date.now();
  player.answeredCurrent = false;
  io.to(player.socketId).emit("question", q);
}

function finishGame() {
  gameEnded = true;
  gameStarted = false;
  io.emit("gameEnded");
  io.to("operator").emit("leaderboard", leaderboard());
}

io.on("connection", socket => {
  socket.on("operatorJoin", ({password}) => {
    if (password !== config.operatorPassword) {
      socket.emit("operatorDenied");
      return;
    }
    socket.join("operator");
    socket.emit("operatorOk", {
      sessionId,
      gameStarted,
      gameEnded,
      playerCount: players.size,
      questionCount: questions.length
    });
    socket.emit("leaderboard", leaderboard());
  });

  socket.on("operatorStart", () => {
    if (!socket.rooms.has("operator")) return;
    players.forEach(p => {
      p.order = shuffled(questions.map(q => q.id));
      p.position = 0;
      p.score = 0;
      p.correct = 0;
      p.answered = 0;
      p.totalTimeMs = 0;
      p.answeredCurrent = false;
    });
    gameStarted = true;
    gameEnded = false;
    io.emit("gameStarted");
    for (const p of players.values()) sendCurrentQuestion(p);
    io.to("operator").emit("leaderboard", leaderboard());
  });

  socket.on("operatorReset", () => {
    if (!socket.rooms.has("operator")) return;
      players.clear();
    gameStarted = false;
    gameEnded = false;
    io.emit("resetGame");
    io.to("operator").emit("leaderboard", []);
  });

  socket.on("joinQuiz", ({name, className}) => {
    name = String(name || "").trim().slice(0, 40);
    className = String(className || "").trim().slice(0, 30);
    if (!name || !className) return socket.emit("joinError", "Enter both name and class.");
    if (players.has(socket.id)) return;

    const p = {
      socketId: socket.id,
      name,
      className,
      order: shuffled(questions.map(q => q.id)),
      position: 0,
      score: 0,
      correct: 0,
      answered: 0,
      totalTimeMs: 0,
      answeredCurrent: false,
      questionStartedAt: 0
    };
    players.set(socket.id, p);
    socket.emit("joined", {name, className, gameStarted, gameEnded});
    io.to("operator").emit("playerCount", players.size);

    if (gameStarted && !gameEnded) sendCurrentQuestion(p);
  });

  socket.on("answer", ({questionId, option}) => {
    const p = players.get(socket.id);
    if (!p || !gameStarted || gameEnded || p.answeredCurrent) return;

    const q = questions.find(x => x.id === questionId);
    if (!q) return;
    const expectedId = p.order[p.position];
    if (expectedId !== questionId) return;

    p.answeredCurrent = true;
    const elapsed = Math.min(Date.now() - p.questionStartedAt, config.timeLimitSeconds * 1000);
    p.totalTimeMs += elapsed;
    p.answered++;

    const isCorrect = option === q.answer;
    if (isCorrect) {
      p.correct++;
      p.score += config.pointsPerCorrect;
    }

    socket.emit("answerResult", {
      correct: isCorrect,
      correctOption: q.answer,
      score: p.score
    });

    setTimeout(() => {
      if (!players.has(socket.id)) return;
      p.position++;
      if (p.position >= p.order.length) {
        socket.emit("playerFinished");
        io.to("operator").emit("leaderboard", leaderboard());
        if ([...players.values()].every(x => x.position >= x.order.length)) finishGame();
      } else {
        sendCurrentQuestion(p);
      }
      io.to("operator").emit("leaderboard", leaderboard());
    }, 900);
  });

  socket.on("disconnect", () => {
    if (players.delete(socket.id)) {
      io.to("operator").emit("playerCount", players.size);
      io.to("operator").emit("leaderboard", leaderboard());
    }
  });
});

app.get("/config", (req,res) => res.json({
  title: config.title,
  timeLimitSeconds: config.timeLimitSeconds,
  pointsPerCorrect: config.pointsPerCorrect,
  questionCount: questions.length
}));

const PORT = process.env.PORT || 3000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`ITSA quiz running on port ${PORT}`);
});
