import express from "express";
import auth from "../middleware/authMiddleware.js";
import {
  getPosts,
  createPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  removeReaction,
} from "../controllers/postController.js";

const router = express.Router();

// Public route - no authentication required
router.get("/", getPosts);

// Protected routes - authentication required
router.use(auth);

router.post("/", createPost);
router.put("/:id", updatePost);
router.delete("/:id", deletePost);
router.post("/:id/like", likePost);
router.post("/:id/dislike", dislikePost);
router.delete("/:id/reaction", removeReaction);

export default router;
