"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Script from "next/script";

// ── Same constants as script.js ────────────────────────────
const COLORS = ["#007EA7","#2A9D8F","#005F7F","#4db8aa","#FF331F","#cc2010","#ff6652","#01295F","#003249","#00a8cc"];
const LIGHT_SHOW_COLORS = ["#007EA7","#2A9D8F","#005F7F","#4db8aa","#FF331F","#cc2010","#01295F","#00a8cc"];
const STOP_WORDS = new Set(["the","a","an","is","it","in","on","at","to","of","and","or","but","this","that","was","were","i","my","we","they","he","she","so","are","for","with","not","its","be","has","had","have"]);
const SIMILARITY_THRESHOLD = 0.60;
const REPORT_PIN_LIKES = 5;

function tokenize(str) {
  return str.toLowerCase().replace(/[^a-z0-9\s]/g,"").split(/\s+/).filter(w => w && !STOP_WORDS.has(w));
}
function similarity(a, b) {
  const sa = new Set(tokenize(a)), sb = new Set(tokenize(b));
  if (!sa.size && !sb.size) return 1;
  return [...sa].filter(w => sb.has(w)).length / new Set([...sa,...sb]).size;
}

const SEED_POSTS = [
  { id:1, username:"maria_j", timestamp:"just now", text:"the stage setup is INSANE tonight omg",                   likes:4, liked:false, isNew:true,  isReport:false, reportCount:1, pinned:false },
  { id:2, username:"kyle.r",  timestamp:"1m ago",   text:"section 104 has the best view fr",                        likes:4, liked:false, isNew:false, isReport:false, reportCount:1, pinned:false },
  { id:3, username:"sofi.a",  timestamp:"2m ago",   text:"the crowd energy right now 🔥🔥🔥",                      likes:9, liked:false, isNew:false, isReport:false, reportCount:1, pinned:false },
  { id:4, username:"dan.l",   timestamp:"4m ago",   text:"security was super smooth tonight, got in under 10 mins", likes:2, liked:false, isNew:false, isReport:false, reportCount:1, pinned:false },
];

export default function LiveFeed() {
  const [posts,         setPosts]         = useState(SEED_POSTS);
  const [composeOpen,   setComposeOpen]   = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [reportOpen,    setReportOpen]    = useState(false);
  const [cameraOpen,    setCameraOpen]    = useState(false);
  const [lightshowOpen, setLightshowOpen] = useState(false);
  const [lightBg,       setLightBg]       = useState("");
  const [messageInput,  setMessageInput]  = useState("");
  const [reportInput,   setReportInput]   = useState("");

  const nextId        = useRef(10);
  const reportBuckets = useRef([]);
  const lightInterval = useRef(null);
  const cameraStream  = useRef(null);
  const videoRef      = useRef(null);
  const msgRef        = useRef(null);
  const rptRef        = useRef(null);

  const visBars = useMemo(() => Array.from({ length: 28 }, (_, i) => ({
    id: i,
    h:   Math.random() * 36 + 12,
    dur: (Math.random() * 0.6 + 0.5).toFixed(2),
    col: COLORS[Math.floor(Math.random() * COLORS.length)],
    del: (Math.random() * 0.4).toFixed(2),
  })), []);

  useEffect(() => { if (composeOpen) setTimeout(() => msgRef.current?.focus(), 50); }, [composeOpen]);
  useEffect(() => { if (reportOpen)  setTimeout(() => rptRef.current?.focus(), 50); }, [reportOpen]);

  function uid() { return nextId.current++; }
  function expireBadge(id) {
    setTimeout(() => setPosts(p => p.map(x => x.id === id ? { ...x, isNew: false } : x)), 10000);
  }

  function toggleLike(postId) {
    setPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const liked  = !p.liked;
      const likes  = p.likes + (liked ? 1 : -1);
      const pinned = p.isReport && likes >= REPORT_PIN_LIKES ? true : p.pinned;
      return { ...p, liked, likes, pinned };
    }));
  }

  function addPost(fields) {
    const id = uid();
    setPosts(prev => [{ id, username:"you", timestamp:"just now", likes:0, liked:false, isNew:true, isReport:false, reportCount:1, pinned:false, ...fields }, ...prev]);
    expireBadge(id);
  }

  function submitReport(text) {
    const bucket = reportBuckets.current.find(b => similarity(text, b.canonical) >= SIMILARITY_THRESHOLD);
    if (bucket) {
      bucket.count++;
      setPosts(prev => prev.map(p => p.id === bucket.postId ? { ...p, reportCount: p.reportCount + 1 } : p));
    } else {
      const id = uid();
      setPosts(prev => [{ id, username:"you", timestamp:"just now", text, likes:0, liked:false, isNew:true, isReport:true, reportCount:1, pinned:false }, ...prev]);
      expireBadge(id);
      reportBuckets.current.push({ canonical: text, count: 1, postId: id });
    }
  }

  // ── Close helpers ──
  function closeCompose() { setComposeOpen(false); setGifPickerOpen(false); }
  function closeReport()  { setReportOpen(false); }

  // ── Send handlers ──
  function sendMessage() {
    const text = messageInput.trim();
    if (!text) return;
    addPost({ text });
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
  function postGif(src) { addPost({ text:"", gifSrc:src }); closeCompose(); }

  // ── Camera ──
  async function openCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video:{ facingMode:"environment" }, audio:false });
      cameraStream.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraOpen(true);
      closeCompose();
    } catch(err) { alert("Camera not available: " + err.message); }
  }
  function closeCamera() {
    setCameraOpen(false);
    cameraStream.current?.getTracks().forEach(t => t.stop());
    cameraStream.current = null;
  }
  function snapPhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth; canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    addPost({ text:"", photoSrc: canvas.toDataURL("image/jpeg") });
    closeCamera();
  }

  // ── Light show ──
  function openLightShow() {
    setLightshowOpen(true);
    setLightBg(LIGHT_SHOW_COLORS[Math.floor(Math.random()*LIGHT_SHOW_COLORS.length)]);
    lightInterval.current = setInterval(() =>
      setLightBg(LIGHT_SHOW_COLORS[Math.floor(Math.random()*LIGHT_SHOW_COLORS.length)]), 800);
  }
  function closeLightShow() { setLightshowOpen(false); clearInterval(lightInterval.current); }

  const sortedPosts = useMemo(() =>
    [...posts].sort((a,b) => (b.pinned?1:0)-(a.pinned?1:0)), [posts]);

  return (
    <>
      <style>{STYLES}</style>
      <Script src="https://cdn.lordicon.com/lordicon.js" strategy="afterInteractive" />

      <div className="app">

        {/* Header */}
        <div className="header">
          <div className="header-top">
            <div>
              <h1><div className="attendee-pill"><span>Kendrick Lamar</span></div></h1>
              <div className="live-row">
                <span className="live-dot"></span>
                <span className="live-text">LIVE</span>
                <span className="attendee-count">3,187 here</span>
              </div>
            </div>
            <h1 className="festival-name">Concert Companion</h1>
          </div>
          <div className="visualizer" style={{cursor:"pointer"}} onClick={openLightShow}>
            {visBars.map(b => (
              <div key={b.id} className="vis-bar"
                style={{height:b.h,"--dur":`${b.dur}s`,background:b.col,animationDelay:`${b.del}s`}} />
            ))}
          </div>
        </div>

        {/* Feed */}
        <div className="feed">
          {sortedPosts.map(post => (
            <div key={post.id} className={`post${post.isReport?" is-report":""}${post.pinned?" pinned":""}`}>
              <div className="post-body">
                <div className="post-header">
                  <span className="username">{post.username}</span>
                  <span className="timestamp">{post.timestamp}</span>
                  {post.isNew && <span className="new-badge">NEW</span>}
                </div>
                {post.text     && <p className="post-text">{post.text}</p>}
                {post.gifSrc   && <img src={post.gifSrc}   alt="gif"   style={{width:"70%",borderRadius:12,margin:"0 auto 10px",display:"block"}} />}
                {post.photoSrc && <img src={post.photoSrc} alt="photo" style={{width:"100%",borderRadius:12,marginBottom:10}} />}
                <div className="post-footer">
                  {post.isReport && <span className="report-count">{post.reportCount} report{post.reportCount!==1?"s":""}</span>}
                  <button className={`like-btn${post.liked?" liked":""}`} onClick={() => toggleLike(post.id)}>
                    <span className="heart">{post.liked?"♥":"♡"}</span>
                    <span className="like-count">{post.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="bottom-bar">
          {/* lights btn — fixed to left edge of column */}
          <button className="lights-btn" onClick={openLightShow}>
            <span className="lights-btn__label">join the<br/><strong>light show</strong></span>
          </button>

          {/* center + button */}
          <button
            className={`nav-btn nav-btn--center${composeOpen?" open":""}`}
            onClick={e => { e.stopPropagation(); closeReport(); setComposeOpen(o => !o); setGifPickerOpen(false); }}
          >&#43;</button>

          {/* report button */}
          <button className="nav-btn" onClick={e => { e.stopPropagation(); closeCompose(); setReportOpen(o => !o); }}>
            <lord-icon src="https://cdn.lordicon.com/lltgvngb.json"
              trigger="loop" delay="1000" stroke="bold"
              colors="primary:#30c9e8,secondary:#16a9c7"
              style={{width:70,height:70,marginBottom:10}} />
          </button>
        </div>

        {/* Compose overlay — click backdrop to close */}
        {composeOpen && (
          <div className="compose-overlay open" onClick={closeCompose}>
            {gifPickerOpen && (
              <div className="gif-picker open" onClick={e => e.stopPropagation()}>
                <div className="gif-grid">
                  {[0,1,2,3,4,5,6].map(i => (
                    <img key={i} src={`/Gifs/gif${i}.gif`} className="gif-option" alt={`gif ${i}`}
                      onClick={() => postGif(`/Gifs/gif${i}.gif`)} />
                  ))}
                </div>
              </div>
            )}
            <div className="compose-panel" onClick={e => e.stopPropagation()}>
              <button className="cam-btn" onClick={openCamera}>
                <lord-icon src="https://cdn.lordicon.com/wsaaegar.json"
                  trigger="loop" delay="500" stroke="bold"
                  colors="primary:#30c9e8,secondary:#16a9c7"
                  style={{width:32,height:32}} />
              </button>
              <input ref={msgRef} className="compose-input" type="text"
                placeholder="Share the vibe..." value={messageInput}
                onChange={e => setMessageInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && sendMessage()} />
              <button className={`gif-toggle-btn${gifPickerOpen?" active":""}`}
                onClick={e => { e.stopPropagation(); setGifPickerOpen(o => !o); }}>GIF</button>
              <button className="send-btn" onClick={sendMessage}>&#10148;</button>
            </div>
          </div>
        )}

        {/* Report overlay */}
        {reportOpen && (
          <div className="report-overlay open" onClick={closeReport}>
            <div className="report-panel" onClick={e => e.stopPropagation()}>
              <input ref={rptRef} className="report-input" type="text"
                placeholder="what happened..." value={reportInput}
                onChange={e => setReportInput(e.target.value)}
                onKeyDown={e => e.key==="Enter" && sendReport()} />
              <button className="report-send-btn" onClick={sendReport}>⚑</button>
            </div>
          </div>
        )}

        {/* Camera overlay */}
        {cameraOpen && (
          <div className="camera-overlay open">
            <video ref={videoRef} autoPlay playsInline id="cameraVideo" />
            <div className="camera-controls">
              <button className="camera-close-btn" onClick={closeCamera}>✕</button>
              <button className="camera-snap-btn" onClick={snapPhoto}>📷</button>
            </div>
          </div>
        )}

        {/* Light show */}
        {lightshowOpen && (
          <div className="lightshow-overlay open" style={{backgroundColor:lightBg}} onClick={closeLightShow}>
            <span className="lightshow-tap-hint">tap to close</span>
          </div>
        )}

      </div>
    </>
  );
}

const STYLES = `
  :root {
    --bg: #0a0a12; --bg-bar: #0d0c1a; --surface: #13121e; --surface-2: #1e1b2e;
    --border: #2e2b42; --border-hi: #002A32; --accent: #003249; --accent-dark: #002642;
    --accent-soft: #007EA7; --accent-pale: #2A9D8F; --pink: #FF331F; --pink-dark: #01295F;
    --muted: #52525b; --subtle: #71717a; --text: #e4e4f0; --white: #fff;
  }
  *, *::before, *::after { margin:0; padding:0; box-sizing:border-box; }
  html, body { min-height:100%; background:var(--bg); }
  body { color:var(--white); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }

  .app {
    width:100%; max-width:400px; min-height:100vh;
    display:flex; flex-direction:column;
    background:var(--bg); position:relative;
    margin:0 auto;
  }

  /* Header */
  .header { padding:20px 16px 0; background:var(--bg); }
  .header-top { display:flex; align-items:flex-start; justify-content:space-between; margin-bottom:12px; }
  .festival-name { font-size:15px; font-weight:800; letter-spacing:0.5px; color:var(--white); text-decoration:underline; }
  .live-row { display:flex; align-items:center; gap:6px; margin-top:4px; }
  .live-dot { width:8px; height:8px; background:var(--pink); border-radius:50%; animation:pulse 1.4s infinite; display:inline-block; }
  @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  .live-text { font-size:11px; font-weight:700; color:var(--pink); letter-spacing:1px; }
  .attendee-count { font-size:11px; color:var(--subtle); }
  .attendee-pill { display:flex; align-items:center; gap:5px; background:var(--surface-2); border:1px solid var(--border); border-radius:999px; padding:5px 12px; font-size:13px; font-weight:600; color:var(--accent-pale); }

  /* Visualizer */
  .visualizer { display:flex; align-items:flex-end; gap:3px; padding:0 2px; }
  .vis-bar { flex:1; border-radius:3px 3px 0 0; animation:bounce var(--dur,0.8s) ease-in-out infinite alternate; transform-origin:bottom; }
  @keyframes bounce { from{transform:scaleY(0.15)} to{transform:scaleY(1)} }

  /* Feed */
  .feed { flex:1; padding:12px; display:flex; flex-direction:column; gap:10px; overflow-y:auto; padding-bottom:110px; }
  .post { background:var(--surface); border:1px solid var(--surface-2); border-radius:18px; padding:14px; display:flex; gap:12px; }
  .post-body { flex:1; min-width:0; }
  .post-header { display:flex; align-items:center; gap:8px; margin-bottom:6px; flex-wrap:wrap; }
  .username { font-size:13px; font-weight:700; color:var(--accent-soft); }
  .timestamp { font-size:11px; color:var(--muted); }
  .new-badge { background:var(--pink-dark); color:var(--white); font-size:10px; font-weight:700; padding:2px 8px; border-radius:999px; letter-spacing:0.5px; margin-left:auto; }
  .post-text { font-size:14px; color:var(--text); line-height:1.5; margin-bottom:10px; }
  .post-footer { display:flex; align-items:center; justify-content:space-between; }
  .like-btn { display:flex; align-items:center; gap:5px; background:none; border:none; color:var(--muted); font-size:13px; cursor:pointer; padding:0; transition:color 0.15s; }
  .like-btn.liked { color:var(--pink); }
  .heart { font-size:15px; }
  .report-count { font-size:11px; color:var(--subtle); }
  .post.is-report { border-color:#FF331F44; background:color-mix(in srgb,var(--surface) 85%,#FF331F 15%); }
  .post.is-report .post-text { color:#ff9a8d; }
  .post.is-report .username { color:#FF331F; }
  .post.pinned { border-color:#FF331F; box-shadow:0 0 12px #FF331F44; }
  .post.pinned::before { content:'PINNED REPORT'; display:block; font-size:9px; font-weight:800; letter-spacing:1px; color:#FF331F; margin-bottom:8px; }

  /* Bottom bar — fixed, centered to the 400px column */
  .bottom-bar {
    position:fixed; bottom:0; left:50%; transform:translateX(-50%);
    width:100%; max-width:400px;
    background:var(--bg-bar); border-top:1px solid var(--border);
    padding:12px 2px 8px;
    display:flex; align-items:center; justify-content:space-between;
  }

  /* Lights btn — anchored to the left edge of the 400px column */
  .lights-btn {
    position:absolute; bottom:0; left:0;
    width:135px; height:80px;
    border-radius:0 50px 0 0; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    gap:8px; overflow:hidden; padding:0 14px;
    background:linear-gradient(120deg,#007EA7,#2A9D8F,#FF331F,#00a8cc,#007EA7);
    background-size:300% 300%; animation:lights-shift 3s ease infinite;
    box-shadow:0 0 16px 4px #007EA780;
  }
  .lights-btn::before { content:''; position:absolute; inset:2px; border-radius:0 49px 0 0; background:var(--bg-bar); z-index:0; }
  .lights-btn__label {
    position:relative; z-index:1; font-size:15px; font-weight:500; line-height:1.4; text-align:left;
    background:linear-gradient(120deg,#007EA7,#2A9D8F,#FF331F,#00a8cc,#007EA7);
    background-size:300% 300%; animation:lights-shift 3s ease infinite;
    -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
  }
  .lights-btn__label strong { font-size:18px; font-weight:800; letter-spacing:0.3px; }
  .lights-btn:active { opacity:0.85; }
  @keyframes lights-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }

  /* Nav buttons */
  .nav-btn {
    width:76px; height:76px; border-radius:50%;
    background:var(--surface-2); border:1px solid var(--border);
    color:var(--subtle); font-size:20px; cursor:pointer;
    display:flex; align-items:center; justify-content:center;
    transition:background 0.15s, transform 0.1s;
  }
  .nav-btn:active { transform:scale(0.9); }

  /* Center + button — pushed right so it lands in the middle */
  .nav-btn--center {
    width:72px; height:72px; font-size:28px;
    background:var(--accent); border-color:var(--accent-soft); color:var(--white);
    box-shadow:0 0 20px rgba(0,50,73,0.8);
    transform:translateX(11rem);
    transition:background 0.15s;
  }
  .nav-btn--center.open {
    background:var(--surface-2);
    border-color:var(--border);
    box-shadow:none;
    transform:translateX(11rem);
  }

  /* Compose overlay */
  .compose-overlay { display:none; position:fixed; inset:0; z-index:20; }
  .compose-overlay.open { display:block; }
  .compose-panel {
    position:absolute; bottom:106px; left:50%; transform:translateX(-50%);
    background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:12px;
    display:flex; align-items:center; gap:6px;
    width:calc(100% - 48px); max-width:352px;
    box-shadow:0 8px 32px rgba(0,0,0,0.5);
  }
  .cam-btn { width:38px; height:38px; border-radius:50%; background:var(--surface-2); border:1px solid var(--border); cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
  .compose-input { flex:1; background:var(--surface-2); border:1px solid var(--border-hi); border-radius:999px; padding:10px 0 10px 5px; font-size:13px; color:var(--white); outline:none; font-family:inherit; }
  .compose-input::placeholder { color:var(--muted); }
  .compose-input:focus { border-color:var(--accent-soft); }
  .send-btn { width:38px; height:38px; border-radius:50%; background:var(--accent); border:none; color:var(--white); font-size:17px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
  .send-btn:active { background:var(--accent-dark); }
  .gif-toggle-btn { background:var(--surface-2); border:1px solid var(--border-hi); border-radius:999px; color:var(--accent-soft); font-size:11px; font-weight:800; letter-spacing:1px; padding:0 10px; height:38px; cursor:pointer; flex-shrink:0; transition:background 0.15s; }
  .gif-toggle-btn.active { background:var(--accent); border-color:var(--accent); color:var(--white); }

  /* GIF picker */
  .gif-picker { display:none; position:absolute; bottom:168px; left:50%; transform:translateX(-50%); width:calc(100% - 48px); max-width:352px; background:var(--surface); border:1px solid var(--border); border-radius:20px; padding:12px; box-shadow:0 8px 32px rgba(0,0,0,0.5); }
  .gif-picker.open { display:block; }
  .gif-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:8px; }
  .gif-option { width:100%; aspect-ratio:1; object-fit:cover; border-radius:12px; cursor:pointer; border:2px solid transparent; transition:border-color 0.15s,transform 0.1s; }
  .gif-option:hover,.gif-option:active { border-color:var(--accent-soft); transform:scale(0.96); }

  /* Report overlay — panel centered to the column */
  .report-overlay { display:none; position:fixed; inset:0; z-index:20; }
  .report-overlay.open { display:block; }
  .report-panel {
    position:absolute; bottom:96px; left:50%; transform:translateX(-50%);
    background:var(--surface); border:1px solid #FF331F55; border-radius:20px; padding:12px;
    display:flex; align-items:center; gap:8px;
    width:calc(100% - 48px); max-width:352px;
    box-shadow:0 8px 32px rgba(255,51,31,0.15);
  }
  .report-input { flex:1; background:var(--surface-2); border:1px solid #FF331F55; border-radius:999px; padding:10px 16px; font-size:13px; color:var(--white); outline:none; font-family:inherit; }
  .report-input::placeholder { color:#FF331F88; }
  .report-input:focus { border-color:#FF331F; }
  .report-send-btn { width:38px; height:38px; border-radius:50%; background:#FF331F; border:none; color:var(--white); font-size:17px; cursor:pointer; display:flex; align-items:center; justify-content:center; flex-shrink:0; transition:background 0.15s; }
  .report-send-btn:active { background:#cc2010; }

  /* Camera */
  .camera-overlay { display:none; position:fixed; inset:0; z-index:30; background:rgba(0,0,0,0.85); flex-direction:column; align-items:center; justify-content:center; gap:16px; }
  .camera-overlay.open { display:flex; }
  #cameraVideo { width:100%; max-width:360px; border-radius:16px; background:#000; }
  .camera-controls { display:flex; gap:16px; }
  .camera-snap-btn { width:64px; height:64px; border-radius:50%; background:var(--white); border:4px solid var(--accent); cursor:pointer; font-size:24px; display:flex; align-items:center; justify-content:center; }
  .camera-close-btn { width:44px; height:44px; border-radius:50%; background:var(--surface-2); border:1px solid var(--border); color:var(--white); cursor:pointer; font-size:18px; display:flex; align-items:center; justify-content:center; }

  /* Light show */
  .lightshow-overlay { display:none; position:fixed; inset:0; z-index:100; cursor:pointer; transition:background-color 0.4s ease; align-items:center; justify-content:center; flex-direction:column; gap:16px; }
  .lightshow-overlay.open { display:flex; }
  .lightshow-tap-hint { color:rgba(255,255,255,0.3); font-size:13px; letter-spacing:2px; text-transform:uppercase; pointer-events:none; animation:hint-fade 2s ease-in-out infinite alternate; }
  @keyframes hint-fade { from{opacity:0.2} to{opacity:0.7} }
`;