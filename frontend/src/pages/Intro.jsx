import { useEffect, useRef, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import gsap                             from "gsap";

const Intro = () => {
  const navigate     = useNavigate();
  const canvasRef    = useRef(null);
  const containerRef = useRef(null);
  const audioCtxRef  = useRef(null);
  const [phase, setPhase] = useState(0);

  // ── Cinematic Sound ──
  const playIntroSound = () => {
    try {
      const ctx  = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Deep cinematic drone
      const drone = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type      = "sine";
      drone.frequency.setValueAtTime(55, ctx.currentTime);
      drone.frequency.linearRampToValueAtTime(80, ctx.currentTime + 3);
      droneGain.gain.setValueAtTime(0, ctx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.5);
      droneGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 2);
      droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);
      drone.connect(droneGain);
      droneGain.connect(ctx.destination);
      drone.start(ctx.currentTime);
      drone.stop(ctx.currentTime + 6);

      // Mid hit — dramatic
      const hit      = ctx.createOscillator();
      const hitGain  = ctx.createGain();
      hit.type       = "triangle";
      hit.frequency.setValueAtTime(120, ctx.currentTime + 1);
      hit.frequency.exponentialRampToValueAtTime(60, ctx.currentTime + 2.5);
      hitGain.gain.setValueAtTime(0, ctx.currentTime + 1);
      hitGain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 1.1);
      hitGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      hit.connect(hitGain);
      hitGain.connect(ctx.destination);
      hit.start(ctx.currentTime + 1);
      hit.stop(ctx.currentTime + 3);

      // High shimmer — cinematic shine
      const shimmer     = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type      = "sine";
      shimmer.frequency.setValueAtTime(880, ctx.currentTime + 1.5);
      shimmer.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 3);
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime + 1.5);
      shimmerGain.gain.linearRampToValueAtTime(0.04, ctx.currentTime + 2);
      shimmerGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(ctx.currentTime + 1.5);
      shimmer.stop(ctx.currentTime + 4);

      // Reverb noise burst
      const bufferSize  = ctx.sampleRate * 1.5;
      const buffer      = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data        = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 3);
      }
      const noise     = ctx.createBufferSource();
      const noiseGain = ctx.createGain();
      const noiseFilter = ctx.createBiquadFilter();
      noise.buffer    = buffer;
      noiseFilter.type      = "bandpass";
      noiseFilter.frequency.value = 200;
      noiseGain.gain.setValueAtTime(0, ctx.currentTime + 1);
      noiseGain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + 1.2);
      noiseGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 2.5);
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(ctx.currentTime + 1);

    } catch (e) {
      console.log("Audio not supported");
    }
  };

  useEffect(() => {
    // Canvas particles
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 180 }, () => ({
      x    : Math.random() * canvas.width,
      y    : Math.random() * canvas.height,
      size : Math.random() * 1.2 + 0.2,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: (Math.random() - 0.5) * 0.25,
      alpha : Math.random() * 0.3 + 0.05,
    }));

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.speedX;
        p.y += p.speedY;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle   = "#ffffff";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });
      animId = requestAnimationFrame(drawParticles);
    };
    drawParticles();

    // Play sound + start timeline based on phases
    playIntroSound();

    const tl = gsap.timeline();
    tl.to({}, { duration: 0.8, onComplete: () => setPhase(1) });
    tl.to({}, { duration: 1.5, onComplete: () => setPhase(2) });
    tl.to({}, { duration: 0.8, onComplete: () => setPhase(3) });
    tl.to({}, { duration: 0.8, onComplete: () => setPhase(4) });
    tl.to(containerRef.current, {
      opacity : 0,
      scale   : 1.04,
      duration: 0.7,
      delay   : 0.5,
      ease    : "power2.in",
      onComplete: () => navigate("/select")
    });

    return () => {
      cancelAnimationFrame(animId);
      tl.kill();
      audioCtxRef.current?.close();
      window.removeEventListener("resize", resize);
    };
  }, [navigate]);

  return (
    <div ref={containerRef} style={{
      position      : "fixed",
      inset         : 0,
      background    : "#000",
      display       : "flex",
      alignItems    : "center",
      justifyContent: "center",
      flexDirection : "column",
      overflow      : "hidden"
    }}>
      <canvas ref={canvasRef} style={{
        position:"absolute", inset:0, zIndex:0
      }} />

      {/* Orange glow */}
      {phase >= 3 && (
        <div style={{
          position    : "absolute",
          width       : "800px",
          height      : "800px",
          borderRadius: "50%",
          background  : "radial-gradient(circle, rgba(255,107,43,0.12) 0%, transparent 70%)",
          animation   : "glowPulse 1.2s ease-out forwards",
          zIndex      : 1,
          pointerEvents: "none"
        }} />
      )}

      {/* Scan line effect */}
      {phase >= 1 && (
        <div style={{
          position  : "absolute",
          inset     : 0,
          background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.008) 2px, rgba(255,255,255,0.008) 4px)",
          zIndex    : 1,
          pointerEvents: "none"
        }} />
      )}

      <div style={{
        position     : "relative",
        zIndex       : 2,
        textAlign    : "center",
        display      : "flex",
        flexDirection: "column",
        alignItems   : "center",
        gap          : "16px"
      }}>
        {/* FRIDAY Logo — Bebas Neue cinematic font */}
        {phase >= 1 && (
          <div style={{ position:"relative" }}>
            {/* Glow layer behind text */}
            <div style={{
              position  : "absolute",
              inset     : 0,
              filter    : "blur(30px)",
              opacity   : phase >= 3 ? 0.5 : 0.15,
              transition: "opacity 1s",
              background: "linear-gradient(135deg, #FF6B2B, #fff)",
              borderRadius: "8px"
            }} />

            <div style={{ display:"flex", gap:"2px", position:"relative" }}>
              {"FRIDAY".split("").map((letter, i) => (
                <span key={i} style={{
                  fontFamily  : "'Bebas Neue', sans-serif",
                  fontSize    : "clamp(5rem, 14vw, 11rem)",
                  fontWeight  : "400",
                  letterSpacing: "0.15em",
                  color       : "#ffffff",
                  animation   : `letterIn 0.5s ${i * 0.08}s both`,
                  display     : "inline-block",
                  lineHeight  : 1,
                  textShadow  : phase >= 3
                    ? `0 0 60px rgba(255,107,43,0.6),
                       0 0 120px rgba(255,107,43,0.2),
                       0 2px 0 rgba(255,255,255,0.1)`
                    : `0 0 30px rgba(255,255,255,0.15)`,
                  transition  : "text-shadow 0.8s"
                }}>
                  {letter}
                </span>
              ))}
            </div>

            {/* Underline sweep */}
            {phase >= 2 && (
              <div style={{
                height    : "2px",
                background: "linear-gradient(90deg, transparent, #FF6B2B, transparent)",
                animation : "sweepLine 0.8s ease-out both",
                marginTop : "4px"
              }} />
            )}
          </div>
        )}

        {/* Tagline */}
        {phase >= 2 && (
          <div style={{ animation:"fadeSlideUp 0.6s both" }}>
            <p style={{
              fontFamily   : "'Inter', sans-serif",
              fontSize     : "clamp(0.7rem, 1.5vw, 0.95rem)",
              color        : "rgba(255,255,255,0.45)",
              letterSpacing: "0.5em",
              fontWeight   : "300",
              textTransform: "uppercase"
            }}>
              Your Personal AI Platform
            </p>
          </div>
        )}

        {/* Orange accent line */}
        {phase >= 3 && (
          <div style={{
            display   : "flex",
            alignItems: "center",
            gap       : "12px",
            animation : "fadeSlideUp 0.4s both"
          }}>
            <div style={{
              width     : "40px",
              height    : "1px",
              background: "linear-gradient(90deg, transparent, #FF6B2B)"
            }} />
            <div style={{
              width       : "6px",
              height      : "6px",
              borderRadius: "50%",
              background  : "#FF6B2B",
              boxShadow   : "0 0 10px #FF6B2B"
            }} />
            <div style={{
              width     : "40px",
              height    : "1px",
              background: "linear-gradient(90deg, #FF6B2B, transparent)"
            }} />
          </div>
        )}

        {/* Loading dots */}
        {phase >= 4 && (
          <div style={{
            display  : "flex",
            gap      : "6px",
            marginTop: "8px",
            animation: "fadeSlideUp 0.4s both"
          }}>
            {[0,1,2].map(i => (
              <div key={i} style={{
                width       : "5px",
                height      : "5px",
                borderRadius: "50%",
                background  : "#FF6B2B",
                animation   : `dot 0.6s ${i*0.15}s infinite alternate`
              }} />
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes letterIn {
          from { opacity:0; transform:translateY(40px) scaleY(0.6); filter:blur(8px); }
          to   { opacity:1; transform:translateY(0) scaleY(1); filter:blur(0); }
        }
        @keyframes fadeSlideUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes sweepLine {
          from { transform:scaleX(0); opacity:0; }
          to   { transform:scaleX(1); opacity:1; }
        }
        @keyframes glowPulse {
          from { transform:scale(0.3); opacity:0; }
          to   { transform:scale(1); opacity:1; }
        }
        @keyframes dot {
          from { transform:translateY(0); opacity:0.3; }
          to   { transform:translateY(-6px); opacity:1; }
        }
      `}</style>
    </div>
  );
};

export default Intro;