import { useState } from "react";
import { useLogin } from "../hooks/useLogin";
import { Link, useNavigate } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
 
  const { login, error, isLoading } = useLogin();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const user = await login(email, password);
    if (user) {
      // Navigate to dashboard - it will automatically redirect based on user role
      navigate("/dashboard");
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#FFC04D",
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
        maxWidth: "400px"
      }}>
        {/* Logo Section */}
        <div style={{ marginBottom: "30px", textAlign: "center" }}>
          <img 
            src="/Quantix_Title.svg" 
            alt="Quantix" 
            style={{
              maxWidth: "100%",
              height: "auto",
              width: "clamp(300px, 70vw, 500px)",
              filter: "drop-shadow(2px 2px 4px rgba(0,0,0,0.2))"
            }}
          />
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} style={{
          width: "100%",
          maxWidth: "400px",
          background: "white",
          borderRadius: "20px",
          padding: "30px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
          position: "relative"
        }}>
          <h2 style={{ 
            marginBottom: "25px", 
            color: '#2E3192', 
            fontFamily: 'Inter, sans-serif', 
            fontWeight: 700,
            textAlign: "center",
            fontSize: "clamp(1.5rem, 4vw, 2rem)"
          }}>
            Login
          </h2>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "16px", 
              fontFamily: 'Inter, sans-serif',
              fontWeight: "600",
              color: "#333"
            }}>
              Email:
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
              style={{
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
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2E3192";
                e.target.style.background = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.background = "#F9FAFB";
              }}
            />
          </div>

          <div style={{ marginBottom: "25px" }}>
            <label style={{ 
              display: "block", 
              marginBottom: "8px", 
              fontSize: "16px", 
              fontFamily: 'Inter, sans-serif',
              fontWeight: "600",
              color: "#333"
            }}>
              Password:
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
              style={{
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
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#2E3192";
                e.target.style.background = "white";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#E5E7EB";
                e.target.style.background = "#F9FAFB";
              }}
            />
          </div>

          <button
            disabled={isLoading}
            style={{
              width: "100%",
              height: "48px",
              background: isLoading ? "#9CA3AF" : "linear-gradient(135deg, #16822D 0%, #059669 100%)",
              color: "white",
              fontWeight: "700",
              border: "none",
              borderRadius: "8px",
              cursor: isLoading ? "not-allowed" : "pointer",
              fontSize: "16px",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              boxShadow: isLoading ? "none" : "0 4px 12px rgba(22, 130, 45, 0.3)"
            }}
            onMouseOver={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(22, 130, 45, 0.4)";
              }
            }}
            onMouseOut={(e) => {
              if (!isLoading) {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(22, 130, 45, 0.3)";
              }
            }}
          >
            {isLoading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <div style={{ 
              marginTop: "16px", 
              padding: "12px",
              backgroundColor: "#FEE2E2",
              border: "1px solid #FECACA",
              borderRadius: "8px",
              color: "#991B1B",
              fontSize: "14px",
              fontFamily: 'Inter, sans-serif',
              textAlign: "center"
            }}>
              {error}
            </div>
          )}

          <div style={{ 
            textAlign: "center", 
            marginTop: "20px",
            fontSize: "14px",
            color: "#6B7280"
          }}>
            Don't have an account?{' '}
            <Link to="/signup" style={{
              color: "#2E3192",
              fontWeight: "600",
              textDecoration: "none"
            }}>
              Sign up
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
