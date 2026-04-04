"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserOnboarding() {
  const router = useRouter();

  const [form, setForm] = useState({ username: "", phone: "" });
  const [errors, setErrors] = useState({});
  const [visible, setVisible] = useState(false);

  // Fade the card in on load
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Username is always required.
  // Phone is optional — only validated if the user actually typed something.
  function validate() {
    const errs = {};

    if (!form.username.trim()) {
      errs.username = "Username is required.";
    }

    const phone = form.phone.trim();
    if (phone) {
      // Only check format if they typed something
      if (!/^\+?[\d\s\-().]{7,15}$/.test(phone)) {
        errs.phone = "Enter a valid phone number.";
      } else {
        const digits = phone.replace(/\D/g, "");
        const allSame = digits.split("").every(d => d === digits[0]);
        const ascending = "0123456789";
        const descending = "9876543210";
        if (allSame || ascending.includes(digits) || descending.includes(digits)) {
          errs.phone = "Enter a real phone number.";
        }
      }
    }

    return errs;
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});

    // Save user info so the feed page can read it
    localStorage.setItem("concert_user", JSON.stringify({
      username: form.username.trim(),
      phone: form.phone.trim() || null,
    }));

    router.push("/livefeed");
  }

  return (
    <div style={styles.page}>
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      <div style={styles.liveBadge}>LIVE</div>
      <p style={styles.tagline}>
        Enter your info to join a live concert stream — no app needed.
      </p>

      <main
        style={{
          ...styles.card,
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.7s ease, transform 0.7s ease",
        }}
      >
        <div style={styles.iconCircle}>
          <svg width="28" height="28" fill="none" stroke="#00d4ff" strokeWidth="1.8" viewBox="0 0 24 24">
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="3" height="3" rx="0.5" />
            <rect x="19" y="14" width="2" height="2" rx="0.5" />
            <rect x="14" y="19" width="2" height="2" rx="0.5" />
            <rect x="18" y="19" width="3" height="2" rx="0.5" />
          </svg>
        </div>

        <h1 style={styles.title}>JOIN CONCERT</h1>
        <p style={styles.subtitle}>
          Enter your username to jump in. Add your number if you haven&apos;t yet.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>

          {/* Username — required */}
          <div style={styles.fieldWrap}>
            <input
              id="username"
              type="text"
              placeholder="Username"
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              style={{
                ...styles.input,
                borderColor: errors.username ? "#ff4444" : "rgba(0,212,255,0.2)",
              }}
            />
            {errors.username && <p style={styles.error}>{errors.username}</p>}
          </div>

          {/* Phone — optional, only validated if filled in */}
          <div style={styles.fieldWrap}>
            <input
              id="phone"
              type="tel"
              placeholder="Phone number (optional)"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              style={{
                ...styles.input,
                borderColor: errors.phone ? "#ff4444" : "rgba(0,212,255,0.2)",
              }}
            />
            {errors.phone
              ? <p style={styles.error}>{errors.phone}</p>
              : <p style={styles.hint}>Only required if you haven&apos;t registered your number yet</p>
            }
          </div>

          <button type="submit" style={styles.primaryBtn}>
            Open Camera &amp; Scan
          </button>

          <div style={styles.divider}><span style={styles.dividerText}>or</span></div>

          <button type="button" style={styles.secondaryBtn}>
            ⊕ &nbsp;Create Concert
          </button>

        </form>
      </main>

      <p style={styles.footer}>Concert Companion — Live Concert Platform</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 20% 50%, #0a1628 0%, #050d1a 60%, #020810 100%)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "24px 16px",
    position: "relative",
    overflow: "hidden",
  },
  glowLeft: {
    position: "absolute",
    top: "30%",
    left: "-10%",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,100,200,0.25) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  glowRight: {
    position: "absolute",
    bottom: "20%",
    right: "-5%",
    width: 200,
    height: 200,
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(0,180,220,0.15) 0%, transparent 70%)",
    pointerEvents: "none",
  },
  liveBadge: {
    border: "1px solid rgba(0,212,255,0.4)",
    color: "rgba(0,212,255,0.8)",
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: 2,
    padding: "5px 16px",
    borderRadius: 999,
    marginBottom: 16,
    zIndex: 1,
  },
  tagline: {
    color: "rgba(180,210,240,0.6)",
    fontSize: 14,
    textAlign: "center",
    maxWidth: 340,
    lineHeight: 1.6,
    marginBottom: 32,
    zIndex: 1,
  },
  card: {
    background: "rgba(8, 20, 45, 0.85)",
    border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: 20,
    padding: "36px 32px",
    width: "100%",
    maxWidth: 400,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
    boxShadow: "0 0 60px rgba(0,100,200,0.15)",
    zIndex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: "50%",
    background: "rgba(0,212,255,0.08)",
    border: "1px solid rgba(0,212,255,0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 800,
    letterSpacing: 2,
    color: "#ffffff",
    textAlign: "center",
    margin: 0,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(180,210,240,0.55)",
    textAlign: "center",
    lineHeight: 1.6,
    margin: 0,
  },
  form: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginTop: 8,
  },
  fieldWrap: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
  },
  input: {
    width: "100%",
    height: 48,
    background: "rgba(0,20,50,0.6)",
    border: "1px solid rgba(0,212,255,0.2)",
    borderRadius: 12,
    padding: "0 16px",
    fontSize: 14,
    color: "#fff",
    outline: "none",
    boxSizing: "border-box",
    fontFamily: "inherit",
  },
  error: {
    fontSize: 12,
    color: "#ff6b6b",
    margin: 0,
  },
  hint: {
    fontSize: 11,
    color: "rgba(180,210,240,0.35)",
    margin: 0,
  },
  primaryBtn: {
    width: "100%",
    height: 52,
    background: "#00d4ff",
    border: "none",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    color: "#050d1a",
    cursor: "pointer",
    marginTop: 4,
    letterSpacing: 0.3,
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  dividerText: {
    color: "rgba(180,210,240,0.3)",
    fontSize: 13,
    width: "100%",
    textAlign: "center",
  },
  secondaryBtn: {
    width: "100%",
    height: 52,
    background: "transparent",
    border: "1px solid rgba(0,212,255,0.25)",
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 600,
    color: "rgba(180,210,240,0.8)",
    cursor: "pointer",
    letterSpacing: 0.3,
    fontFamily: "inherit",
  },
  footer: {
    marginTop: 32,
    fontSize: 12,
    color: "rgba(180,210,240,0.25)",
    zIndex: 1,
  },
};
