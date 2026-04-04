// app/manage/page.js
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";

export default function ManagePage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const concertId = searchParams.get("concertId");
  const [activeTab, setActiveTab] = useState("lightsync");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  // Concert data
  const [concert, setConcert] = useState(null);

  // QR modal
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrUrl, setQrUrl] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const qrCanvasRef = useRef(null);

  // Lighting state
  const [activeEffect, setActiveEffect] = useState(null);
  const [baseColor, setBaseColor] = useState("#38b6ff");
  const [brightness, setBrightness] = useState(100);
  const [effectSpeed, setEffectSpeed] = useState(1.0);
  const [effectIntensity, setEffectIntensity] = useState(1.0);
  const [previewColor, setPreviewColor] = useState("#38b6ff");
  const effectRef = useRef(null);


  function fetchMessages() {
    fetch("/api/chat/get?concertId=" + concertId).then(async (response) => {
      let json_response = await response.json()
      if (json_response.success) {
        setMessages(json_response.data)
      }
    })
  }
  // Load concert + build join URL
  useEffect(() => {
    if (!concertId) return;
    const saved = localStorage.getItem("concerts");
    if (saved) {
      const concerts = JSON.parse(saved);
      const found = concerts.find((c) => String(c.id) === String(concertId));
      setConcert(found || null);
    }
    setQrUrl(`${window.location.origin}/UserOnboarding?concertId=${concertId}`);

    setInterval(fetchMessages, 250)
  }, [concertId]);

  // ── QR actions ──────────────────────────────────────────

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(qrUrl);
    } catch {
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

  // Download the QR canvas as a PNG, then print it as a PDF page
  const handleDownloadPDF = () => {
    // Grab the canvas rendered by QRCodeCanvas
    const canvas = document.getElementById("qr-canvas");
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const concertName = concert?.name || `Concert #${concertId}`;

    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${concertName} – QR Code</title>
          <style>
            body {
              font-family: sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              background: #fff;
              color: #111;
            }
            h1 { font-size: 24px; margin-bottom: 8px; text-align: center; }
            p { font-size: 13px; color: #555; margin-bottom: 24px; word-break: break-all; text-align: center; max-width: 400px; }
            img { width: 280px; height: 280px; }
            .footer { margin-top: 20px; font-size: 12px; color: #aaa; }
          </style>
        </head>
        <body>
          <h1>${concertName}</h1>
          <p>Scan to join the live experience:<br/>${qrUrl}</p>
          <img src="${dataUrl}" />
          <div class="footer">Powered by Stagefront</div>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() { window.close(); };
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const shareLinks = [
    {
      name: "Twitter / X",
      color: "#000",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      href: () => `https://twitter.com/intent/tweet?text=${encodeURIComponent("Join my live concert! 🎵")}&url=${encodeURIComponent(qrUrl)}`,
    },
    {
      name: "Facebook",
      color: "#1877F2",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
      href: () => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(qrUrl)}`,
    },
    {
      name: "WhatsApp",
      color: "#25D366",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      ),
      href: () => `https://wa.me/?text=${encodeURIComponent(`Join my live concert! 🎵 ${qrUrl}`)}`,
    },
    {
      name: "Telegram",
      color: "#2CA5E0",
      icon: (
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      ),
      href: () => `https://t.me/share/url?url=${encodeURIComponent(qrUrl)}&text=${encodeURIComponent("Join my live concert! 🎵")}`,
    },
  ];

  // ── Lighting helpers ─────────────────────────────────────

  const applyBrightness = (hex, percent) => {
    if (!hex || hex === "#000000") return hex;
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const factor = percent / 100;
    return `rgb(${Math.min(255, Math.floor(r * factor))}, ${Math.min(255, Math.floor(g * factor))}, ${Math.min(255, Math.floor(b * factor))})`;
  };

  function handleDeleteMessage(id) {
    fetch('/api/chat/delete', {
      method: 'POST',
      body: JSON.stringify({
        chatId: id
      })
    })
  }

  const updateSharedColor = useCallback((color) => {
    setPreviewColor(color);
    if (!concertId) return;
    localStorage.setItem(`lightsync_${concertId}`, color);

    let color_code = (brightness << 24) | (parseInt(baseColor.replace("#", 16), 16) & 0xFFFFFF);
    fetch("/api/venue/concert/setcolor", {
      method: "POST", body: JSON.stringify({
        concertId: concertId,
        color: color_code
      })
    })
  }, [concertId]);

  const stopEffect = useCallback(() => {
    if (effectRef.current) { clearInterval(effectRef.current); effectRef.current = null; }
    setActiveEffect(null);
    const color = applyBrightness(baseColor, brightness);
    setPreviewColor(color);
    updateSharedColor(color);

  }, [baseColor, brightness, updateSharedColor]);

  const startEffect = useCallback((type) => {
    if (effectRef.current) { clearInterval(effectRef.current); effectRef.current = null; }
    setActiveEffect(type);
    const getDelay = (baseMs) => Math.max(20, baseMs / effectSpeed);

    if (type === "strobe") {
      let toggle = false;
      effectRef.current = setInterval(() => {
        updateSharedColor(toggle ? "#ffffff" : "#000000");
        toggle = !toggle;
      }, getDelay(150));
    } else if (type === "breath") {
      let step = 0;
      const r0 = parseInt(baseColor.slice(1, 3), 16);
      const g0 = parseInt(baseColor.slice(3, 5), 16);
      const b0 = parseInt(baseColor.slice(5, 7), 16);
      const brightnessFactor = brightness / 100;
      effectRef.current = setInterval(() => {
        const rawIntensity = (Math.sin(step * 0.2 * effectSpeed) + 1) / 2;
        const intensity = 0.2 + rawIntensity * effectIntensity * 0.8;
        const finalFactor = intensity * brightnessFactor;
        updateSharedColor(`rgb(${Math.min(255, Math.floor(r0 * finalFactor))}, ${Math.min(255, Math.floor(g0 * finalFactor))}, ${Math.min(255, Math.floor(b0 * finalFactor))})`);
        step++;
      }, getDelay(100));
    } else if (type === "rainbow") {
      let hue = 0;
      effectRef.current = setInterval(() => {
        updateSharedColor(`hsl(${hue}, 100%, 50%)`);
        hue = (hue + 5 * effectSpeed) % 360;
      }, getDelay(100));
    }
  }, [baseColor, brightness, effectSpeed, effectIntensity, updateSharedColor]);

  useEffect(() => {
    if (activeEffect) startEffect(activeEffect);
    else updateSharedColor(applyBrightness(baseColor, brightness));
  }, [baseColor, brightness, effectSpeed, effectIntensity, activeEffect, startEffect, updateSharedColor]);

  useEffect(() => {
    if (!concertId) return;
    const savedMessages = localStorage.getItem(`chat_${concertId}`);
    if (savedMessages) setMessages(JSON.parse(savedMessages));
  }, [concertId]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    fetch("/api/chat/post", {
      method: "POST",
      body: JSON.stringify({
        concertId: concertId,
        messageData: newMessage,
        messageType: "announcement"
      })
    })
    setNewMessage("");
  };

  const presets = {
    "Warm Glow": { baseColor: "#ff8844", brightness: 120, effect: null },
    "Cold Wave": { baseColor: "#2288ff", brightness: 90, effect: null },
    "Party Strobe": { baseColor: "#ff44aa", brightness: 150, effect: "strobe", speed: 2.0 },
    "Deep Breath": { baseColor: "#8844ff", brightness: 80, effect: "breath", speed: 0.5, intensity: 0.8 },
    "Rainbow Rush": { baseColor: "#ff0000", brightness: 100, effect: "rainbow", speed: 1.5 },
  };

  const applyPreset = (name) => {
    const p = presets[name];
    setBaseColor(p.baseColor);
    setBrightness(p.brightness);
    if (p.speed) setEffectSpeed(p.speed);
    if (p.intensity) setEffectIntensity(p.intensity);
    if (p.effect) setTimeout(() => startEffect(p.effect), 20);
    else stopEffect();
  };

  if (!concertId) {
    return <div className="min-h-screen bg-black text-white flex items-center justify-center">Invalid concert.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050d1a] to-[#0a1f3d] text-white">
      <div className="max-w-5xl mx-auto p-6">
        <button onClick={() => router.push("/dashboard")} className="mb-4 text-[#38b6ff]">
          ← Back to Dashboard
        </button>

        {/* Header row */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold">{concert ? concert.name : `Concert #${concertId}`}</h1>
            {concert && <p className="text-sm text-[#b0d4ff] mt-1">{concert.date} at {concert.time}</p>}
          </div>
          <button
            onClick={() => setShowQRModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#38b6ff]/50 text-[#38b6ff] hover:bg-[#38b6ff]/10 transition text-sm font-medium whitespace-nowrap self-start"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h1v1h-1zM17 14h1v1h-1zM20 14v1M14 17v1M17 17h3v3h-3z" strokeLinecap="round" />
            </svg>
            My QR Code
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-[#38b6ff]/20 mb-6">
          {["lightsync", "chat", "reports"].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 capitalize transition ${activeTab === tab ? "border-b-2 border-[#38b6ff] text-[#38b6ff]" : "text-gray-400 hover:text-white"}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* LightSync */}
        {activeTab === "lightsync" && (
          <div className="space-y-6">
            <div className="bg-[#0a1f3d]/60 rounded-xl p-6 border border-[#38b6ff]/20">
              <h2 className="text-lg font-semibold mb-4">Live Preview</h2>
              <div className="w-full h-32 rounded-xl" style={{ backgroundColor: previewColor, transition: activeEffect === "strobe" ? "none" : "background-color 80ms ease" }} />
              <p className="text-center text-sm mt-2 text-gray-300">{activeEffect ? `Effect: ${activeEffect} running` : "Static color"}</p>
            </div>

            <div className="bg-[#0a1f3d]/60 rounded-xl p-6 border border-[#38b6ff]/20">
              <h3 className="text-md font-medium mb-3">Color & Brightness</h3>
              <div className="flex flex-wrap gap-4 items-end">
                <div>
                  <label className="block text-sm text-gray-300 mb-1">Base Color</label>
                  <input type="color" value={baseColor} onChange={(e) => setBaseColor(e.target.value)}
                    disabled={activeEffect !== null && activeEffect !== "rainbow"}
                    className={`w-16 h-10 rounded border border-[#38b6ff]/30 ${activeEffect ? "opacity-50" : ""}`} />
                </div>
                <div className="flex-1">
                  <label className="block text-sm text-gray-300 mb-1">Brightness: {brightness}%</label>
                  <input type="range" min="20" max="200" step="1" value={brightness}
                    onChange={(e) => setBrightness(parseInt(e.target.value))} className="w-full" />
                </div>
              </div>
            </div>
            <div>
              {/*
            <div className="bg-[#0a1f3d]/60 rounded-xl p-6 border border-[#38b6ff]/20">
              <h3 className="text-md font-medium mb-3">Lighting Effects</h3>
              <div className="flex flex-wrap gap-3 mb-4">
                {["strobe", "breath", "rainbow"].map((effect) => (
                  <button key={effect} onClick={() => { if (activeEffect === effect) stopEffect(); else startEffect(effect); }}
                    className={`px-4 py-2 rounded-full transition capitalize ${activeEffect === effect ? "bg-[#38b6ff] text-black" : "bg-white/10 hover:bg-white/20"}`}>
                    {effect} {activeEffect === effect && "✓"}
                  </button>
                ))}
                <button onClick={stopEffect} className="px-4 py-2 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition">Stop All</button>
              </div>
              {activeEffect && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-[#38b6ff]/20">
                  <div>
                    <label className="block text-sm text-gray-300 mb-1">Speed: {effectSpeed.toFixed(1)}x</label>
                    <input type="range" min="0.2" max="3.0" step="0.05" value={effectSpeed}
                      onChange={(e) => setEffectSpeed(parseFloat(e.target.value))} className="w-full" />
                  </div>
                  {activeEffect !== "strobe" && (
                    <div>
                      <label className="block text-sm text-gray-300 mb-1">Intensity: {Math.round(effectIntensity * 100)}%</label>
                      <input type="range" min="0.1" max="1.0" step="0.01" value={effectIntensity}
                        onChange={(e) => setEffectIntensity(parseFloat(e.target.value))} className="w-full" />
                    </div>
                  )}
                </div>

            <div className="bg-[#0a1f3d]/60 rounded-xl p-6 border border-[#38b6ff]/20">
              <h3 className="text-md font-medium mb-3">Quick Presets</h3>
              <div className="flex flex-wrap gap-2">
                {Object.keys(presets).map((name) => (
                  <button key={name} onClick={() => applyPreset(name)}
                    className="px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 text-sm transition">{name}</button>
                ))}
              </div>*/}
            </div>
          </div>
        )}

        {/* Chat */}
        {activeTab === "chat" && (
          <div className="bg-[#0a1f3d]/60 rounded-xl p-4 border border-[#38b6ff]/20">
            <div className="h-80 overflow-y-auto space-y-2 mb-4">
              {messages.length === 0 && <p className="text-gray-500 text-center">No messages yet.</p>}
              {messages.map((msg) => (
                <div key={msg.idChatMessage} className="bg-black/30 p-2 rounded flex justify-between items-start group">
                  <div className="flex-1">
                    <span className="text-xs text-[#38b6ff]">{msg.timestamp}</span>
                    <span className="ml-2 font-semibold">{msg.Username || "Official Concert"}:</span>
                    <span className="ml-2 break-words">{msg.Message}</span>
                  </div>
                  <button onClick={() => handleDeleteMessage(msg.idChatMessage)} className="text-red-400 opacity-0 group-hover:opacity-100 transition ml-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                placeholder="Send announcement..."
                className="flex-1 px-3 py-2 rounded bg-[#071628] border border-[#38b6ff]/30 text-white" />
              <button onClick={sendMessage} className="px-4 py-2 rounded bg-[#38b6ff] text-black font-semibold">Send</button>
            </div>
          </div>
        )}

        {/* Reports */}
        {activeTab === "reports" && (
          <div className="bg-[#0a1f3d]/60 rounded-xl p-6 border border-[#38b6ff]/20">
            <h2 className="text-lg font-semibold mb-2">Viewer Analytics</h2>
            <p className="text-gray-300">Total unique viewers: 1,234</p>
            <p className="text-gray-300">Peak concurrent: 567</p>
            <p className="text-gray-400 text-sm mt-4">(Placeholder – connect your analytics API)</p>
          </div>
        )}
      </div>

      {/* ── QR Code Modal ── */}
      {
        showQRModal && (
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => { if (e.target === e.currentTarget) setShowQRModal(false); }}
          >
            <div className="bg-[#0a1f3d] rounded-2xl border border-[#38b6ff]/30 p-6 max-w-sm w-full shadow-2xl">
              {/* Header */}
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-lg font-bold text-white">My QR Code</h2>
                <button onClick={() => setShowQRModal(false)} className="text-gray-400 hover:text-white transition">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* QR Code — rendered by qrcode.react directly into a canvas */}
              <div className="flex flex-col items-center mb-5">
                <div className="bg-white p-3 rounded-xl mb-3">
                  {qrUrl && (
                    <QRCodeCanvas
                      id="qr-canvas"
                      value={qrUrl}
                      size={240}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      level="H"
                      includeMargin={false}
                    />
                  )}
                </div>
                <p className="text-xs text-[#b0d4ff] text-center break-all px-2">{qrUrl}</p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3 mb-5">
                <button
                  onClick={handleCopyLink}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition ${copySuccess
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-white/5 hover:bg-white/10 text-white border border-white/10"
                    }`}
                >
                  {copySuccess ? (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Copied!</>
                  ) : (
                    <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>Copy Link</>
                  )}
                </button>

                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium bg-[#38b6ff]/10 hover:bg-[#38b6ff]/20 text-[#38b6ff] border border-[#38b6ff]/30 transition"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  Download PDF
                </button>
              </div>

              {/* Social share */}
              <div>
                <p className="text-xs text-gray-400 mb-3 text-center uppercase tracking-widest">Share to</p>
                <div className="flex justify-center gap-3">
                  {shareLinks.map((s) => (
                    <a key={s.name} href={s.href()} target="_blank" rel="noopener noreferrer" title={s.name}
                      className="w-10 h-10 rounded-full flex items-center justify-center transition hover:scale-110 hover:opacity-90"
                      style={{ backgroundColor: s.color }}>
                      <span className="text-white">{s.icon}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}
