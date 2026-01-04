import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/authRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import todoRoutes from "./routes/todoRoutes.js";

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
const getMongoUri = () => process.env.MONGO_URI || process.env.MONGODB_URI;

const connectToDatabase = async () => {
  const uri = getMongoUri();

  try {
    if (uri) {
      await mongoose.connect(uri);
      console.log("MongoDB connected");
      return;
    }

    // Fallback when no external Mongo is provided (data will not persist).
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "No MONGO_URI provided; starting in-memory MongoDB (data is ephemeral)."
      );
    } else {
      console.log("No MONGO_URI provided; starting in-memory MongoDB.");
    }
    const { MongoMemoryServer } = await import("mongodb-memory-server");
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
