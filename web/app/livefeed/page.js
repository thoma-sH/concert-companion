"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

// ── Constants ──────────────────────────────────────────────────────────────
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
const REPORT_PIN_LIKES = 5;
const ADMIN_NOTES_KEY = "admin_notes";
const ADMIN_NOTE_DURATION = 10 * 60 * 1000;

// ── Helpers ─────────────────────────────────────────────────────────────────
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

// ── Component ────────────────────────────────────────────────────────────────
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

  const nextId = useRef(10);
  const reportBuckets = useRef([]);
  const lightInterval = useRef(null);
  const cameraStream = useRef(null);
  const videoRef = useRef(null);
  const msgRef = useRef(null);
  const rptRef = useRef(null);
  const searchParams = useSearchParams();


  function fetchMessages() {
    fetch("/api/chat/get?concertId=" + searchParams.get("concertId")).then(async (response) => {
      let json_response = await response.json()
      if (json_response.success) {
        setPosts(json_response.data)
      }
    })
  }

  useEffect(() => {
    setInterval(fetchMessages, 500)
  }, [])
  // ── Stable visualizer bars (randomised once) ────────────────────────────
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

  // ── Admin notes (localStorage) ──────────────────────────────────────────
  const loadAdminNotes = useCallback(() => {
    try {
      const raw = localStorage.getItem(ADMIN_NOTES_KEY);
      const notes = raw ? JSON.parse(raw) : [];
      const now = Date.now();
      const valid = notes.filter((n) => n.expiresAt > now);
      if (valid.length !== notes.length) {
        localStorage.setItem(ADMIN_NOTES_KEY, JSON.stringify(valid));
      }
      setAdminNotes(valid);
    } catch {
      setAdminNotes([]);
    }
  }, []);

  useEffect(() => {
    loadAdminNotes();
    const tick = setInterval(loadAdminNotes, 10_000);

    // Seed a demo note if none exist
    try {
      const raw = localStorage.getItem(ADMIN_NOTES_KEY);
      if (!raw || JSON.parse(raw).length === 0) {
        const note = {
          id: Date.now().toString(),
          message: "Stage update: Main stage is getting packed!",
          createdAt: Date.now(),
          expiresAt: Date.now() + ADMIN_NOTE_DURATION,
        };
        localStorage.setItem(ADMIN_NOTES_KEY, JSON.stringify([note]));
        setAdminNotes([note]);
      }
    } catch { }

    const onStorage = () => loadAdminNotes();
    window.addEventListener("storage", onStorage);
    return () => {
      clearInterval(tick);
      window.removeEventListener("storage", onStorage);
    };
  }, [loadAdminNotes]);

  function addAdminNote(message) {
    const note = {
      id: Date.now().toString(),
      message,
      createdAt: Date.now(),
      expiresAt: Date.now() + ADMIN_NOTE_DURATION,
    };
    const prev = (() => {
      try { return JSON.parse(localStorage.getItem(ADMIN_NOTES_KEY)) || []; }
      catch { return []; }
    })();
    const next = [note, ...prev];
    localStorage.setItem(ADMIN_NOTES_KEY, JSON.stringify(next));
    setAdminNotes(next);
  }

  function dismissAdminNote(id) {
    const next = adminNotes.filter((n) => n.id !== id);
    localStorage.setItem(ADMIN_NOTES_KEY, JSON.stringify(next));
    setAdminNotes(next);
  }

  // Expose for console / admin panel usage
  useEffect(() => { window.addAdminNote = addAdminNote; }, [adminNotes]);

  // ── Auto-focus inputs ───────────────────────────────────────────────────
  useEffect(() => { if (composeOpen) setTimeout(() => msgRef.current?.focus(), 50); }, [composeOpen]);
  useEffect(() => { if (reportOpen) setTimeout(() => rptRef.current?.focus(), 50); }, [reportOpen]);

  // ── ID generator ────────────────────────────────────────────────────────
  function uid() { return nextId.current++; }

  // ── Expire NEW badge after 10 s ─────────────────────────────────────────
  function expireBadge(id) {
    setTimeout(
      () => setPosts((p) => p.map((x) => (x.id === id ? { ...x, isNew: false } : x))),
      10_000
    );
  }

  // ── Like toggle ─────────────────────────────────────────────────────────
  function toggleLike(postId) {
    if (posts.filter((p) => p.idChatMessage == postId)[0].hasUpvoted) {
      fetch("/api/chat/unheart", {
        method: "POST", body: JSON.stringify({
          "messageId": postId
        })
      })
    } else {
      fetch("/api/chat/heart", {
        method: "POST", body: JSON.stringify({
          "messageId": postId
        })
      })
    }
  }

  // ── Add post ────────────────────────────────────────────────────────────
  function addPost(fields) {
    const id = uid();
    setPosts((prev) => [
      {
        id,
        username: "you",
        timestamp: "just now",
        likes: 0,
        liked: false,
        isNew: true,
        isReport: false,
        isAdmin: false,
        reportCount: 1,
        pinned: false,
        ...fields,
      },
      ...prev,
    ]);
    expireBadge(id);
  }

  // ── Report / similarity ─────────────────────────────────────────────────
  function submitReport(text) {
    const bucket = reportBuckets.current.find(
      (b) => similarity(text, b.canonical) >= SIMILARITY_THRESHOLD
    );
    if (bucket) {
      bucket.count++;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === bucket.postId ? { ...p, reportCount: p.reportCount + 1 } : p
        )
      );
    } else {
      const id = uid();
      setPosts((prev) => [
        {
          id,
          username: "you",
          timestamp: "just now",
          text,
          likes: 0,
          liked: false,
          isNew: true,
          isReport: true,
          isAdmin: false,
          reportCount: 1,
          pinned: false,
        },
        ...prev,
      ]);
      expireBadge(id);
      reportBuckets.current.push({ canonical: text, count: 1, postId: id });
    }
  }

  // ── Compose / report helpers ────────────────────────────────────────────
  function closeCompose() { setComposeOpen(false); setGifPickerOpen(false); }
  function closeReport() { setReportOpen(false); }

  function sendMessage() {
    fetch("/api/chat/post", {
      method: "POST", body: JSON.stringify({
        messageType: "message",
        concertId: searchParams.get("concertId"),
        messageData: messageInput
      })
    })
    setMessageInput("");
    closeCompose();
  }

  function sendReport() {
    const text = reportInput.trim();
    if (!text) return;
    submitReport(text);
    setReportInput("");
    closeReport();
  }

  function postGif(src) {
    addPost({ text: "", gifSrc: src });
    closeCompose();
  }

  // ── Camera ──────────────────────────────────────────────────────────────
  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      cameraStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
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

  function snapPhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    addPost({ text: "", photoSrc: canvas.toDataURL("image/jpeg") });
    closeCamera();
  }

  // ── Light show ──────────────────────────────────────────────────────────
  function openLightShow() {
    setLightshowOpen(true);
    setLightBg(randColor(LIGHT_SHOW_COLORS));
    lightInterval.current = setInterval(
      async () => {
        let resp = await fetch("/api/concertColor")
        let json_resp = await resp.json()
        if (json_resp.success) {
          let r = (color_code >> 16) & 0xFF;
          let g = (color_code >> 8) & 0xFF;
          let b = color_code & 0xFF;
          let cssColor = `rgb(${r}, ${g}, ${b})`;
        }
      },
      200
    );
  }

  function closeLightShow() {
    setLightshowOpen(false);
    clearInterval(lightInterval.current);
    lightInterval.current = null;
  }

  // ── Sort: pinned reports float to top ───────────────────────────────────
  const sortedPosts = useMemo(
    () => [...posts].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0)),
    [posts]
  );

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <style>{STYLES}</style>
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />

      <div className="app">

        {/* ── Header ── */}
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

          {/* Visualizer */}
          <div
            className="visualizer"
            style={{ cursor: "pointer" }}
            onClick={openLightShow}
          >
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

        {/* ── Feed ── */}
        <div className="feed">

          {/* Admin notes slot */}
          <div id="admin-notes-slot">
            {adminNotes.map((note) => (
              <div key={note.id} className="post admin-post">
                <div className="post-body">
                  <div className="post-header">
                    <span className="username">admin</span>
                    <span className="timestamp">just now</span>
                    <span className="new-badge">PINNED</span>
                  </div>
                  <p className="post-text">{note.messageData}</p>
                  <div className="post-footer">
                    <span className="admin-label">admin update</span>
                    <button
                      className="admin-dismiss-btn"
                      onClick={() => dismissAdminNote(note.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Regular + report posts */}
          {sortedPosts.map((post) => (
            <div
              key={post.id}
              className={[
                "post",
                post.Type == 2 ? "is-report" : "",
                post.pinned ? "pinned" : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="post-body">
                <div className="post-header">
                  <span className="username">{safeStr(post.Username)}</span>
                  <span className="timestamp">{post.Sent}</span>
                </div>

                {post.Type == 0 && <p className="post-text">{post.Message}</p>}
                {post.Type == 1 && (
                  <img
                    src={"data:image/png;base64," + post.Message}
                    alt="gif"
                    style={{ width: "70%", borderRadius: 12, margin: "0 auto 10px", display: "block" }}
                  />
                )}
                {post.photoSrc && (
                  <img
                    src={post.photoSrc}
                    alt="photo"
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

        {/* ── Bottom bar ── */}
        <div className="bottom-bar">
          {/* Lights button — fixed to left edge */}
          <button className="lights-btn" onClick={openLightShow}>
            <span className="lights-btn__label">
              join the<br />
              <strong>light show</strong>
            </span>
          </button>

          {/* Right cluster: compose + report */}
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
              {/* lordicon loads after hydration */}
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

        {/* ── Compose overlay ── */}
        {composeOpen && (
          <div
            className="compose-overlay open"
            onClick={closeCompose}
          >
            {/* GIF picker */}
            {gifPickerOpen && (
              <div className="gif-picker open" onClick={(e) => e.stopPropagation()}>
                <div className="gif-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <img
                      key={i}
                      src={`web/Gifs/gif${i}.gif`}
                      className="gif-option"
                      alt={`gif ${i}`}
                      onClick={() => postGif(`/Gifs/gif${i}.gif`)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Compose panel */}
            <div className="compose-panel" onClick={(e) => e.stopPropagation()}>
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
            </div>
          </div>
        )}

        {/* ── Report overlay ── */}
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

        {/* ── Camera overlay ── */}
        {cameraOpen && (
          <div className="camera-overlay open">
            <video ref={videoRef} autoPlay playsInline />
            <div className="camera-controls">
              <button className="camera-close-btn" onClick={closeCamera}>✕</button>
              <button className="camera-snap-btn" onClick={snapPhoto}>      <lord-icon
                src="https://cdn.lordicon.com/wsaaegar.json"
                trigger="loop"
                delay="500"
                stroke="bold"
                colors="primary:#30c9e8,secondary:#16a9c7"
                style={{ width: 32, height: 32 }}
              /></button>
            </div>
          </div>
        )}

        {/* ── Light show overlay ── */}
        {lightshowOpen && (
          <div
            className="lightshow-overlay open"
            style={{ backgroundColor: lightBg }}
            onClick={closeLightShow}
          >
            <span className="lightshow-tap-hint">tap to close</span>
          </div>
        )}
      </div>
    </>
  );
}

// ── All styles (faithful port of styles.css) ─────────────────────────────────
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

  /* ── App shell ── */
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

  /* ── Header ── */
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

  /* ── Visualizer ── */
  .visualizer { display: flex; align-items: flex-end; gap: 3px; padding: 0 2px; }
  .vis-bar {
    flex: 1;
    border-radius: 3px 3px 0 0;
    animation: bounce var(--dur, 0.8s) ease-in-out infinite alternate;
    transform-origin: bottom;
  }
  @keyframes bounce { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }

  /* ── Feed ── */
  .feed {
    flex: 1;
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
    padding-bottom: 110px;
  }

  /* ── Post cards ── */
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

  /* Report posts */
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

  /* ── Admin notes slot ── */
  #admin-notes-slot { display: flex; flex-direction: column; gap: 10px; }

  .post.admin-post {
    background: #2b2400;
    border: 1px solid #f2c94c;
    box-shadow: 0 0 14px rgba(202,138,4,0.25);
  }
  .post.admin-post .username  { color: #fbbf24; }
  .post.admin-post .post-text { color: #fef3c7; }
  .post.admin-post .new-badge { background: #ca8a04; color: #fff; }
  .admin-label {
    font-size: 10px; font-weight: 700; letter-spacing: 1px;
    color: #fbbf24; text-transform: uppercase;
  }
  .admin-dismiss-btn {
    background: none;
    border: 1px solid #ca8a04;
    border-radius: 999px;
    color: #fbbf24;
    font-size: 11px; padding: 2px 10px;
    cursor: pointer; transition: background 0.15s;
  }
  .admin-dismiss-btn:hover { background: rgba(202,138,4,0.2); }

  /* ── Bottom bar ── */
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

  /* Lights button */
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

  /* Nav buttons */
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

  /* ── Compose overlay ── */
  .compose-overlay { display: none; position: fixed; inset: 0; z-index: 20; }
  .compose-overlay.open { display: block; }

  .compose-panel {
    position: absolute;
    bottom: 106px;
    left: 50%; transform: translateX(-50%);
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px; padding: 12px;
    display: flex; align-items: center; gap: 6px;
    width: calc(100% - 48px); max-width: 352px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
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
  .compose-input:focus        { border-color: var(--accent-soft); }

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

  /* ── GIF picker ── */
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

  /* ── Report overlay ── */
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
  .report-input:focus        { border-color: #FF331F; }

  .report-send-btn {
    width: 38px; height: 38px;
    border-radius: 50%;
    background: #FF331F; border: none;
    color: var(--white); font-size: 17px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: background 0.15s;
  }
  .report-send-btn:active { background: #cc2010; }

  /* ── Camera overlay ── */
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

  /* ── Light show overlay ── */
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