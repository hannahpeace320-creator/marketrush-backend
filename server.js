// server.js – MarketRush backend

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

// Load .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Global middleware ----------
app.use(
  cors({
    origin: true, // allow any origin while testing
    credentials: true,
  })
);

app.use(express.json());

// ---------- Health check ----------
app.get("/", (req, res) => {
  res.json({ status: "ok", service: "MarketRush API" });
});

// ---------- Auth middleware ----------
const authMiddleware = require("./middleware/auth");

// ---------- Route modules ----------
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const settingsRoutes = require("./routes/settings");
const rewardsRoutes = require("./routes/rewards");
const historyRoutes = require("./routes/history");

// ---------- Mount routes ----------

// Public (no token needed)
app.use("/auth", authRoutes);

// Protected (need Bearer token)
app.use("/users", authMiddleware, userRoutes);
app.use("/settings", authMiddleware, settingsRoutes);
app.use("/rewards", authMiddleware, rewardsRoutes);
app.use("/history", authMiddleware, historyRoutes);

// ---------- 404 fallback ----------
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`API running on port ${PORT}`);
});

module.exports = app;
