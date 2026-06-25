import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";

/* ─────────────────────────────────────────────────────────────
   Inject styles once
───────────────────────────────────────────────────────────── */
const STYLE_ID = "tcc-fullscreen-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');

    @keyframes tcc-overlay-in {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes tcc-overlay-out {
      from { opacity: 1; }
      to   { opacity: 0; }
    }
    @keyframes tcc-burst {
      0%   { transform: translate(-50%,-50%) scale(0.4); opacity: 0; }
      40%  { opacity: 1; }
      100% { transform: translate(-50%,-50%) scale(1);   opacity: 1; }
    }
    @keyframes tcc-emblem-pop {
      0%   { transform: scale(0) rotate(-20deg); opacity: 0; }
      60%  { transform: scale(1.12) rotate(4deg); opacity: 1; }
      80%  { transform: scale(0.96) rotate(-1deg); }
      100% { transform: scale(1) rotate(0deg); opacity: 1; }
    }
    @keyframes tcc-emblem-float {
      0%,100% { transform: translateY(0px); }
      50%     { transform: translateY(-10px); }
    }
    @keyframes tcc-orbit-cw {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    @keyframes tcc-orbit-ccw {
      from { transform: rotate(0deg); }
      to   { transform: rotate(-360deg); }
    }
    @keyframes tcc-ring-in {
      from { opacity: 0; transform: scale(0.5); }
      to   { opacity: 1; transform: scale(1); }
    }
    @keyframes tcc-check-draw {
      from { stroke-dashoffset: 120; }
      to   { stroke-dashoffset: 0; }
    }
    @keyframes tcc-glow-pulse {
      0%,100% { box-shadow: 0 0 40px 10px rgba(250,189,47,0.25), 0 0 80px 20px rgba(250,189,47,0.1); }
      50%     { box-shadow: 0 0 60px 20px rgba(250,189,47,0.4),  0 0 120px 40px rgba(250,189,47,0.18); }
    }
    @keyframes tcc-scan {
      0%   { background-position: 0 0; }
      100% { background-position: 0 100px; }
    }
    @keyframes tcc-label-in {
      from { opacity: 0; letter-spacing: 0.6em; transform: translateY(6px); }
      to   { opacity: 1; letter-spacing: 0.25em; transform: translateY(0); }
    }
    @keyframes tcc-title-in {
      from { opacity: 0; transform: translateY(28px) skewY(2deg); filter: blur(4px); }
      to   { opacity: 1; transform: translateY(0) skewY(0); filter: blur(0); }
    }
    @keyframes tcc-sub-in {
      from { opacity: 0; transform: translateY(14px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tcc-divider-in {
      from { transform: scaleX(0); opacity: 0; }
      to   { transform: scaleX(1); opacity: 1; }
    }
    @keyframes tcc-stat-in {
      from { opacity: 0; transform: translateY(20px) scale(0.9); }
      to   { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes tcc-btn-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes tcc-shimmer {
      0%   { background-position: -300% center; }
      100% { background-position: 300% center; }
    }
    @keyframes tcc-confetti-drop {
      0%   { transform: translateY(0) rotate(0deg) scale(1);   opacity: 1; }
      80%  { opacity: 0.8; }
      100% { transform: translateY(105vh) rotate(900deg) scale(0.5); opacity: 0; }
    }
    @keyframes tcc-line-h {
      from { transform: scaleX(0); }
      to   { transform: scaleX(1); }
    }
  `;
  document.head.appendChild(s);
}

/* ─── Confetti ─── */
const CONF_COLORS = [
  "#fabd2f",
  "#fb4934",
  "#b8bb26",
  "#83a598",
  "#d3869b",
  "#fe8019",
  "#8ec07c",
];
const confettiPieces = Array.from({ length: 55 }, (_, i) => ({
  id: i,
  color: CONF_COLORS[i % CONF_COLORS.length],
  left: `${(i * 1.85) % 100}%`,
  size: 5 + (i % 6) * 1.8,
  delay: `${(i * 0.055).toFixed(2)}s`,
  dur: `${2.2 + (i % 5) * 0.35}s`,
  shape: ["rect", "circle", "tri", "rect", "rect", "circle"][i % 6],
  skew: (i % 3) * 10,
}));

/* ─── Orbit dot (absolute, positioned via transform) ─── */
const OrbitDot = ({ angle, radius, size, color, opacity = 1 }) => (
  <div
    style={{
      position: "absolute",
      width: size,
      height: size,
      borderRadius: "50%",
      backgroundColor: color,
      opacity,
      top: "50%",
      left: "50%",
      marginTop: -size / 2,
      marginLeft: -size / 2,
      transform: `rotate(${angle}deg) translateX(${radius}px)`,
      boxShadow: `0 0 ${size * 2.5}px ${color}88`,
    }}
  />
);

/* ─── Stat pill ─── */
const StatPill = ({ icon, label, value, delay, accent }) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      padding: "16px 12px",
      borderRadius: 16,
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.09)",
      backdropFilter: "blur(8px)",
      flex: 1,
      animation: `tcc-stat-in 0.5s ${delay} cubic-bezier(0.34,1.56,0.64,1) both`,
    }}
  >
    <span style={{ fontSize: 24 }}>{icon}</span>
    <span
      style={{
        fontFamily: "'Bebas Neue'",
        fontSize: 21,
        color: accent,
        letterSpacing: "0.05em",
        lineHeight: 1,
      }}
    >
      {value}
    </span>
    <span
      style={{
        fontFamily: "'Outfit'",
        fontSize: 10,
        color: "rgba(255,255,255,0.4)",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
  </div>
);

/* ─── Main component ─── */
const TaskCompletionCelebrate = ({ visible, onClose }) => {
  const { isDark } = useTheme();
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    if (visible) {
      setPhase("in");
    } else if (phase !== "hidden") {
      setPhase("out");
      const t = setTimeout(() => setPhase("hidden"), 500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  const handleClose = () => {
    setPhase("out");
    setTimeout(() => onClose?.(), 480);
  };

  if (phase === "hidden") return null;

  const isOut = phase === "out";

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: isOut
          ? "tcc-overlay-out 0.48s ease forwards"
          : "tcc-overlay-in 0.4s ease forwards",
        fontFamily: "'Outfit', sans-serif",
      }}
    >
      {/* ── Background ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at 50% 40%, #1a1200 0%, #0d0d0d 55%, #050505 100%)",
        }}
      />

      {/* ── Scanlines ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          backgroundImage:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
          animation: "tcc-scan 4s linear infinite",
          opacity: 0.5,
        }}
      />

      {/* ── Radial glow burst ── */}
      <div
        style={{
          position: "absolute",
          width: "120vmin",
          height: "120vmin",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(250,189,47,0.14) 0%, rgba(250,189,47,0.06) 35%, transparent 70%)",
          top: "50%",
          left: "50%",
          animation: "tcc-burst 1.2s 0.1s cubic-bezier(0.23,1,0.32,1) both",
          pointerEvents: "none",
        }}
      />

      {/* ── Confetti rain ── */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      >
        {confettiPieces.map((c) => (
          <div
            key={c.id}
            style={{
              position: "absolute",
              top: "-20px",
              left: c.left,
              width: c.shape === "tri" ? 0 : c.size,
              height:
                c.shape === "circle"
                  ? c.size
                  : c.shape === "tri"
                    ? 0
                    : c.size * 1.7,
              borderRadius:
                c.shape === "circle" ? "50%" : c.shape === "rect" ? 3 : 0,
              borderLeft:
                c.shape === "tri"
                  ? `${c.size / 2}px solid transparent`
                  : undefined,
              borderRight:
                c.shape === "tri"
                  ? `${c.size / 2}px solid transparent`
                  : undefined,
              borderBottom:
                c.shape === "tri" ? `${c.size}px solid ${c.color}` : undefined,
              backgroundColor: c.shape !== "tri" ? c.color : "transparent",
              transform: `skewX(${c.skew}deg)`,
              animation: `tcc-confetti-drop ${c.dur} ${c.delay} ease-in both`,
            }}
          />
        ))}
      </div>

      {/* ── Content ── */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          textAlign: "center",
          padding: "0 24px",
          maxWidth: 560,
          width: "100%",
          pointerEvents: "none",
        }}
      >
        {/* ── Orbit system ── */}
        <div
          style={{
            position: "relative",
            width: 210,
            height: 210,
            marginBottom: 32,
            animation: "tcc-emblem-float 4s 1.6s ease-in-out infinite",
            pointerEvents: "none",
          }}
        >
          {/* Outer ring */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              border: "1.5px dashed rgba(250,189,47,0.18)",
              animation:
                "tcc-orbit-cw 20s linear infinite, tcc-ring-in 0.6s 0.4s ease both",
            }}
          >
            <OrbitDot angle={0} radius={102} size={8} color="#fabd2f" />
            <OrbitDot
              angle={180}
              radius={102}
              size={4}
              color="#fe8019"
              opacity={0.7}
            />
          </div>

          {/* Mid ring */}
          <div
            style={{
              position: "absolute",
              inset: "22px",
              borderRadius: "50%",
              border: "1px solid rgba(250,189,47,0.1)",
              animation:
                "tcc-orbit-ccw 11s linear infinite, tcc-ring-in 0.6s 0.6s ease both",
            }}
          >
            <OrbitDot
              angle={60}
              radius={78}
              size={6}
              color="#8ec07c"
              opacity={0.9}
            />
            <OrbitDot
              angle={240}
              radius={78}
              size={4}
              color="#83a598"
              opacity={0.7}
            />
          </div>

          {/* Inner ring */}
          <div
            style={{
              position: "absolute",
              inset: "44px",
              borderRadius: "50%",
              border: "2px solid rgba(250,189,47,0.32)",
              animation:
                "tcc-orbit-cw 6s linear infinite, tcc-ring-in 0.6s 0.8s ease both",
            }}
          >
            <OrbitDot angle={120} radius={56} size={7} color="#fabd2f" />
            <OrbitDot
              angle={300}
              radius={56}
              size={4}
              color="#fb4934"
              opacity={0.85}
            />
          </div>

          {/* Central emblem */}
          <div
            style={{
              position: "absolute",
              inset: "60px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #2d2000 0%, #1a1200 100%)",
              border: "2.5px solid rgba(250,189,47,0.65)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation:
                "tcc-emblem-pop 0.7s 0.9s cubic-bezier(0.34,1.56,0.64,1) both, tcc-glow-pulse 3s 2s ease-in-out infinite",
            }}
          >
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none">
              <polyline
                points="10,25 20,35 38,14"
                stroke="#fabd2f"
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="120"
                strokeDashoffset="120"
                style={{
                  animation: "tcc-check-draw 0.6s 1.4s ease-out forwards",
                }}
              />
            </svg>
          </div>
        </div>

        {/* ── Label ── */}
        <div
          style={{
            fontFamily: "'Outfit'",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.25em",
            color: "#fabd2f",
            textTransform: "uppercase",
            marginBottom: 14,
            animation: "tcc-label-in 0.6s 1.5s ease-out both",
          }}
        >
          ✦ Daily Objective Complete ✦
        </div>

        {/* ── Headline ── */}
        <div
          style={{
            fontFamily: "'Bebas Neue'",
            fontSize: "clamp(52px, 10vw, 90px)",
            color: "#ffffff",
            letterSpacing: "0.04em",
            lineHeight: 0.95,
            marginBottom: 18,
            animation:
              "tcc-title-in 0.65s 1.65s cubic-bezier(0.23,1,0.32,1) both",
          }}
        >
          Mission
          <br />
          <span
            style={{
              background:
                "linear-gradient(90deg, #fabd2f 0%, #fe8019 40%, #fabd2f 80%)",
              backgroundSize: "200% auto",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              display: "inline-block",
              animation: "tcc-shimmer 3s 2.8s linear infinite",
            }}
          >
            Accomplished
          </span>
        </div>

        {/* ── Divider ── */}
        <div
          style={{
            width: 120,
            height: 1.5,
            background:
              "linear-gradient(90deg, transparent, rgba(250,189,47,0.6), transparent)",
            marginBottom: 16,
            transformOrigin: "center",
            animation: "tcc-divider-in 0.5s 1.9s ease-out both",
          }}
        />

        {/* ── Subtitle ── */}
        <div
          style={{
            fontSize: "clamp(13px, 2vw, 16px)",
            fontWeight: 400,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.65,
            maxWidth: 380,
            marginBottom: 32,
            animation: "tcc-sub-in 0.5s 2.05s ease-out both",
          }}
        >
          Every task cleared. Every deadline met.
          <br />
          You showed up and delivered —{" "}
          <span style={{ color: "rgba(250,189,47,0.9)", fontWeight: 500 }}>
            that's what excellence looks like.
          </span>
        </div>

        {/* ── Stats ── */}
        <div
          style={{
            display: "flex",
            gap: 10,
            width: "100%",
            maxWidth: 420,
            marginBottom: 28,
          }}
        >
          <StatPill
            icon="🔥"
            label="Streak"
            value="Active"
            delay="2.2s"
            accent="#fe8019"
          />
          <StatPill
            icon="⚡"
            label="Focus"
            value="100%"
            delay="2.35s"
            accent="#fabd2f"
          />
          <StatPill
            icon="🏆"
            label="Today"
            value="Done"
            delay="2.5s"
            accent="#b8bb26"
          />
          <StatPill
            icon="🎯"
            label="Perfect"
            value="Day"
            delay="2.65s"
            accent="#83a598"
          />
        </div>

        {/* ── Separator ── */}
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            height: 1,
            background: "rgba(255,255,255,0.07)",
            marginBottom: 24,
            transformOrigin: "left",
            animation: "tcc-line-h 0.6s 2.7s ease-out both",
          }}
        />

        {/* ── CTA ── */}
        <div
          style={{
            animation: "tcc-btn-in 0.5s 2.8s ease-out both",
            width: "100%",
            maxWidth: 320,
            pointerEvents: "auto",
          }}
        >
          <button
            onClick={handleClose}
            style={{
              width: "100%",
              height: 56,
              borderRadius: 14,
              border: "1.5px solid rgba(250,189,47,0.4)",
              cursor: "pointer",
              fontFamily: "'Bebas Neue'",
              fontSize: 20,
              letterSpacing: "0.15em",
              color: "#0d0d0d",
              background:
                "linear-gradient(90deg, #fabd2f 0%, #fe8019 50%, #fabd2f 100%)",
              backgroundSize: "200% auto",
              animation: "tcc-shimmer 2.5s 3.2s linear infinite",
              position: "relative",
              overflow: "hidden",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              boxShadow: "0 8px 30px rgba(250,189,47,0.25)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 12px 40px rgba(250,189,47,0.48)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 8px 30px rgba(250,189,47,0.25)";
            }}
          >
            CONTINUE →
          </button>
        </div>

        {/* ── Dismiss hint ── */}
        <div
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "rgba(255,255,255,0.2)",
            letterSpacing: "0.05em",
            animation: "tcc-sub-in 0.4s 3.1s ease-out both",
            pointerEvents: "none",
          }}
        >
          Press anywhere outside to dismiss
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionCelebrate;
