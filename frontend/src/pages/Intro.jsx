import { useEffect, useRef, useState } from "react";
import { useNavigate }                  from "react-router-dom";
import gsap                             from "gsap";

const Intro = () => {
  const navigate     = useNavigate();
  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const lettersRef   = useRef([]);
  const taglineRef   = useRef(null);
  const lineRef      = useRef(null);
  const dotsRef      = useRef(null);
  const audioCtxRef  = useRef(null);
  const [phase, setPhase] = useState(0);

  const playSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Deep drone
      const drone     = ctx.createOscillator();
      const droneGain = ctx.createGain();
      drone.type      = "sine";
      drone.frequency.setValueAtTime(55, ctx.currentTime);
      drone.frequency.linearRampToValueAtTime(85, ctx.currentTime + 4);
      droneGain.gain.setValueAtTime(0, ctx.currentTime);
      droneGain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.8);
      droneGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 5.5);
      drone.connect(droneGain);
      droneGain.connect(ctx.destination);
      drone.start();
      drone.stop(ctx.currentTime + 6);

      // Hit
      const hit     = ctx.createOscillator();
      const hitGain = ctx.createGain();
      hit.type      = "triangle";
      hit.frequency.setValueAtTime(110, ctx.currentTime + 1);
      hit.frequency.exponentialRampToValueAtTime(55, ctx.currentTime + 2.5);
      hitGain.gain.setValueAtTime(0, ctx.currentTime + 1);
      hitGain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.1);
      hitGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3);
      hit.connect(hitGain);
      hitGain.connect(ctx.destination);
      hit.start(ctx.currentTime + 1);
      hit.stop(ctx.currentTime + 3);

      // Shimmer
      const shimmer     = ctx.createOscillator();
      const shimmerGain = ctx.createGain();
      shimmer.type      = "sine";
      shimmer.frequency.setValueAtTime(880, ctx.currentTime + 1.8);
      shimmer.frequency.linearRampToValueAtTime(1320, ctx.currentTime + 3.5);
      shimmerGain.gain.setValueAtTime(0, ctx.currentTime + 1.8);
      shimmerGain.gain.linearRampToValueAtTime(0.03, ctx.currentTime + 2.2);
      shimmerGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 4.5);
      shimmer.connect(shimmerGain);
      shimmerGain.connect(ctx.destination);
      shimmer.start(ctx.currentTime + 1.8);
      shimmer.stop(ctx.currentTime + 5);

    } catch(e) {}
  };

  useEffect(() => {
    // ── Canvas particles ──
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext("2d");
    let animId;

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 120 }, () => ({
      x    : Math.random() * window.innerWidth,
      y    : Math.random() * window.innerHeight,
      size : Math.random() * 1 + 0.2,
      vx   : (Math.random() - 0.5) * 0.2,
      vy   : (Math.random() - 0.5) * 0.2,
      alpha: Math.random() * 0.25 + 0.05
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
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
      animId = requestAnimationFrame(draw);
    };
    draw();

    // ── Sound ──
    playSound();

    // ── GSAP Timeline ──
    const tl = gsap.timeline();

    // Phase 1 — letters drop in one by one
    tl.to({}, { duration: 0.3, onComplete: () => setPhase(1) });

    tl.fromTo(lettersRef.current,
      {
        y      : -80,
        opacity: 0,
        rotateX: 90,
        filter : "blur(12px)"
      },
      {
        y       : 0,
        opacity : 1,
        rotateX : 0,
        filter  : "blur(0px)",
        duration: 0.7,
        stagger : 0.08,
        ease    : "power4.out"
      }
    );

    // Phase 2 — tagline fades up
    tl.fromTo(taglineRef.current,
      { y: 16, opacity: 0, filter:"blur(6px)" },
      { y: 0,  opacity: 1, filter:"blur(0px)",
        duration: 0.7, ease:"power3.out",
        onComplete: () => setPhase(2)
      },
      "-=0.2"
    );

    // Phase 3 — line expands
    tl.fromTo(lineRef.current,
      { scaleX: 0, opacity: 0 },
      { scaleX: 1, opacity: 1,
        duration: 0.8, ease:"power3.inOut",
        onComplete: () => setPhase(3)
      },
      "-=0.3"
    );

    // Phase 4 — dots appear
    tl.fromTo(dotsRef.current,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0,
        duration: 0.4, ease:"power2.out",
        onComplete: () => setPhase(4)
      },
      "+=0.1"
    );

    // Phase 5 — cinematic exit
    tl.to(lettersRef.current, {
      y       : -6,
      opacity : 0.6,
      duration: 0.4,
      stagger : 0.04,
      ease    : "power2.in",
      delay   : 0.6
    });

    tl.to(containerRef.current, {
      opacity : 0,
      duration: 0.6,
      ease    : "power2.in",
      onComplete: () => navigate("/select")
    }, "-=0.2");

    return () => {
      cancelAnimationFrame(animId);
      tl.kill();
      audioCtxRef.current?.close();
      window.removeEventListener("resize", resize);
    };
  }, [navigate]);

  return (
    <div
      ref={containerRef}
      style={{
        position      : "fixed",
        inset         : 0,
        background    : "#050508",
        display       : "flex",
        alignItems    : "center",
        justifyContent: "center",
        flexDirection : "column",
        overflow      : "hidden"
      }}
    >
      {/* Particles */}
      <canvas ref={canvasRef} style={{
        position     : "absolute",
        inset        : 0,
        zIndex       : 0,
        pointerEvents: "none"
      }} />

      {/* Center content */}
      <div style={{
        position      : "relative",
        zIndex        : 2,
        display       : "flex",
        flexDirection : "column",
        alignItems    : "center",
        gap           : "20px"
      }}>

        {/* FRIDAY letters */}
        {phase >= 1 && (
          <div style={{
            display       : "flex",
            gap           : "0px",
            perspective   : "600px",
            alignItems    : "center"
          }}>
            {"FRIDAY".split("").map((letter, i) => (
              <span
                key={i}
                ref={el => lettersRef.current[i] = el}
                style={{
                  fontFamily   : "'Bebas Neue', sans-serif",
                  fontSize     : "clamp(5rem, 15vw, 11rem)",
                  fontWeight   : "400",
                  letterSpacing: "0.12em",
                  color        : "#ffffff",
                  display      : "inline-block",
                  lineHeight   : 1,
                  opacity      : 0
                }}
              >
                {letter}
              </span>
            ))}
          </div>
        )}

        {/* Tagline */}
        <p
          ref={taglineRef}
          style={{
            fontFamily   : "'Inter', sans-serif",
            fontSize     : "clamp(0.65rem, 1.4vw, 0.88rem)",
            color        : "rgba(255,255,255,0.35)",
            letterSpacing: "0.55em",
            fontWeight   : "300",
            textTransform: "uppercase",
            opacity      : 0,
            margin       : 0
          }}
        >
          Your Personal AI Platform
        </p>

        {/* Thin line */}
        <div
          ref={lineRef}
          style={{
            width          : "120px",
            height         : "1px",
            background     : "rgba(255,255,255,0.15)",
            transformOrigin: "center",
            opacity        : 0
          }}
        />

        {/* Loading dots */}
        <div
          ref={dotsRef}
          style={{
            display : "flex",
            gap     : "8px",
            opacity : 0
          }}
        >
          {[0,1,2].map(i => (
            <div key={i} style={{
              width       : "4px",
              height      : "4px",
              borderRadius: "50%",
              background  : "rgba(255,255,255,0.3)",
              animation   : `dot 0.8s ${i*0.2}s infinite alternate`
            }} />
          ))}
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500&display=swap');

        @keyframes dot {
          from { transform:translateY(0); opacity:0.2; }
          to   { transform:translateY(-5px); opacity:0.8; }
        }
      `}</style>
    </div>
  );
};

export default Intro;