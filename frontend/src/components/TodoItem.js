import React from "react";

const TodoItem = ({ todo, onToggle, onDelete }) => (
  <div className="todo-item">
    <span
      onClick={() => onToggle(todo._id, !todo.completed)}
      className={`todo-title ${todo.completed ? "todo-title--completed" : ""}`}
    >
      {todo.title}
    </span>
    <div className="todo-actions">
      <button className="btn delete-btn" onClick={() => onDelete(todo._id)} aria-label="Delete todo">
        ❌
      </button>
    </div>
  </div>
);

export default TodoItem;
