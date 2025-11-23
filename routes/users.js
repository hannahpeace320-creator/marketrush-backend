// routes/users.js
const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

router.get("/me", async (req, res) => {
  try {
    if (!req.user || !req.user.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const doc = await db.collection("users").doc(req.user.uid).get();

    if (!doc.exists) {
      return res.status(404).json({ message: "User not found" });
    }

    const user = doc.data() || {};

    return res.json({
      uid: doc.id,
      email: user.email || req.user.email || "member@example.com",
      status: user.status || req.user.status || "pending",
      totalDeposits: user.totalDeposits || 0,
      totalWithdrawn: user.totalWithdrawn || 0,
      totalRewards: user.totalRewards || 0,
    });
  } catch (err) {
    console.error("/users/me error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
