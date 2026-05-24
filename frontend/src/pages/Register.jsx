import { useState, useEffect, useRef } from "react";
import { useNavigate, Link }           from "react-router-dom";
import gsap                            from "gsap";
import ParticlesBackground             from "../components/ParticlesBackground";
import axios                           from "axios";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

const Register = () => {
  const [form, setForm] = useState({
    email:"", username:"", password:"", full_name:""
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity:0, y:30, filter:"blur(8px)" },
      { opacity:1, y:0, filter:"blur(0px)",
        duration:0.9, ease:"power3.out" }
    );
  }, []);

  const handleChange = (e) =>
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://127.0.0.1:8000/auth/register", form);
      const formData = new URLSearchParams();
      formData.append("username", form.email);
      formData.append("password", form.password);
      const res = await axios.post(
        "http://127.0.0.1:8000/auth/login", formData);
      localStorage.setItem("friday_token", res.data.access_token);
      localStorage.setItem("friday_user",  JSON.stringify(res.data.user));
      gsap.to(cardRef.current, {
        opacity:0, y:-20, filter:"blur(8px)",
        duration:0.4,
        onComplete: () => navigate("/select")
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
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

  const fields = [
    { name:"full_name", label:"Full Name",
      type:"text",     icon:User, placeholder:"Your Name"      },
    { name:"email",     label:"Email",
      type:"email",    icon:Mail, placeholder:"your@email.com" },
    { name:"username",  label:"Username",
      type:"text",     icon:User, placeholder:"username"       },
    { name:"password",  label:"Password",
      type:"password", icon:Lock, placeholder:"••••••••"       },
  ];

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
        zIndex  : 10,
        width   : "100%",
        maxWidth: "400px"
      }}>
        {/* Logo */}
        <div style={{
          display       : "flex",
          alignItems    : "center",
          justifyContent: "center",
          gap           : "10px",
          marginBottom  : "40px"
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
            Create account
          </h2>
          <p style={{
            fontSize    : "0.85rem",
            color       : "rgba(255,255,255,0.3)",
            margin      : "0 0 28px"
          }}>
            Join FRIDAY and choose your AI companion
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

          <form onSubmit={handleRegister}
            style={{ display:"flex", flexDirection:"column", gap:"14px" }}>

            {fields.map(field => {
              const Icon = field.icon;
              return (
                <div key={field.name}>
                  <label style={{
                    fontSize     : "0.72rem",
                    fontWeight   : "500",
                    color        : "rgba(255,255,255,0.35)",
                    letterSpacing: "0.06rem",
                    display      : "block",
                    marginBottom : "7px",
                    textTransform: "uppercase"
                  }}>
                    {field.label}
                  </label>
                  <div style={{ position:"relative" }}>
                    <Icon size={14} color="rgba(255,255,255,0.2)"
                      style={{ position:"absolute", left:"14px",
                        top:"50%", transform:"translateY(-50%)" }} />
                    <input
                      type={field.type}
                      name={field.name}
                      value={form[field.name]}
                      onChange={handleChange}
                      required
                      placeholder={field.placeholder}
                      style={inputStyle}
                      onFocus={e => {
                        e.target.style.borderColor =
                          "rgba(255,255,255,0.2)";
                        e.target.style.background  =
                          "rgba(255,255,255,0.06)";
                      }}
                      onBlur={e => {
                        e.target.style.borderColor =
                          "rgba(255,255,255,0.08)";
                        e.target.style.background  =
                          "rgba(255,255,255,0.04)";
                      }}
                    />
                  </div>
                </div>
              );
            })}

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
                color        : loading
                  ? "rgba(255,255,255,0.3)" : "#050508",
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
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.9)";
              }}
            >
              {loading ? "Creating account..." : "Create Account"}
              {!loading && <ArrowRight size={15} />}
            </button>
          </form>

          <div style={{
            display   : "flex",
            alignItems: "center",
            gap       : "12px",
            margin    : "24px 0"
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
            textAlign: "center",
            fontSize : "0.82rem",
            color    : "rgba(255,255,255,0.25)",
            margin   : 0
          }}>
            Already have an account?{" "}
            <Link to="/login" style={{
              color         : "rgba(255,255,255,0.7)",
              textDecoration: "none",
              fontWeight    : "500",
              borderBottom  : "1px solid rgba(255,255,255,0.2)"
            }}>
              Sign in
            </Link>
          </p>
        </div>

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

export default Register;