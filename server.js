const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// --- Leaderboard persistence ---
const LB_FILE = path.join(__dirname, "leaderboard.json");

function loadLeaderboard() {
  try {
    if (fs.existsSync(LB_FILE)) {
      return JSON.parse(fs.readFileSync(LB_FILE, "utf8"));
    }
  } catch (e) {
    console.error("Error loading leaderboard:", e);
  }
  return [];
}

function saveLeaderboard(data) {
  fs.writeFileSync(LB_FILE, JSON.stringify(data, null, 2));
}

let leaderboard = loadLeaderboard();

// GET top 10 scores
app.get("/api/leaderboard", (req, res) => {
  res.json(leaderboard.slice(0, 10));
});

// POST a new score
app.post("/api/leaderboard", (req, res) => {
  const { name, score } = req.body;
  if (!name || typeof score !== "number") {
    return res.status(400).json({ error: "name and score required" });
  }
  const cleanName = String(name).trim().substring(0, 20);
  if (!cleanName) return res.status(400).json({ error: "name required" });

  const wasTopScore = leaderboard.length === 0 || score > leaderboard[0].score;

  leaderboard.push({ name: cleanName, score, date: new Date().toISOString() });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard = leaderboard.slice(0, 50); // keep top 50
  saveLeaderboard(leaderboard);

  res.json({ rank: leaderboard.findIndex(e => e.name === cleanName && e.score === score) + 1, isNewTopScore: wasTopScore });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
