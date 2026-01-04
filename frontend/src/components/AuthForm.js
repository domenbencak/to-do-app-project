import React, { useState } from "react";
import axios from "axios";

const AuthForm = ({ mode, onAuthSuccess }) => {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState(""); // only for signup
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = `/api/auth/${mode}`;
      const payload =
        mode === "signup" ? { username, email, password } : { email, password };

      const res = await axios.post(url, payload);

      // Store tokens here
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("refreshToken", res.data.refreshToken);

      onAuthSuccess(res.data.user); // pass user to parent
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">
      {mode === "signup" && (
        <input
          className="form-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      )}
      <input
        className="form-input"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        required
      />
      <input
        className="form-input"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        type="password"
        required
      />
      <button type="submit" className="btn btn-primary">
        {mode === "signup" ? "Sign Up" : "Sign In"}
      </button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </form>
  );
};

export default AuthForm;
