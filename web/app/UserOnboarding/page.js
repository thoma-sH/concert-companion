"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Step 1 — user enters their phone number
// Step 2 — only shown if the phone is NOT in the DB, asks for a username
// After step 2 (or step 1 if phone already exists) → redirect to /livefeed

export default function UserOnboarding() {
  const router = useRouter();

  // "phone" = step 1, "username" = step 2
  const [step, setStep] = useState("phone");

  const [phone,    setPhone]    = useState("");
  const [username, setUsername] = useState("");
  const [error,    setError]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [visible,  setVisible]  = useState(false);

  // Fade the card in on load
  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);


  // ── Step 1: submit phone number ──────────────────────────
  async function submitPhone(e) {
    e.preventDefault();
    setError("");

    // Basic format check before hitting the API
    if (!phone.trim()) { setError("Phone number is required."); return; }
    if (!/^\+?[\d\s\-().]{7,15}$/.test(phone.trim())) {
      setError("Enter a valid phone number.");
      return;
    }

    setLoading(true);
    try {
      // Ask the API: does this phone already have a username in the DB?
      const res  = await fetch(`/api/check-phone?phone=${encodeURIComponent(phone.trim())}`);
      const data = await res.json();

      if (data.username) {
        // Phone found — save and go straight to the feed
        localStorage.setItem("concert_user", JSON.stringify({ username: data.username, phone: phone.trim() }));
        router.push("/livefeed");
      } else {
        // Phone not found — ask them to pick a username
        setStep("username");
      }
    } catch {
      // API not built yet — fall through to username step so the app stays usable
      setStep("username");
    } finally {
      setLoading(false);
    }
  }


  // ── Step 2: submit username (new user) ───────────────────
  function submitUsername(e) {
    e.preventDefault();
    setError("");

    if (!username.trim()) { setError("Username is required."); return; }

    // Save both to localStorage and head to the feed
    localStorage.setItem("concert_user", JSON.stringify({ username: username.trim(), phone: phone.trim() }));
    router.push("/livefeed");
  }


  // ── Shared card wrapper (keeps the animated fade-in) ─────
  const cardStyle = {
    ...styles.card,
    opacity:   visible ? 1 : 0,
    transform: visible ? "translateY(0)" : "translateY(16px)",
    transition: "opacity 0.7s ease, transform 0.7s ease",
  };

  return (
    <div style={styles.page}>
      <div style={styles.glowLeft} />
      <div style={styles.glowRight} />

      <div style={styles.liveBadge}>LIVE</div>
      <p style={styles.tagline}>
        {step === "phone"
          ? "Enter your number to join a live concert stream."
          : "One more step — pick a username for the feed."}
      </p>

      <main style={cardStyle}>
        {/* Icon */}
        <div style={styles.iconCircle}>
          <svg width="28" height="28" fill="none" stroke="#00d4ff" strokeWidth="1.8" viewBox="0 0 24 24">
            {step === "phone" ? (
              // Phone icon
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24 11.47 11.47 0 003.58.57 1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.25 1.02l-2.2 2.2z" />
            ) : (
              // Person icon
              <>
                <circle cx="12" cy="8" r="4" />
                <path strokeLinecap="round" d="M4 20c0-4 3.58-7 8-7s8 3 8 7" />
              </>
            )}
          </svg>
        </div>

        <h1 style={styles.title}>{step === "phone" ? "JOIN CONCERT" : "PICK A USERNAME"}</h1>
        <p style={styles.subtitle}>
          {step === "phone"
            ? "We'll check if you're already registered."
            : "Your phone number wasn't found. Choose a name to show up in the feed."}
        </p>

        {/* ── Step 1 form ── */}
        {step === "phone" && (
          <form onSubmit={submitPhone} style={styles.form}>
            <div style={styles.fieldWrap}>
              <input
                type="tel"
                placeholder="Phone number (e.g. +1 555 000 0000)"
                value={phone}
                onChange={e => { setPhone(e.target.value); setError(""); }}
                style={{ ...styles.input, borderColor: error ? "#ff4444" : "rgba(0,212,255,0.2)" }}
                autoFocus
              />
              {error && <p style={styles.error}>{error}</p>}
            </div>
            <button type="submit" style={styles.primaryBtn} disabled={loading}>
              {loading ? "Checking..." : "Continue"}
            </button>
          </form>
        )}

        {/* ── Step 2 form ── */}
        {step === "username" && (
          <form onSubmit={submitUsername} style={styles.form}>
            <div style={styles.fieldWrap}>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={e => { setUsername(e.target.value); setError(""); }}
                style={{ ...styles.input, borderColor: error ? "#ff4444" : "rgba(0,212,255,0.2)" }}
                autoFocus
              />
              {error && <p style={styles.error}>{error}</p>}
            </div>
            <button type="submit" style={styles.primaryBtn}>
              Join Feed
            </button>
            {/* Let them go back and fix their number */}
            <button type="button" style={styles.backBtn} onClick={() => { setStep("phone"); setError(""); }}>
              ← Use a different number
            </button>
          </form>
        )}
      </main>

      <p style={styles.footer}>Concert Companion — Live Concert Platform</p>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "radial-gradient(ellipse at 20% 50%, #0a1628 0%, #050d1a 60%, #020810 100%)",
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "24px 16px", position: "relative", overflow: "hidden",
  },
  glowLeft: {
    position: "absolute", top: "30%", left: "-10%", width: 300, height: 300,
    borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(0,100,200,0.25) 0%, transparent 70%)",
  },
  glowRight: {
    position: "absolute", bottom: "20%", right: "-5%", width: 200, height: 200,
    borderRadius: "50%", pointerEvents: "none",
    background: "radial-gradient(circle, rgba(0,180,220,0.15) 0%, transparent 70%)",
  },
  liveBadge: {
    border: "1px solid rgba(0,212,255,0.4)", color: "rgba(0,212,255,0.8)",
    fontSize: 11, fontWeight: 700, letterSpacing: 2,
    padding: "5px 16px", borderRadius: 999, marginBottom: 16, zIndex: 1,
  },
  tagline: {
    color: "rgba(180,210,240,0.6)", fontSize: 14, textAlign: "center",
    maxWidth: 340, lineHeight: 1.6, marginBottom: 32, zIndex: 1,
  },
  card: {
    background: "rgba(8, 20, 45, 0.85)", border: "1px solid rgba(0,212,255,0.15)",
    borderRadius: 20, padding: "36px 32px", width: "100%", maxWidth: 400,
    display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
    boxShadow: "0 0 60px rgba(0,100,200,0.15)", zIndex: 1,
  },
  iconCircle: {
    width: 60, height: 60, borderRadius: "50%",
    background: "rgba(0,212,255,0.08)", border: "1px solid rgba(0,212,255,0.2)",
    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  title: { fontSize: 26, fontWeight: 800, letterSpacing: 2, color: "#fff", textAlign: "center", margin: 0 },
  subtitle: { fontSize: 13, color: "rgba(180,210,240,0.55)", textAlign: "center", lineHeight: 1.6, margin: 0 },
  form: { width: "100%", display: "flex", flexDirection: "column", gap: 12, marginTop: 8 },
  fieldWrap: { display: "flex", flexDirection: "column", gap: 4 },
  input: {
    width: "100%", height: 48, background: "rgba(0,20,50,0.6)",
    border: "1px solid rgba(0,212,255,0.2)", borderRadius: 12,
    padding: "0 16px", fontSize: 14, color: "#fff", outline: "none",
    boxSizing: "border-box", fontFamily: "inherit",
  },
  error: { fontSize: 12, color: "#ff6b6b", margin: 0 },
  primaryBtn: {
    width: "100%", height: 52, background: "#00d4ff", border: "none",
    borderRadius: 12, fontSize: 15, fontWeight: 700, color: "#050d1a",
    cursor: "pointer", marginTop: 4, letterSpacing: 0.3,
  },
  backBtn: {
    background: "none", border: "none", color: "rgba(180,210,240,0.45)",
    fontSize: 13, cursor: "pointer", textAlign: "center", padding: "4px 0",
  },
  footer: { marginTop: 32, fontSize: 12, color: "rgba(180,210,240,0.25)", zIndex: 1 },
};
