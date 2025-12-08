import express from "express";
import auth from "../middleware/authMiddleware.js";
import { getTodos, createTodo, updateTodo, deleteTodo } from "../controllers/todoController.js";

const router = express.Router();

router.use(auth);

router.get("/", getTodos);
router.post("/", createTodo);
router.put("/:id", updateTodo);
router.delete("/:id", deleteTodo);

export default router;
