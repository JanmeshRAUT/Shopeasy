import React, { useState } from "react";
import "../styles/LoginPage.css";
import toast from 'react-hot-toast';

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (data.success) {
        if (data.ctf_flag) {
          toast.success(`Success! Staff account accessed. \nFlag location: Profile Page`, {
            duration: 6000,
            icon: '🚩',
          });
        }
        onLogin(data.username);
      } else {
        setError(data.message);
      }
    } catch {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-logo">
        🛒 Shop<span>Easy</span>
      </div>

      <div className="login-card">
        <h1>Sign in</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Email or mobile phone number</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              autoComplete="off"
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
            />
          </div>

          {error && <div style={{color: '#CC0C39', fontSize: '0.8rem'}}>⚠️ {error}</div>}

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Signing in..." : "Continue"}
          </button>
        </form>

        <p className="login-terms">
          By continuing, you agree to ShopEasy's <span>Conditions of Use</span> and <span>Privacy Notice</span>.
        </p>
      </div>

      <div className="new-to-shopeasy">
        <p>New to ShopEasy?</p>
        <button className="create-account-btn">Create your ShopEasy account</button>
      </div>
    </div>
  );
}
