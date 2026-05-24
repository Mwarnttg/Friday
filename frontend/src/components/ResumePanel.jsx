import { useState, useRef, useEffect } from "react";
import gsap                             from "gsap";
import axios                            from "axios";
import {
  X, Upload, FileText, Briefcase, TrendingUp,
  ChevronRight, Download, Loader,
  CheckCircle, AlertCircle, Star, MapPin,
  DollarSign, Clock, ExternalLink, BookOpen,
  MessageSquare, BarChart2
} from "lucide-react";

const API = "http://127.0.0.1:8000";

const ResumePanel = ({ isOpen, onClose, accentColor = "#FF6B2B" }) => {
  const [activeTab,     setActiveTab]     = useState("upload");
  const [uploading,     setUploading]     = useState(false);
  const [analysis,      setAnalysis]      = useState(null);
  const [improved,      setImproved]      = useState(null);
  const [jobs,          setJobs]          = useState([]);
  const [skillsGap,     setSkillsGap]     = useState(null);
  const [salary,        setSalary]        = useState(null);
  const [coverLetter,   setCoverLetter]   = useState("");
  const [interviewPrep, setInterviewPrep] = useState(null);
  const [selectedJob,   setSelectedJob]   = useState(null);
  const [loading,       setLoading]       = useState("");
  const [jobSource,     setJobSource]     = useState("ai");
  const [preferences,   setPreferences]   = useState({
    location        : "Calgary",
    industry        : "Technology",
    job_type        : "Full-time",
    experience_level: "Mid-level",
    salary_range    : "$60,000-$90,000"
  });

  const panelRef = useRef(null);
  const fileRef  = useRef(null);

  useEffect(() => {
    if (isOpen) {
      gsap.fromTo(panelRef.current,
        { x: "100%", opacity: 0 },
        { x: "0%", opacity: 1, duration: 0.4, ease: "power3.out" }
      );
    }
  }, [isOpen]);

  const handleClose = () => {
    gsap.to(panelRef.current, {
      x: "100%", opacity: 0, duration: 0.3,
      ease: "power3.in", onComplete: onClose
    });
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setAnalysis(null);
    try {
      const formData = new FormData();
      formData.append("file",             file);
      formData.append("location",         preferences.location);
      formData.append("industry",         preferences.industry);
      formData.append("job_type",         preferences.job_type);
      formData.append("experience_level", preferences.experience_level);
      formData.append("salary_range",     preferences.salary_range);
      const token = localStorage.getItem("friday_token");
      const res   = await axios.post(
        `${API}/api/resume/upload`, formData,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setAnalysis(res.data.analysis);
      setActiveTab("analysis");
    } catch (err) {
      alert(err.response?.data?.detail || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleImprove = async () => {
    setLoading("improve");
    try {
      const token = localStorage.getItem("friday_token");
      if (!token) { alert("Not logged in!"); return; }
      const res = await axios.post(
        `${API}/api/resume/improve`, {},
        { headers: { Authorization: `Bearer ${token}` }}
      );
      if (res.data.success) {
        setImproved(res.data.result);
        setActiveTab("improved");
      }
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Unknown error";
      alert("Error: " + JSON.stringify(msg));
    } finally { setLoading(""); }
  };

  const handleGetJobs = async () => {
    setLoading("jobs");
    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.get(
        `${API}/api/resume/jobs`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setJobs(res.data.jobs);
      setJobSource(res.data.source || "ai");
      setActiveTab("jobs");
    } catch { alert("Failed to fetch jobs"); }
    finally { setLoading(""); }
  };

  const handleSkillsGap = async () => {
    setLoading("skills");
    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.get(
        `${API}/api/resume/skills-gap`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSkillsGap(res.data.gap);
      setActiveTab("skills");
    } catch { alert("Failed to analyze skills"); }
    finally { setLoading(""); }
  };

  const handleSalary = async () => {
    setLoading("salary");
    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.get(
        `${API}/api/resume/salary`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setSalary(res.data.salary);
      setActiveTab("salary");
    } catch { alert("Failed to get salary data"); }
    finally { setLoading(""); }
  };

  const handleCoverLetter = async (job) => {
    setSelectedJob(job);
    setLoading("cover");
    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.post(
        `${API}/api/resume/cover-letter`,
        { job_title: job.title, company: job.company,
          job_description: job.description },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setCoverLetter(res.data.cover_letter);
      setActiveTab("cover");
    } catch { alert("Failed to generate cover letter"); }
    finally { setLoading(""); }
  };

  const handleInterviewPrep = async (job) => {
    setSelectedJob(job);
    setLoading("interview");
    try {
      const token = localStorage.getItem("friday_token");
      const res   = await axios.post(
        `${API}/api/resume/interview-prep`,
        { job_title: job.title, company: job.company },
        { headers: { Authorization: `Bearer ${token}` }}
      );
      setInterviewPrep(res.data.prep);
      setActiveTab("interview");
    } catch { alert("Failed to generate interview prep"); }
    finally { setLoading(""); }
  };

  const scoreColor = (score) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#f59e0b";
    return "#ef4444";
  };

  if (!isOpen) return null;

  const glass = {
    background    : "rgba(255,255,255,0.04)",
    backdropFilter: "blur(10px)",
    border        : "1px solid rgba(255,255,255,0.08)",
    borderRadius  : "12px"
  };

  const tabs = [
    { id:"upload",    icon: Upload,        label:"Upload"    },
    { id:"analysis",  icon: BarChart2,     label:"Analysis"  },
    { id:"improved",  icon: TrendingUp,    label:"Improved"  },
    { id:"jobs",      icon: Briefcase,     label:"Jobs"      },
    { id:"skills",    icon: BookOpen,      label:"Skills"    },
    { id:"salary",    icon: DollarSign,    label:"Salary"    },
    { id:"cover",     icon: FileText,      label:"Cover"     },
    { id:"interview", icon: MessageSquare, label:"Interview" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={handleClose} style={{
        position      : "fixed",
        inset         : 0,
        background    : "rgba(0,0,0,0.5)",
        zIndex        : 20,
        backdropFilter: "blur(3px)"
      }} />

      {/* Panel */}
      <div ref={panelRef} style={{
        position     : "fixed",
        top          : 0,
        right        : 0,
        width        : "500px",
        height       : "100vh",
        background   : "#0a0a0f",
        border       : "1px solid rgba(255,255,255,0.07)",
        borderRight  : "none",
        zIndex       : 30,
        display      : "flex",
        flexDirection: "column",
        overflow     : "hidden",
        boxShadow    : "-24px 0 80px rgba(0,0,0,0.6)"
      }}>

        {/* Header */}
        <div style={{
          padding       : "18px 20px",
          borderBottom  : "1px solid rgba(255,255,255,0.06)",
          display       : "flex",
          alignItems    : "center",
          justifyContent: "space-between",
          flexShrink    : 0
        }}>
          <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
            <div style={{
              width        : "34px",
              height       : "34px",
              borderRadius : "10px",
              background   : `${accentColor}15`,
              border       : `1px solid ${accentColor}30`,
              display      : "flex",
              alignItems   : "center",
              justifyContent: "center"
            }}>
              <Briefcase size={16} color={accentColor} />
            </div>
            <div>
              <h2 style={{
                fontSize  : "0.95rem",
                fontWeight: "600",
                color     : "#fff",
                margin    : 0
              }}>
                Career Assistant
              </h2>
              <p style={{
                fontSize: "0.65rem",
                color   : "rgba(255,255,255,0.3)",
                margin  : 0
              }}>
                Resume · Jobs · Interview
              </p>
            </div>
          </div>
          <button onClick={handleClose} style={{
            background  : "rgba(255,255,255,0.05)",
            border      : "1px solid rgba(255,255,255,0.08)",
            borderRadius: "8px",
            padding     : "6px",
            cursor      : "pointer",
            display     : "flex",
            transition  : "all 0.2s"
          }}>
            <X size={16} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Tab Bar */}
        <div style={{
          display      : "flex",
          overflowX    : "auto",
          padding      : "8px 12px",
          gap          : "4px",
          borderBottom : "1px solid rgba(255,255,255,0.05)",
          flexShrink   : 0,
          scrollbarWidth: "none"
        }}>
          {tabs.map(tab => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                style={{
                  display     : "flex",
                  alignItems  : "center",
                  gap         : "5px",
                  padding     : "6px 10px",
                  background  : isActive ? `${accentColor}18` : "transparent",
                  border      : isActive
                    ? `1px solid ${accentColor}35`
                    : "1px solid transparent",
                  borderRadius: "8px",
                  cursor      : "pointer",
                  whiteSpace  : "nowrap",
                  flexShrink  : 0,
                  transition  : "all 0.2s"
                }}>
                <Icon size={11}
                  color={isActive ? accentColor : "rgba(255,255,255,0.3)"} />
                <span style={{
                  fontSize : "0.68rem",
                  color    : isActive ? "#fff" : "rgba(255,255,255,0.3)",
                  fontWeight: isActive ? "600" : "400"
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div style={{ flex:1, overflowY:"auto", padding:"16px" }}>

          {/* ── UPLOAD ── */}
          {activeTab === "upload" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"16px" }}>
              <p style={{
                fontSize  : "0.82rem",
                color     : "rgba(255,255,255,0.35)",
                lineHeight: "1.6",
                margin    : 0
              }}>
                Upload your resume and set preferences to get
                personalized job matches, improvements, and more.
              </p>

              {/* Preferences */}
              <div style={{ ...glass, padding:"16px" }}>
                <p style={{
                  fontSize     : "0.68rem",
                  color        : accentColor,
                  letterSpacing: "0.1rem",
                  marginBottom : "14px",
                  fontWeight   : "600",
                  margin       : "0 0 14px"
                }}>
                  YOUR PREFERENCES
                </p>
                {[
                  { key:"location", label:"Location",
                    opts:["Calgary","Edmonton","Toronto","Vancouver","Remote"] },
                  { key:"industry", label:"Industry",
                    opts:["Technology","Finance","Healthcare","Marketing","Engineering"] },
                  { key:"job_type", label:"Job Type",
                    opts:["Full-time","Part-time","Contract","Internship"] },
                  { key:"experience_level", label:"Experience",
                    opts:["Entry-level","Mid-level","Senior","Lead"] },
                  { key:"salary_range", label:"Salary Range",
                    opts:["$40,000-$60,000","$60,000-$80,000",
                          "$80,000-$100,000","$100,000+"] }
                ].map(pref => (
                  <div key={pref.key} style={{ marginBottom:"10px" }}>
                    <label style={{
                      fontSize    : "0.65rem",
                      color       : "rgba(255,255,255,0.35)",
                      display     : "block",
                      marginBottom: "5px",
                      letterSpacing: "0.04rem"
                    }}>
                      {pref.label}
                    </label>
                    <select
                      value={preferences[pref.key]}
                      onChange={e => setPreferences(prev => ({
                        ...prev, [pref.key]: e.target.value
                      }))}
                      style={{
                        width       : "100%",
                        padding     : "8px 10px",
                        background  : "rgba(255,255,255,0.05)",
                        border      : "1px solid rgba(255,255,255,0.08)",
                        borderRadius: "8px",
                        color       : "#fff",
                        fontSize    : "0.82rem",
                        outline     : "none",
                        cursor      : "pointer"
                      }}
                    >
                      {pref.opts.map(o => (
                        <option key={o} value={o}
                          style={{ background:"#1a1a1a" }}>
                          {o}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Upload area */}
              <input ref={fileRef} type="file" accept=".pdf"
                onChange={handleUpload} style={{ display:"none" }} />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                style={{
                  padding      : "24px 20px",
                  background   : uploading
                    ? "rgba(255,255,255,0.02)"
                    : `${accentColor}08`,
                  border       : `2px dashed ${uploading
                    ? "rgba(255,255,255,0.08)"
                    : accentColor + "40"}`,
                  borderRadius : "14px",
                  cursor       : uploading ? "not-allowed" : "pointer",
                  display      : "flex",
                  flexDirection: "column",
                  alignItems   : "center",
                  gap          : "10px",
                  width        : "100%",
                  transition   : "all 0.2s"
                }}
              >
                {uploading ? (
                  <>
                    <Loader size={26} color={accentColor}
                      style={{ animation:"spin 1s linear infinite" }} />
                    <span style={{
                      color:"rgba(255,255,255,0.4)", fontSize:"0.88rem"
                    }}>
                      Analyzing your resume...
                    </span>
                  </>
                ) : (
                  <>
                    <Upload size={26} color={accentColor} />
                    <span style={{
                      color:"#fff", fontSize:"0.92rem", fontWeight:"500"
                    }}>
                      Upload Resume (PDF)
                    </span>
                    <span style={{
                      color:"rgba(255,255,255,0.25)", fontSize:"0.75rem"
                    }}>
                      Click to browse or drag & drop
                    </span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ── ANALYSIS ── */}
          {activeTab === "analysis" && analysis && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {/* Score */}
              <div style={{ ...glass, padding:"22px", textAlign:"center" }}>
                <div style={{
                  fontSize:"3.8rem", fontWeight:"800",
                  color:scoreColor(analysis.score), lineHeight:1
                }}>
                  {analysis.score}
                </div>
                <div style={{
                  fontSize:"0.75rem",
                  color:"rgba(255,255,255,0.35)", marginTop:"6px"
                }}>
                  Resume Score / 100
                </div>
                <div style={{
                  width:"100%", height:"6px",
                  background:"rgba(255,255,255,0.07)",
                  borderRadius:"3px", marginTop:"14px", overflow:"hidden"
                }}>
                  <div style={{
                    width:`${analysis.score}%`, height:"100%",
                    background:scoreColor(analysis.score),
                    borderRadius:"3px", transition:"width 1s ease"
                  }} />
                </div>
              </div>

              {/* Info */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  CANDIDATE INFO
                </p>
                {[
                  { label:"Name",       value: analysis.name },
                  { label:"Role",       value: analysis.current_role },
                  { label:"Experience", value: `${analysis.experience_years} years` },
                  { label:"Education",  value: analysis.education }
                ].map(item => (
                  <div key={item.label} style={{
                    display:"flex", justifyContent:"space-between",
                    padding:"7px 0",
                    borderBottom:"1px solid rgba(255,255,255,0.04)"
                  }}>
                    <span style={{
                      fontSize:"0.75rem", color:"rgba(255,255,255,0.3)"
                    }}>
                      {item.label}
                    </span>
                    <span style={{
                      fontSize:"0.78rem", color:"#fff", fontWeight:"500"
                    }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Skills */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  SKILLS DETECTED
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {analysis.skills?.map((skill, i) => (
                    <span key={i} style={{
                      padding:"3px 10px",
                      background:"rgba(255,255,255,0.06)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:"20px",
                      fontSize:"0.72rem", color:"#ccc"
                    }}>
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              {/* Strengths */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#22c55e", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  ✅ STRENGTHS
                </p>
                {analysis.strengths?.map((s, i) => (
                  <div key={i} style={{
                    display:"flex", gap:"8px",
                    marginBottom:"7px", alignItems:"flex-start"
                  }}>
                    <CheckCircle size={13} color="#22c55e"
                      style={{ flexShrink:0, marginTop:"1px" }} />
                    <span style={{
                      fontSize:"0.8rem", color:"rgba(255,255,255,0.72)"
                    }}>
                      {s}
                    </span>
                  </div>
                ))}
              </div>

              {/* Weaknesses */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#ef4444", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  ⚠️ NEEDS IMPROVEMENT
                </p>
                {analysis.weaknesses?.map((w, i) => (
                  <div key={i} style={{
                    display:"flex", gap:"8px",
                    marginBottom:"7px", alignItems:"flex-start"
                  }}>
                    <AlertCircle size={13} color="#ef4444"
                      style={{ flexShrink:0, marginTop:"1px" }} />
                    <span style={{
                      fontSize:"0.8rem", color:"rgba(255,255,255,0.72)"
                    }}>
                      {w}
                    </span>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              {analysis.missing_keywords?.length > 0 && (
                <div style={{ ...glass, padding:"14px" }}>
                  <p style={{
                    color:"#f59e0b", fontSize:"0.68rem",
                    letterSpacing:"0.1rem", marginBottom:"10px",
                    fontWeight:"600", margin:"0 0 10px"
                  }}>
                    🔑 MISSING KEYWORDS
                  </p>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                    {analysis.missing_keywords?.map((kw, i) => (
                      <span key={i} style={{
                        padding:"3px 10px",
                        background:"rgba(245,158,11,0.1)",
                        border:"1px solid rgba(245,158,11,0.2)",
                        borderRadius:"20px",
                        fontSize:"0.72rem", color:"#f59e0b"
                      }}>
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Feedback */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"8px",
                  fontWeight:"600", margin:"0 0 8px"
                }}>
                  AI FEEDBACK
                </p>
                <p style={{
                  fontSize:"0.82rem",
                  color:"rgba(255,255,255,0.6)", lineHeight:"1.65"
                }}>
                  {analysis.overall_feedback}
                </p>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", flexDirection:"column", gap:"8px" }}>
                <button onClick={handleImprove}
                  disabled={loading === "improve"}
                  style={{
                    padding      : "13px",
                    background   : `linear-gradient(135deg, ${accentColor}, #ff9a6b)`,
                    border       : "none",
                    borderRadius : "10px",
                    color        : "#fff",
                    fontSize     : "0.85rem",
                    fontWeight   : "600",
                    cursor       : "pointer",
                    display      : "flex",
                    alignItems   : "center",
                    justifyContent: "center",
                    gap          : "8px"
                  }}>
                  {loading === "improve"
                    ? <><Loader size={14}
                        style={{ animation:"spin 1s linear infinite" }} />
                      Improving...</>
                    : <><TrendingUp size={14} />Improve My Resume</>
                  }
                </button>
                <div style={{ display:"flex", gap:"8px" }}>
                  <button onClick={handleGetJobs}
                    disabled={loading === "jobs"}
                    style={{
                      flex:"1", padding:"10px",
                      background:"rgba(255,255,255,0.05)",
                      border:"1px solid rgba(255,255,255,0.09)",
                      borderRadius:"10px", color:"#fff",
                      fontSize:"0.8rem", cursor:"pointer",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", gap:"6px"
                    }}>
                    {loading === "jobs"
                      ? <Loader size={13}
                          style={{ animation:"spin 1s linear infinite" }} />
                      : <Briefcase size={13} />
                    }
                    Find Jobs
                  </button>
                  <button onClick={handleSkillsGap}
                    disabled={loading === "skills"}
                    style={{
                      flex:"1", padding:"10px",
                      background:"rgba(255,255,255,0.05)",
                      border:"1px solid rgba(255,255,255,0.09)",
                      borderRadius:"10px", color:"#fff",
                      fontSize:"0.8rem", cursor:"pointer",
                      display:"flex", alignItems:"center",
                      justifyContent:"center", gap:"6px"
                    }}>
                    {loading === "skills"
                      ? <Loader size={13}
                          style={{ animation:"spin 1s linear infinite" }} />
                      : <BookOpen size={13} />
                    }
                    Skills Gap
                  </button>
                </div>
                <button onClick={handleSalary}
                  disabled={loading === "salary"}
                  style={{
                    padding:"10px",
                    background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.09)",
                    borderRadius:"10px", color:"#fff",
                    fontSize:"0.8rem", cursor:"pointer",
                    display:"flex", alignItems:"center",
                    justifyContent:"center", gap:"6px"
                  }}>
                  {loading === "salary"
                    ? <Loader size={13}
                        style={{ animation:"spin 1s linear infinite" }} />
                    : <DollarSign size={13} />
                  }
                  Salary Insights
                </button>
              </div>
            </div>
          )}

          {/* ── IMPROVED ── */}
          {activeTab === "improved" && improved && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {/* Score comparison */}
              <div style={{
                ...glass, padding:"18px",
                display:"flex", justifyContent:"space-around",
                alignItems:"center"
              }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{
                    fontSize:"2.2rem", fontWeight:"800",
                    color:scoreColor(analysis?.score || 0)
                  }}>
                    {analysis?.score || 0}
                  </div>
                  <div style={{
                    fontSize:"0.65rem", color:"rgba(255,255,255,0.3)"
                  }}>
                    Before
                  </div>
                </div>
                <ChevronRight size={20} color={accentColor} />
                <div style={{ textAlign:"center" }}>
                  <div style={{
                    fontSize:"2.2rem", fontWeight:"800",
                    color:scoreColor(improved.new_score)
                  }}>
                    {improved.new_score}
                  </div>
                  <div style={{
                    fontSize:"0.65rem", color:"rgba(255,255,255,0.3)"
                  }}>
                    After
                  </div>
                </div>
                <div style={{
                  padding:"5px 12px",
                  background:"rgba(34,197,94,0.1)",
                  border:"1px solid rgba(34,197,94,0.25)",
                  borderRadius:"20px",
                  color:"#22c55e",
                  fontSize:"0.78rem", fontWeight:"700"
                }}>
                  +{improved.new_score - (analysis?.score || 0)} pts
                </div>
              </div>

              {/* Summary */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"8px",
                  fontWeight:"600", margin:"0 0 8px"
                }}>
                  IMPROVEMENT SUMMARY
                </p>
                <p style={{
                  fontSize:"0.82rem",
                  color:"rgba(255,255,255,0.6)", lineHeight:"1.65"
                }}>
                  {improved.improvement_summary}
                </p>
              </div>

              {/* Changes */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"12px",
                  fontWeight:"600", margin:"0 0 12px"
                }}>
                  CHANGES MADE
                </p>
                {improved.changes_made?.map((change, i) => (
                  <div key={i} style={{
                    marginBottom:"12px", paddingBottom:"12px",
                    borderBottom:"1px solid rgba(255,255,255,0.04)"
                  }}>
                    <div style={{
                      padding:"6px 10px",
                      background:"rgba(239,68,68,0.08)",
                      border:"1px solid rgba(239,68,68,0.15)",
                      borderRadius:"6px", fontSize:"0.72rem",
                      color:"#ef4444", marginBottom:"6px",
                      textDecoration:"line-through"
                    }}>
                      {change.original}
                    </div>
                    <div style={{
                      padding:"6px 10px",
                      background:"rgba(34,197,94,0.08)",
                      border:"1px solid rgba(34,197,94,0.15)",
                      borderRadius:"6px", fontSize:"0.72rem",
                      color:"#22c55e", marginBottom:"4px"
                    }}>
                      {change.improved}
                    </div>
                    <p style={{
                      fontSize:"0.65rem",
                      color:"rgba(255,255,255,0.2)", marginLeft:"4px"
                    }}>
                      {change.reason}
                    </p>
                  </div>
                ))}
              </div>

              {/* Keywords */}
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#22c55e", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  KEYWORDS ADDED
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {improved.keywords_added?.map((kw, i) => (
                    <span key={i} style={{
                      padding:"3px 10px",
                      background:"rgba(34,197,94,0.1)",
                      border:"1px solid rgba(34,197,94,0.2)",
                      borderRadius:"20px",
                      fontSize:"0.72rem", color:"#22c55e"
                    }}>
                      ✓ {kw}
                    </span>
                  ))}
                </div>
              </div>

              {/* Download */}
              <div style={{ display:"flex", gap:"8px" }}>
                <button
                  onClick={async () => {
                    const token = localStorage.getItem("friday_token");
                    const res   = await fetch(
                      `${API}/api/resume/download-improved`,
                      { headers: { Authorization: `Bearer ${token}` }}
                    );
                    const blob = await res.blob();
                    const url  = URL.createObjectURL(blob);
                    const a    = document.createElement("a");
                    a.href     = url;
                    a.download = "improved_resume.pdf";
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  style={{
                    flex:"1", padding:"12px",
                    background:`linear-gradient(135deg, ${accentColor}, #ff9a6b)`,
                    border:"none", borderRadius:"10px",
                    color:"#fff", fontSize:"0.85rem", fontWeight:"600",
                    cursor:"pointer", display:"flex",
                    alignItems:"center", justifyContent:"center", gap:"8px"
                  }}>
                  <Download size={14} />
                  Download PDF
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(improved.improved_resume);
                    alert("Copied to clipboard!");
                  }}
                  style={{
                    padding:"12px 16px",
                    background:"rgba(255,255,255,0.05)",
                    border:"1px solid rgba(255,255,255,0.1)",
                    borderRadius:"10px", color:"#ccc",
                    fontSize:"0.85rem", cursor:"pointer",
                    display:"flex", alignItems:"center", gap:"8px"
                  }}>
                  Copy Text
                </button>
              </div>
            </div>
          )}

          {/* ── JOBS ── */}
          {activeTab === "jobs" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"12px" }}>

              {/* ── LIVE BADGE ── */}
              {jobs.length > 0 && (
                <div style={{
                  display    : "flex",
                  alignItems : "center",
                  gap        : "8px",
                  padding    : "8px 14px",
                  background : jobSource === "live"
                    ? "rgba(34,197,94,0.08)"
                    : "rgba(99,102,241,0.08)",
                  border     : jobSource === "live"
                    ? "1px solid rgba(34,197,94,0.15)"
                    : "1px solid rgba(99,102,241,0.15)",
                  borderRadius: "10px"
                }}>
                  <div style={{
                    width       : "7px",
                    height      : "7px",
                    borderRadius: "50%",
                    background  : jobSource === "live"
                      ? "#22c55e" : "#818cf8",
                    boxShadow   : jobSource === "live"
                      ? "0 0 8px #22c55e"
                      : "0 0 8px #818cf8",
                    animation   : "pulse 2s infinite"
                  }} />
                  <span style={{
                    fontSize : "0.78rem",
                    color    : jobSource === "live"
                      ? "#22c55e" : "#818cf8",
                    fontWeight: "500"
                  }}>
                    {jobSource === "live"
                      ? "Live jobs from Indeed & LinkedIn"
                      : "AI matched jobs"}
                  </span>
                  <span style={{
                    fontSize  : "0.68rem",
                    color     : "rgba(255,255,255,0.2)",
                    marginLeft: "auto"
                  }}>
                    {jobs.length} found
                  </span>
                </div>
              )}

              {jobs.length === 0 ? (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <Briefcase size={40} color="rgba(255,255,255,0.08)"
                    style={{ margin:"0 auto 12px", display:"block" }} />
                  <p style={{
                    color:"rgba(255,255,255,0.3)", fontSize:"0.88rem"
                  }}>
                    No jobs loaded yet
                  </p>
                  <button onClick={handleGetJobs} style={{
                    marginTop:"14px", padding:"10px 22px",
                    background:`${accentColor}18`,
                    border:`1px solid ${accentColor}35`,
                    borderRadius:"8px", color:accentColor,
                    cursor:"pointer", fontSize:"0.82rem"
                  }}>
                    {loading === "jobs"
                      ? "Finding jobs..."
                      : "Find Matching Jobs"}
                  </button>
                </div>
              ) : (
                jobs.map((job, i) => (
                  <div key={i} style={{
                    ...glass, padding:"14px", cursor:"pointer",
                    transition:"all 0.2s"
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = `${accentColor}30`;
                    e.currentTarget.style.background  = "rgba(255,255,255,0.06)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.background  = "rgba(255,255,255,0.04)";
                  }}>
                    {/* Job header */}
                    <div style={{
                      display:"flex", justifyContent:"space-between",
                      alignItems:"flex-start", marginBottom:"8px"
                    }}>
                      <div style={{ flex:1, marginRight:"8px" }}>
                        <p style={{
                          fontSize:"0.9rem", fontWeight:"600",
                          color:"#fff", marginBottom:"2px", margin:"0 0 2px"
                        }}>
                          {job.title}
                        </p>
                        <p style={{
                          fontSize:"0.75rem",
                          color:"rgba(255,255,255,0.45)", margin:0
                        }}>
                          {job.company}
                        </p>
                      </div>
                      <div style={{
                        padding:"4px 10px",
                        background:`${scoreColor(job.match_percentage)}15`,
                        border:`1px solid ${scoreColor(job.match_percentage)}30`,
                        borderRadius:"20px",
                        color:scoreColor(job.match_percentage),
                        fontSize:"0.72rem", fontWeight:"700",
                        flexShrink:0
                      }}>
                        {job.match_percentage}% match
                      </div>
                    </div>

                    {/* Details */}
                    <div style={{
                      display:"flex", gap:"12px",
                      marginBottom:"8px", flexWrap:"wrap"
                    }}>
                      {[
                        { icon:MapPin,     text:job.location },
                        { icon:DollarSign, text:job.salary   },
                        { icon:Clock,      text:job.posted   }
                      ].map((item, j) => {
                        const Icon = item.icon;
                        return (
                          <div key={j} style={{
                            display:"flex", alignItems:"center", gap:"4px"
                          }}>
                            <Icon size={11} color="rgba(255,255,255,0.25)" />
                            <span style={{
                              fontSize:"0.68rem",
                              color:"rgba(255,255,255,0.38)"
                            }}>
                              {item.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Match reasons */}
                    <div style={{
                      display:"flex", flexWrap:"wrap",
                      gap:"4px", marginBottom:"10px"
                    }}>
                      {job.match_reasons?.map((r, j) => (
                        <span key={j} style={{
                          padding:"2px 8px",
                          background:"rgba(34,197,94,0.08)",
                          border:"1px solid rgba(34,197,94,0.15)",
                          borderRadius:"4px",
                          fontSize:"0.62rem", color:"#22c55e"
                        }}>
                          ✓ {r}
                        </span>
                      ))}
                    </div>

                    {/* Buttons */}
                    <div style={{ display:"flex", gap:"6px" }}>
                      <a href={job.apply_url} target="_blank"
                        rel="noreferrer" style={{
                          flex:"1", padding:"8px",
                          background:`linear-gradient(135deg, ${accentColor}, #ff9a6b)`,
                          border:"none", borderRadius:"8px",
                          color:"#fff", fontSize:"0.72rem", fontWeight:"600",
                          cursor:"pointer", display:"flex",
                          alignItems:"center", justifyContent:"center",
                          gap:"4px", textDecoration:"none"
                        }}>
                        <ExternalLink size={11} />
                        Apply Now
                      </a>
                      <button onClick={() => handleCoverLetter(job)}
                        style={{
                          padding:"8px 10px",
                          background:"rgba(255,255,255,0.05)",
                          border:"1px solid rgba(255,255,255,0.09)",
                          borderRadius:"8px", color:"#ccc",
                          fontSize:"0.68rem", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:"4px"
                        }}>
                        <FileText size={11} />
                        Cover Letter
                      </button>
                      <button onClick={() => handleInterviewPrep(job)}
                        style={{
                          padding:"8px 10px",
                          background:"rgba(255,255,255,0.05)",
                          border:"1px solid rgba(255,255,255,0.09)",
                          borderRadius:"8px", color:"#ccc",
                          fontSize:"0.68rem", cursor:"pointer",
                          display:"flex", alignItems:"center", gap:"4px"
                        }}>
                        <MessageSquare size={11} />
                        Prep
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── SKILLS ── */}
          {activeTab === "skills" && skillsGap && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#ef4444", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"12px",
                  fontWeight:"600", margin:"0 0 12px"
                }}>
                  🔴 CRITICAL SKILLS MISSING
                </p>
                {skillsGap.missing_critical?.map((skill, i) => (
                  <div key={i} style={{
                    padding:"10px",
                    background:"rgba(239,68,68,0.06)",
                    border:"1px solid rgba(239,68,68,0.12)",
                    borderRadius:"8px", marginBottom:"8px"
                  }}>
                    <div style={{
                      display:"flex", justifyContent:"space-between",
                      marginBottom:"4px"
                    }}>
                      <span style={{
                        fontSize:"0.84rem", fontWeight:"600", color:"#fff"
                      }}>
                        {skill.skill}
                      </span>
                      <span style={{
                        fontSize:"0.68rem", color:"rgba(255,255,255,0.3)"
                      }}>
                        {skill.learn_time}
                      </span>
                    </div>
                    <a href={skill.resource} target="_blank"
                      rel="noreferrer" style={{
                        fontSize:"0.7rem", color:accentColor,
                        textDecoration:"none"
                      }}>
                      Learn for free →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#f59e0b", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"12px",
                  fontWeight:"600", margin:"0 0 12px"
                }}>
                  🟡 NICE TO HAVE
                </p>
                {skillsGap.missing_nice_to_have?.map((skill, i) => (
                  <div key={i} style={{
                    padding:"10px",
                    background:"rgba(245,158,11,0.06)",
                    border:"1px solid rgba(245,158,11,0.12)",
                    borderRadius:"8px", marginBottom:"8px"
                  }}>
                    <div style={{
                      display:"flex", justifyContent:"space-between",
                      marginBottom:"4px"
                    }}>
                      <span style={{
                        fontSize:"0.84rem", fontWeight:"500", color:"#fff"
                      }}>
                        {skill.skill}
                      </span>
                      <span style={{
                        fontSize:"0.68rem", color:"rgba(255,255,255,0.3)"
                      }}>
                        {skill.learn_time}
                      </span>
                    </div>
                    <a href={skill.resource} target="_blank"
                      rel="noreferrer" style={{
                        fontSize:"0.7rem", color:"#f59e0b",
                        textDecoration:"none"
                      }}>
                      Learn for free →
                    </a>
                  </div>
                ))}
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  📊 MARKET INSIGHTS
                </p>
                {skillsGap.market_insights?.map((insight, i) => (
                  <div key={i} style={{
                    display:"flex", gap:"8px", marginBottom:"8px"
                  }}>
                    <Star size={12} color={accentColor}
                      style={{ flexShrink:0, marginTop:"2px" }} />
                    <span style={{
                      fontSize:"0.8rem", color:"rgba(255,255,255,0.62)"
                    }}>
                      {insight}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  🏆 RECOMMENDED CERTIFICATIONS
                </p>
                {skillsGap.recommended_certifications?.map((cert, i) => (
                  <div key={i} style={{
                    padding:"10px",
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.06)",
                    borderRadius:"8px", marginBottom:"8px"
                  }}>
                    <p style={{
                      fontSize:"0.82rem", fontWeight:"500",
                      color:"#fff", marginBottom:"4px", margin:"0 0 4px"
                    }}>
                      {cert.name}
                    </p>
                    <p style={{
                      fontSize:"0.7rem",
                      color:"rgba(255,255,255,0.38)", margin:0
                    }}>
                      {cert.provider} · {cert.cost} · {cert.time}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── SALARY ── */}
          {activeTab === "salary" && salary && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              <div style={{ ...glass, padding:"22px", textAlign:"center" }}>
                <p style={{
                  fontSize:"0.7rem",
                  color:"rgba(255,255,255,0.3)", marginBottom:"8px",
                  margin:"0 0 8px"
                }}>
                  ESTIMATED SALARY RANGE
                </p>
                <p style={{
                  fontSize:"2rem", fontWeight:"800",
                  color:accentColor, margin:0
                }}>
                  ${salary.salary_range?.min?.toLocaleString()} —
                  ${salary.salary_range?.max?.toLocaleString()}
                </p>
                <p style={{
                  fontSize:"0.72rem",
                  color:"rgba(255,255,255,0.3)", marginTop:"4px"
                }}>
                  CAD · {salary.location}
                </p>
                <div style={{
                  marginTop:"12px", padding:"10px",
                  background:`${accentColor}10`,
                  border:`1px solid ${accentColor}20`,
                  borderRadius:"8px"
                }}>
                  <p style={{
                    fontSize:"0.8rem",
                    color:"rgba(255,255,255,0.7)", margin:0
                  }}>
                    {salary.your_estimate}
                  </p>
                </div>
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  BY EXPERIENCE LEVEL
                </p>
                {Object.entries(salary.by_experience || {}).map(
                  ([level, range]) => (
                    <div key={level} style={{
                      display:"flex", justifyContent:"space-between",
                      padding:"8px 0",
                      borderBottom:"1px solid rgba(255,255,255,0.04)"
                    }}>
                      <span style={{
                        fontSize:"0.78rem",
                        color:"rgba(255,255,255,0.45)",
                        textTransform:"capitalize"
                      }}>
                        {level.replace("_"," ")}
                      </span>
                      <span style={{
                        fontSize:"0.78rem", color:"#fff", fontWeight:"500"
                      }}>
                        {range}
                      </span>
                    </div>
                  )
                )}
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:"#22c55e", fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  💡 NEGOTIATION TIPS
                </p>
                {salary.negotiation_tips?.map((tip, i) => (
                  <div key={i} style={{
                    display:"flex", gap:"8px", marginBottom:"8px"
                  }}>
                    <CheckCircle size={12} color="#22c55e"
                      style={{ flexShrink:0, marginTop:"2px" }} />
                    <span style={{
                      fontSize:"0.8rem", color:"rgba(255,255,255,0.62)"
                    }}>
                      {tip}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ ...glass, padding:"14px" }}>
                <p style={{
                  color:accentColor, fontSize:"0.68rem",
                  letterSpacing:"0.1rem", marginBottom:"10px",
                  fontWeight:"600", margin:"0 0 10px"
                }}>
                  🏢 TOP PAYING COMPANIES
                </p>
                <div style={{ display:"flex", flexWrap:"wrap", gap:"6px" }}>
                  {salary.top_paying_companies?.map((company, i) => (
                    <span key={i} style={{
                      padding:"4px 12px",
                      background:"rgba(255,255,255,0.06)",
                      border:"1px solid rgba(255,255,255,0.08)",
                      borderRadius:"20px",
                      fontSize:"0.74rem", color:"#ccc"
                    }}>
                      {company}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── COVER LETTER ── */}
          {activeTab === "cover" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {coverLetter ? (
                <>
                  {selectedJob && (
                    <div style={{ ...glass, padding:"12px" }}>
                      <p style={{
                        fontSize:"0.7rem",
                        color:"rgba(255,255,255,0.35)",
                        marginBottom:"3px", margin:"0 0 3px"
                      }}>
                        Cover letter for:
                      </p>
                      <p style={{
                        fontSize:"0.88rem", fontWeight:"500",
                        color:"#fff", margin:0
                      }}>
                        {selectedJob.title} at {selectedJob.company}
                      </p>
                    </div>
                  )}
                  <div style={{ ...glass, padding:"16px" }}>
                    <p style={{
                      fontSize:"0.85rem",
                      color:"rgba(255,255,255,0.75)",
                      lineHeight:"1.8", whiteSpace:"pre-wrap", margin:0
                    }}>
                      {coverLetter}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(coverLetter);
                      alert("Copied to clipboard!");
                    }}
                    style={{
                      padding:"12px",
                      background:`linear-gradient(135deg, ${accentColor}, #ff9a6b)`,
                      border:"none", borderRadius:"10px",
                      color:"#fff", fontSize:"0.85rem", fontWeight:"600",
                      cursor:"pointer"
                    }}>
                    Copy to Clipboard
                  </button>
                </>
              ) : (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <FileText size={40} color="rgba(255,255,255,0.08)"
                    style={{ margin:"0 auto 12px", display:"block" }} />
                  <p style={{
                    color:"rgba(255,255,255,0.3)", fontSize:"0.88rem"
                  }}>
                    Select a job from the Jobs tab to generate a cover letter
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ── INTERVIEW ── */}
          {activeTab === "interview" && (
            <div style={{ display:"flex", flexDirection:"column", gap:"14px" }}>
              {interviewPrep ? (
                <>
                  {selectedJob && (
                    <div style={{ ...glass, padding:"12px" }}>
                      <p style={{
                        fontSize:"0.7rem",
                        color:"rgba(255,255,255,0.35)",
                        marginBottom:"3px", margin:"0 0 3px"
                      }}>
                        Interview prep for:
                      </p>
                      <p style={{
                        fontSize:"0.88rem", fontWeight:"500",
                        color:"#fff", margin:0
                      }}>
                        {selectedJob.title} at {selectedJob.company}
                      </p>
                    </div>
                  )}

                  <div style={{ ...glass, padding:"14px" }}>
                    <p style={{
                      color:accentColor, fontSize:"0.68rem",
                      letterSpacing:"0.1rem", marginBottom:"12px",
                      fontWeight:"600", margin:"0 0 12px"
                    }}>
                      💻 TECHNICAL QUESTIONS
                    </p>
                    {interviewPrep.technical_questions?.map((qa, i) => (
                      <div key={i} style={{
                        marginBottom:"12px", paddingBottom:"12px",
                        borderBottom:"1px solid rgba(255,255,255,0.04)"
                      }}>
                        <p style={{
                          fontSize:"0.82rem", fontWeight:"500",
                          color:"#fff", marginBottom:"6px", margin:"0 0 6px"
                        }}>
                          Q: {qa.question}
                        </p>
                        <p style={{
                          fontSize:"0.78rem",
                          color:"rgba(255,255,255,0.5)",
                          lineHeight:"1.55", margin:0
                        }}>
                          A: {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...glass, padding:"14px" }}>
                    <p style={{
                      color:"#8b5cf6", fontSize:"0.68rem",
                      letterSpacing:"0.1rem", marginBottom:"12px",
                      fontWeight:"600", margin:"0 0 12px"
                    }}>
                      🧠 BEHAVIORAL QUESTIONS
                    </p>
                    {interviewPrep.behavioral_questions?.map((qa, i) => (
                      <div key={i} style={{
                        marginBottom:"12px", paddingBottom:"12px",
                        borderBottom:"1px solid rgba(255,255,255,0.04)"
                      }}>
                        <p style={{
                          fontSize:"0.82rem", fontWeight:"500",
                          color:"#fff", marginBottom:"6px", margin:"0 0 6px"
                        }}>
                          Q: {qa.question}
                        </p>
                        <p style={{
                          fontSize:"0.78rem",
                          color:"rgba(255,255,255,0.5)",
                          lineHeight:"1.55", margin:0
                        }}>
                          A: {qa.answer}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...glass, padding:"14px" }}>
                    <p style={{
                      color:"#22c55e", fontSize:"0.68rem",
                      letterSpacing:"0.1rem", marginBottom:"10px",
                      fontWeight:"600", margin:"0 0 10px"
                    }}>
                      ❓ QUESTIONS TO ASK THEM
                    </p>
                    {interviewPrep.questions_to_ask?.map((q, i) => (
                      <div key={i} style={{
                        display:"flex", gap:"8px", marginBottom:"8px"
                      }}>
                        <ChevronRight size={13} color="#22c55e"
                          style={{ flexShrink:0, marginTop:"1px" }} />
                        <span style={{
                          fontSize:"0.8rem", color:"rgba(255,255,255,0.62)"
                        }}>
                          {q}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div style={{ ...glass, padding:"14px" }}>
                    <p style={{
                      color:"#f59e0b", fontSize:"0.68rem",
                      letterSpacing:"0.1rem", marginBottom:"10px",
                      fontWeight:"600", margin:"0 0 10px"
                    }}>
                      💡 PREPARATION TIPS
                    </p>
                    {interviewPrep.preparation_tips?.map((tip, i) => (
                      <div key={i} style={{
                        display:"flex", gap:"8px", marginBottom:"8px"
                      }}>
                        <Star size={12} color="#f59e0b"
                          style={{ flexShrink:0, marginTop:"2px" }} />
                        <span style={{
                          fontSize:"0.8rem", color:"rgba(255,255,255,0.62)"
                        }}>
                          {tip}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign:"center", padding:"40px 20px" }}>
                  <MessageSquare size={40} color="rgba(255,255,255,0.08)"
                    style={{ margin:"0 auto 12px", display:"block" }} />
                  <p style={{
                    color:"rgba(255,255,255,0.3)", fontSize:"0.88rem"
                  }}>
                    Select a job from the Jobs tab to generate interview prep
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Empty state */}
          {activeTab === "analysis" && !analysis && (
            <div style={{ textAlign:"center", padding:"40px 20px" }}>
              <BarChart2 size={40} color="rgba(255,255,255,0.08)"
                style={{ margin:"0 auto 12px", display:"block" }} />
              <p style={{
                color:"rgba(255,255,255,0.3)", fontSize:"0.88rem"
              }}>
                Upload your resume first to see analysis
              </p>
              <button onClick={() => setActiveTab("upload")} style={{
                marginTop:"14px", padding:"8px 18px",
                background:`${accentColor}18`,
                border:`1px solid ${accentColor}35`,
                borderRadius:"8px", color:accentColor,
                cursor:"pointer", fontSize:"0.8rem"
              }}>
                Upload Resume
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform:rotate(0deg); }
          to   { transform:rotate(360deg); }
        }
        @keyframes pulse {
          0%,100% { opacity:1; }
          50%     { opacity:0.4; }
        }
      `}</style>
    </>
  );
};

export default ResumePanel;