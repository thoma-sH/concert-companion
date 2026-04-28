// app/onboard_page/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConsoleShell from "../components/ConsoleShell";

export default function OnboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signup");
  const [email, setEmail] = useState("");
  const [venueName, setVenueName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (activeTab === "signup") {
      if (!email.includes("@")) { setError("Valid email required"); setLoading(false); return; }
      if (password.length < 6)  { setError("Password must be at least 6 characters"); setLoading(false); return; }
      if (password !== confirmPassword) { setError("Passwords don't match"); setLoading(false); return; }
    } else {
      if (!email.includes("@") || password.length === 0) {
        setError("Email and password required"); setLoading(false); return;
      }
    }

    if (activeTab === "signup") {
      const res = await fetch("/api/venue/register", {
        method: "POST",
        body: JSON.stringify({ email, password, venueName }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error);
        setLoading(false);
      } else {
        setError(""); setSuccess(true); setLoading(false);
      }
    } else {
      const res = await fetch("/api/venue/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error); setLoading(false);
      } else {
        router.push("/dashboard");
      }
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError(""); setEmail(""); setPassword(""); setConfirmPassword(""); setSuccess(false);
  };

  return (
    <ConsoleShell>
      <button onClick={() => router.push("/")} className="cc-back">← Back to Home</button>

      <h1 className="cc-h1" style={{ marginBottom: 6 }}>
        {activeTab === "signup" ? "Create Venue Account" : "Venue Sign In"}
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: 14, marginBottom: 28 }}>
        {activeTab === "signup"
          ? "Register a new venue to schedule concerts and broadcast live experiences."
          : "Authenticate into the venue console to manage concerts and live rooms."}
      </p>

      <div className="cc-panel" style={{ maxWidth: 560 }}>
        <div className="cc-panel__head" style={{ display: "flex", padding: 0, borderBottom: "1px solid var(--border)" }}>
          <TabBtn active={activeTab === "signup"} onClick={() => switchTab("signup")}>+ Sign Up</TabBtn>
          <TabBtn active={activeTab === "login"}  onClick={() => switchTab("login")}>+ Log In</TabBtn>
        </div>

        <div className="cc-panel__body">
          <form onSubmit={handleSubmit}>
            <div className="cc-field">
              <label className="cc-field__label">Email</label>
              <input
                type="email" className="cc-input"
                value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>

            <div className="cc-field">
              <label className="cc-field__label">Password</label>
              <input
                type="password" className="cc-input"
                value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>

            {activeTab === "signup" && (
              <>
                <div className="cc-field">
                  <label className="cc-field__label">Confirm Password</label>
                  <input
                    type="password" className="cc-input"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required
                  />
                </div>
                <div className="cc-field">
                  <label className="cc-field__label">Venue Name</label>
                  <input
                    className="cc-input"
                    value={venueName} onChange={(e) => setVenueName(e.target.value)} required
                  />
                </div>
              </>
            )}

            {activeTab === "login" && (
              <div style={{ textAlign: "right", marginTop: -8, marginBottom: 14 }}>
                <button
                  type="button"
                  onClick={() => alert("Reset link sent (demo)")}
                  className="cc-mono"
                  style={{
                    background: "none", border: "none", color: "var(--text-muted)",
                    fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", cursor: "pointer",
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            <button type="submit" className="cc-btn cc-btn--block" disabled={loading}>
              {loading ? "Processing…" : activeTab === "signup" ? "Sign Up" : "Log In"}
            </button>

            {error && (
              <div className="cc-feedback cc-feedback--err">
                <span className="cc-feedback__tag">[ ERR ]</span>{error.toUpperCase()}
              </div>
            )}
            {success && (
              <div className="cc-feedback cc-feedback--ok">
                <span className="cc-feedback__tag">[ OK ]</span>ACCOUNT CREATED — YOU CAN NOW LOG IN
              </div>
            )}
          </form>

          <p
            className="cc-mono"
            style={{
              marginTop: 24, color: "var(--text-dim)", fontSize: 10,
              letterSpacing: "0.14em", textTransform: "uppercase", textAlign: "center",
            }}
          >
            By continuing you agree to the Terms & Privacy Policy
          </p>
        </div>
      </div>
    </ConsoleShell>
  );
}

function TabBtn({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        background: active ? "var(--accent-soft)" : "transparent",
        color: active ? "var(--accent)" : "var(--text-muted)",
        border: "none",
        borderRight: "1px solid var(--border)",
        padding: "12px 16px",
        fontFamily: "var(--font-mono)",
        fontSize: 10,
        letterSpacing: "0.18em",
        textTransform: "uppercase",
        cursor: "pointer",
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}
