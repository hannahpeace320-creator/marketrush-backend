// routes/auth.js
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/firebase");

const JWT_SECRET = process.env.JWT_SECRET;

// ---------- SIGNUP ----------
router.post("/signup", async (req, res) => {
  try {
    let { email, password, username } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    email = email.toLowerCase().trim();

    // Check if user already exists
    const existingSnap = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingSnap.empty) {
      return res.status(400).json({ message: "User already exists" });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await db.collection("users").add({
      email,
      username: username || null,
      passwordHash,
      status: "approved", // for now, auto-approved so you can log in & test
      createdAt: new Date().toISOString(),
      totalDeposits: 0,
      totalWithdrawn: 0,
      totalRewards: 0,
    });

    return res.json({
      message: "Registered successfully. Awaiting approval.",
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  try {
    let { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    email = email.toLowerCase().trim();

    const snap = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (snap.empty) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const userDoc = snap.docs[0];
    const user = userDoc.data() || {};

    if (!user.passwordHash) {
      console.error(
        "User record missing passwordHash for doc:",
        userDoc.id,
        user
      );
      return res
        .status(500)
        .json({ message: "User record incomplete. Contact support." });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (!JWT_SECRET) {
      console.error("JWT_SECRET is missing in .env");
      return res
        .status(500)
        .json({ message: "Server misconfigured (missing secret)" });
    }

    const tokenPayload = {
      uid: userDoc.id,
      email: user.email || email, // safe fallback
      status: user.status || "pending",
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: "7d" });

    return res.json({
      message: "Login successful",
      token,
      status: tokenPayload.status,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
