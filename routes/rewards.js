// routes/rewards.js – MarketRush rewards (deposit + withdraw)

const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// Same demo rate as frontend
const SOL_USD_ESTIMATE = 40;

// Deposit cap (demo)
const MAX_DEPOSIT = 20000;

// Withdrawal limits (from your spec)
const MIN_WITHDRAW = 0.13;
const MAX_WITHDRAW = 50;

// Helper to get user ID from auth middleware
function getUid(req) {
  return req.user && req.user.uid;
}

// -------- Deposit (demo) --------
router.post("/deposit", async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount } = req.body;
    const numericAmount = parseFloat(amount);

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (numericAmount > MAX_DEPOSIT) {
      return res
        .status(400)
        .json({
          message: `Max contribution per user (demo) is ${MAX_DEPOSIT} SOL`,
        });
    }

    const userRef = db.collection("users").doc(uid);
    const txRef = userRef.collection("transactions").doc();
    const now = new Date();

    const usdValue = numericAmount * SOL_USD_ESTIMATE;

    await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : {};

      const prevDeposits = userData.totalDeposits || 0;
      const newTotalDeposits = prevDeposits + numericAmount;

      t.set(
        userRef,
        {
          totalDeposits: newTotalDeposits,
        },
        { merge: true }
      );

      t.set(txRef, {
        id: txRef.id,
        userId: uid,
        type: "deposit",
        amount: numericAmount,
        currency: "SOL",
        usdValue,
        status: "recorded-demo",
        createdAt: now.toISOString(),
        createdAtDisplay: now.toLocaleString("en-US", { timeZone: "UTC" }),
      });
    });

    return res.json({
      message: "Deposit recorded (demo).",
      amount: numericAmount,
      usdValue,
    });
  } catch (err) {
    console.error("Deposit error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// -------- Withdraw (pending demo) --------
router.post("/withdraw", async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { amount } = req.body;
    const numericAmount = parseFloat(amount);

    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    if (numericAmount < MIN_WITHDRAW) {
      return res
        .status(400)
        .json({
          message: `Minimum withdrawal is ${MIN_WITHDRAW} SOL`,
        });
    }

    if (numericAmount > MAX_WITHDRAW) {
      return res
        .status(400)
        .json({
          message: `Maximum withdrawal is ${MAX_WITHDRAW} SOL`,
        });
    }

    const userRef = db.collection("users").doc(uid);
    const txRef = userRef.collection("transactions").doc();
    const now = new Date();

    const usdValue = numericAmount * SOL_USD_ESTIMATE;

    await db.runTransaction(async (t) => {
      const userSnap = await t.get(userRef);
      const userData = userSnap.exists ? userSnap.data() : {};

      const prevWithdrawn = userData.totalWithdrawn || 0;
      const newTotalWithdrawn = prevWithdrawn + numericAmount;

      t.set(
        userRef,
        {
          totalWithdrawn: newTotalWithdrawn,
        },
        { merge: true }
      );

      t.set(txRef, {
        id: txRef.id,
        userId: uid,
        type: "withdrawal",
        amount: numericAmount,
        currency: "SOL",
        usdValue,
        status: "pending", // will show as Pending Approval
        createdAt: now.toISOString(),
        createdAtDisplay: now.toLocaleString("en-US", { timeZone: "UTC" }),
      });
    });

    return res.json({
      message: "Withdrawal request submitted (pending approval).",
      amount: numericAmount,
      usdValue,
      status: "pending",
    });
  } catch (err) {
    console.error("Withdraw error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
