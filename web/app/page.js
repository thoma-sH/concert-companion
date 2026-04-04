"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    } catch (err) {
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
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      // Use BarcodeDetector if available
      if ("BarcodeDetector" in window) {
        const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
        detector.detect(canvas).then((codes) => {
          if (codes.length > 0) {
            const value = codes[0].rawValue;
            stopScan();
            // Navigate to livefeed with optional query param from QR
            router.push(`/livefeed?feed=${encodeURIComponent(value)}`);
          } else {
            requestAnimationFrame(tick);
          }
        });
      } else {
        // Fallback: just navigate after a short demo delay
        setTimeout(() => {
          stopScan();
          router.push("/UserOnboarding");
        }, 3000);
      }
    };
    requestAnimationFrame(tick);
  };

  useEffect(() => {
    return () => stopScan();
  }, []);

  return (
    <div style={styles.page}>
      {/* Background texture */}
      <div style={styles.noiseBg} aria-hidden="true" />

      {/* Hero */}
      <header style={styles.header}>
        <span style={styles.badge}>LIVE</span>
        <p style={styles.subtitle}>
          Scan your ticket QR code to enter a live concert stream — no app needed.
        </p>
      </header>

      {/* CTA card */}
      <main style={styles.main}>
        {!scanning ? (
          <div style={styles.card}>
            <div style={styles.iconRing}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3v3M21 14v2" />
              </svg>
            </div>
            <h2 style={styles.cardTitle}>Join Concert</h2>
            <p style={styles.cardDesc}>
              Point your camera at the QR code on your ticket or event screen to enter instantly.
            </p>
            {error && <p style={styles.errorMsg}>{error}</p>}
            <button style={styles.btn} onClick={startScan}>
              Open Camera &amp; Scan
            </button>
            <div style={styles.divider}>
              <span style={styles.dividerLine} />
              <span style={styles.dividerText}>or</span>
              <span style={styles.dividerLine} />
            </div>
            <button style={styles.btnOutline} onClick={() => router.push("/onboard_page")}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v8M8 12h8" />
              </svg>
              Create Concert
            </button>
          </div>
        ) : (
          <div style={styles.scannerCard}>
            <div style={styles.scannerFrame}>
              <video
                ref={videoRef}
                style={styles.video}
                muted
                playsInline
              />
              <div style={styles.scanCornerTL} />
              <div style={styles.scanCornerTR} />
              <div style={styles.scanCornerBL} />
              <div style={styles.scanCornerBR} />
              <div style={styles.scanLine} />
            </div>
            <p style={styles.scanHint}>Align QR code within the frame</p>
            <button style={styles.cancelBtn} onClick={stopScan}>
              Cancel
            </button>
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span style={styles.footerText}>Concert Companion &mdash; Live Concert Platform</span>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:ital,wght@0,300;0,400;1,300&display=swap');

        @keyframes scanMove {
          0%, 100% { top: 12px; }
          50% { top: calc(100% - 14px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#050d1a",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "48px 24px 32px",
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  noiseBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(ellipse 90% 55% at 50% 0%, #0a1f3d 0%, transparent 70%),
      radial-gradient(ellipse 60% 40% at 85% 85%, #071628 0%, transparent 60%),
      radial-gradient(ellipse 40% 30% at 10% 70%, #0c2240 0%, transparent 55%)`,
    zIndex: 0,
    pointerEvents: "none",
  },
  header: {
    textAlign: "center",
    zIndex: 1,
    animation: "fadeUp 0.7s ease both",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    background: "rgba(56, 182, 255, 0.12)",
    border: "0.5px solid rgba(56, 182, 255, 0.35)",
    color: "#38b6ff",
    fontSize: "11px",
    fontWeight: 600,
    letterSpacing: "0.15em",
    padding: "5px 14px",
    borderRadius: "100px",
    marginBottom: "20px",
    animation: "pulse 2s ease infinite",
  },
  subtitle: {
    color: "rgba(180, 210, 240, 0.55)",
    fontSize: "15px",
    fontWeight: 300,
    maxWidth: "320px",
    margin: "0 auto",
    lineHeight: 1.6,
    letterSpacing: "0.01em",
  },
  main: {
    zIndex: 1,
    width: "100%",
    maxWidth: "380px",
    animation: "fadeUp 0.7s 0.15s ease both",
    opacity: 0,
  },
  card: {
    background: "rgba(56, 182, 255, 0.04)",
    border: "0.5px solid rgba(56, 182, 255, 0.15)",
    borderRadius: "20px",
    padding: "36px 32px",
    textAlign: "center",
    backdropFilter: "blur(16px)",
  },
  iconRing: {
    width: "64px",
    height: "64px",
    borderRadius: "50%",
    border: "0.5px solid rgba(56, 182, 255, 0.3)",
    background: "rgba(56, 182, 255, 0.08)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
    color: "#38b6ff",
  },
  cardTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "32px",
    color: "#e0f0ff",
    margin: "0 0 10px",
    letterSpacing: "0.04em",
  },
  cardDesc: {
    color: "rgba(180, 210, 240, 0.5)",
    fontSize: "14px",
    lineHeight: 1.65,
    margin: "0 0 28px",
    fontWeight: 300,
  },
  errorMsg: {
    color: "#60a8d4",
    fontSize: "13px",
    marginBottom: "16px",
  },
  btn: {
    width: "100%",
    padding: "14px 24px",
    background: "#38b6ff",
    color: "#050d1a",
    border: "none",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    letterSpacing: "0.02em",
    transition: "opacity 0.2s, transform 0.15s",
  },
  scannerCard: {
    background: "rgba(56, 182, 255, 0.04)",
    border: "0.5px solid rgba(56, 182, 255, 0.15)",
    borderRadius: "20px",
    padding: "24px",
    textAlign: "center",
    backdropFilter: "blur(16px)",
  },
  scannerFrame: {
    position: "relative",
    width: "100%",
    aspectRatio: "1",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#020a14",
  },
  video: {
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  scanCornerTL: {
    position: "absolute", top: 10, left: 10, width: 24, height: 24,
    borderTop: "2px solid #38b6ff", borderLeft: "2px solid #38b6ff", borderRadius: "4px 0 0 0",
  },
  scanCornerTR: {
    position: "absolute", top: 10, right: 10, width: 24, height: 24,
    borderTop: "2px solid #38b6ff", borderRight: "2px solid #38b6ff", borderRadius: "0 4px 0 0",
  },
  scanCornerBL: {
    position: "absolute", bottom: 10, left: 10, width: 24, height: 24,
    borderBottom: "2px solid #38b6ff", borderLeft: "2px solid #38b6ff", borderRadius: "0 0 0 4px",
  },
  scanCornerBR: {
    position: "absolute", bottom: 10, right: 10, width: 24, height: 24,
    borderBottom: "2px solid #38b6ff", borderRight: "2px solid #38b6ff", borderRadius: "0 0 4px 0",
  },
  scanLine: {
    position: "absolute", left: 12, right: 12, height: "2px",
    background: "rgba(56, 182, 255, 0.7)",
    animation: "scanMove 2s linear infinite",
  },
  scanHint: {
    color: "rgba(180, 210, 240, 0.4)",
    fontSize: "13px",
    margin: "16px 0 20px",
    fontWeight: 300,
  },
  cancelBtn: {
    background: "transparent",
    border: "0.5px solid rgba(56, 182, 255, 0.2)",
    color: "rgba(180, 210, 240, 0.6)",
    borderRadius: "10px",
    padding: "10px 24px",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    width: "100%",
  },
  divider: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    margin: "16px 0",
  },
  dividerLine: {
    flex: 1,
    height: "0.5px",
    background: "rgba(56, 182, 255, 0.15)",
  },
  dividerText: {
    color: "rgba(180, 210, 240, 0.3)",
    fontSize: "12px",
    fontWeight: 300,
    letterSpacing: "0.06em",
  },
  btnOutline: {
    width: "100%",
    padding: "13px 24px",
    background: "transparent",
    color: "#38b6ff",
    border: "0.5px solid rgba(56, 182, 255, 0.4)",
    borderRadius: "12px",
    fontSize: "15px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    letterSpacing: "0.06em",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    transition: "background 0.2s, border-color 0.2s",
  },
  footer: {
    zIndex: 1,
  },
  footerText: {
    color: "rgba(56, 182, 255, 0.2)",
    fontSize: "11px",
    letterSpacing: "0.12em",
    fontWeight: 300,
  },
};
