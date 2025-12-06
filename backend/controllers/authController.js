import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const REFRESH_TOKEN_SECRET =
  process.env.REFRESH_TOKEN_SECRET || "supersecret_refresh";
const JWT_SECRET = process.env.JWT_SECRET || "supersecret_access";

export const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email already registered" });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Generate tokens
    const token = jwt.sign({ id: newUser._id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    const refreshToken = jwt.sign({ id: newUser._id }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Send user object properly
    res.status(201).json({
      token,
      refreshToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: "15m" });
    const refreshToken = jwt.sign({ id: user._id }, REFRESH_TOKEN_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      refreshToken,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const refreshToken = (req, res) => {
  const { token } = req.body;
  if (!token)
    return res.status(401).json({ message: "No refresh token provided" });

  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);
    const newToken = jwt.sign({ id: decoded.id }, JWT_SECRET, {
      expiresIn: "15m",
    });
    res.json({ token: newToken });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid refresh token" });
  }
};
