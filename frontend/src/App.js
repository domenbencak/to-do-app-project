import React, { useState, useEffect } from "react";
import "./App.css";
import api from "./axios";
import AuthForm from "./components/AuthForm";
import TodoItem from "./components/TodoItem";

function App() {
  const [user, setUser] = useState(null);
  const [todos, setTodos] = useState([]);
  const [title, setTitle] = useState("");
  const [authMode, setAuthMode] = useState("signin");

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const { data: authData } = await api.get("/api/auth/me");
        setUser(authData.user);
        const { data: todosData } = await api.get("/api/todos");
        setTodos(todosData);
      } catch (err) {
        console.error("Failed fetching user:", err);
        // Don't remove token here; Axios interceptor can handle refresh
      }
    };

    fetchUserData();
  }, []);

  const handleAuthSuccess = async (authedUser) => {
    setUser(authedUser);
    try {
      const { data: todosData } = await api.get("/api/todos");
      setTodos(todosData);
    } catch (err) {
      console.error("Failed fetching todos after login:", err);
    }
  };

  const addTodo = async () => {
    if (!title.trim()) return;
    const res = await api.post("/api/todos", { title });
    setTodos([...todos, res.data]);
    setTitle("");
  };

  const toggleTodo = async (id, completed) => {
    const res = await api.put(`/api/todos/${id}`, { completed });
    setTodos(todos.map((t) => (t._id === id ? res.data : t)));
  };

  const deleteTodo = async (id) => {
    await api.delete(`/api/todos/${id}`);
    setTodos(todos.filter((t) => t._id !== id));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    setUser(null);
    setTodos([]);
  };

  if (!user)
    return (
      <div className="app">
        <div className="card">
          <h1 className="title">📝 To‑Do App</h1>
          <p className="subtitle">Sign in to manage your tasks</p>
          <AuthForm mode={authMode} onAuthSuccess={handleAuthSuccess} />
          <p className="auth-toggle">
            {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              className="link-btn"
              onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
            >
              {authMode === "signin" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </div>
    );

  return (
    <div className="app">
      <div className="card">
        <div className="header-row">
          <h1 className="title">📝 {user.username}'s To‑Do</h1>
          <button className="btn btn-ghost logout-btn" onClick={logout}>Logout</button>
        </div>
        <div className="add-row">
          <input
            className="input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a task..."
          />
          <button className="btn btn-primary" onClick={addTodo}>Add</button>
        </div>
        <div className="todo-list">
          {todos.map((todo) => (
            <TodoItem
              key={todo._id}
              todo={todo}
              onToggle={toggleTodo}
              onDelete={deleteTodo}
            />
          ))}
        </div>
      </div>
    </div>
  );
}


export default App;
