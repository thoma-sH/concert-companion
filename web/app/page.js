"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConsoleShell from "./components/ConsoleShell";

export default function Home() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const router = useRouter();

  const startScan = async () => {
    setError("");
    setScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      scanQRCode();
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
      setScanning(false);
    }
  };

  const stopScan = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setScanning(false);
    setError("");
  };

  const scanQRCode = () => {
    const tick = () => {
      if (!videoRef.current || videoRef.current.readyState !== videoRef.current.HAVE_ENOUGH_DATA) {
        requestAnimationFrame(tick);
        return;
      }
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(canvas).then((codes) => {
          if (codes.length > 0) {
            const value = codes[0].rawValue;
            stopScan();
            router.push(`/livefeed?feed=${encodeURIComponent(value)}`);
          } else {
            requestAnimationFrame(tick);
          }
        });
      } else {
        setTimeout(() => {
          stopScan();
          router.push("/UserOnboarding");
        }, 3000);
      }
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => () => stopScan(), []);

  return (
    <ConsoleShell>
      <section className="cc-hero">
        <div className="cc-hero__status">Status: Online</div>
        <h1 className="cc-hero__title">Welcome to Concert Companion</h1>
        <p className="cc-hero__sub">
          Manage venues, concerts, attendees, and live light shows — all in one console.
        </p>
      </section>

      <div className="cc-stat-grid">
        <Stat icon="people" num="31" label="Artists"   sub="Total registered artists" />
        <Stat icon="music"  num="6"  label="Concerts"  sub="Total scheduled concerts" />
        <Stat icon="user"   num="17" label="Customers" sub="Total registered customers" />
        <Stat icon="ticket" num="44" label="Tickets Sold" sub="Total tickets purchased" />
      </div>

      <div className="cc-panel-grid">
        <div className="cc-panel">
          <div className="cc-panel__head">Quick Actions</div>
          <div className="cc-panel__body">
            <button className="cc-action" onClick={startScan}>
              <span className="cc-action__marker">+</span>
              Scan Ticket QR
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={() => router.push("/UserOnboarding")}>
              <span className="cc-action__marker">+</span>
              Join as Attendee
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={() => router.push("/onboard_page")}>
              <span className="cc-action__marker">+</span>
              Create Venue Account
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={() => router.push("/dashboard")}>
              <span className="cc-action__marker">+</span>
              Open Venue Dashboard
              <span className="cc-action__chev">›</span>
            </button>
          </div>
        </div>

        <div className="cc-panel">
          <div className="cc-panel__head">Live Reports</div>
          <div className="cc-panel__body">
            <button className="cc-action" onClick={() => router.push("/dashboard")}>
              <span className="cc-action__marker">›</span>
              View My Concerts
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={() => router.push("/livefeed")}>
              <span className="cc-action__marker">›</span>
              Open Live Feed
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={() => router.push("/manage")}>
              <span className="cc-action__marker">›</span>
              Manage Live Room
              <span className="cc-action__chev">›</span>
            </button>
            <button className="cc-action" onClick={startScan}>
              <span className="cc-action__marker">›</span>
              Open Camera Scanner
              <span className="cc-action__chev">›</span>
            </button>
          </div>
        </div>
      </div>

      {scanning && (
        <div className="cc-panel" style={{ marginBottom: 20 }}>
          <div className="cc-panel__head">Live Scanner</div>
          <div className="cc-panel__body" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            <div className="cc-scan-frame" style={{ flex: "0 0 320px", maxWidth: 320 }}>
              <video ref={videoRef} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <div className="cc-scan-corner tl" />
              <div className="cc-scan-corner tr" />
              <div className="cc-scan-corner bl" />
              <div className="cc-scan-corner br" />
              <div className="cc-scan-line" />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p className="cc-label" style={{ marginBottom: 14 }}>► Awaiting QR Code</p>
              <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 18 }}>
                Align your ticket QR within the frame. The scanner runs continuously until a valid code is detected.
              </p>
              <button className="cc-btn cc-btn--ghost" onClick={stopScan}>Cancel Scan</button>
            </div>
          </div>
          {error && (
            <div className="cc-feedback cc-feedback--err" style={{ margin: 16 }}>
              <span className="cc-feedback__tag">[ ERR ]</span>{error}
            </div>
          )}
        </div>
      )}
    </ConsoleShell>
  );
}

function Stat({ icon, num, label, sub }) {
  return (
    <div className="cc-stat">
      <Icon name={icon} />
      <div className="cc-stat__num">{num}</div>
      <div className="cc-stat__label">{label}</div>
      <div className="cc-stat__sub">{sub}</div>
    </div>
  );
}

function Icon({ name }) {
  const props = {
    width: 16, height: 16, viewBox: "0 0 24 24",
    fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
    className: "cc-stat__icon",
  };
  switch (name) {
    case "music":
      return (<svg {...props}><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>);
    case "user":
      return (<svg {...props}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></svg>);
    case "ticket":
      return (<svg {...props}><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>);
    case "people":
    default:
      return (<svg {...props}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.5" /><path d="M3 20c0-3 3-5 6-5s6 2 6 5" /><path d="M15 20c0-2 2-4 5-4" /></svg>);
  }
}
