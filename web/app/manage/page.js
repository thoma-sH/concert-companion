"use client";

export const dynamic = "force-dynamic";
import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import ConsoleShell from "../components/ConsoleShell";

function hexToRgbObj(hex) {
  const clean = (hex || "#000000").replace("#", "");
  return {
    r: parseInt(clean.slice(0, 2), 16) || 0,
    g: parseInt(clean.slice(2, 4), 16) || 0,
    b: parseInt(clean.slice(4, 6), 16) || 0,
  };
}

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.min(255, Math.max(0, v)).toString(16).padStart(2, "0")).join("");
}

function RgbPicker({ color, onChange }) {
  const { r, g, b } = hexToRgbObj(color);

  function update(channel, val) {
    const v = Math.min(255, Math.max(0, parseInt(val) || 0));
    const next = { r, g, b, [channel]: v };
    onChange(rgbToHex(next.r, next.g, next.b));
  }

  const channels = [
    { key: "r", label: "R", gradient: `linear-gradient(to right, ${rgbToHex(0, g, b)}, ${rgbToHex(255, g, b)})`, val: r },
    { key: "g", label: "G", gradient: `linear-gradient(to right, ${rgbToHex(r, 0, b)}, ${rgbToHex(r, 255, b)})`, val: g },
    { key: "b", label: "B", gradient: `linear-gradient(to right, ${rgbToHex(r, g, 0)}, ${rgbToHex(r, g, 255)})`, val: b },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {channels.map(({ key, label, gradient, val }) => (
        <div key={key}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span className="cc-label">{label} channel</span>
            <input
              type="number" min={0} max={255} value={val}
              onChange={(e) => update(key, e.target.value)}
              className="cc-input cc-mono"
              style={{ width: 72, textAlign: "right", padding: "4px 8px", fontSize: 12 }}
            />
          </div>
          <div style={{ position: "relative", height: 14, cursor: "pointer", background: gradient, border: "1px solid var(--border-mid)" }}>
            <input
              type="range" min={0} max={255} value={val}
              onChange={(e) => update(key, e.target.value)}
              style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }}
            />
            <div
              style={{
                position: "absolute", top: "50%", transform: "translateY(-50%)",
                width: 14, height: 18, background: "var(--accent)",
                left: `calc(${(val / 255) * 100}% - 7px)`, pointerEvents: "none",
              }}
            />
          </div>
        </div>
      ))}
      <div style={{ height: 32, border: "1px solid var(--border-mid)", backgroundColor: color }} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ManagePage />
    </Suspense>
  );
}

function ManagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const concertId = searchParams.get("concertId");
  const [activeTab, setActiveTab] = useState("lightsync");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [concert, setConcert] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [baseColor, setBaseColor] = useState("#c8ff00");
  const [brightness, setBrightness] = useState(100);
  const [activeEffect, setActiveEffect] = useState(null);
  const [previewColor, setPreviewColor] = useState("#c8ff00");
  const [effectSpeed, setEffectSpeed] = useState(1.0);

  const previewIntervalRef = useRef(null);

  function applyBrightnessToHex(hex, percent) {
    if (!hex || hex === "#000000") return hex;
    const { r, g, b } = hexToRgbObj(hex);
    const f = Math.min(percent, 100) / 100;
    return `rgb(${Math.min(255, Math.floor(r * f))}, ${Math.min(255, Math.floor(g * f))}, ${Math.min(255, Math.floor(b * f))})`;
  }

  const updateSharedState = useCallback(async (effect, color) => {
    if (!concertId) return;
    try {
      await fetch("/api/concertState", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ concertId, effect, color }),
      });
    } catch (err) {
      console.error("Failed to update concert state:", err);
    }
  }, [concertId]);

  const stopLocalPreview = useCallback(() => {
    if (previewIntervalRef.current) {
      clearInterval(previewIntervalRef.current);
      previewIntervalRef.current = null;
    }
  }, []);

  const startLocalPreview = useCallback((type) => {
    stopLocalPreview();
    const { r, g, b } = hexToRgbObj(baseColor);
    const brightnessFactor = brightness / 100;

    if (type === "breath") {
      let step = 0;
      previewIntervalRef.current = setInterval(() => {
        const intensity = (Math.sin(step * 0.2 * effectSpeed) + 1) / 2;
        const f = (0.1 + intensity * 0.9) * brightnessFactor;
        const color = `rgb(${Math.min(255, Math.floor(r * f))}, ${Math.min(255, Math.floor(g * f))}, ${Math.min(255, Math.floor(b * f))})`;
        setPreviewColor(color);
        step++;
      }, 100);
    } else if (type === "rainbow") {
      let hue = 0;
      previewIntervalRef.current = setInterval(() => {
        setPreviewColor(`hsl(${hue}, 100%, 50%)`);
        hue = (hue + 4 * effectSpeed) % 360;
      }, 80);
    }
  }, [baseColor, brightness, effectSpeed, stopLocalPreview]);

  useEffect(() => {
    if (activeEffect) {
      updateSharedState(activeEffect, baseColor);
      startLocalPreview(activeEffect);
    } else {
      updateSharedState("solid", baseColor);
      setPreviewColor(applyBrightnessToHex(baseColor, brightness));
      stopLocalPreview();
    }
  }, [activeEffect, baseColor, brightness, effectSpeed, updateSharedState, startLocalPreview, stopLocalPreview]);

  useEffect(() => () => stopLocalPreview(), [stopLocalPreview]);

  function fetchMessages() {
    if (!concertId) return;
    fetch("/api/chat/get?concertId=" + concertId)
      .then((res) => res.json())
      .then((data) => { if (data.success) setMessages(data.data); });
  }

  useEffect(() => {
    if (!concertId) return;
    fetch("/api/venue/concert/list")
      .then((r) => r.json())
      .then((json) => {
        if (json.data) {
          const found = json.data.find((c) => String(c.idConcert) === String(concertId));
          setConcert(found || null);
        }
      });
    setQrUrl(`${window.location.origin}/UserOnboarding?concertId=${concertId}`);
    fetchMessages();
    const interval = setInterval(fetchMessages, 250);
    return () => clearInterval(interval);
  }, [concertId]);

  function handleDeleteMessage(id) {
    fetch("/api/chat/delete", { method: "POST", body: JSON.stringify({ chatId: id }) });
  }

  function sendMessage() {
    if (!newMessage.trim()) return;
    fetch("/api/chat/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ concertId, messageData: newMessage, messageType: "announcement" }),
    });
    setNewMessage("");
  }

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(qrUrl); }
    catch {
      const el = document.createElement("textarea");
      el.value = qrUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleDownloadPDF = () => {
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const concertName = concert?.ConcertName || `Concert #${concertId}`;
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`<!DOCTYPE html><html><head><title>${concertName} – QR Code</title>
      <style>body{font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#fff;color:#111;}
      h1{font-size:24px;margin-bottom:8px;text-align:center;}p{font-size:13px;color:#555;margin-bottom:24px;word-break:break-all;text-align:center;max-width:400px;}
      img{width:280px;height:280px;}.footer{margin-top:20px;font-size:12px;color:#aaa;}</style></head>
      <body><h1>${concertName}</h1><p>Scan to join the live experience:<br/>${qrUrl}</p><img src="${dataUrl}"/>
      <div class="footer">Powered by Concert Companion</div>
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script></body></html>`);
    printWindow.document.close();
  };

  const presetColors = ["#ff0000", "#ff6600", "#ffff00", "#c8ff00", "#00ff00", "#00ffff", "#0066ff", "#ff00ff"];
  const effects = ["breath", "rainbow"];

  if (!concertId) {
    return (
      <ConsoleShell>
        <div className="cc-feedback cc-feedback--err">
          <span className="cc-feedback__tag">[ ERR ]</span>NO CONCERT ID PROVIDED — RETURN TO DASHBOARD
        </div>
        <button className="cc-btn" style={{ marginTop: 16 }} onClick={() => router.push("/dashboard")}>
          ← Back to Dashboard
        </button>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell>
      <button className="cc-back" onClick={() => router.push("/dashboard")}>← Back to Dashboard</button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
        <div>
          <h1 className="cc-h1" style={{ marginBottom: 4 }}>
            {concert ? concert.ConcertName : `Concert #${concertId}`}
          </h1>
          {concert && (
            <p className="cc-mono" style={{ color: "var(--text-muted)", fontSize: 12, letterSpacing: "0.06em" }}>
              ► {new Date(concert.StartDate).toLocaleString()}
            </p>
          )}
        </div>
        <button className="cc-btn cc-btn--ghost" onClick={() => setShowQRModal(true)}>
          ◫ My QR Code
        </button>
      </div>

      <div style={{ display: "flex", gap: 0, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
        {["lightsync", "chat"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none",
              padding: "12px 20px",
              fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.18em",
              textTransform: "uppercase", cursor: "pointer", fontWeight: 600,
              color: activeTab === tab ? "var(--accent)" : "var(--text-muted)",
              borderBottom: `2px solid ${activeTab === tab ? "var(--accent)" : "transparent"}`,
              marginBottom: -1,
            }}
          >
            + {tab}
          </button>
        ))}
      </div>

      {activeTab === "lightsync" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div className="cc-panel" style={{ gridColumn: "1 / -1" }}>
            <div className="cc-panel__head">Live Preview</div>
            <div
              style={{
                height: 120, display: "flex", alignItems: "center", justifyContent: "center",
                backgroundColor: previewColor, transition: "background-color 120ms ease",
              }}
            >
              <span
                className="cc-mono"
                style={{
                  fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase",
                  opacity: 0.5, mixBlendMode: "difference", color: "#fff",
                }}
              >
                ► {activeEffect ? `${activeEffect} running` : "solid output"}
              </span>
            </div>
          </div>

          <div className="cc-panel">
            <div className="cc-panel__head">Color</div>
            <div className="cc-panel__body">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6, marginBottom: 16 }}>
                {presetColors.map((c) => (
                  <button
                    key={c}
                    onClick={() => { setBaseColor(c); if (activeEffect) setActiveEffect(null); }}
                    style={{
                      width: "100%", aspectRatio: "1",
                      background: c, border: `1px solid ${baseColor === c ? "var(--accent)" : "var(--border-mid)"}`,
                      cursor: "pointer", padding: 0,
                    }}
                  />
                ))}
              </div>
              <RgbPicker color={baseColor} onChange={(hex) => { setBaseColor(hex); if (activeEffect) setActiveEffect(null); }} />
            </div>
          </div>

          <div className="cc-panel">
            <div className="cc-panel__head">Brightness</div>
            <div className="cc-panel__body">
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <span className="cc-label">Output level</span>
                <span className="cc-mono" style={{ color: "var(--accent)", fontSize: 12 }}>{brightness}%</span>
              </div>
              <div style={{ position: "relative", height: 14, background: `linear-gradient(to right, #000, ${baseColor})`, border: "1px solid var(--border-mid)" }}>
                <input
                  type="range" min="0" max="100" value={brightness}
                  onChange={(e) => { setBrightness(parseInt(e.target.value)); if (activeEffect) setActiveEffect(null); }}
                  style={{ position: "absolute", inset: 0, width: "100%", opacity: 0, cursor: "pointer" }}
                />
                <div style={{
                  position: "absolute", top: "50%", transform: "translateY(-50%)",
                  width: 14, height: 18, background: "var(--accent)",
                  left: `calc(${brightness}% - 7px)`, pointerEvents: "none",
                }} />
              </div>

              <div style={{ marginTop: 22 }}>
                <div className="cc-label" style={{ marginBottom: 8 }}>Effects</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {effects.map((effect) => (
                    <button
                      key={effect}
                      onClick={() => setActiveEffect(activeEffect === effect ? null : effect)}
                      className={activeEffect === effect ? "cc-btn" : "cc-btn cc-btn--ghost"}
                    >
                      {activeEffect === effect ? "✓ " : ""}{effect}
                    </button>
                  ))}
                </div>
                {activeEffect && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span className="cc-label">Speed</span>
                      <span className="cc-mono" style={{ color: "var(--accent)", fontSize: 12 }}>
                        {effectSpeed.toFixed(1)}×
                      </span>
                    </div>
                    <input
                      type="range" min="0.2" max="3.0" step="0.1" value={effectSpeed}
                      onChange={(e) => setEffectSpeed(parseFloat(e.target.value))}
                      style={{ width: "100%", accentColor: "var(--accent)" }}
                    />
                    <button
                      className="cc-btn cc-btn--danger cc-btn--block"
                      style={{ marginTop: 14 }}
                      onClick={() => setActiveEffect(null)}
                    >
                      Stop Effect
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "chat" && (
        <div className="cc-panel">
          <div className="cc-panel__head">Announcement Channel</div>
          <div className="cc-panel__body">
            <div style={{ height: 360, overflowY: "auto", marginBottom: 14, display: "flex", flexDirection: "column", gap: 6 }}>
              {messages.length === 0 && (
                <p className="cc-mono" style={{ color: "var(--text-dim)", textAlign: "center", padding: 30, fontSize: 12 }}>
                  ► No messages yet
                </p>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.idChatMessage}
                  style={{
                    padding: "10px 12px",
                    border: "1px solid var(--border)",
                    background: msg.Type == 20 ? "rgba(255,77,77,0.06)" : "var(--bg-elev)",
                    borderColor: msg.Type == 20 ? "rgba(255,77,77,0.3)" : "var(--border)",
                    display: "flex", justifyContent: "space-between", gap: 8,
                  }}
                  className="msg-row"
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span className="cc-mono" style={{ fontSize: 10, color: "var(--accent)", letterSpacing: "0.12em" }}>
                      {msg.timestamp}
                    </span>
                    <span style={{ marginLeft: 8, fontWeight: 600, color: "var(--text)" }}>
                      {msg.Username || "Official Concert"}
                    </span>
                    {(msg.Type != 4 && msg.Type != 1) && (
                      <span style={{ marginLeft: 8, color: "var(--text)", fontSize: 13 }}>{msg.Message}</span>
                    )}
                    {(msg.Type == 4 || msg.Type == 1) && (
                      <img alt="img" src={msg.Message} style={{ display: "block", maxWidth: 240, marginTop: 6 }} />
                    )}
                  </div>
                  <button
                    onClick={() => handleDeleteMessage(msg.idChatMessage)}
                    style={{
                      background: "none", border: "none", color: "var(--danger)", cursor: "pointer",
                      fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.18em",
                    }}
                  >
                    DEL
                  </button>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                type="text" value={newMessage} className="cc-input"
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Send announcement…"
                style={{ flex: 1 }}
              />
              <button className="cc-btn" onClick={sendMessage}>Send</button>
            </div>
          </div>
        </div>
      )}

      {showQRModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false); }}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div className="cc-panel" style={{ maxWidth: 380, width: "100%", borderTop: "2px solid var(--accent)" }}>
            <div className="cc-panel__head" style={{ display: "flex", justifyContent: "space-between" }}>
              <span>Concert QR</span>
              <button
                onClick={() => setShowQRModal(false)}
                style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
              >
                ✕
              </button>
            </div>
            <div className="cc-panel__body">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 16 }}>
                <div style={{ background: "#fff", padding: 12, marginBottom: 12 }}>
                  {qrUrl && <QRCodeCanvas id="qr-canvas" value={qrUrl} size={220} bgColor="#ffffff" fgColor="#000000" level="H" includeMargin={false} />}
                </div>
                <p
                  className="cc-mono"
                  style={{ fontSize: 10, color: "var(--text-muted)", textAlign: "center", wordBreak: "break-all", letterSpacing: "0.04em" }}
                >
                  {qrUrl}
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <button
                  onClick={handleCopyLink}
                  className={copySuccess ? "cc-btn" : "cc-btn cc-btn--ghost"}
                >
                  {copySuccess ? "✓ Copied" : "Copy Link"}
                </button>
                <button onClick={handleDownloadPDF} className="cc-btn cc-btn--ghost">
                  Print PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConsoleShell>
  );
}
