// routes/history.js – MarketRush transaction history

const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// Helper to get user ID from auth middleware
function getUid(req) {
  return req.user && req.user.uid;
}

/**
 * GET /history/me
 * Returns all transactions for the logged-in user.
 * Optional query params: from, to (YYYY-MM-DD)
 */
router.get("/me", async (req, res) => {
  try {
    const uid = getUid(req);
    if (!uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { from, to } = req.query;

    // We now store transactions under:
    // users/{uid}/transactions
    const userRef = db.collection("users").doc(uid);
    const txSnap = await userRef.collection("transactions").get();

    let transactions = [];

    txSnap.forEach((doc) => {
      const d = doc.data();

      // We already saved createdAt (ISO string) and createdAtDisplay in rewards.js
      // So we just pass them through.
      transactions.push({
        id: doc.id,
        type: d.type || "unknown",
        amount: d.amount || 0,
        currency: d.currency || "SOL",
        usdValue: d.usdValue ?? null,
        status: d.status || "recorded-demo",
        createdAt: d.createdAt || null,
        createdAtDisplay: d.createdAtDisplay || "",
      });
    });

    // Optional date filtering in JS using createdAt (ISO string)
    if (from) {
      const fromDate = new Date(from + "T00:00:00");
      transactions = transactions.filter((tx) => {
        if (!tx.createdAt) return true;
        return new Date(tx.createdAt) >= fromDate;
      });
    }

    if (to) {
      const toDate = new Date(to + "T23:59:59");
      transactions = transactions.filter((tx) => {
        if (!tx.createdAt) return true;
        return new Date(tx.createdAt) <= toDate;
      });
    }

    // Sort newest → oldest for display
    transactions.sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return res.json({ transactions });
  } catch (err) {
    console.error("History error:", err);
    return res.status(500).json({ message: "History fetch failed" });
  }
});

module.exports = router;
