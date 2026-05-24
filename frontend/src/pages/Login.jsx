import { useState, useEffect, useRef } from "react";
import { useNavigate, Link }           from "react-router-dom";
import gsap                            from "gsap";
import ParticlesBackground             from "../components/ParticlesBackground";
import axios                           from "axios";
import { Mail, Lock, ArrowRight } from "lucide-react";

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const cardRef  = useRef(null);
  const navigate = useNavigate();
// Animate card in on mount
  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity: 0, y: 40, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    );
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);
      const res = await axios.post(
        "http://127.0.0.1:8000/auth/login", formData);
      localStorage.setItem("friday_token", res.data.access_token);
      localStorage.setItem("friday_user",  JSON.stringify(res.data.user));
      gsap.to(cardRef.current, {
        opacity: 0, y: -20, duration: 0.3,
        onComplete: () => navigate("/dashboard")
      });
    } catch {
      setError("Invalid email or password");
      gsap.to(cardRef.current, {
        keyframes: [
          { x: -8, duration: 0.08 },
          { x:  8, duration: 0.08 },
          { x: -8, duration: 0.08 },
          { x:  0, duration: 0.08 }
        ]
      });
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight     : "100vh",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "center",
      background    : "#0a0a0a",
      position      : "relative"
    }}>
      <ParticlesBackground />

      <div ref={cardRef} style={{
        zIndex        : 10,
        width         : "100%",
        maxWidth      : "420px",
        padding       : "40px",
        background    : "rgba(255,255,255,0.04)",
        backdropFilter: "blur(30px)",
        border        : "1px solid rgba(255,255,255,0.08)",
        borderRadius  : "24px",
        boxShadow     : "0 25px 60px rgba(0,0,0,0.5)"
      }}>
        {/* Logo */}
        <div style={{
          display      : "flex",
          alignItems   : "center",
          gap          : "12px",
          marginBottom : "32px"
        }}>
<div style={{
  width        : "44px",
  height       : "44px",
  borderRadius : "12px",
  overflow     : "hidden",
  boxShadow    : "0 4px 20px rgba(255,107,43,0.4)"
}}>
  <img
    src="/logo.png"
    alt="FRIDAY"
    style={{
      width    : "100%",
      height   : "100%",
      objectFit: "contain"
    }}
  />
</div>
          <div>
            <h1 style={{
              fontSize    : "1.3rem",
              fontWeight  : "700",
              letterSpacing: "0.15rem",
              color       : "#fff"
            }}>FRIDAY</h1>
            <p style={{
              fontSize : "0.62rem",
              color    : "rgba(255,255,255,0.3)",
              letterSpacing: "0.1rem"
            }}>AI PLATFORM</p>
          </div>
        </div>

        <h2 style={{
          fontSize    : "1.4rem",
          fontWeight  : "600",
          color       : "#fff",
          marginBottom: "6px"
        }}>
          Welcome back
        </h2>
        <p style={{
          fontSize    : "0.82rem",
          color       : "rgba(255,255,255,0.35)",
          marginBottom: "28px"
        }}>
          Sign in to access your AI platform
        </p>

        {error && (
          <div style={{
            padding      : "10px 14px",
            background   : "rgba(255,59,48,0.1)",
            border       : "1px solid rgba(255,59,48,0.2)",
            borderRadius : "10px",
            color        : "#ff6b6b",
            fontSize     : "0.8rem",
            marginBottom : "16px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
          <div>
            <label style={{
              fontSize     : "0.72rem",
              fontWeight   : "500",
              color        : "rgba(255,255,255,0.4)",
              letterSpacing: "0.05rem",
              display      : "block",
              marginBottom : "6px"
            }}>
              EMAIL
            </label>
            <div style={{ position: "relative" }}>
              <Mail size={15} color="rgba(255,255,255,0.25)"
                style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)" }} />
              <input
                type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                style={{
                  width       : "100%",
                  padding     : "12px 14px 12px 40px",
                  background  : "rgba(255,255,255,0.05)",
                  border      : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color       : "#fff",
                  fontSize    : "0.88rem",
                  outline     : "none",
                  fontFamily  : "Inter, sans-serif"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,107,43,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          </div>

          <div>
            <label style={{
              fontSize     : "0.72rem",
              fontWeight   : "500",
              color        : "rgba(255,255,255,0.4)",
              letterSpacing: "0.05rem",
              display      : "block",
              marginBottom : "6px"
            }}>
              PASSWORD
            </label>
            <div style={{ position: "relative" }}>
              <Lock size={15} color="rgba(255,255,255,0.25)"
                style={{ position:"absolute", left:"14px", top:"50%", transform:"translateY(-50%)" }} />
              <input
                type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width       : "100%",
                  padding     : "12px 14px 12px 40px",
                  background  : "rgba(255,255,255,0.05)",
                  border      : "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "10px",
                  color       : "#fff",
                  fontSize    : "0.88rem",
                  outline     : "none",
                  fontFamily  : "Inter, sans-serif"
                }}
                onFocus={e => e.target.style.borderColor = "rgba(255,107,43,0.5)"}
                onBlur={e  => e.target.style.borderColor = "rgba(255,255,255,0.08)"}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} style={{
            padding      : "14px",
            background   : loading
              ? "rgba(255,107,43,0.4)"
              : "linear-gradient(135deg, #FF6B2B, #ff9a6b)",
            border       : "none",
            borderRadius : "12px",
            color        : "#fff",
            fontSize     : "0.88rem",
            fontWeight   : "600",
            cursor       : loading ? "not-allowed" : "pointer",
            display      : "flex",
            alignItems   : "center",
            justifyContent: "center",
            gap          : "8px",
            marginTop    : "4px",
            boxShadow    : "0 4px 20px rgba(255,107,43,0.3)",
            transition   : "all 0.2s"
          }}
          onMouseEnter={e => {
            if (!loading) e.currentTarget.style.boxShadow = "0 6px 25px rgba(255,107,43,0.5)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(255,107,43,0.3)";
          }}>
            {loading ? "Signing in..." : "Sign In"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{
          textAlign  : "center",
          marginTop  : "20px",
          fontSize   : "0.78rem",
          color      : "rgba(255,255,255,0.3)"
        }}>
          No account?{" "}
          <Link to="/register" style={{
            color         : "#FF6B2B",
            textDecoration: "none",
            fontWeight    : "500"
          }}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;