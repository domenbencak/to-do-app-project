import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import postRoutes from "./routes/postRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";
import { MongoMemoryServer } from "mongodb-memory-server";

dotenv.config();
const app = express();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:3000";
const ALLOWED_ORIGINS = Array.from(
  new Set([FRONTEND_ORIGIN, "http://localhost:3000", "http://localhost:3001"])
);
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json());

let memoryServer;
const connectToDatabase = async () => {
  const uri = process.env.MONGO_URI;

  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return;
    }

    // Fallback for local development without Mongo installed.
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    await mongoose.connect(memoryUri);
    console.log(`MongoDB (in-memory) started at ${memoryUri}`);
  } catch (err) {
    console.error("MongoDB error:", err);
    process.exit(1);
  }
};

connectToDatabase();

app.get("/", (req, res) => {
  res.send("Server running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/todos", todoRoutes);

const PORT = process.env.PORT || 3242;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  if (memoryServer) {
    await memoryServer.stop();
  }
  process.exit(0);
});
