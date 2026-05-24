import { useState, useEffect, useRef } from "react";
import { useNavigate }                  from "react-router-dom";
import gsap                             from "gsap";
import ParticlesBackground              from "../components/ParticlesBackground";
import MessageRenderer                  from "../components/MessageRenderer";
import axios                            from "axios";
import {
  Search, Code, FileText, BarChart2, GraduationCap,
  Mail, Bug, Globe, BookOpen, Target, DollarSign,
  Lightbulb, Zap, Send, LogOut, User, Clock,
  ChevronRight, Plus, Briefcase
} from "lucide-react";
import ResumePanel from "../components/ResumePanel";

const API = process.env.REACT_APP_API_URL || "http://127.0.0.1:8000";

const AGENT_META = {
  auto      : { icon: Zap,           label: "Auto",      color: "#ffffff" },
  researcher: { icon: Search,        label: "Research",  color: "#60a5fa" },
  coder     : { icon: Code,          label: "Code",      color: "#34d399" },
  writer    : { icon: FileText,      label: "Write",     color: "#f472b6" },
  analyst   : { icon: BarChart2,     label: "Analyze",   color: "#a78bfa" },
  tutor     : { icon: GraduationCap, label: "Teach",     color: "#fbbf24" },
  email     : { icon: Mail,          label: "Email",     color: "#fb923c" },
  debugger  : { icon: Bug,           label: "Debug",     color: "#f87171" },
  translator: { icon: Globe,         label: "Translate", color: "#2dd4bf" },
  summarizer: { icon: BookOpen,      label: "Summarize", color: "#818cf8" },
  planner   : { icon: Target,        label: "Plan",      color: "#4ade80" },
  finance   : { icon: DollarSign,    label: "Finance",   color: "#86efac" },
  idea      : { icon: Lightbulb,     label: "Ideas",     color: "#fde68a" },
};

const Dashboard = () => {
  const [messages,    setMessages]    = useState([]);
  const [input,       setInput]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [activeAgent, setActiveAgent] = useState("auto");
  const [user,        setUser]        = useState(null);
  const [character,   setCharacter]   = useState(null);
  const [resumeOpen,  setResumeOpen]  = useState(false);
  const chatEndRef = useRef(null);
  const inputRef   = useRef(null);
  const headerRef  = useRef(null);
  const chatRef    = useRef(null);
  const navigate   = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem("friday_user");
    if (!userData) { navigate("/login"); return; }
    setUser(JSON.parse(userData));

    const charData = localStorage.getItem("friday_character");
    const char     = charData ? JSON.parse(charData) : null;
    setCharacter(char);

    gsap.fromTo(headerRef.current,
      { opacity: 0, y: -30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }
    );
    gsap.fromTo(chatRef.current,
      { opacity: 0, scale: 0.97 },
      { opacity: 1, scale: 1, duration: 0.8,
        delay: 0.2, ease: "power3.out" }
    );

    const greeting = char
      ? char.greeting
      : "Hello! I'm FRIDAY — your personal AI platform. I have 12 specialized agents ready. How can I help you today?";

    setMessages([{
      role   : "friday",
      content: greeting,
      agent  : "auto",
      label  : char ? char.name : "FRIDAY",
      time   : new Date().toLocaleTimeString([],
        { hour:"2-digit", minute:"2-digit" })
    }]);
  }, [navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    setLoading(true);

    setMessages(prev => [...prev, {
      role: "user", content: msg,
      time: new Date().toLocaleTimeString([],
        { hour:"2-digit", minute:"2-digit" })
    }]);

    setMessages(prev => [...prev, {
      role: "friday", content: "thinking",
      agent: "thinking", time: ""
    }]);

    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.post(`${API}/api/chat`,
        {
          message     : msg,
          agent       : activeAgent,
          system_prompt: character?.systemPrompt || null
        },
        { headers: { Authorization: `Bearer ${token}` }}
      );

      setMessages(prev => [...prev.slice(0, -1), {
        role   : "friday",
        content: res.data.response,
        agent  : res.data.agent_used,
        label  : character?.name ||
                 AGENT_META[res.data.agent_used]?.label || "FRIDAY",
        tokens : res.data.tokens_used,
        time   : new Date().toLocaleTimeString([],
          { hour:"2-digit", minute:"2-digit" })
      }]);
    } catch {
      setMessages(prev => [...prev.slice(0, -1), {
        role   : "friday",
        content: "Connection error. Make sure backend is running.",
        agent  : "error",
        time   : new Date().toLocaleTimeString([],
          { hour:"2-digit", minute:"2-digit" })
      }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const logout          = () => { localStorage.clear(); navigate("/login"); };
  const changeCharacter = () => navigate("/select");
  const currentMeta     = AGENT_META[activeAgent] || AGENT_META.auto;
  const ActiveIcon      = currentMeta.icon;
  const accentColor     = character?.color || "#FF6B2B";
  const accentGlow      = character?.glow  || "rgba(255,107,43,0.4)";

  return (
    <div style={{
      height       : "100vh",
      background   : "#050508",
      display      : "flex",
      flexDirection: "column",
      overflow     : "hidden",
      position     : "relative"
    }}>
      <ParticlesBackground />

      {/* Background orbs */}
      <div style={{
        position    : "fixed",
        top         : "-20%",
        left        : "-10%",
        width       : "500px",
        height      : "500px",
        borderRadius: "50%",
        background  : `radial-gradient(circle, ${accentColor}08 0%, transparent 70%)`,
        pointerEvents: "none",
        zIndex      : 0
      }} />
      <div style={{
        position    : "fixed",
        bottom      : "-20%",
        right       : "-10%",
        width       : "600px",
        height      : "600px",
        borderRadius: "50%",
        background  : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        zIndex      : 0
      }} />

      {/* ── HEADER ── */}
      <div ref={headerRef} style={{
        zIndex        : 10,
        padding       : "12px 24px",
        display       : "flex",
        alignItems    : "center",
        justifyContent: "space-between",
        borderBottom  : "1px solid rgba(255,255,255,0.05)",
        background    : "rgba(5,5,8,0.8)",
        backdropFilter: "blur(20px)",
        flexShrink    : 0
      }}>
        {/* Left */}
        <div style={{ display:"flex", alignItems:"center", gap:"16px" }}>
          <div style={{ display:"flex", alignItems:"center", gap:"10px" }}>
            <div style={{
              width:"32px", height:"32px",
              borderRadius:"8px", overflow:"hidden"
            }}>
              <img src="/logo.png" alt="FRIDAY"
                style={{ width:"100%", height:"100%",
                  objectFit:"contain" }} />
            </div>
            <span style={{
              fontFamily   : "'Bebas Neue', sans-serif",
              fontSize     : "1.1rem",
              letterSpacing: "0.3rem",
              color        : "#fff"
            }}>
              FRIDAY
            </span>
          </div>

          {character && (
            <div onClick={changeCharacter} style={{
              display    : "flex",
              alignItems : "center",
              gap        : "8px",
              padding    : "5px 12px",
              background : `${accentColor}12`,
              border     : `1px solid ${accentColor}25`,
              borderRadius: "20px",
              cursor     : "pointer",
              transition : "all 0.2s"
            }}
            onMouseEnter={e =>
              e.currentTarget.style.background = `${accentColor}20`}
            onMouseLeave={e =>
              e.currentTarget.style.background = `${accentColor}12`}
            >
              <div style={{
                width:"20px", height:"20px",
                borderRadius:"50%", overflow:"hidden"
              }}>
                <img src={character.image} alt={character.name}
                  style={{ width:"100%", height:"100%",
                    objectFit:"cover" }} />
              </div>
              <span style={{
                fontSize:"0.72rem", color:accentColor, fontWeight:"500"
              }}>
                {character.name}
              </span>
            </div>
          )}
        </div>

        {/* Right */}
        <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
          <div style={{
            display    : "flex",
            alignItems : "center",
            gap        : "6px",
            padding    : "5px 12px",
            background : "rgba(34,197,94,0.08)",
            border     : "1px solid rgba(34,197,94,0.15)",
            borderRadius: "20px"
          }}>
            <div style={{
              width:"6px", height:"6px",
              borderRadius:"50%",
              background:"#22c55e",
              boxShadow:"0 0 6px #22c55e",
              animation:"pulse 2s infinite"
            }} />
            <span style={{
              fontSize:"0.68rem", color:"#22c55e", fontWeight:"500"
            }}>
              Online
            </span>
          </div>

          <div style={{
            display    : "flex",
            alignItems : "center",
            gap        : "8px",
            padding    : "5px 12px",
            background : "rgba(255,255,255,0.04)",
            border     : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px"
          }}>
            <div style={{
              width:"22px", height:"22px",
              borderRadius:"50%",
              background:`${accentColor}20`,
              border:`1px solid ${accentColor}40`,
              display:"flex", alignItems:"center",
              justifyContent:"center"
            }}>
              <User size={11} color={accentColor} />
            </div>
            <span style={{
              fontSize:"0.72rem", color:"rgba(255,255,255,0.6)"
            }}>
              {user?.name || "User"}
            </span>
          </div>

          <button onClick={logout} style={{
            padding     : "6px 12px",
            background  : "transparent",
            border      : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "20px",
            color       : "rgba(255,255,255,0.35)",
            fontSize    : "0.72rem",
            cursor      : "pointer",
            display     : "flex",
            alignItems  : "center",
            gap         : "5px",
            transition  : "all 0.2s"
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = "rgba(239,68,68,0.4)";
            e.currentTarget.style.color       = "#ef4444";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
            e.currentTarget.style.color       = "rgba(255,255,255,0.35)";
          }}>
            <LogOut size={11} />
            Sign out
          </button>
        </div>
      </div>

      {/* ── AGENT BAR ── */}
      <div style={{
        zIndex        : 10,
        padding       : "8px 24px",
        display       : "flex",
        alignItems    : "center",
        gap           : "6px",
        overflowX     : "auto",
        borderBottom  : "1px solid rgba(255,255,255,0.04)",
        background    : "rgba(5,5,8,0.6)",
        backdropFilter: "blur(10px)",
        flexShrink    : 0,
        scrollbarWidth: "none"
      }}>
        {Object.entries(AGENT_META).map(([key, meta]) => {
          const Icon     = meta.icon;
          const isActive = activeAgent === key;
          return (
            <button key={key} onClick={() => setActiveAgent(key)}
              style={{
                display      : "flex",
                alignItems   : "center",
                gap          : "5px",
                padding      : "5px 12px",
                background   : isActive
                  ? `${meta.color}15` : "transparent",
                border       : isActive
                  ? `1px solid ${meta.color}35`
                  : "1px solid transparent",
                borderRadius : "20px",
                cursor       : "pointer",
                whiteSpace   : "nowrap",
                flexShrink   : 0,
                transition   : "all 0.2s"
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.background =
                    "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor =
                    "rgba(255,255,255,0.08)";
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.borderColor = "transparent";
                }
              }}
            >
              <Icon size={11}
                color={isActive
                  ? meta.color : "rgba(255,255,255,0.3)"} />
              <span style={{
                fontSize : "0.68rem",
                color    : isActive
                  ? meta.color : "rgba(255,255,255,0.35)",
                fontWeight: isActive ? "600" : "400"
              }}>
                {meta.label}
              </span>
            </button>
          );
        })}

        {/* Career button */}
        <button onClick={() => setResumeOpen(true)} style={{
          display      : "flex",
          alignItems   : "center",
          gap          : "5px",
          padding      : "5px 12px",
          background   : "rgba(255,107,43,0.1)",
          border       : "1px solid rgba(255,107,43,0.25)",
          borderRadius : "20px",
          cursor       : "pointer",
          whiteSpace   : "nowrap",
          flexShrink   : 0,
          marginLeft   : "auto",
          transition   : "all 0.2s"
        }}
        onMouseEnter={e =>
          e.currentTarget.style.background = "rgba(255,107,43,0.18)"}
        onMouseLeave={e =>
          e.currentTarget.style.background = "rgba(255,107,43,0.1)"}
        >
          <Briefcase size={11} color="#FF6B2B" />
          <span style={{
            fontSize:"0.68rem", color:"#FF6B2B", fontWeight:"600"
          }}>
            Career
          </span>
        </button>
      </div>

      {/* ── CHAT AREA ── */}
      <div ref={chatRef} style={{
        flex         : 1,
        display      : "flex",
        flexDirection: "column",
        overflow     : "hidden",
        position     : "relative",
        zIndex       : 1
      }}>
        {/* Messages */}
        <div style={{
          flex         : 1,
          overflowY    : "auto",
          padding      : "32px 10vw",
          display      : "flex",
          flexDirection: "column",
          gap          : "24px"
        }}>
          {messages.map((msg, i) => {
            const isUser = msg.role === "user";
            const meta   = AGENT_META[msg.agent];
            const Icon   = meta?.icon || Zap;
            const color  = meta?.color || accentColor;

            return (
              <div key={i} style={{
                display      : "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
                alignItems   : "flex-start",
                gap          : "12px",
                animation    : "fadeIn 0.3s ease"
              }}>
                {/* FRIDAY avatar */}
                {!isUser && (
                  <div style={{
                    width        : "36px",
                    height       : "36px",
                    borderRadius : "12px",
                    overflow     : "hidden",
                    border       : `1px solid ${color}30`,
                    flexShrink   : 0,
                    marginTop    : "2px",
                    background   : character
                      ? "transparent" : `${color}15`,
                    boxShadow    : `0 4px 12px ${color}20`
                  }}>
                    {character && msg.agent !== "thinking" ? (
                      <img src={character.image} alt={character.name}
                        style={{ width:"100%", height:"100%",
                          objectFit:"cover" }} />
                    ) : (
                      <div style={{
                        width:"100%", height:"100%",
                        display:"flex", alignItems:"center",
                        justifyContent:"center"
                      }}>
                        <Icon size={16} color={color} />
                      </div>
                    )}
                  </div>
                )}

                <div style={{
                  maxWidth     : isUser ? "65%" : "85%",
                  minWidth     : "200px",
                  width        : "fit-content",
                  display      : "flex",
                  flexDirection: "column",
                  gap          : "5px"
                }}>
                  {/* Label */}
                  {!isUser && msg.agent !== "thinking" && (
                    <div style={{
                      display:"flex", alignItems:"center", gap:"8px"
                    }}>
                      <span style={{
                        fontSize:"0.68rem", fontWeight:"600",
                        color:"rgba(255,255,255,0.4)"
                      }}>
                        {msg.label || "FRIDAY"}
                      </span>
                      {msg.tokens && (
                        <span style={{
                          fontSize    : "0.6rem",
                          color       : "rgba(255,255,255,0.2)",
                          background  : "rgba(255,255,255,0.05)",
                          padding     : "1px 6px",
                          borderRadius: "4px"
                        }}>
                          {msg.tokens} tokens
                        </span>
                      )}
                    </div>
                  )}

                  {/* Bubble */}
                  <div style={{
                    padding      : "16px 20px",
                    background   : isUser
                      ? `linear-gradient(135deg,
                          ${accentColor}20, ${accentColor}08)`
                      : "rgba(255,255,255,0.07)",
                    border       : isUser
                      ? `1px solid ${accentColor}30`
                      : "1px solid rgba(255,255,255,0.07)",
                    borderRadius : isUser
                      ? "18px 4px 18px 18px"
                      : "4px 18px 18px 18px",
                    backdropFilter: "blur(20px)",
                    boxShadow    : isUser
                      ? `0 4px 20px ${accentColor}10`
                      : "0 4px 20px rgba(0,0,0,0.2)"
                  }}>
                    {/* ── MESSAGE CONTENT ── */}
                    {msg.content === "thinking" ? (
                      <div style={{
                        display  :"flex", gap:"5px",
                        alignItems:"center", padding:"2px 0"
                      }}>
                        {[0,1,2].map(j => (
                          <div key={j} style={{
                            width:"6px", height:"6px",
                            borderRadius:"50%",
                            background: accentColor,
                            animation:`dot 0.8s ${j*0.2}s infinite alternate`
                          }} />
                        ))}
                      </div>
                    ) : isUser ? (
                      <p style={{
                        color    : "rgba(255,255,255,0.9)",
                        fontSize : "0.9rem",
                        lineHeight: "1.7",
                        whiteSpace: "pre-wrap",
                        margin   : 0,
                        fontFamily: "Inter, sans-serif"
                      }}>
                        {msg.content}
                      </p>
                    ) : (
                      <MessageRenderer
                        content={msg.content}
                        accentColor={accentColor}
                      />
                    )}
                  </div>

                  {/* Time */}
                  {msg.time && (
                    <div style={{
                      display      : "flex",
                      alignItems   : "center",
                      gap          : "4px",
                      justifyContent: isUser ? "flex-end" : "flex-start"
                    }}>
                      <Clock size={9}
                        color="rgba(255,255,255,0.15)" />
                      <span style={{
                        fontSize:"0.6rem",
                        color:"rgba(255,255,255,0.15)"
                      }}>
                        {msg.time}
                      </span>
                    </div>
                  )}
                </div>

                {/* User avatar */}
                {isUser && (
                  <div style={{
                    width        : "36px",
                    height       : "36px",
                    borderRadius : "12px",
                    background   : "rgba(255,255,255,0.06)",
                    border       : "1px solid rgba(255,255,255,0.1)",
                    display      : "flex",
                    alignItems   : "center",
                    justifyContent: "center",
                    flexShrink   : 0,
                    marginTop    : "2px",
                    boxShadow    : "0 4px 12px rgba(0,0,0,0.2)"
                  }}>
                    <User size={15}
                      color="rgba(255,255,255,0.4)" />
                  </div>
                )}
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* ── INPUT AREA ── */}
        <div style={{
          padding      : "16px 10vw 24px",
          background   : "rgba(5,5,8,0.8)",
          backdropFilter: "blur(20px)",
          borderTop    : "1px solid rgba(255,255,255,0.05)",
          flexShrink   : 0,
          zIndex       : 10
        }}>
          {/* Agent pill */}
          <div style={{
            display    : "flex",
            alignItems : "center",
            gap        : "6px",
            marginBottom: "10px"
          }}>
            <div style={{
              width       : "6px",
              height      : "6px",
              borderRadius: "50%",
              background  : currentMeta.color,
              boxShadow   : `0 0 6px ${currentMeta.color}`
            }} />
            <span style={{
              fontSize:"0.65rem",
              color:"rgba(255,255,255,0.3)",
              fontWeight:"500"
            }}>
              {currentMeta.label}
              {character && ` · ${character.name}`}
            </span>
          </div>

          {/* Input box */}
          <div style={{
            display      : "flex",
            gap          : "10px",
            alignItems   : "flex-end",
            background   : "rgba(255,255,255,0.04)",
            border       : "1px solid rgba(255,255,255,0.08)",
            borderRadius : "20px",
            padding      : "8px 8px 8px 16px",
            transition   : "all 0.2s",
            boxShadow    : "0 8px 32px rgba(0,0,0,0.3)"
          }}>
            {/* + button */}
            <button onClick={() => setResumeOpen(true)} style={{
              width       : "36px",
              height      : "36px",
              borderRadius: "12px",
              background  : "rgba(255,255,255,0.06)",
              border      : "1px solid rgba(255,255,255,0.08)",
              color       : "rgba(255,255,255,0.4)",
              cursor      : "pointer",
              display     : "flex",
              alignItems  : "center",
              justifyContent: "center",
              flexShrink  : 0,
              transition  : "all 0.2s"
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background  = `${accentColor}15`;
              e.currentTarget.style.borderColor = `${accentColor}40`;
              e.currentTarget.style.color       = accentColor;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background  = "rgba(255,255,255,0.06)";
              e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
              e.currentTarget.style.color       = "rgba(255,255,255,0.4)";
            }}
            title="Career Assistant">
              <Plus size={15} />
            </button>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder={character
                ? `Ask ${character.name} anything...`
                : "Ask FRIDAY anything..."}
              rows={1}
              style={{
                flex      : 1,
                background: "transparent",
                border    : "none",
                color     : "#fff",
                fontSize  : "0.92rem",
                outline   : "none",
                resize    : "none",
                fontFamily: "Inter, sans-serif",
                lineHeight: "1.5",
                padding   : "6px 0",
                maxHeight : "120px"
              }}
              onInput={e => {
                e.target.style.height = "auto";
                e.target.style.height =
                  Math.min(e.target.scrollHeight, 120) + "px";
              }}
            />

            {/* Send button */}
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              style={{
                width        : "38px",
                height       : "38px",
                borderRadius : "14px",
                background   : loading || !input.trim()
                  ? "rgba(255,255,255,0.05)"
                  : `linear-gradient(135deg, ${accentColor}, #ff9a6b)`,
                border       : "none",
                cursor       : loading || !input.trim()
                  ? "not-allowed" : "pointer",
                display      : "flex",
                alignItems   : "center",
                justifyContent: "center",
                boxShadow    : loading || !input.trim()
                  ? "none"
                  : `0 4px 15px ${accentGlow}`,
                flexShrink   : 0,
                transition   : "all 0.2s"
              }}
              onMouseEnter={e => {
                if (!loading && input.trim()) {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.boxShadow =
                    `0 6px 20px ${accentGlow}`;
                }
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            >
              <Send size={14}
                color={loading || !input.trim()
                  ? "rgba(255,255,255,0.2)" : "#fff"} />
            </button>
          </div>

          <p style={{
            fontSize : "0.6rem",
            color    : "rgba(255,255,255,0.12)",
            textAlign: "center",
            marginTop: "8px"
          }}>
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>

      {/* Resume Panel */}
      <ResumePanel
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        accentColor={accentColor}
      />

      <style>{`
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.3; }
        }
        @keyframes dot {
          from { transform:translateY(0); opacity:0.3; }
          to   { transform:translateY(-5px); opacity:1; }
        }
        @keyframes fadeIn {
          from { opacity:0; transform:translateY(8px); }
          to   { opacity:1; transform:translateY(0); }
        }
        ::-webkit-scrollbar { width:3px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb {
          background:rgba(255,255,255,0.1);
          border-radius:4px;
        }
        textarea::placeholder { color:rgba(255,255,255,0.25); }
      `}</style>
    </div>
  );
};

export default Dashboard;