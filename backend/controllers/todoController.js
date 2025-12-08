import Todo from "../models/Todo.js";

// Get todos for the authenticated user
export const getTodos = async (req, res) => {
  try {
    const todos = await Todo.find({ user: req.user._id })
      .sort({ createdAt: -1 });
    res.json(todos);
  } catch (error) {
    res.status(500).json({ message: "Error fetching todos", error: error.message });
  }
};

// Create a new todo
export const createTodo = async (req, res) => {
  try {
    const { title } = req.body;
    if (!title?.trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    const todo = await Todo.create({
      title: title.trim(),
      user: req.user._id,
    });
    res.status(201).json(todo);
  } catch (error) {
    res.status(400).json({ message: "Error creating todo", error: error.message });
  }
};

// Update a todo (title or completed) owned by the user
export const updateTodo = async (req, res) => {
  try {
    const { title, completed } = req.body;

    const update = {};
    if (typeof completed === "boolean") update.completed = completed;
    if (typeof title === "string") update.title = title.trim();

    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json(todo);
  } catch (error) {
    res.status(400).json({ message: "Error updating todo", error: error.message });
  }
};

// Delete a todo owned by the user
export const deleteTodo = async (req, res) => {
  try {
    const deleted = await Todo.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!deleted) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json({ message: "Todo deleted" });
  } catch (error) {
    res.status(400).json({ message: "Error deleting todo", error: error.message });
  }
};
