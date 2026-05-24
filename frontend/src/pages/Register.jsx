import { useState, useEffect, useRef } from "react";
import { useNavigate, Link }           from "react-router-dom";
import gsap                            from "gsap";
import ParticlesBackground             from "../components/ParticlesBackground";
import axios                           from "axios";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
// Registration page with animated card and particles background
const Register = () => {
  const [form,    setForm]    = useState({
    email:"", username:"", password:"", full_name:""
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const cardRef  = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    gsap.fromTo(cardRef.current,
      { opacity:0, y:40, scale:0.97 },
      { opacity:1, y:0, scale:1, duration:0.8, ease:"power3.out" }
    );
  }, []);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axios.post("http://127.0.0.1:8000/auth/register", form);
      // Auto login after register
      const formData = new URLSearchParams();
      formData.append("username", form.email);
      formData.append("password", form.password);
      const res = await axios.post(
        "http://127.0.0.1:8000/auth/login", formData);
      localStorage.setItem("friday_token", res.data.access_token);
      localStorage.setItem("friday_user",  JSON.stringify(res.data.user));
      gsap.to(cardRef.current, {
        opacity:0, y:-20, duration:0.3,
        onComplete: () => navigate("/dashboard")
      });
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally { setLoading(false); }
  };

  const fields = [
    { name:"full_name", label:"FULL NAME",  type:"text",     icon:User,  placeholder:"Your Name"       },
    { name:"email",     label:"EMAIL",      type:"email",    icon:Mail,  placeholder:"your@email.com"  },
    { name:"username",  label:"USERNAME",   type:"text",     icon:User,  placeholder:"username"        },
    { name:"password",  label:"PASSWORD",   type:"password", icon:Lock,  placeholder:"••••••••"        },
  ];

  return (
    <div style={{
      minHeight     : "100vh",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "center",
      background    : "#0a0a0a",
      position      : "relative",
      padding       : "20px"
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
          display    : "flex",
          alignItems : "center",
          gap        : "12px",
          marginBottom: "32px"
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
        }}>Create account</h2>
        <p style={{
          fontSize    : "0.82rem",
          color       : "rgba(255,255,255,0.35)",
          marginBottom: "24px"
        }}>
          Join FRIDAY and meet your AI companion
        </p>

        {error && (
          <div style={{
            padding     : "10px 14px",
            background  : "rgba(255,59,48,0.1)",
            border      : "1px solid rgba(255,59,48,0.2)",
            borderRadius: "10px",
            color       : "#ff6b6b",
            fontSize    : "0.8rem",
            marginBottom: "16px"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}
          style={{ display:"flex", flexDirection:"column", gap:"12px" }}>
          {fields.map(field => {
            const Icon = field.icon;
            return (
              <div key={field.name}>
                <label style={{
                  fontSize     : "0.72rem",
                  fontWeight   : "500",
                  color        : "rgba(255,255,255,0.4)",
                  letterSpacing: "0.05rem",
                  display      : "block",
                  marginBottom : "6px"
                }}>
                  {field.label}
                </label>
                <div style={{ position:"relative" }}>
                  <Icon size={15} color="rgba(255,255,255,0.25)"
                    style={{ position:"absolute", left:"14px",
                      top:"50%", transform:"translateY(-50%)" }} />
                  <input
                    type={field.type}
                    name={field.name}
                    value={form[field.name]}
                    onChange={handleChange}
                    required
                    placeholder={field.placeholder}
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
                    onFocus={e => e.target.style.borderColor="rgba(255,107,43,0.5)"}
                    onBlur={e  => e.target.style.borderColor="rgba(255,255,255,0.08)"}
                  />
                </div>
              </div>
            );
          })}

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
          }}>
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <p style={{
          textAlign : "center",
          marginTop : "20px",
          fontSize  : "0.78rem",
          color     : "rgba(255,255,255,0.3)"
        }}>
          Already have an account?{" "}
          <Link to="/login" style={{
            color         : "#FF6B2B",
            textDecoration: "none",
            fontWeight    : "500"
          }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;