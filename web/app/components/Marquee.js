"use client";

const DEFAULT_ITEMS = [
  "CONCERT COMPANION V1.0",
  "SYSTEM ACTIVE",
  "ALL CHANNELS NOMINAL",
  "TICKETS MOVING",
  "UPTIME 99.9%",
  "ARTIST: KENDRICK LAMAR",
  "ARTIST: TAYLOR SWIFT",
  "ARTIST: SABRINA CARPENTER",
  "ARTIST: GUNNA",
  "ARTIST: BLADEE",
  "ARTIST: CHAPPELL ROAN",
  "ARTIST: DJ ELIJAH",
  "VENUES ONLINE: 12",
  "LIVE ROOMS: 6",
];

export default function Marquee({ items = DEFAULT_ITEMS, prefix = "LIVE FEED" }) {
  const full = items.slice();
  const renderRow = (keyPrefix) => (
    <>
      <span className="cc-marquee__item" style={{ color: "#000", fontWeight: 800 }}>
        ▶ {prefix}
      </span>
      {full.map((it, i) => (
        <span key={`${keyPrefix}-${i}`} style={{ display: "inline-flex", alignItems: "center" }}>
          <span className="cc-marquee__sep">·</span>
          <span className="cc-marquee__item">{it}</span>
        </span>
      ))}
    </>
  );

  return (
    <div className="cc-marquee" role="status" aria-label="Live system feed">
      <div className="cc-marquee__track">
        {renderRow("a")}
        {renderRow("b")}
      </div>
    </div>
  );
}
