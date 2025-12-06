import jwt from "jsonwebtoken";

// Use the same fallback as used when signing tokens in authController
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_access";

export default function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { _id: decoded.id }; // make sure 'id' matches JWT payload
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}
