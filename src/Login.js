import React, { useState } from "react";
import axios from "axios";

const API = "https://chatapp-backend-f7fmbvgragb8g8g5.centralus-01.azurewebsites.net";function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async () => {

    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }

    try {

      setLoading(true);
      setError("");

      const res = await axios.post(`${API}/api/Auth/login`, {
        email,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("userId", res.data.userId);
      localStorage.setItem("name", res.data.name);

      window.location.href = "/chat";

    } catch (err) {

      if (err.response) {
        setError(err.response.data.message || "Login failed");
      } else {
        setError("Server not reachable");
      }

    } finally {
      setLoading(false);
    }

  };

  return (
    <div style={{ padding: 40 }}>

      <h2>Login</h2>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={login} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      <br /><br />

      <div>
        Don't have an account?
        <br />
        <a href="/register">Register Here</a>
      </div>

    </div>
  );
}

export default Login;