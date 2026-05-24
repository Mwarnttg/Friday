import { useState, useEffect, useRef } from "react";
import { useNavigate, Link }           from "react-router-dom";
import gsap                            from "gsap";
import ParticlesBackground             from "../components/ParticlesBackground";
import axios                           from "axios";
import { Mail, Lock, ArrowRight }      from "lucide-react";

const Login = () => {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const cardRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity:0, y:30, filter:"blur(8px)" },
      { opacity:1, y:0, filter:"blur(0px)",
        duration:0.9, ease:"power3.out" }
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
        opacity:0, y:-20, filter:"blur(8px)",
        duration:0.4,
        onComplete: () => navigate("/dashboard")
      });
    } catch {
      setError("Invalid email or password");
      gsap.to(cardRef.current, {
        keyframes: [
          { x:-10, duration:0.07 },
          { x: 10, duration:0.07 },
          { x:-10, duration:0.07 },
          { x:  0, duration:0.07 }
        ]
      });
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width       : "100%",
    padding     : "13px 14px 13px 42px",
    background  : "rgba(255,255,255,0.04)",
    border      : "1px solid rgba(255,255,255,0.08)",
    borderRadius: "12px",
    color       : "#fff",
    fontSize    : "0.92rem",
    outline     : "none",
    fontFamily  : "Inter, sans-serif",
    transition  : "all 0.2s",
    boxSizing   : "border-box"
  };

  return (
    <div style={{
      minHeight     : "100vh",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "center",
      background    : "#050508",
      position      : "relative",
      padding       : "20px"
    }}>
      <ParticlesBackground />

      <div ref={cardRef} style={{
        zIndex        : 10,
        width         : "100%",
        maxWidth      : "400px"
      }}>
        {/* Logo */}
        <div style={{
          display      : "flex",
          alignItems   : "center",
          justifyContent: "center",
          gap          : "10px",
          marginBottom : "40px"
        }}>
          <div style={{
            width:"34px", height:"34px",
            borderRadius:"8px", overflow:"hidden"
          }}>
            <img src="/logo.png" alt="FRIDAY"
              style={{ width:"100%", height:"100%", objectFit:"contain" }} />
          </div>
          <span style={{
            fontFamily   : "'Bebas Neue', sans-serif",
            fontSize     : "1.3rem",
            letterSpacing: "0.3rem",
            color        : "#fff"
          }}>
            FRIDAY
          </span>
        </div>

        {/* Card */}
        <div style={{
          background    : "rgba(255,255,255,0.03)",
          backdropFilter: "blur(30px)",
          border        : "1px solid rgba(255,255,255,0.07)",
          borderRadius  : "24px",
          padding       : "36px 32px",
          boxShadow     : "0 24px 60px rgba(0,0,0,0.4)"
        }}>
          <h2 style={{
            fontSize    : "1.4rem",
            fontWeight  : "600",
            color       : "#fff",
            margin      : "0 0 6px",
            letterSpacing: "-0.01em"
          }}>
            Welcome back
          </h2>
          <p style={{
            fontSize    : "0.85rem",
            color       : "rgba(255,255,255,0.3)",
            marginBottom: "28px",
            margin      : "0 0 28px"
          }}>
            Sign in to your FRIDAY account
          </p>

          {error && (
            <div style={{
              padding     : "11px 14px",
              background  : "rgba(239,68,68,0.08)",
              border      : "1px solid rgba(239,68,68,0.2)",
              borderRadius: "10px",
              color       : "#f87171",
              fontSize    : "0.82rem",
              marginBottom: "18px"
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}
            style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {/* Email */}
            <div>
              <label style={{
                fontSize     : "0.72rem",
                fontWeight   : "500",
                color        : "rgba(255,255,255,0.35)",
                letterSpacing: "0.06rem",
                display      : "block",
                marginBottom : "7px",
                textTransform: "uppercase"
              }}>
                Email
              </label>
              <div style={{ position:"relative" }}>
                <Mail size={14} color="rgba(255,255,255,0.2)"
                  style={{ position:"absolute", left:"14px",
                    top:"50%", transform:"translateY(-50%)" }} />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.2)";
                    e.target.style.background  = "rgba(255,255,255,0.06)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.background  = "rgba(255,255,255,0.04)";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{
                fontSize     : "0.72rem",
                fontWeight   : "500",
                color        : "rgba(255,255,255,0.35)",
                letterSpacing: "0.06rem",
                display      : "block",
                marginBottom : "7px",
                textTransform: "uppercase"
              }}>
                Password
              </label>
              <div style={{ position:"relative" }}>
                <Lock size={14} color="rgba(255,255,255,0.2)"
                  style={{ position:"absolute", left:"14px",
                    top:"50%", transform:"translateY(-50%)" }} />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={inputStyle}
                  onFocus={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.2)";
                    e.target.style.background  = "rgba(255,255,255,0.06)";
                  }}
                  onBlur={e => {
                    e.target.style.borderColor = "rgba(255,255,255,0.08)";
                    e.target.style.background  = "rgba(255,255,255,0.04)";
                  }}
                />
              </div>
            </div>

            {/* Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                padding      : "14px",
                background   : loading
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(255,255,255,0.9)",
                border       : "1px solid rgba(255,255,255,0.1)",
                borderRadius : "12px",
                color        : loading ? "rgba(255,255,255,0.3)" : "#050508",
                fontSize     : "0.9rem",
                fontWeight   : "600",
                cursor       : loading ? "not-allowed" : "pointer",
                display      : "flex",
                alignItems   : "center",
                justifyContent: "center",
                gap          : "8px",
                marginTop    : "4px",
                transition   : "all 0.2s",
                fontFamily   : "Inter, sans-serif",
                letterSpacing: "0.01em"
              }}
              onMouseEnter={e => {
                if (!loading) e.currentTarget.style.background = "#fff";
              }}
              onMouseLeave={e => {
                if (!loading)
                  e.currentTarget.style.background = "rgba(255,255,255,0.9)";
              }}
            >
              {loading ? "Signing in..." : "Sign In"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          {/* Divider */}
          <div style={{
            display    : "flex",
            alignItems : "center",
            gap        : "12px",
            margin     : "24px 0"
          }}>
            <div style={{
              flex:"1", height:"1px",
              background:"rgba(255,255,255,0.07)"
            }} />
            <span style={{
              fontSize:"0.72rem",
              color:"rgba(255,255,255,0.2)"
            }}>
              or
            </span>
            <div style={{
              flex:"1", height:"1px",
              background:"rgba(255,255,255,0.07)"
            }} />
          </div>

          <p style={{
            textAlign : "center",
            fontSize  : "0.82rem",
            color     : "rgba(255,255,255,0.25)",
            margin    : 0
          }}>
            No account?{" "}
            <Link to="/register" style={{
              color         : "rgba(255,255,255,0.7)",
              textDecoration: "none",
              fontWeight    : "500",
              borderBottom  : "1px solid rgba(255,255,255,0.2)"
            }}>
              Create one
            </Link>
          </p>
        </div>

        {/* Bottom tag */}
        <p style={{
          textAlign    : "center",
          marginTop    : "24px",
          fontSize     : "0.68rem",
          color        : "rgba(255,255,255,0.12)",
          letterSpacing: "0.08rem"
        }}>
          FRIDAY AI PLATFORM
        </p>
      </div>
    </div>
  );
};

export default Login;