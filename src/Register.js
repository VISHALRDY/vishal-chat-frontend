import React, { useState } from "react";
import axios from "axios";

const API = "https://chatapp-backend-f7fmbvgragbg8g5.centralus-01.azurewebsites.net";

function Register() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const register = async () => {

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    try {

      setError("");

      await axios.post(`${API}/api/Auth/register`, {
        name,
        email,
        password
      });

      setMessage("Registration successful! Please login.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } catch (err) {

      if (err.response) {
        setError(err.response.data);
      } else {
        setError("Server error");
      }

    }

  };

  return (
    <div style={{ padding: 40 }}>

      <h2>Register</h2>

      {error && (
        <div style={{ color: "red", marginBottom: 10 }}>
          {error}
        </div>
      )}

      {message && (
        <div style={{ color: "green", marginBottom: 10 }}>
          {message}
        </div>
      )}

      <input
        placeholder="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />

      <br /><br />

      <input
        type="email"
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

      <button onClick={register}>
        Register
      </button>

      <br /><br />

      <a href="/login">Already have an account? Login</a>

    </div>
  );
}

export default Register;