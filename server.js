const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const LEADERBOARD_FILE = path.join(__dirname, "leaderboard.json");
const MAX_ENTRIES = 50;

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());

function readLeaderboard() {
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, "utf8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {}
  return [];
}

function writeLeaderboard(board) {
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(board, null, 2));
}

app.get("/api/leaderboard", (req, res) => {
  res.json(readLeaderboard());
});

app.post("/api/leaderboard", (req, res) => {
  const { name, score, correct, total } = req.body;
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return res.status(400).json({ error: "Name is required" });
  }
  if (typeof score !== "number" || score < 0) {
    return res.status(400).json({ error: "Invalid score" });
  }

  const board = readLeaderboard();
  const entry = {
    name: name.trim().substring(0, 20),
    score: score,
    correct: correct || 0,
    total: total || 0,
    date: new Date().toLocaleDateString()
  };
  board.push(entry);
  board.sort((a, b) => b.score - a.score);
  if (board.length > MAX_ENTRIES) board.length = MAX_ENTRIES;
  writeLeaderboard(board);

  const rank = board.indexOf(entry) + 1;
  res.json({ rank, board });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
