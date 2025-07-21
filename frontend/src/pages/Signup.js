import { useState } from "react";
import { useSignup } from "../hooks/useSignup";
import { Link, useNavigate } from 'react-router-dom';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signup, error, isLoading } = useSignup();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await signup(name, email, password, 'staff');
    // Navigate to dashboard - it will automatically redirect based on user role
    navigate('/dashboard');
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(135deg, #FFCC5D 0%, #FDB94E 100%)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        width: "100%",
        maxWidth: "450px"
      }}>
        {/* Logo Section */}
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <h1 style={{
            fontFamily: 'Poppins',
            fontSize: "clamp(2.5rem, 10vw, 4.5rem)",
            fontWeight: 600,
            color: "white",
            WebkitTextStroke: "2px #2E3192",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            margin: 0,
            lineHeight: "1",
            letterSpacing: "-1px"
          }}>
            Quantix
          </h1>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} style={{
          width: "100%",
          background: "white",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
        }}>
          <h2 style={{
            marginBottom: "25px",
            color: '#2E3192',
            fontFamily: 'Inter, sans-serif',
            fontWeight: 700,
            textAlign: "center",
            fontSize: "24px"
          }}>
            Create Account
          </h2>

          {/* Name */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Enter your full name"
              style={inputStyle}
            />
          </div>

          {/* Email */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={inputStyle}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "20px" }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Create a strong password"
              style={inputStyle}
            />
          </div>

          {/* Submit Button */}
          <button
            disabled={isLoading}
            style={{
              width: "100%",
              height: "48px",
              background: isLoading
                ? "#9CA3AF"
                : "linear-gradient(135deg, #16822D 0%, #059669 100%)",
              color: "white",
              fontWeight: "700",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "16px",
              transition: "all 0.3s ease",
              boxShadow: isLoading ? "none" : "0 4px 12px rgba(22, 130, 45, 0.3)"
            }}
          >
            {isLoading ? "Creating Account..." : "Sign Up"}
          </button>

          {/* Error */}
          {error && (
            <div style={{
              marginTop: "16px",
              padding: "12px",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "14px",
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          {/* Link to Login */}
          <div style={{
            textAlign: "center",
            marginTop: "20px",
            fontSize: "14px",
            color: "#6B7280"
          }}>
            Already have an account?{' '}
            <Link to="/login" style={{
              color: "#2E3192",
              fontWeight: "600",
              textDecoration: "none"
            }}>
              Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "16px",
  fontFamily: 'Inter, sans-serif',
  fontWeight: "600",
  color: "#333"
};

const inputStyle = {
  width: "100%",
  height: "48px",
  borderRadius: "8px",
  border: "2px solid #E5E7EB",
  background: "#F9FAFB",
  padding: "0 16px",
  fontSize: "16px",
  transition: "all 0.3s ease",
  outline: "none",
  boxSizing: "border-box"
};

export default Signup;
