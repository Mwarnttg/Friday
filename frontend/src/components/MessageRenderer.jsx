import { useState } from "react";

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2.5"
    strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const parseInline = (text) => {
  if (!text) return null;
  const parts   = [];
  let remaining = String(text);
  let key       = 0;
  while (remaining.length > 0) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(
        <strong key={key++} style={{ color:"black", fontWeight:"600" }}>
          {boldMatch[1]}
        </strong>
      );
      remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
      continue;
    }
    const codeMatch = remaining.match(/`([^`]+)`/);
    if (codeMatch) {
      const before = remaining.slice(0, codeMatch.index);
      if (before) parts.push(<span key={key++}>{before}</span>);
      parts.push(
        <code key={key++} style={{
          background  : "rgba(255,255,255,0.1)",
          color       : "#e2e8f0",
          padding     : "1px 6px",
          borderRadius: "4px",
          fontSize    : "0.9em",
          fontFamily  : "monospace"
        }}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch.index + codeMatch[0].length);
      continue;
    }
    parts.push(<span key={key++}>{remaining}</span>);
    break;
  }
  return parts;
};

const CopyButton = ({ text, dark = false }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      style={{
        display    : "flex",
        alignItems : "center",
        gap        : "5px",
        padding    : "5px 12px",
        background : copied
          ? "rgba(34,197,94,0.15)"
          : dark ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.08)",
        border     : copied
          ? "1px solid rgba(34,197,94,0.3)"
          : "1px solid rgba(255,255,255,0.15)",
        borderRadius: "6px",
        cursor     : "pointer",
        color      : copied ? "#22c55e" : "rgba(255,255,255,0.65)",
        fontSize   : "0.78rem",
        fontWeight : "500",
        transition : "all 0.2s",
        fontFamily : "Inter, sans-serif"
      }}>
      {copied ? <CheckIcon /> : <CopyIcon />}
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

// ── CODE BOX ──
const CodeBox = ({ code, language }) => (
  <div style={{
    margin      : "14px 0",
    borderRadius: "16px",
    overflow    : "hidden",
    border      : "1px solid rgba(255,255,255,0.1)",
    boxShadow   : "0 8px 32px rgba(0,0,0,0.4)"
  }}>
    {/* Header bar */}
    <div style={{
      padding       : "10px 16px",
      background    : "#1e1e2e",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "space-between",
      borderBottom  : "1px solid rgba(255,255,255,0.07)"
    }}>
      <div style={{ display:"flex", alignItems:"center", gap:"12px" }}>
        {/* macOS dots */}
        <div style={{ display:"flex", gap:"6px" }}>
          {["#ff5f57","#febc2e","#28c840"].map((c, idx) => (
            <div key={idx} style={{
              width:"11px", height:"11px",
              borderRadius:"50%", background:c
            }} />
          ))}
        </div>
        {language && (
          <span style={{
            fontSize     : "0.75rem",
            color        : "rgba(255,255,255,0.35)",
            fontFamily   : "monospace",
            letterSpacing: "0.06rem",
            textTransform: "lowercase"
          }}>
            {language}
          </span>
        )}
      </div>
      <CopyButton text={code} dark />
    </div>

    {/* Code body */}
    <div style={{
      background: "#161622",
      padding   : "18px 0",
      overflowX : "auto"
    }}>
      <pre style={{
        margin    : 0,
        padding   : "0 20px",
        fontFamily: "'Fira Code','Cascadia Code','Courier New',monospace",
        fontSize  : "0.9rem",
        lineHeight: "1.8",
        color     : "#e2e8f0",
        whiteSpace: "pre",
        tabSize   : 2
      }}>
        {code.split('\n').map((line, idx) => (
          <div key={idx} style={{ display:"flex", gap:"20px" }}>
            <span style={{
              color      : "rgba(255,255,255,0.15)",
              userSelect : "none",
              minWidth   : "28px",
              textAlign  : "right",
              fontSize   : "0.78rem",
              fontFamily : "monospace",
              paddingTop : "1px"
            }}>
              {idx + 1}
            </span>
            <span style={{ flex:1 }}>{line || " "}</span>
          </div>
        ))}
      </pre>
    </div>
  </div>
);

// ── TABLE ──
const parseTable = (lines) => {
  const tableLines = lines.filter(l =>
    l.trim().startsWith('|') && l.trim().endsWith('|')
  );
  if (tableLines.length < 2) return null;

  const rows = tableLines
    .filter(l => !l.match(/^\|[-| :]+\|$/))
    .map(l => l.trim().slice(1,-1).split('|').map(c => c.trim()));

  if (rows.length === 0) return null;
  const headers = rows[0];
  const body    = rows.slice(1);

  return (
    <div style={{
      overflowX   : "auto",
      margin      : "12px 0",
      borderRadius: "14px",
      border      : "1px solid rgba(255,255,255,0.1)"
    }}>
      <table style={{
        width:"100%", borderCollapse:"collapse", fontSize:"0.96rem"
      }}>
        <thead>
          <tr style={{ background:"rgba(255,255,255,0.08)" }}>
            {headers.map((h,i) => (
              <th key={i} style={{
                padding      : "12px 16px",
                textAlign    : "left",
                color        : "#fff",
                fontWeight   : "600",
                fontSize     : "0.88rem",
                letterSpacing: "0.04rem",
                borderBottom : "1px solid rgba(255,255,255,0.08)"
              }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {body.map((row,i) => (
            <tr key={i} style={{
              background: i%2===0 ? "transparent" : "rgba(255,255,255,0.02)"
            }}>
              {row.map((cell,j) => (
                <td key={j} style={{
                  padding     : "10px 16px",
                  color       : "rgba(255,255,255,0.78)",
                  fontSize    : "0.94rem",
                  lineHeight  : "1.5",
                  borderBottom: i<body.length-1
                    ? "1px solid rgba(255,255,255,0.04)" : "none"
                }}>
                  {parseInline(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ── WHITE CONTENT BOX (email/letter) ──
const ContentBox = ({ content, title }) => (
  <div style={{
    background  : "#161622",
    borderRadius: "16px",
    overflow    : "hidden",
    margin      : "12px 0",
    boxShadow   : "0 4px 24px rgba(0,0,0,0.2)"
  }}>
    <div style={{
      padding       : "12px 18px",
      background    : "#f5f5f7",
      borderBottom  : "1px solid rgba(0,0,0,0.08)",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "space-between"
    }}>
      <p style={{
        fontSize     : "0.82rem",
        fontWeight   : "600",
        color        : "#86868b",
        margin       : 0,
        letterSpacing: "0.08rem",
        textTransform: "uppercase"
      }}>
        {title || "Content"}
      </p>
      <CopyButton text={content} />
    </div>
    <div style={{ padding:"18px 20px", background:"#161622" }}>
      {content.split('\n').map((line, i) => {
        const t = line.trim();
        if (!t) return <div key={i} style={{ height:"8px" }} />;
        if (t.match(/^---+$/)) return (
          <hr key={i} style={{
            border:"none", borderTop:"1px solid #e5e5e7", margin:"12px 0"
          }} />
        );
        if (t.toLowerCase().startsWith('subject:')) return (
          <p key={i} style={{
            fontSize:"1rem", fontWeight:"700", color:"#1d1d1f",
            margin:"0 0 12px", paddingBottom:"10px",
            borderBottom:"1px solid #e5e5e7"
          }}>{t}</p>
        );
        if (t.startsWith('**') && t.endsWith('**')) return (
          <p key={i} style={{
            fontSize:"1rem", fontWeight:"700",
            color:"#1d1d1f", margin:"8px 0"
          }}>{t.replace(/\*\*/g,'')}</p>
        );
        if (t.startsWith('- ') || t.startsWith('• ')) return (
          <div key={i} style={{ display:"flex", gap:"8px", marginBottom:"6px" }}>
            <span style={{ color:"#555", flexShrink:0 }}>•</span>
            <p style={{
              fontSize:"0.98rem", color:"#fff",
              margin:0, lineHeight:"1.65"
            }}>{t.slice(2)}</p>
          </div>
        );
        return (
          <p key={i} style={{
            fontSize:"0.98rem", color:"#fff",
            margin:"0 0 5px", lineHeight:"1.75"
          }}>{t}</p>
        );
      })}
    </div>
  </div>
);

// ── SECTION HEADER ──
const SectionHeader = ({ text, accentColor }) => (
  <div style={{
    display:"flex", alignItems:"center",
    gap:"10px", margin:"18px 0 10px"
  }}>
    <div style={{
      width:"3px", height:"18px",
      background:accentColor, borderRadius:"2px", flexShrink:0
    }} />
    <p style={{
      fontSize:"0.96rem", fontWeight:"700",
      color:"#fff", margin:0, letterSpacing:"0.03rem"
    }}>
      {text.replace(/^#+\s/,'').replace(/\*\*/g,'')}
    </p>
  </div>
);

// ── BULLET ──
const BulletItem = ({ text, accentColor }) => (
  <div style={{
    display:"flex", gap:"12px",
    marginBottom:"8px", alignItems:"flex-start"
  }}>
    <div style={{
      width:"7px", height:"7px", borderRadius:"50%",
      background:accentColor, flexShrink:0,
      marginTop:"7px", opacity:0.85
    }} />
    <p style={{
      fontSize:"0.98rem", color:"rgba(255,255,255,0.82)",
      margin:0, lineHeight:"1.72"
    }}>
      {parseInline(text)}
    </p>
  </div>
);

// ── NUMBERED ──
const NumberedItem = ({ num, text, accentColor }) => (
  <div style={{
    display:"flex", gap:"12px",
    marginBottom:"10px", alignItems:"flex-start"
  }}>
    <div style={{
      width:"24px", height:"24px", borderRadius:"50%",
      background:`${accentColor}20`,
      border:`1px solid ${accentColor}40`,
      display:"flex", alignItems:"center", justifyContent:"center",
      flexShrink:0, fontSize:"0.75rem",
      fontWeight:"700", color:accentColor
    }}>
      {num}
    </div>
    <p style={{
      fontSize:"0.98rem", color:"rgba(255,255,255,0.82)",
      margin:0, lineHeight:"1.72", paddingTop:"2px"
    }}>
      {parseInline(text)}
    </p>
  </div>
);

// ── INFO CARD ──
const InfoCard = ({ items, accentColor }) => (
  <div style={{
    background:"rgba(255,255,255,0.05)",
    border:"1px solid rgba(255,255,255,0.09)",
    borderRadius:"14px", padding:"14px 16px", margin:"10px 0"
  }}>
    {items.map((item,i) => (
      <div key={i} style={{
        display:"flex", justifyContent:"space-between",
        alignItems:"flex-start", padding:"8px 0", gap:"14px",
        borderBottom: i<items.length-1
          ? "1px solid rgba(255,255,255,0.06)" : "none"
      }}>
        <span style={{
          fontSize:"0.88rem", color:accentColor,
          fontWeight:"600", flexShrink:0, opacity:0.9
        }}>
          {item.key}
        </span>
        <span style={{
          fontSize:"0.96rem", color:"rgba(255,255,255,0.75)",
          textAlign:"right", lineHeight:"1.5"
        }}>
          {parseInline(item.value)}
        </span>
      </div>
    ))}
  </div>
);

// ── TIP BOX ──
const TipBox = ({ text, accentColor }) => (
  <div style={{
    background:`${accentColor}10`,
    border:`1px solid ${accentColor}25`,
    borderLeft:`4px solid ${accentColor}`,
    borderRadius:"10px", padding:"12px 16px", margin:"8px 0"
  }}>
    <p style={{
      fontSize:"0.96rem", color:"rgba(255,255,255,0.8)",
      margin:0, lineHeight:"1.65"
    }}>
      {parseInline(text)}
    </p>
  </div>
);

// ── MAIN RENDERER ──
const MessageRenderer = ({ content, accentColor = "#FF6B2B" }) => {
  if (!content || content === "thinking") return null;

  const lines    = content.split('\n');
  const elements = [];
  let i          = 0;
  let infoItems  = [];
  let emailLines = [];
  let inEmail    = false;

  const flushInfo = () => {
    if (infoItems.length > 0) {
      elements.push(
        <InfoCard key={`info-${i}`}
          items={infoItems} accentColor={accentColor} />
      );
      infoItems = [];
    }
  };

  const flushEmail = (title) => {
    if (emailLines.length > 0) {
      elements.push(
        <ContentBox key={`email-${i}`}
          content={emailLines.join('\n')}
          title={title || "Content"} />
      );
      emailLines = [];
      inEmail    = false;
    }
  };

  while (i < lines.length) {
    const line    = lines[i];
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      if (inEmail) { emailLines.push(''); }
      else {
        flushInfo();
        elements.push(<div key={`sp-${i}`} style={{ height:"8px" }} />);
      }
      i++;
      continue;
    }

    // ── CODE BLOCK ──
    if (trimmed.startsWith('```')) {
      flushInfo();
      if (inEmail) flushEmail("Email");

      const lang      = trimmed.slice(3).trim();
      const codeLines = [];
      i++;

      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```

      elements.push(
        <CodeBox
          key={`code-${i}`}
          code={codeLines.join('\n')}
          language={lang || null}
        />
      );
      continue;
    }

    // Email detection
    const isEmailStart =
      /^subject:/i.test(trimmed) ||
      /^dear /i.test(trimmed)    ||
      /^to whom/i.test(trimmed);

    const isEmailEnd =
      /^\*\*tips/i.test(trimmed)    ||
      /^tips:/i.test(trimmed)       ||
      /^feel better/i.test(trimmed) ||
      /^let me know/i.test(trimmed) ||
      /^hope this/i.test(trimmed)   ||
      (/^---+$/.test(trimmed) && inEmail && emailLines.length > 3);

    if (isEmailStart && !inEmail) {
      flushInfo();
      inEmail = true;
      emailLines.push(trimmed);
      i++;
      continue;
    }

    if (inEmail && isEmailEnd) { flushEmail("Email"); }

    if (inEmail) {
      emailLines.push(trimmed);
      i++;
      continue;
    }

    // Table
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushInfo();
      const tableLines = [];
      while (i < lines.length &&
        (lines[i].trim().startsWith('|') ||
         lines[i].trim().match(/^[-| :]+$/))) {
        tableLines.push(lines[i].trim());
        i++;
      }
      const tableEl = parseTable(tableLines);
      if (tableEl) elements.push(<div key={`tbl-${i}`}>{tableEl}</div>);
      continue;
    }

    // H1
    if (trimmed.startsWith('# ') ||
       (trimmed.startsWith('**') && trimmed.endsWith('**') && i === 0)) {
      flushInfo();
      elements.push(
        <p key={`h1-${i}`} style={{
          fontSize:"1.15rem", fontWeight:"700",
          color:"#fff", margin:"6px 0 10px", lineHeight:1.3
        }}>
          {trimmed.replace(/^#+\s/,'').replace(/\*\*/g,'')}
        </p>
      );
      i++;
      continue;
    }

    // H2
    if (trimmed.startsWith('## ') ||
       (trimmed.startsWith('**') && trimmed.endsWith('**') &&
        trimmed.length < 60 && !trimmed.includes('.'))) {
      flushInfo();
      elements.push(
        <SectionHeader key={`h2-${i}`}
          text={trimmed} accentColor={accentColor} />
      );
      i++;
      continue;
    }

    // Numbered
    const numMatch = trimmed.match(/^(\d+)\.\s+(.+)/);
    if (numMatch) {
      flushInfo();
      elements.push(
        <NumberedItem key={`num-${i}`}
          num={numMatch[1]} text={numMatch[2]}
          accentColor={accentColor} />
      );
      i++;
      continue;
    }

    // Bullet
    if (trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
      flushInfo();
      elements.push(
        <BulletItem key={`bul-${i}`}
          text={trimmed.slice(2)} accentColor={accentColor} />
      );
      i++;
      continue;
    }

    // Key: value
    const kvMatch = trimmed.match(/^[-•]?\s*\*?\*?([^:]+)\*?\*?:\s*(.+)/);
    if (kvMatch && kvMatch[1].length < 30 &&
        !trimmed.startsWith('http')) {
      infoItems.push({
        key  : kvMatch[1].replace(/\*/g,'').trim(),
        value: kvMatch[2]
      });
      i++;
      continue;
    }

    // Tip
    if (trimmed.startsWith('>')) {
      flushInfo();
      elements.push(
        <TipBox key={`tip-${i}`}
          text={trimmed.slice(1).trim()} accentColor={accentColor} />
      );
      i++;
      continue;
    }

    // Divider
    if (trimmed.match(/^---+$/) || trimmed.match(/^===+$/)) {
      flushInfo();
      elements.push(
        <hr key={`hr-${i}`} style={{
          border:"none",
          borderTop:"1px solid rgba(255,255,255,0.08)",
          margin:"12px 0"
        }} />
      );
      i++;
      continue;
    }

    // Normal paragraph
    flushInfo();
    elements.push(
      <p key={`p-${i}`} style={{
        fontSize  : "1rem",
        color     : "rgba(255,255,255,0.85)",
        margin    : "0 0 8px",
        lineHeight: "1.78",
        fontFamily: "Inter, sans-serif"
      }}>
        {parseInline(trimmed)}
      </p>
    );
    i++;
  }

  flushInfo();
  if (inEmail && emailLines.length > 0) {
    elements.push(
      <ContentBox key="email-final"
        content={emailLines.join('\n')} title="Email" />
    );
  }

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"3px" }}>
      {elements}
    </div>
  );
};

export default MessageRenderer;