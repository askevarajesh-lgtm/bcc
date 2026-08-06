import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../contexts/ThemeContext";

/* ─────────────────────────────────────────────
   Inject keyframes once
───────────────────────────────────────────── */
const STYLE_ID = "tct-toast-styles";
if (typeof document !== "undefined" && !document.getElementById(STYLE_ID)) {
  const s = document.createElement("style");
  s.id = STYLE_ID;
  s.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

    @keyframes tct-slide-in {
      from { transform: translateY(18px) scale(0.96); opacity: 0; }
      to   { transform: translateY(0)    scale(1);    opacity: 1; }
    }
    @keyframes tct-slide-out {
      from { transform: translateY(0)   scale(1);    opacity: 1; }
      to   { transform: translateY(14px) scale(0.96); opacity: 0; }
    }
    @keyframes tct-check-draw {
      from { stroke-dashoffset: 36; }
      to   { stroke-dashoffset: 0;  }
    }
    @keyframes tct-icon-pop {
      0%   { transform: scale(0); }
      65%  { transform: scale(1.15); }
      85%  { transform: scale(0.95); }
      100% { transform: scale(1); }
    }
    @keyframes tct-timer {
      from { width: 100%; }
      to   { width: 0%; }
    }
    @keyframes tct-msg-in {
      from { opacity: 0; transform: translateX(6px); }
      to   { opacity: 1; transform: translateX(0); }
    }
    @keyframes tct-count-bump {
      0%   { transform: scale(1); }
      40%  { transform: scale(1.22); }
      100% { transform: scale(1); }
    }

    .tct-close-btn:hover { opacity: 1 !important; background: rgba(0,0,0,0.07) !important; }
    .tct-toast-wrap:hover .tct-timer-bar { animation-play-state: paused !important; }
  `;
  document.head.appendChild(s);
}

/* ─── Ordinal helper ─── */
const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

/* ─── Per-count motivational messages ─── */
const getMessage = (count, total) => {
  const remaining = total ? total - count : null;

  if (count === 1) return "Great start! Keep the momentum going.";
  if (count === 2) return "Two down — you're on a roll! 🔥";
  if (count === 3) return "Three done! You're picking up speed.";

  if (remaining !== null) {
    if (remaining === 1) return "Almost there — just one left!";
    if (remaining === 2) return `Only ${remaining} more to go. Finish strong!`;
    if (remaining === 0) return "Every task done. You nailed it today! 🏆";
  }

  const pool = [
    "Consistent effort builds big results.",
    "You're unstoppable today — keep it up!",
    "Another one bites the dust. Well done.",
    "Halfway habits make full-day wins. 💪",
    "Your focus is paying off — stay locked in.",
    "One step closer to a perfect day!",
    "This is what being productive looks like.",
    "The list is shrinking — keep going!",
  ];
  // Fix negative index by adding pool.length before modulo
  return pool[((count - 4) % pool.length + pool.length) % pool.length];
};

/* ─── Toast accent colors ─── */
const ACCENT = {
  bg: "#0d9488",
  bgSoft: "#f0fdf9",
  border: "#99f6e4",
  text: "#0f766e",
  timer: "#14b8a6",
};
const ACCENT_DARK = {
  bg: "#0d9488",
  bgSoft: "#0d1f1e",
  border: "rgba(20,184,166,0.25)",
  text: "#5eead4",
  timer: "#0d9488",
};

/* ─────────────────────────────────────────────
   Main component
   Props:
     visible  : boolean
     count    : number   — how many tasks completed so far (1-based)
     total    : number   — total tasks today (optional, used for remaining calc)
     onClose  : () => void
     duration : number   — ms before auto-dismiss (default 4000)
───────────────────────────────────────────── */
const TaskCompletionToast = ({
  visible,
  count = 1,
  total = null,
  onClose,
  duration = 4000,
}) => {
  const { isDark } = useTheme();
  const [phase, setPhase] = useState("hidden"); // hidden | in | out
  const timerRef = useRef(null);
  const ac = isDark ? ACCENT_DARK : ACCENT;

  /* Phase management */
  useEffect(() => {
    if (visible) {
      setPhase("in");

      // Auto-dismiss
      timerRef.current = setTimeout(() => {
        setPhase("out");
        setTimeout(() => onClose?.(), 340);
      }, duration);
    } else if (phase !== "hidden") {
      clearTimeout(timerRef.current);
      setPhase("out");
      setTimeout(() => setPhase("hidden"), 340);
    }

    return () => clearTimeout(timerRef.current);
  }, [visible, count]); // re-trigger on new count so each task shows fresh

  if (phase === "hidden") return null;

  const isOut = phase === "out";
  const label = ordinal(count);
  const message = getMessage(count, total);

  return (
    <div
      className="tct-toast-wrap"
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 10000,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        animation: isOut
          ? "tct-slide-out 0.32s cubic-bezier(0.4,0,1,1) forwards"
          : "tct-slide-in  0.38s cubic-bezier(0.34,1.56,0.64,1) forwards",
        maxWidth: 360,
        width: "calc(100vw - 56px)",
      }}
    >
      <div
        style={{
          borderRadius: 16,
          background: ac.bgSoft,
          border: `1.5px solid ${ac.border}`,
          boxShadow: isDark
            ? "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)"
            : "0 8px 28px rgba(13,148,136,0.12), 0 2px 8px rgba(0,0,0,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* ── Main row ── */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 12,
            padding: "14px 14px 16px 14px",
          }}
        >
          {/* Check icon */}
          <div
            style={{
              flexShrink: 0,
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: ac.bg,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: `0 4px 14px ${ac.bg}55`,
              animation:
                "tct-icon-pop 0.45s 0.05s cubic-bezier(0.34,1.56,0.64,1) both",
              marginTop: 1,
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
              <polyline
                points="5,13 10,18 19,7"
                stroke="#fff"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="36"
                strokeDashoffset="36"
                style={{
                  animation: "tct-check-draw 0.4s 0.28s ease-out forwards",
                }}
              />
            </svg>
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Ordinal badge + label */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#fff",
                  background: ac.bg,
                  borderRadius: 99,
                  padding: "2px 9px",
                  letterSpacing: "0.01em",
                  animation: "tct-count-bump 0.4s 0.1s ease-out both",
                  flexShrink: 0,
                }}
              >
                Task Completed ✓
              </span>
              {total && (
                <span
                  style={{
                    fontSize: 11,
                    color: isDark ? "rgba(255,255,255,0.35)" : "#94a3b8",
                    fontWeight: 500,
                  }}
                >
                  {count} of {total} done today
                </span>
              )}
            </div>

            {/* Motivational message */}
            <p
              style={{
                margin: 0,
                fontSize: 13,
                fontWeight: 500,
                color: isDark ? "rgba(255,255,255,0.78)" : "#1e293b",
                lineHeight: 1.5,
                animation: "tct-msg-in 0.35s 0.18s ease-out both",
              }}
            >
              {message}
            </p>
          </div>

          {/* Close button */}
          <button
            className="tct-close-btn"
            onClick={() => {
              clearTimeout(timerRef.current);
              setPhase("out");
              setTimeout(() => onClose?.(), 340);
            }}
            style={{
              flexShrink: 0,
              width: 26,
              height: 26,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.45,
              transition: "opacity 0.15s, background 0.15s",
              padding: 0,
              marginTop: 1,
            }}
            aria-label="Dismiss"
          >
            <svg viewBox="0 0 10 10" width="10" height="10" fill="none">
              <path
                d="M1 1l8 8M9 1L1 9"
                stroke={isDark ? "#fff" : "#475569"}
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        {/* ── Auto-dismiss timer bar ── */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 3,
            background: isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(13,148,136,0.1)",
          }}
        >
          <div
            className="tct-timer-bar"
            style={{
              height: "100%",
              background: `linear-gradient(90deg, ${ac.bg}, ${ac.timer})`,
              borderRadius: 99,
              animation: `tct-timer ${duration}ms linear forwards`,
              transformOrigin: "left",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default TaskCompletionToast;
