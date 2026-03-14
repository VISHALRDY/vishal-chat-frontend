import React, { useState } from "react";
import axios from "axios";

function Login() {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = async () => {

    const res = await axios.post(
      "https://chatapp-backend-f7fmbvgragb8g8g5.centralus-01.azurewebsites.net/api/auth/login",
      {
        email,
        password
      }
    );

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("userId", res.data.userId);
    localStorage.setItem("name", res.data.name);

    window.location.href = "/chat";
  };

  return (
    <div style={{ padding: 40 }}>

      <h2>Login</h2>

      <input
        placeholder="Email"
        onChange={(e) => setEmail(e.target.value)}
      />

      <br /><br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />

      <br /><br />

      <button onClick={login}>
        Login
      </button>

    </div>
  );
}

export default Login;