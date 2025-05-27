import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, isLoading } = useLogin();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <div style={{ackground: "#FFCC5D"}}>
      <img
        style={{ width: 421, height: 237, left: 398, top: 102, position: "absolute" }}
        src="/FYPLOGO_1.png"
        alt="logo"
      />

      <div className="outlined-text">uantix</div>

      <form onSubmit={handleSubmit} style={{
        width: 522,
        height: 398,
        left: 460,
        top: 313,
        position: "absolute",
        background: "white",
        borderRadius: 36,
        padding: "40px 30px",
        boxSizing: "border-box"
      }}>
        <h2 style={{ marginBottom: 20, color: 'black', fontFamily: 'Inter', fontWeight: 700 }}>Log in</h2>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16, fontFamily: 'Inter' }}>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email"
            style={{
              width: "100%",
              height: 42,
              borderRadius: 5,
              border: "none",
              background: "#D9D9D9",
              paddingLeft: 10,
              fontSize: 16
            }}
          />
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", marginBottom: 8, fontSize: 16, fontFamily: 'Inter' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Password"
            style={{
              width: "100%",
              height: 42,
              borderRadius: 5,
              border: "none",
              background: "#D9D9D9",
              paddingLeft: 10,
              fontSize: 16
            }}
          />
        </div>

        <button
          disabled={isLoading}
          style={{
            width: 100,
            height: 45,
            background: "#16822D",
            color: "white",
            fontWeight: 700,
            border: "none",
            borderRadius: 8,
            cursor: "pointer"
          }}
        >
          Login
        </button>

        {error && (
          <div style={{ marginTop: 16, color: "red", fontFamily: 'Inter' }}>
            {error}
          </div>
        )}
      </form>

      <div>
        <Link to="/signup" style={{
          position: "absolute",
          left: 896,
          top: 643,
          color: "#262626",
          fontSize: 16,
          fontFamily: "Inter",
          fontWeight: "700",
          textDecoration: "underline",
          cursor: "pointer"
        }}>
          Sign up
        </Link>
      </div>
    </div>
  );
};

export default Login;