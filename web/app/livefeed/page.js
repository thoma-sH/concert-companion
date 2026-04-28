"use client";

export const fetchCache = "force-no-store";
import { useState, useEffect, useRef, useMemo, useCallback, Suspense } from "react";
import Script from "next/script";
import { useSearchParams } from "next/navigation";

const VIS_COLORS = ["#c8ff00", "#9bcc00", "#ffe14d", "#7fff5a", "#aaff66", "#d4ff66"];

function safeStr(s) { return String(s).replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function randColor(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function hexToRgb(hex) {
  const bigint = parseInt(hex.slice(1), 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}
function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
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

export default function Page() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: "var(--text-muted)" }}>► loading</div>}>
      <ConcertCompanion />
    </Suspense>
  );
}

function ConcertCompanion() {
  const [posts, setPosts] = useState([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [gifPickerOpen, setGifPickerOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [lightshowOpen, setLightshowOpen] = useState(false);
  const [lightBg, setLightBg] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [reportInput, setReportInput] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);

  const [lightEffect, setLightEffect] = useState("solid");
  const [lightBaseColor, setLightBaseColor] = useState("#c8ff00");

  const lightInterval = useRef(null);
  const animationFrameId = useRef(null);
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
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data)) setPosts(data.data);
      })
      .catch((err) => console.error("Fetch messages error:", err));
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
      Array.from({ length: 32 }, (_, i) => ({
        id: i,
        h: Math.random() * 32 + 10,
        dur: (Math.random() * 0.6 + 0.4).toFixed(2),
        col: randColor(VIS_COLORS),
        del: (Math.random() * 0.4).toFixed(2),
      })),
    []
  );

  useEffect(() => { if (composeOpen) setTimeout(() => msgRef.current?.focus(), 50); }, [composeOpen]);
  useEffect(() => { if (reportOpen) setTimeout(() => rptRef.current?.focus(), 50); }, [reportOpen]);

  function toggleLike(postId) {
    const post = posts.find((p) => p.idChatMessage == postId);
    if (!post) return;
    if (post.hasUpvoted) {
      fetch("/api/chat/unheart", {
        method: "POST",
        body: JSON.stringify({ messageId: postId }),
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.error("Unheart error:", err));
    } else {
      fetch("/api/chat/heart", {
        method: "POST",
        body: JSON.stringify({ messageId: postId }),
        headers: { "Content-Type": "application/json" },
      }).catch((err) => console.error("Heart error:", err));
    }
  }

  function submitReport(text) {
    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: "report",
        concertId: searchParams.get("concertId"),
        messageData: text,
      }),
    }).catch((err) => console.error("Report send error:", err));
  }

  function closeCompose() { setComposeOpen(false); setGifPickerOpen(false); }
  function closeReport() { setReportOpen(false); }

  function sendMessage() {
    if (!messageInput.trim()) return;
    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messageType: "message",
        concertId: searchParams.get("concertId"),
        messageData: messageInput,
      }),
    }).catch((err) => console.error("Send message error:", err));
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

  async function postGif(src) {
    try {
      await fetch("/api/chat/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messageType: "gif",
          concertId: searchParams.get("concertId"),
          messageData: src,
        }),
      });
      closeCompose();
    } catch (err) {
      console.error("GIF error:", err);
    }
  }

  function pollLightState() {
    const concertId = searchParams.get("concertId");
    if (!concertId) return;
    fetch(`/api/concertState?concertId=${concertId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setLightBaseColor(data.color);
          setLightEffect(data.effect);
        }
      })
      .catch((err) => console.error("Light state poll error:", err));
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

      <div className="lf-app">
        <header className="lf-header">
          <div className="lf-header-row">
            <div>
              <div className="lf-pill">
                <span className="lf-pill__dot" />
                <span>LIVE</span>
              </div>
              <div className="lf-meta">
                <span className="lf-mono">CONCERT FEED ▸ ONLINE</span>
              </div>
            </div>
            <div className="lf-brand">// Concert Companion</div>
          </div>

          <div className="lf-vis" onClick={openLightShow} title="Tap for light show">
            {visBars.map((b) => (
              <div
                key={b.id}
                className="lf-vis-bar"
                style={{ height: b.h, "--dur": `${b.dur}s`, background: b.col, animationDelay: `${b.del}s` }}
              />
            ))}
          </div>
        </header>

        <div className="lf-feed" ref={feedRef} onScroll={handleFeedScroll}>
          {sortedPosts.length === 0 && (
            <p className="lf-empty">► No posts yet. Be the first to drop a vibe.</p>
          )}
          {sortedPosts.map((post) => (
            <article
              key={post.idChatMessage}
              className={[
                "lf-post",
                post.Type == 20 ? "is-report" : "",
                post.pinned ? "pinned" : "",
              ].filter(Boolean).join(" ")}
            >
              <div className="lf-post-head">
                <span className="lf-username">{safeStr(post.Username)}</span>
                <span className="lf-ts">{post.Sent}</span>
              </div>

              {(post.Type == 0 || post.Type == 20) && (
                <p className="lf-text">{post.Message}</p>
              )}
              {post.Type == 1 && (
                <img src={post.Message} alt="photo" className="lf-img" />
              )}
              {post.Type == 4 && (
                <img src={post.Message} alt="gif" className="lf-img" style={{ width: "100%" }} />
              )}

              <div className="lf-post-foot">
                {post.isReport && (
                  <span className="lf-rpt">
                    {post.reportCount} report{post.reportCount !== 1 ? "s" : ""}
                  </span>
                )}
                <button className={`lf-like${post.hasUpvoted ? " liked" : ""}`} onClick={() => toggleLike(post.idChatMessage)}>
                  <span className="lf-heart">{post.hasUpvoted ? "♥" : "♡"}</span>
                  <span>{post.UpvoteCount}</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {unreadCount > 0 && (
          <button
            className="lf-new-pill"
            onClick={() => {
              feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: "smooth" });
              lastSeenCount.current = posts.length;
              setUnreadCount(0);
              isUserScrolledUp.current = false;
            }}
          >
            ↓ {unreadCount} NEW
          </button>
        )}

        <div className="lf-bottom">
          <button className="lf-lights" onClick={openLightShow}>
            <span className="lf-lights__txt">JOIN<br /><strong>LIGHT SHOW</strong></span>
          </button>

          <div className="lf-actions">
            <button
              className={`lf-fab${composeOpen ? " open" : ""}`}
              onClick={(e) => {
                e.stopPropagation();
                closeReport();
                setComposeOpen((o) => !o);
                setGifPickerOpen(false);
              }}
              aria-label="Compose"
            >
              +
            </button>
            <button
              className="lf-fab lf-fab--ghost"
              onClick={(e) => {
                e.stopPropagation();
                closeCompose();
                setReportOpen((o) => !o);
              }}
              aria-label="Report"
            >
              ⚑
            </button>
          </div>
        </div>

        {composeOpen && (
          <div className="lf-overlay" onClick={closeCompose}>
            {gifPickerOpen && (
              <div className="lf-gifpick" onClick={(e) => e.stopPropagation()}>
                <div className="lf-gif-grid">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <img
                      key={i} src={`Gifs/gif${i}.gif`} alt={`gif ${i}`}
                      className="lf-gif-opt"
                      onClick={() => postGif(`/Gifs/gif${i}.gif`)}
                    />
                  ))}
                </div>
              </div>
            )}
            <div className="lf-composer" onClick={(e) => e.stopPropagation()}>
              <input
                ref={msgRef}
                className="lf-input"
                type="text"
                placeholder="Share the vibe…"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                className={`lf-gif-btn${gifPickerOpen ? " active" : ""}`}
                onClick={(e) => { e.stopPropagation(); setGifPickerOpen((o) => !o); }}
              >
                GIF
              </button>
              <button className="lf-send" onClick={sendMessage}>➤</button>
            </div>
          </div>
        )}

        {reportOpen && (
          <div className="lf-overlay" onClick={closeReport}>
            <div className="lf-composer lf-composer--rpt" onClick={(e) => e.stopPropagation()}>
              <input
                ref={rptRef}
                className="lf-input lf-input--rpt"
                type="text"
                placeholder="what happened…"
                value={reportInput}
                onChange={(e) => setReportInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendReport()}
              />
              <button className="lf-send lf-send--rpt" onClick={sendReport}>⚑</button>
            </div>
          </div>
        )}

        {lightshowOpen && (
          <div
            className="lf-lightshow"
            style={{ backgroundColor: lightBg }}
            onClick={closeLightShow}
          >
            <span className="lf-lightshow__hint">▼ tap to close</span>
          </div>
        )}
      </div>
    </>
  );
}

const STYLES = `
  body { background: var(--bg); }

  .lf-app {
    width: 100%;
    max-width: 440px;
    min-height: 100vh;
    margin: 0 auto;
    background: var(--bg);
    display: flex;
    flex-direction: column;
    position: relative;
  }
  .lf-mono { font-family: var(--font-mono); font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; }

  .lf-header {
    padding: 18px 16px 0;
    background: var(--bg);
    border-bottom: 1px solid var(--border);
  }
  .lf-header-row {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }
  .lf-brand {
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--text);
    font-weight: 700;
  }

  .lf-pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: var(--accent-soft);
    border: 1px solid var(--accent);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.2em;
    padding: 3px 10px;
    margin-bottom: 6px;
  }
  .lf-pill__dot {
    width: 6px; height: 6px;
    background: var(--accent);
    border-radius: 50%;
    animation: lf-pulse 1.4s infinite;
    display: inline-block;
  }
  @keyframes lf-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
  .lf-meta { color: var(--text-dim); }

  .lf-vis {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    padding: 4px 0 12px;
    cursor: pointer;
    height: 56px;
  }
  .lf-vis-bar {
    flex: 1;
    border-radius: 1px 1px 0 0;
    animation: lf-bounce var(--dur, 0.8s) ease-in-out infinite alternate;
    transform-origin: bottom;
  }
  @keyframes lf-bounce { from { transform: scaleY(0.15); } to { transform: scaleY(1); } }

  .lf-feed {
    position: fixed;
    top: 142px;
    bottom: 96px;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 440px;
    padding: 14px 16px 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow-y: auto;
  }
  .lf-empty {
    color: var(--text-dim);
    font-family: var(--font-mono);
    font-size: 12px;
    letter-spacing: 0.12em;
    text-align: center;
    padding-top: 60px;
  }

  .lf-post {
    background: var(--bg-panel);
    border: 1px solid var(--border);
    padding: 12px 14px;
    transition: border-color 120ms;
  }
  .lf-post:hover { border-color: var(--border-mid); }
  .lf-post-head {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
  }
  .lf-username {
    font-size: 12px;
    font-weight: 700;
    color: var(--accent);
  }
  .lf-ts {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.12em;
    color: var(--text-dim);
    margin-left: auto;
  }
  .lf-text {
    font-size: 14px;
    color: var(--text);
    line-height: 1.5;
    margin: 4px 0 8px;
    word-break: break-word;
  }
  .lf-img {
    width: 70%;
    border: 1px solid var(--border);
    margin: 6px auto;
    display: block;
  }
  .lf-post-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 6px;
  }
  .lf-rpt {
    font-family: var(--font-mono);
    font-size: 9px;
    letter-spacing: 0.14em;
    color: var(--text-muted);
    text-transform: uppercase;
  }
  .lf-like {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 13px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 0;
    transition: color 120ms;
    font-family: var(--font-mono);
    letter-spacing: 0.06em;
  }
  .lf-like.liked, .lf-like:hover { color: var(--accent); }
  .lf-heart { font-size: 16px; }

  .lf-post.is-report {
    border-color: rgba(255,77,77,0.35);
    background: rgba(255,77,77,0.04);
  }
  .lf-post.is-report .lf-text { color: #ffaaa3; }
  .lf-post.is-report .lf-username { color: var(--danger); }
  .lf-post.pinned {
    border-color: var(--danger);
    box-shadow: 0 0 0 1px rgba(255,77,77,0.3);
    order: -1;
  }
  .lf-post.pinned::before {
    content: 'PINNED REPORT';
    display: block;
    font-family: var(--font-mono);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: var(--danger);
    margin-bottom: 6px;
  }

  .lf-new-pill {
    position: fixed;
    bottom: 110px;
    left: 50%;
    transform: translateX(-50%);
    background: var(--accent);
    color: #000;
    border: none;
    padding: 7px 18px;
    font-family: var(--font-mono);
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.18em;
    cursor: pointer;
    z-index: 15;
    box-shadow: 0 4px 16px rgba(200,255,0,0.3);
  }

  .lf-bottom {
    position: fixed;
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    width: 100%;
    max-width: 440px;
    background: var(--bg-panel);
    border-top: 1px solid var(--border);
    padding: 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .lf-lights {
    flex: 1;
    height: 64px;
    border: 1px solid var(--accent);
    background: var(--accent);
    color: #000;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 0 14px;
    font-family: var(--font-mono);
    transition: filter 120ms;
  }
  .lf-lights:hover { filter: brightness(1.1); }
  .lf-lights__txt {
    font-size: 10px;
    font-weight: 600;
    line-height: 1.3;
    letter-spacing: 0.18em;
    text-align: left;
  }
  .lf-lights__txt strong { font-size: 14px; font-weight: 800; letter-spacing: 0.12em; }

  .lf-actions { display: flex; gap: 10px; }
  .lf-fab {
    width: 64px;
    height: 64px;
    border: 1px solid var(--accent);
    background: transparent;
    color: var(--accent);
    cursor: pointer;
    font-size: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 120ms, transform 120ms;
    font-family: var(--font-mono);
  }
  .lf-fab:hover { background: var(--accent-soft); }
  .lf-fab.open { transform: rotate(45deg); }
  .lf-fab--ghost { color: var(--text-muted); border-color: var(--border-mid); font-size: 18px; }
  .lf-fab--ghost:hover { color: var(--danger); border-color: var(--danger); background: rgba(255,77,77,0.08); }

  .lf-overlay {
    position: fixed; inset: 0; z-index: 20;
    background: rgba(0,0,0,0.6); backdrop-filter: blur(2px);
  }

  .lf-composer {
    position: absolute;
    bottom: 92px;
    left: 50%; transform: translateX(-50%);
    background: var(--bg-panel);
    border: 1px solid var(--accent);
    padding: 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    width: calc(100% - 32px);
    max-width: 408px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
  }
  .lf-composer--rpt { border-color: var(--danger); }

  .lf-input {
    flex: 1;
    background: var(--bg-input);
    border: 1px solid var(--border-mid);
    padding: 10px 12px;
    font-size: 13px;
    color: var(--text);
    outline: none;
    font-family: var(--font-sans);
  }
  .lf-input::placeholder { color: var(--text-dim); }
  .lf-input:focus { border-color: var(--accent); }
  .lf-input--rpt:focus { border-color: var(--danger); }
  .lf-input--rpt::placeholder { color: rgba(255,77,77,0.5); }

  .lf-send {
    width: 40px; height: 40px;
    background: var(--accent);
    color: #000;
    border: none;
    cursor: pointer;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: filter 120ms;
  }
  .lf-send:hover { filter: brightness(1.1); }
  .lf-send--rpt { background: var(--danger); color: #fff; }

  .lf-gif-btn {
    background: var(--bg-input);
    border: 1px solid var(--border-mid);
    color: var(--accent);
    font-family: var(--font-mono);
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.18em;
    padding: 0 12px;
    height: 40px;
    cursor: pointer;
    flex-shrink: 0;
  }
  .lf-gif-btn.active { background: var(--accent); color: #000; border-color: var(--accent); }

  .lf-gifpick {
    position: absolute;
    bottom: 156px;
    left: 50%; transform: translateX(-50%);
    width: calc(100% - 32px); max-width: 408px;
    background: var(--bg-panel);
    border: 1px solid var(--border);
    padding: 10px;
  }
  .lf-gif-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; }
  .lf-gif-opt {
    width: 100%; aspect-ratio: 1; object-fit: cover;
    cursor: pointer; border: 1px solid transparent;
    transition: border-color 120ms;
  }
  .lf-gif-opt:hover { border-color: var(--accent); }

  .lf-lightshow {
    position: fixed; inset: 0; z-index: 100;
    cursor: pointer;
    transition: background-color 0.06s linear;
    display: flex; align-items: center; justify-content: center;
  }
  .lf-lightshow__hint {
    color: rgba(0,0,0,0.55);
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.3em;
    text-transform: uppercase;
    pointer-events: none;
    animation: lf-fade 2s ease-in-out infinite alternate;
  }
  @keyframes lf-fade { from { opacity: 0.3; } to { opacity: 0.8; } }
`;
