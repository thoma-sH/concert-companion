"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

const COLORS = [
  "#007EA7", "#2A9D8F", "#005F7F", "#4db8aa",
  "#FF331F", "#cc2010", "#ff6652",
  "#01295F", "#003249", "#00a8cc",
];
const LIGHT_SHOW_COLORS = [
  "#007EA7", "#2A9D8F", "#005F7F", "#4db8aa",
  "#FF331F", "#cc2010", "#01295F", "#00a8cc",
];
const STOP_WORDS = new Set([
  "the", "a", "an", "is", "it", "in", "on", "at", "to", "of", "and", "or", "but",
  "this", "that", "was", "were", "i", "my", "we", "they", "he", "she", "so", "are",
  "for", "with", "not", "its", "be", "has", "had", "have",
]);
const SIMILARITY_THRESHOLD = 0.60;
const ADMIN_NOTES_KEY = "admin_notes";
const ADMIN_NOTE_DURATION = 10 * 60 * 1000;

function tokenize(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter((w) => w && !STOP_WORDS.has(w));
}
function similarity(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  if (!sa.size && !sb.size) return 1;
  const inter = [...sa].filter((w) => sb.has(w)).length;
  return inter / new Set([...sa, ...sb]).size;
}
function safeStr(s) {
  return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function randColor(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export default function ConcertCompanion() {
  const [posts, setPosts] = useState([]);
  const [adminNotes, setAdminNotes] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [lightshowOpen, setLightshowOpen] = useState(false);
  const [lightBg, setLightBg] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [reportInput, setReportInput] = useState("");
  const [dismissedPins, setDismissedPins] = useState([]);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const [lightEffect, setLightEffect] = useState("solid");
  const [lightBaseColor, setLightBaseColor] = useState("#007EA7");

  const nextId = useRef(10);
  const reportBuckets = useRef([]);
  const lightInterval = useRef(null);
  const animationFrameId = useRef(null);
  const cameraStream = useRef(null);
  const videoRef = useRef(null);
  const msgRef = useRef(null);
  const rptRef = useRef(null);
  const feedRef = useRef(null);
  const isUserScrolledUp = useRef(false);
  const lastSeenCount = useRef(0);
  const searchParams = useSearchParams();

  function fetchMessages() {
    const concertId = searchParams.get("concertId");
    if (!concertId) return;
    fetch(`/api/chat/get?concertId=${concertId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.data)) {
          setPosts(data.data);
        } else {
          console.error("Invalid messages response", data);
        }
      })
      .catch(err => console.error("Fetch messages error:", err));
  }

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 500);
    return () => clearInterval(interval);
  }, [searchParams]);

  useEffect(() => {
    setTimeout(() => {
      const el = feedRef.current;
      if (!el) return;
      if (!isUserScrolledUp.current) {
        el.scrollTop = el.scrollHeight;
        lastSeenCount.current = posts.length;
        setUnreadCount(0);
      } else {
        const newUnseen = posts.length - lastSeenCount.current;
        setUnreadCount(newUnseen > 0 ? newUnseen : 0);
      }
    }, 0);
  }, [posts]);

  function handleFeedScroll() {
    const el = feedRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    if (atBottom) {
      isUserScrolledUp.current = false;
      lastSeenCount.current = posts.length;
      setUnreadCount(0);
    } else {
      isUserScrolledUp.current = true;
    }
  }

  const visBars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        h: Math.random() * 36 + 12,
        dur: (Math.random() * 0.6 + 0.5).toFixed(2),
        col: randColor(COLORS),
        del: (Math.random() * 0.4).toFixed(2),
      })),
    []
  );

  useEffect(() => { if (composeOpen) setTimeout(() => msgRef.current?.focus(), 50); }, [composeOpen]);
  useEffect(() => { if (reportOpen) setTimeout(() => rptRef.current?.focus(), 50); }, [reportOpen]);

  function uid() { return nextId.current++; }

  function expireBadge(id) {
    setTimeout(
      () => setPosts((p) => p.map((x) => (x.id === id ? { ...x, isNew: false } : x))),
      10_000
    );
  }

  function toggleLike(postId) {
    const post = posts.find(p => p.idChatMessage == postId);
    if (!post) return;
    if (post.hasUpvoted) {
      fetch("/api/chat/unheart", {
        method: "POST",
        body: JSON.stringify({ messageId: postId }),
        headers: { "Content-Type": "application/json" }
      }).catch(err => console.error("Unheart error:", err));
    } else {
      fetch("/api/chat/heart", {
        method: "POST",
        body: JSON.stringify({ messageId: postId }),
        headers: { "Content-Type": "application/json" }
      }).catch(err => console.error("Heart error:", err));
    }
  }

  function submitReport(text) {
    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: "report",
        concertId: searchParams.get("concertId"),
        messageData: text
      })
    }).catch(err => console.error("Report send error:", err));
  }

  function closeCompose() {
    setComposeOpen(false);
    setGifPickerOpen(false);
  }
  function closeReport() { setReportOpen(false); }

  function sendMessage() {
    if (capturedPhoto) {
      sendPhoto();
      return;
    }
    if (!messageInput.trim()) return;
    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: "message",
        concertId: searchParams.get("concertId"),
        messageData: messageInput
      })
    }).catch(err => console.error("Send message error:", err));
    setMessageInput("");
    closeCompose();
  }

  function sendPhoto() {
    if (!capturedPhoto) return;

    const payload = {
      messageType: "image",
      concertId: searchParams.get("concertId"),
      messageData: capturedPhoto
    };

    console.log("Sending photo, payload size:", capturedPhoto.length);

    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
      .then(async res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        console.log("Photo send response:", data);
        if (!data.success) throw new Error(data.error || "Unknown error");
        setCapturedPhoto(null);
        setMessageInput("");
        closeCompose();
      })
      .catch(err => {
        console.error("Failed to send photo:", err);
        alert("Could not send photo. Check console or backend.");
      });
  }

  function removePhoto() {
    setCapturedPhoto(null);
    setTimeout(() => msgRef.current?.focus(), 50);
  }

  function sendReport() {
    const text = reportInput.trim();
    if (!text) return;
    submitReport(text);
    setReportInput("");
    closeReport();
  }

  async function postGif(src) {
    try {
      const res = await fetch("/api/chat/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "gif",
          concertId: searchParams.get("concertId"),
          messageData: src
        })
      });
      if (!res.ok) throw new Error("GIF send failed");
      closeCompose();
    } catch (err) {
      console.error("GIF error:", err);
    }
  }

  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStream.current = stream;
      setCameraOpen(true);
      closeCompose();
    } catch (err) {
      alert("Camera not available: " + err.message);
    }
  }

  function closeCamera() {
    setCameraOpen(false);
    cameraStream.current?.getTracks().forEach((t) => t.stop());
    cameraStream.current = null;
  }

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStream.current) {
      videoRef.current.srcObject = cameraStream.current;
      videoRef.current.play().catch(e => console.warn("autoplay failed", e));
    }
  }, [cameraOpen]);

  function snapPhoto() {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) {
      alert("Camera not ready yet. Please wait a moment.");
      return;
    }
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const photoData = canvas.toDataURL("image/jpeg");
    setCapturedPhoto(photoData);
    closeCamera();
    setComposeOpen(true);
  }

  function pollLightState() {
    const concertId = searchParams.get("concertId");
    if (!concertId) return;
    fetch(`/api/concertState?concertId=${concertId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setLightBaseColor(data.color);
          setLightEffect(data.effect);
        }
      })
      .catch(err => console.error("Light state poll error:", err));
  }

  const startLightAnimation = useCallback(() => {
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    const animate = () => {
      if (!lightshowOpen) return;
      let r, g, b;
      const base = hexToRgb(lightBaseColor);
      if (lightEffect === "breath") {
        const t = (Date.now() / 1000) % 2;
        const intensity = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * Math.PI));
        r = Math.min(255, Math.round(base.r * intensity));
        g = Math.min(255, Math.round(base.g * intensity));
        b = Math.min(255, Math.round(base.b * intensity));
      } else if (lightEffect === "rainbow") {
        const hue = (Date.now() / 30) % 360;
        const rgb = hslToRgb(hue, 100, 50);
        r = rgb.r; g = rgb.g; b = rgb.b;
      } else {
        r = base.r; g = base.g; b = base.b;
      }
      setLightBg(`rgb(${r}, ${g}, ${b})`);
      animationFrameId.current = requestAnimationFrame(animate);
    };
    animate();
  }, [lightEffect, lightBaseColor, lightshowOpen]);

  useEffect(() => {
    if (!lightshowOpen && animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (lightshowOpen) startLightAnimation();
  }, [lightshowOpen, startLightAnimation]);

  useEffect(() => {
    if (lightshowOpen) startLightAnimation();
  }, [lightEffect, lightBaseColor, lightshowOpen, startLightAnimation]);

  function openLightShow() {
    setLightshowOpen(true);
    if (lightInterval.current) clearInterval(lightInterval.current);
    lightInterval.current = setInterval(pollLightState, 500);
    pollLightState();
  }

  function closeLightShow() {
    setLightshowOpen(false);
    if (lightInterval.current) {
      clearInterval(lightInterval.current);
      lightInterval.current = null;
    }
  }

  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [posts]
  );

  return (
    <>
      <style>{STYLES}</style>
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />

      <div className="app">

        <div className="header">
          <div className="header-top">
            <div>
              <div className="attendee-pill">
                <span>Kendrick Lamar</span>
              </div>
              <div className="live-row">
                <span className="live-dot" />
                <span className="live-text">LIVE</span>
                <span className="attendee-count">3,187 here</span>
              </div>
            </div>
            <h1 className="festival-name">Concert Companion</h1>
          </div>

          <div className="visualizer" style={{ cursor: "pointer" }} onClick={openLightShow}>
            {visBars.map((b) => (
              <div
                key={b.id}
                className="vis-bar"
                style={{
                  height: b.h,
                  "--dur": `${b.dur}s`,
                  background: b.col,
                  animationDelay: `${b.del}s`,
                }}
              />
            ))}
          </div>
        </div>

        <div className="feed" ref={feedRef} onScroll={handleFeedScroll}>
          {sortedPosts.map((post) => (
            <div
              key={post.idChatMessage}
              className={[
                "post",
                post.Type == 20 ? "is-report" : "",
                post.pinned ? "pinned" : "",
              ].filter(Boolean).join(" ")}
            >
              <div className="post-body">
                <div className="post-header">
                  <span className="username">{safeStr(post.Username)}</span>
                  <span className="timestamp">{post.Sent}</span>
                </div>

                {(post.Type == 0 || post.Type == 20) && <p className="post-text">{post.Message}</p>}
                {post.Type == 1 && (
                  <img
                    src={post.Message}
                    alt="photo"
                    style={{ width: "70%", borderRadius: 12, margin: "0 auto 10px", display: "block" }}
                  />
                )}
                {post.Type == 4 && (
                  <img
                    src={post.Message}
                    alt="gif"
                    style={{ width: "100%", borderRadius: 12, marginBottom: 10 }}
                  />
                )}

                <div className="post-footer">
                  {post.isReport && (
                    <span className="report-count">
                      {post.reportCount} report{post.reportCount !== 1 ? "s" : ""}
                    </span>
                  )}
                  <button
                    className={`like-btn${post.liked ? " liked" : ""}`}
                    onClick={() => toggleLike(post.idChatMessage)}
                  >
                    <span className="heart">{post.hasUpvoted ? "♥" : "♡"}</span>
                    <span className="like-count">{post.UpvoteCount}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            className="new-messages-pill"
            onClick={() => {
              feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
              lastSeenCount.current = posts.length;
              setUnreadCount(0);
              isUserScrolledUp.current = false;
            }}
          >
            ↓ New messages
          </button>
        )}

        <div className="bottom-bar">
          <button className="lights-btn" onClick={openLightShow}>
            <span className="lights-btn__label">
              join the<br />
              <strong>light show</strong>
            </span>
          </button>

          <div className="smallContainer">
            <button
              className={`nav-btn nav-btn--center${composeOpen ? " open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                closeReport();
                setComposeOpen((o) => !o);
                setGifPickerOpen(false);
              }}
            >
              <span style={{ marginBottom: 5 }}>&#43;</span>
            </button>

            <button
              className="nav-btn"
              onClick={(e) => {
                e.stopPropagation();
                closeCompose();
                setReportOpen((o) => !o);
              }}
            >
              <lord-icon
                src="https://cdn.lordicon.com/lltgvngb.json"
                trigger="loop"
                delay="1000"
                stroke="bold"
                colors="primary:#30c9e8,secondary:#16a9c7"
                style={{ width: 50, height: 50, marginBottom: 10 }}
              />
            </button>
          </div>
        </div>

        {composeOpen && (
          <div className="compose-overlay open" onClick={closeCompose}>
            {gifPickerOpen && !capturedPhoto && (
              <div className="gif-picker open" onClick={(e) => e.stopPropagation()}>
                <div className="gif-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <img
                      key={i}
                      src={`Gifs/gif${i}.gif`}
                      className="gif-option"
                      alt={`gif ${i}`}
                      onClick={() => postGif(`/Gifs/gif${i}.gif`)}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="compose-panel" onClick={(e) => e.stopPropagation()}>
              {!capturedPhoto ? (
                <>
                  <button className="cam-btn" onClick={openCamera}>
                    <lord-icon
                      src="https://cdn.lordicon.com/wsaaegar.json"
                      trigger="loop"
                      delay="500"
                      stroke="bold"
                      colors="primary:#30c9e8,secondary:#16a9c7"
                      style={{ width: 32, height: 32 }}
                    />
                  </button>
                  <input
                    ref={msgRef}
                    className="compose-input"
                    type="text"
                    placeholder="Share the vibe..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                  />
                  <button
                    className={`gif-toggle-btn${gifPickerOpen ? " active" : ""}`}
                    onClick={(e) => { e.stopPropagation(); setGifPickerOpen((o) => !o); }}
                  >
                    GIF
                  </button>
                  <button className="send-btn" onClick={sendMessage}>
                    &#10148;
                  </button>
                </>
              ) : (
                <div className="photo-preview-container">
                  <img src={capturedPhoto} alt="preview" className="photo-preview" />
                  <div className="photo-preview-buttons">
                    <button className="send-btn" onClick={sendPhoto}>Send</button>
                    <button className="remove-photo-btn" onClick={removePhoto}>Remove</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {reportOpen && (
          <div className="report-overlay open" onClick={closeReport}>
            <div className="report-panel" onClick={(e) => e.stopPropagation()}>
              <input
                ref={rptRef}
                className="report-input"
                type="text"
                placeholder="what happened..."
                value={reportInput}
                onChange={(e) => setReportInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReport()}
              />
              <button className="report-send-btn" onClick={sendReport}>
                ⚑
              </button>
            </div>
          </div>
        )}

        {cameraOpen && (
          <div className="camera-overlay open">
            <video ref={videoRef} autoPlay playsInline muted />
            <div className="camera-controls">
              <button className="camera-close-btn" onClick={closeCamera}>✕</button>
              <button className="camera-snap-btn" onClick={snapPhoto}>
                <lord-icon
                  src="https://cdn.lordicon.com/wsaaegar.json"
                  trigger="loop"
                  delay="500"
                  stroke="bold"
                  colors="primary:#30c9e8,secondary:#16a9c7"
                  style={{ width: 32, height: 32 }}
                />
              </button>
            </div>
          </div>
        )}

        {lightshowOpen && (
          <div
            className="lightshow-overlay open"
            style={{ backgroundColor: lightBg, transition: "background-color 0.02s linear" }}
            onClick={closeLightShow}
          >
            <span className="lightshow-tap-hint">tap to close</span>
          </div>
        )}
      </div>
    </>
  );
}

const STYLES = `
  :root {
    --bg:          #0a0a12;
    --bg-bar:      #0d0c1a;
    --surface:     #13121e;
    --surface-2:   #1e1b2e;
    --border:      #2e2b42;
    --border-hi:   #002A32;
    --accent:      #003249;
    --accent-dark: #002642;
    --accent-soft: #007EA7;
    --accent-pale: #2A9D8F;
    --pink:        #2A9D8F;
    --pink-dark:   #01295F;
    --muted:       #52525b;
    --subtle:      #71717a;
    --text:        #e4e4f0;
    --white:       #fff;
  }

  *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { min-height: 100%; background: var(--bg); }
  body {
    color: var(--white);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    display: flex;
    justify-content: center;
  }

  .app {
    width: 100%;
    max-width: 400px;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--bg);
    position: relative;
    margin: 0 auto;
  }

  .header { padding: 20px 16px 0; background: var(--bg); }
  .header-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .festival-name {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 0.5px;
    color: var(--white);
    text-decoration: underline;
  }
  .live-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; }
  .live-dot {
    width: 8px; height: 8px;
    background: var(--pink);
    border-radius: 50%;
    animation: pulse 1.4s infinite;
    display: inline-block;
  }
  @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .live-text  { font-size: 11px; font-weight: 700; color: var(--pink); letter-spacing: 1px; }
  .attendee-count { font-size: 11px; color: var(--subtle); }
  .attendee-pill {
    display: flex; align-items: center; gap: 5px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 5px 12px;
    font-size: 13px; font-weight: 600;
    color: var(--accent-pale);
  }

  .visualizer { display: flex; align-items: flex-end; gap: 3px; padding: 0 2px; }
  .vis-bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    animation: bounce var(--dur, 0.8s) ease-in-out infinite alternate;
    transform-origin: bottom;
  }
  @keyframes bounce { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }

  .feed {
    position: fixed;
    top: 130px;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 400px;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding-bottom: 20px;
  }

  .post {
    background: var(--surface);
    border: 1px solid var(--surface-2);
    border-radius: 18px;
    padding: 14px;
    display: flex;
    gap: 12px;
  }
  .post-body   { flex: 1; min-width: 0; }
  .post-header {
    display: flex; align-items: center;
    gap: 8px; margin-bottom: 6px;
    flex-wrap: wrap;
  }
  .username  { font-size: 13px; font-weight: 700; color: var(--accent-soft); }
  .timestamp { font-size: 11px; color: var(--muted); }
  .new-badge {
    background: var(--pink-dark);
    color: var(--white);
    font-size: 10px; font-weight: 700;
    padding: 2px 8px;
    border-radius: 999px;
    letter-spacing: 0.5px;
    margin-left: auto;
  }
  .post-text { font-size: 14px; color: var(--text); line-height: 1.5; margin-bottom: 10px; }
  .post-footer { display: flex; align-items: center; justify-content: space-between; }

  .like-btn {
    display: flex; align-items: center; gap: 5px;
    background: none; border: none;
    color: var(--muted); font-size: 13px;
    cursor: pointer; padding: 0;
    transition: color 0.15s;
  }
  .like-btn.liked { color: var(--pink); }
  .like-btn .heart, .heart { font-size: 15px; }
  .like-count { font-size: 13px; }
  .report-count { font-size: 11px; color: var(--subtle); }

  .post.is-report {
    border-color: #FF331F44;
    background: color-mix(in srgb, var(--surface) 85%, #FF331F 15%);
  }
  .post.is-report .post-text { color: #ff9a8d; }
  .post.is-report .username  { color: #FF331F; }
  .post.pinned {
    border-color: #FF331F;
    box-shadow: 0 0 12px #FF331F44;
    order: -1;
  }
  .post.pinned::before {
    content: 'PINNED REPORT';
    display: block;
    font-size: 9px; font-weight: 800; letter-spacing: 1px;
    color: #FF331F; margin-bottom: 8px;
  }

  .new-messages-pill {
    position: fixed;
    bottom: 100px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent-soft);
    color: var(--white);
    border: none;
    border-radius: 999px;
    padding: 7px 18px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    box-shadow: 0 2px 12px rgba(0, 126, 167, 0.5);
    z-index: 15;
    animation: pill-pop 0.2s ease;
    letter-spacing: 0.3px;
  }
  @keyframes pill-pop {
    from { opacity: 0; transform: translateX(-50%) translateY(8px); }
    to   { opacity: 1; transform: translateX(-50%) translateY(0); }
  }

  .bottom-bar {
    position: fixed; bottom: 0;
    left: 50%; transform: translateX(-50%);
    width: 100%; max-width: 400px;
    background: var(--bg-bar);
    border-top: 1px solid var(--border);
    padding: 12px 2px 8px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .lights-btn {
    position: fixed; bottom: 0; left: 0;
    width: 135px; height: 80px;
    border-radius: 0 50px 0 0;
    border: none; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    gap: 8px; overflow: hidden; padding: 0 14px;
    background: linear-gradient(120deg, #007EA7, #2A9D8F, #FF331F, #00a8cc, #007EA7);
    background-size: 300% 300%;
    animation: lights-shift 3s ease infinite;
    box-shadow: 0 0 16px 4px #007EA780;
  }
  .lights-btn::before {
    content: '';
    position: absolute; inset: 2px;
    border-radius: 0 49px 0 0;
    background: var(--bg-bar);
    z-index: 0;
  }
  .lights-btn__label {
    position: relative; z-index: 1;
    font-size: 15px; font-weight: 500; line-height: 1.4; text-align: left;
    background: linear-gradient(120deg, #007EA7, #2A9D8F, #FF331F, #00a8cc, #007EA7);
    background-size: 300% 300%;
    animation: lights-shift 3s ease infinite;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .lights-btn__label strong { font-size: 18px; font-weight: 800; letter-spacing: 0.3px; }
  .lights-btn:active { opacity: 0.85; }

  @keyframes lights-shift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  .nav-btn {
    width: 76px; height: 76px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--subtle); font-size: 20px;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s, transform 0.1s;
  }
  .nav-btn:active { transform: scale(0.9); }

  .nav-btn--center {
    width: 72px; height: 72px;
    font-size: 28px;
    background: var(--accent);
    border-color: var(--accent-soft);
    color: var(--white);
    box-shadow: 0 0 20px rgba(0,50,73,0.8);
    transition: transform 0.2s, background 0.15s;
  }
  .nav-btn--center.open {
    transform: rotate(45deg);
    background: var(--surface-2);
    border-color: var(--border);
    box-shadow: none;
  }

  .smallContainer {
    display: flex;
    flex-direction: row;
    width: 200px;
    margin-left: auto;
    justify-content: space-between;
    align-items: center;
  }

  .compose-overlay { display: none; position: fixed; inset: 0; z-index: 20; }
  .compose-overlay.open { display: block; }

  .compose-panel {
    position: absolute;
    bottom: 106px;
    left: 50%; transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px; padding: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
    width: calc(100% - 48px);
    max-width: 352px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }

  .photo-preview-container {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
  }
  .photo-preview {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 12px;
    border: 2px solid var(--accent-soft);
  }
  .photo-preview-buttons {
    display: flex;
    gap: 8px;
    flex: 1;
    justify-content: flex-end;
  }
  .remove-photo-btn {
    background: #FF331F;
    border: none;
    border-radius: 999px;
    color: white;
    padding: 8px 16px;
    font-size: 13px;
    font-weight: bold;
    cursor: pointer;
  }

  .cam-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    font-size: 17px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  .compose-input {
    flex: 1;
    background: var(--surface-2);
    border: 1px solid var(--border-hi);
    border-radius: 999px;
    padding: 10px 0 10px 5px;
    font-size: 13px; color: var(--white);
    outline: none;
    font-family: inherit;
  }
  .compose-input::placeholder { color: var(--muted); }
  .compose-input:focus { border-color: var(--accent-soft); }

  .send-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: var(--accent); border: none;
    color: var(--white); font-size: 17px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.15s;
  }
  .send-btn:active { background: var(--accent-dark); }

  .gif-toggle-btn {
    background: var(--surface-2);
    border: 1px solid var(--border-hi);
    border-radius: 999px;
    color: var(--accent-soft);
    font-size: 11px; font-weight: 800; letter-spacing: 1px;
    padding: 0 10px; height: 38px;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.15s;
  }
  .gif-toggle-btn.active {
    background: var(--accent);
    border-color: var(--accent);
    color: var(--white);
  }

  .gif-picker {
    display: none;
    position: absolute;
    bottom: 168px;
    left: 50%; transform: translateX(-50%);
    width: calc(100% - 48px); max-width: 352px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px; padding: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  }
  .gif-picker.open { display: block; }
  .gif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
  .gif-option {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    border-radius: 12px; cursor: pointer;
    border: 2px solid transparent;
    transition: border-color 0.15s, transform 0.1s;
  }
  .gif-option:hover, .gif-option:active {
    border-color: var(--accent-soft);
    transform: scale(0.96);
  }

  .report-overlay { display: none; position: fixed; inset: 0; z-index: 20; }
  .report-overlay.open { display: block; }

  .report-panel {
    position: absolute;
    bottom: 106px;
    left: 50%; transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid #FF331F55;
    border-radius: 20px; padding: 12px;
    display: flex; align-items: center; gap: 8px;
    width: calc(100% - 48px); max-width: 352px;
    box-shadow: 0 8px 32px rgba(255,51,31,0.15);
  }

  .report-input {
    flex: 1;
    background: var(--surface-2);
    border: 1px solid #FF331F55;
    border-radius: 999px;
    padding: 10px 16px;
    font-size: 13px; color: var(--white);
    outline: none; font-family: inherit;
  }
  .report-input::placeholder { color: #FF331F88; }
  .report-input:focus { border-color: #FF331F; }

  .report-send-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #FF331F; border: none;
    color: var(--white); font-size: 17px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.15s;
  }
  .report-send-btn:active { background: #cc2010; }

  .camera-overlay {
    display: none; position: fixed; inset: 0; z-index: 30;
    background: rgba(0,0,0,0.85);
    flex-direction: column; align-items: center; justify-content: center;
    gap: 16px;
  }
  .camera-overlay.open { display: flex; }
  .camera-overlay video {
    width: 100%; max-width: 360px;
    border-radius: 16px; background: #000;
  }
  .camera-controls { display: flex; gap: 16px; }
  .camera-snap-btn {
    width: 64px; height: 64px;
    border-radius: 50%;
    background: var(--white);
    border: 4px solid var(--accent);
    cursor: pointer; font-size: 24px;
    display: flex; align-items: center; justify-content: center;
  }
  .camera-close-btn {
    width: 44px; height: 44px;
    border-radius: 50%;
    background: var(--surface-2);
    border: 1px solid var(--border);
    color: var(--white); cursor: pointer; font-size: 18px;
    display: flex; align-items: center; justify-content: center;
  }

  .lightshow-overlay {
    display: none; position: fixed; inset: 0; z-index: 100;
    cursor: pointer;
    transition: background-color 0.4s ease;
    align-items: center; justify-content: center;
    flex-direction: column; gap: 16px;
  }
  .lightshow-overlay.open { display: flex; }
  .lightshow-tap-hint {
    color: rgba(255,255,255,0.3);
    font-size: 13px; letter-spacing: 2px;
    text-transform: uppercase; pointer-events: none;
    animation: hint-fade 2s ease-in-out infinite alternate;
  }
  @keyframes hint-fade { from { opacity: 0.2; } to { opacity: 0.7; } }
`;