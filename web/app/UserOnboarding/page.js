"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Marquee from "../components/Marquee";

function UserOnboardingInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const concertId = searchParams.get("concertId");

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submitPhone(e) {
    e.preventDefault();
    setError("");
    if (!phone.trim()) { setError("Phone number is required."); return; }
    if (!/^\+?[\d\s\-().]{7,15}$/.test(phone.trim())) {
      setError("Enter a valid phone number."); return;
    }
    if (!concertId) { setError("No concert found. Please scan the QR code again."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim(), concertId }),
      });
      const data = await res.json();
      if (data.success) {
        router.push(`/livefeed?concertId=${concertId}`);
      } else {
        setStep("username");
      }
    } catch {
      setStep("username");
    } finally {
      setLoading(false);
    }
  }

  async function submitUsername(e) {
    e.preventDefault();
    setError("");
    if (!username.trim()) { setError("Username is required."); return; }
    setLoading(true);

    try {
      const regRes = await fetch("/api/user/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim(), screenName: username.trim(), concertId }),
      });
      const regData = await regRes.json();
      if (!regData.success) {
        setError(regData.error || "Registration failed.");
        setLoading(false);
        return;
      }

      const loginRes = await fetch("/api/user/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phone.trim(), concertId }),
      });
      const loginData = await loginRes.json();
      if (loginData.success) router.push(`/livefeed?concertId=${concertId}`);
      else setError("Registered but login failed. Try again.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="cc-page">
      <Marquee prefix="ATTENDEE GATE" />
      <main className="cc-page__main">
        <div style={{ marginBottom: 24, textAlign: "center" }}>
          <span className="cc-pill"><span className="cc-pill__dot" />LIVE</span>
        </div>
        <p className="cc-mono" style={{
          color: "var(--text-muted)", fontSize: 11, letterSpacing: "0.18em",
          textTransform: "uppercase", marginBottom: 24, textAlign: "center",
        }}>
          {step === "phone" ? "► Enter number to join the concert" : "► Pick a username"}
        </p>

        <div className="cc-card">
          <h1 className="cc-h2" style={{ marginBottom: 6 }}>
            {step === "phone" ? "Join Concert" : "Pick a Username"}
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 13, marginBottom: 24 }}>
            {step === "phone"
              ? "We'll check if you're already registered for this event."
              : "Your number wasn't found. Choose a display name for the feed."}
          </p>

          {step === "phone" && (
            <form onSubmit={submitPhone}>
              <div className="cc-field">
                <label className="cc-field__label">Phone Number</label>
                <input
                  type="tel"
                  className="cc-input"
                  placeholder="+1 555 000 0000"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(""); }}
                  autoFocus
                />
              </div>
              {error && (
                <div className="cc-feedback cc-feedback--err">
                  <span className="cc-feedback__tag">[ ERR ]</span>{error.toUpperCase()}
                </div>
              )}
              <button type="submit" className="cc-btn cc-btn--block" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? "Checking…" : "Continue"}
              </button>
            </form>
          )}

          {step === "username" && (
            <form onSubmit={submitUsername}>
              <div className="cc-field">
                <label className="cc-field__label">Username</label>
                <input
                  type="text"
                  className="cc-input"
                  placeholder="how you'll appear in the feed"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(""); }}
                  autoFocus
                />
              </div>
              {error && (
                <div className="cc-feedback cc-feedback--err">
                  <span className="cc-feedback__tag">[ ERR ]</span>{error.toUpperCase()}
                </div>
              )}
              <button type="submit" className="cc-btn cc-btn--block" disabled={loading} style={{ marginTop: 8 }}>
                {loading ? "Joining…" : "Join Feed"}
              </button>
              <button
                type="button"
                onClick={() => { setStep("phone"); setError(""); }}
                className="cc-back"
                style={{ marginTop: 16, marginBottom: 0, display: "block", textAlign: "center", width: "100%" }}
              >
                ← Use a different number
              </button>
            </form>
          )}
        </div>

        <p className="cc-mono" style={{
          marginTop: 28, fontSize: 9, color: "var(--text-dim)",
          letterSpacing: "0.22em", textTransform: "uppercase",
        }}>
          Concert Companion · Live Concert Platform
        </p>
      </main>
    </div>
  );
}

export default function UserOnboarding() {
  return (
    <Suspense>
      <UserOnboardingInner />
    </Suspense>
  );
}
