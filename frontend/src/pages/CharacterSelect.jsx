import { useState, useEffect, useRef } from "react";
import { useNavigate }                  from "react-router-dom";
import gsap                             from "gsap";
import { CHARACTERS }                   from "../data/characters";

const CharacterSelect = () => {
  const [selected,   setSelected]   = useState(null);
  const [hovering,   setHovering]   = useState(null);
  const [confirmed,  setConfirmed]  = useState(false);
  const [imgErrors,  setImgErrors]  = useState({});
  const containerRef = useRef(null);
  const titleRef     = useRef(null);
  const cardsRef     = useRef([]);
  const navigate     = useNavigate();

  // Real anime image URLs from reliable sources
  const ANIME_IMAGES = {
    naruto : "https://i.pinimg.com/736x/96/a9/f7/96a9f7f6edba0ebb548b43a248023b45.jpg",
    levi   : "https://otakukart.com/wp-content/uploads/2022/03/levi-featured.jpg",
    zerotwo: "https://images.ponychar.com/samples/zero_two-0.webp",
    itachi : "https://wallpapercave.com/wp/wp12394365.jpg",
    rem    : "https://animepromptsdb.com/images/characters/rem/rem_illustrious_portrait.png",
    gojo   : "https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/b3acc143-332f-43c9-8707-d61106b45a55/deh6gqa-b7c94f64-9b00-49fb-9bae-c9cb69cc3273.png?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2IzYWNjMTQzLTMzMmYtNDNjOS04NzA3LWQ2MTEwNmI0NWE1NVwvZGVoNmdxYS1iN2M5NGY2NC05YjAwLTQ5ZmItOWJhZS1jOWNiNjljYzMyNzMucG5nIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.pAKe3dEkkA7QhaRkFwmppNzGaGm67cUrfxxN0GPMTAc"
  };

  // Fallback gradient avatars if images fail
  const FALLBACK_INITIALS = {
    naruto : { letter:"N", gradient:"linear-gradient(135deg,#FF8C00,#FF4500)" },
    levi   : { letter:"L", gradient:"linear-gradient(135deg,#4A90D9,#1a3a6e)" },
    zerotwo: { letter:"Z", gradient:"linear-gradient(135deg,#FF4D6D,#c2185b)" },
    itachi : { letter:"I", gradient:"linear-gradient(135deg,#8B5CF6,#3b0080)" },
    rem    : { letter:"R", gradient:"linear-gradient(135deg,#60A5FA,#1565c0)" },
    gojo   : { letter:"G", gradient:"linear-gradient(135deg,#e0e0e0,#9e9e9e)" }
  };

  useEffect(() => {
    // Stagger title + cards
    gsap.fromTo(titleRef.current,
      { opacity:0, y:-20 },
      { opacity:1, y:0, duration:0.6, ease:"power3.out" }
    );
    gsap.fromTo(cardsRef.current,
      { opacity:0, y:40, scale:0.94 },
      { opacity:1, y:0, scale:1,
        duration:0.5, stagger:0.08,
        ease:"power3.out", delay:0.2 }
    );
  }, []);

  const handleSelect = (char) => {
    if (confirmed) return;
    setSelected(char);
    setConfirmed(true);
    localStorage.setItem("friday_character", JSON.stringify(char));

    gsap.to(containerRef.current, {
      opacity : 0,
      scale   : 1.02,
      duration: 0.5,
      delay   : 0.9,
      ease    : "power2.in",
      onComplete: () => navigate("/dashboard")
    });
  };

  const handleImgError = (id) => {
    setImgErrors(prev => ({ ...prev, [id]: true }));
  };

  return (
    <div ref={containerRef} style={{
      minHeight     : "100vh",
      background    : "#050508",
      display       : "flex",
      flexDirection : "column",
      alignItems    : "center",
      justifyContent: "center",
      padding       : "40px 20px",
      overflow      : "hidden",
      position      : "relative"
    }}>

      {/* Background blobs */}
      <div style={{
        position    : "fixed",
        top         : "10%",
        left        : "15%",
        width       : "400px",
        height      : "400px",
        borderRadius: "50%",
        background  : "radial-gradient(circle, rgba(255,107,43,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        filter      : "blur(40px)"
      }} />
      <div style={{
        position    : "fixed",
        bottom      : "10%",
        right       : "15%",
        width       : "500px",
        height      : "500px",
        borderRadius: "50%",
        background  : "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
        filter      : "blur(60px)"
      }} />

      {/* Content */}
      <div style={{
        position : "relative",
        zIndex   : 1,
        width    : "100%",
        maxWidth : "1000px"
      }}>

        {/* Header */}
        <div ref={titleRef} style={{
          textAlign   : "center",
          marginBottom: "52px"
        }}>
          {/* Logo */}
          <div style={{
            display       : "flex",
            alignItems    : "center",
            justifyContent: "center",
            gap           : "10px",
            marginBottom  : "28px"
          }}>
            <div style={{
              width       : "36px",
              height      : "36px",
              borderRadius: "10px",
              overflow    : "hidden"
            }}>
              <img src="/logo.png" alt="FRIDAY"
                style={{ width:"100%", height:"100%",
                  objectFit:"contain" }} />
            </div>
            <span style={{
              fontFamily   : "'Bebas Neue', sans-serif",
              fontSize     : "1.2rem",
              letterSpacing: "0.3rem",
              color        : "rgba(255,255,255,0.5)"
            }}>
              FRIDAY
            </span>
          </div>

          <h1 style={{
            fontSize    : "clamp(2rem, 4vw, 3rem)",
            fontWeight  : "700",
            color       : "#fff",
            marginBottom: "10px",
            letterSpacing: "-0.02em",
            lineHeight  : 1.1
          }}>
            Who's using FRIDAY?
          </h1>
          <p style={{
            color    : "rgba(255,255,255,0.3)",
            fontSize : "0.9rem",
            fontWeight: "400"
          }}>
            Choose your AI companion
          </p>
        </div>

        {/* Cards */}
        <div style={{
          display       : "flex",
          gap           : "16px",
          justifyContent: "center",
          flexWrap      : "wrap"
        }}>
          {CHARACTERS.map((char, i) => {
            const isHovered  = hovering  === char.id;
            const isSelected = selected?.id === char.id;
            const isDimmed   = confirmed && !isSelected;
            const imgFailed  = imgErrors[char.id];
            const fallback   = FALLBACK_INITIALS[char.id];

            return (
              <div
                key={char.id}
                ref={el => cardsRef.current[i] = el}
                onClick={() => handleSelect(char)}
                onMouseEnter={() => setHovering(char.id)}
                onMouseLeave={() => setHovering(null)}
                style={{
                  width     : "150px",
                  cursor    : "pointer",
                  opacity   : isDimmed ? 0.25 : 1,
                  transform : isHovered || isSelected
                    ? "translateY(-10px) scale(1.04)"
                    : "translateY(0) scale(1)",
                  transition: "all 0.35s cubic-bezier(0.34,1.4,0.64,1)",
                  filter    : isDimmed ? "grayscale(1)" : "none"
                }}
              >
                {/* Card */}
                <div style={{
                  width        : "150px",
                  height       : "200px",
                  borderRadius : "20px",
                  overflow     : "hidden",
                  position     : "relative",
                  background   : imgFailed
                    ? fallback.gradient
                    : `linear-gradient(160deg, ${char.color}30, #0a0a0a)`,
                  border       : isSelected
                    ? `2px solid ${char.color}`
                    : isHovered
                    ? `2px solid rgba(255,255,255,0.2)`
                    : "2px solid rgba(255,255,255,0.06)",
                  boxShadow    : isSelected
                    ? `0 0 0 4px ${char.color}20,
                       0 20px 40px ${char.color}30,
                       0 8px 16px rgba(0,0,0,0.4)`
                    : isHovered
                    ? `0 20px 40px rgba(0,0,0,0.4),
                       0 0 0 1px rgba(255,255,255,0.1)`
                    : "0 8px 24px rgba(0,0,0,0.3)",
                  transition   : "all 0.3s ease"
                }}>

                  {/* Character Image */}
                  {!imgFailed ? (
                    <img
                      src={ANIME_IMAGES[char.id]}
                      alt={char.name}
                      onError={() => handleImgError(char.id)}
                      style={{
                        width        : "100%",
                        height       : "100%",
                        objectFit    : "cover",
                        objectPosition: "top center",
                        filter       : isSelected || isHovered
                          ? "brightness(1.1)"
                          : "brightness(0.85)",
                        transition   : "filter 0.3s ease"
                      }}
                    />
                  ) : (
                    /* Fallback — Letter Avatar */
                    <div style={{
                      width         : "100%",
                      height        : "100%",
                      display       : "flex",
                      alignItems    : "center",
                      justifyContent: "center",
                      fontSize      : "4rem",
                      fontWeight    : "800",
                      color         : "rgba(255,255,255,0.9)",
                      fontFamily    : "'Bebas Neue', sans-serif",
                      letterSpacing : "0.1rem"
                    }}>
                      {fallback.letter}
                    </div>
                  )}

                  {/* Bottom gradient overlay */}
                  <div style={{
                    position  : "absolute",
                    bottom    : 0,
                    left      : 0,
                    right     : 0,
                    height    : "60%",
                    background: `linear-gradient(to top,
                      ${char.color}60 0%,
                      ${char.color}10 50%,
                      transparent 100%)`,
                    pointerEvents: "none"
                  }} />

                  {/* Top subtle vignette */}
                  <div style={{
                    position  : "absolute",
                    top       : 0,
                    left      : 0,
                    right     : 0,
                    height    : "30%",
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.3), transparent)",
                    pointerEvents: "none"
                  }} />

                  {/* Selected checkmark */}
                  {isSelected && (
                    <div style={{
                      position      : "absolute",
                      top           : "10px",
                      right         : "10px",
                      width         : "26px",
                      height        : "26px",
                      borderRadius  : "50%",
                      background    : char.color,
                      display       : "flex",
                      alignItems    : "center",
                      justifyContent: "center",
                      fontSize      : "13px",
                      animation     : "popIn 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                      zIndex        : 2,
                      boxShadow     : `0 2px 8px ${char.color}80`
                    }}>
                      ✓
                    </div>
                  )}

                  {/* Anime label bottom left */}
                  <div style={{
                    position : "absolute",
                    bottom   : "8px",
                    left     : "10px",
                    zIndex   : 2
                  }}>
                    <p style={{
                      fontSize     : "0.58rem",
                      color        : "rgba(255,255,255,0.5)",
                      letterSpacing: "0.05rem",
                      margin       : 0
                    }}>
                      {char.anime}
                    </p>
                  </div>
                </div>

                {/* Name + title below card */}
                <div style={{
                  textAlign  : "center",
                  marginTop  : "12px",
                  padding    : "0 4px"
                }}>
                  <p style={{
                    fontSize  : "0.92rem",
                    fontWeight: "600",
                    color     : isHovered || isSelected
                      ? "#fff" : "rgba(255,255,255,0.65)",
                    margin    : 0,
                    transition: "color 0.2s",
                    letterSpacing: "-0.01em"
                  }}>
                    {char.name}
                  </p>
                  <p style={{
                    fontSize  : "0.68rem",
                    color     : isHovered || isSelected
                      ? char.color : "rgba(255,255,255,0.25)",
                    margin    : "3px 0 0",
                    fontWeight: "500",
                    transition: "color 0.2s"
                  }}>
                    {char.title}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom hint */}
        {!confirmed && (
          <p style={{
            textAlign    : "center",
            marginTop    : "44px",
            fontSize     : "0.72rem",
            color        : "rgba(255,255,255,0.18)",
            letterSpacing: "0.08rem",
            animation    : "fadeUp 0.5s 1s both"
          }}>
            tap to select your companion
          </p>
        )}

        {/* Confirmation */}
        {confirmed && selected && (
          <div style={{
            textAlign : "center",
            marginTop : "36px",
            animation : "fadeUp 0.4s both"
          }}>
            {/* Character greeting */}
            <div style={{
              display      : "inline-flex",
              alignItems   : "center",
              gap          : "10px",
              padding      : "12px 20px",
              background   : `${selected.color}12`,
              border       : `1px solid ${selected.color}30`,
              borderRadius : "16px",
              marginBottom : "12px"
            }}>
              <div style={{
                width       : "28px",
                height      : "28px",
                borderRadius: "50%",
                overflow    : "hidden",
                flexShrink  : 0
              }}>
                {!imgErrors[selected.id] ? (
                  <img
                    src={ANIME_IMAGES[selected.id]}
                    alt={selected.name}
                    style={{ width:"100%", height:"100%",
                      objectFit:"cover" }}
                  />
                ) : (
                  <div style={{
                    width     : "100%",
                    height    : "100%",
                    background: FALLBACK_INITIALS[selected.id].gradient,
                    display   : "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize  : "0.8rem",
                    fontWeight: "700",
                    color     : "#fff"
                  }}>
                    {FALLBACK_INITIALS[selected.id].letter}
                  </div>
                )}
              </div>
              <p style={{
                fontSize  : "0.82rem",
                color     : "rgba(255,255,255,0.7)",
                fontStyle : "italic",
                margin    : 0
              }}>
                "{selected.greeting}"
              </p>
            </div>

            {/* Loading indicator */}
            <div style={{
              display       : "flex",
              alignItems    : "center",
              justifyContent: "center",
              gap           : "6px"
            }}>
              {[0,1,2].map(i => (
                <div key={i} style={{
                  width       : "4px",
                  height      : "4px",
                  borderRadius: "50%",
                  background  : selected.color,
                  animation   : `dot 0.6s ${i*0.15}s infinite alternate`
                }} />
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes popIn {
          from { transform:scale(0) rotate(-180deg); opacity:0; }
          to   { transform:scale(1) rotate(0deg); opacity:1; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes dot {
          from { transform:translateY(0); opacity:0.3; }
          to   { transform:translateY(-5px); opacity:1; }
        }
      `}</style>
    </div>
  );
};

export default CharacterSelect;