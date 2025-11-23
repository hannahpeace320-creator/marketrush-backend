// middleware/auth.js
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7)
    : null;

  if (!token) {
    return res.status(401).json({ message: "Missing token" });
  }

  if (!JWT_SECRET) {
    console.error("JWT_SECRET missing in .env");
    return res
      .status(500)
      .json({ message: "Server misconfigured (missing secret)" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);

    req.user = {
      uid: decoded.uid,
      email: decoded.email || null,
      status: decoded.status || "pending",
    };

    next();
  } catch (err) {
    console.error("Auth error:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};
