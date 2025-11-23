const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");
const auth = require("../middleware/auth");

const SETTINGS_ID = "global";

// GET /settings – public (for dashboard)
router.get("/", async (req, res) => {
  const doc = await db.collection("settings").doc(SETTINGS_ID).get();

  if (!doc.exists) {
    // default settings
    return res.json({
      maxDepositPerUser: 20000,
      groups: {
        A: { minPct: 5, maxPct: 10 },
        B: { minPct: 20, maxPct: 30 },
      },
      rewardInterval: "daily",
    });
  }

  res.json(doc.data());
});

// PUT /settings – admin update
router.put("/", auth, async (req, res) => {
  if (!req.user.isAdmin) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { maxDepositPerUser, groups, rewardInterval } = req.body;

  await db
    .collection("settings")
    .doc(SETTINGS_ID)
    .set(
      {
        ...(maxDepositPerUser !== undefined && { maxDepositPerUser }),
        ...(groups && { groups }),
        ...(rewardInterval && { rewardInterval }),
      },
      { merge: true }
    );

  res.json({ message: "Settings updated" });
});

module.exports = router;
