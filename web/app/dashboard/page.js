"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const MOCK_CONCERTS = [
  {
    id: 1,
    title: "Neon Nights Vol. 3",
    date: "Apr 5, 2026",
    time: "9:00 PM",
    viewers: 1204,
    status: "live",
  },
  {
    id: 2,
    title: "Acoustic Sessions",
    date: "Apr 12, 2026",
    time: "7:30 PM",
    viewers: 0,
    status: "upcoming",
  },
  {
    id: 3,
    title: "Bass Drop Festival",
    date: "Mar 28, 2026",
    time: "10:00 PM",
    viewers: 3820,
    status: "ended",
  },
];

export default function Dashboard() {
  const router = useRouter();
  const [concerts, setConcerts] = useState(MOCK_CONCERTS);
  const [showModal, setShowModal] = useState(false);
  const [newConcert, setNewConcert] = useState({ title: "", date: "", time: "" });
  const [formError, setFormError] = useState("");

  const handleCreate = () => {
    if (!newConcert.title.trim()) { setFormError("Concert name is required."); return; }
    if (!newConcert.date) { setFormError("Please pick a date."); return; }
    if (!newConcert.time) { setFormError("Please pick a time."); return; }

    const formatted = new Date(newConcert.date).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });

    setConcerts((prev) => [
      {
        id: Date.now(),
        title: newConcert.title.trim(),
        date: formatted,
        time: newConcert.time,
        viewers: 0,
        status: "upcoming",
      },
      ...prev,
    ]);
    setShowModal(false);
    setNewConcert({ title: "", date: "", time: "" });
    setFormError("");
  };

  const statusMeta = {
    live:     { label: "Live",     dot: "#38ffa0", text: "rgba(56,255,160,0.85)",  bg: "rgba(56,255,160,0.08)",  border: "rgba(56,255,160,0.25)" },
    upcoming: { label: "Upcoming", dot: "#38b6ff", text: "rgba(56,182,255,0.85)",  bg: "rgba(56,182,255,0.08)",  border: "rgba(56,182,255,0.25)" },
    ended:    { label: "Ended",    dot: "rgba(180,210,240,0.3)", text: "rgba(180,210,240,0.4)", bg: "rgba(180,210,240,0.04)", border: "rgba(180,210,240,0.12)" },
  };

  const liveConcerts    = concerts.filter((c) => c.status === "live");
  const upcomingConcerts = concerts.filter((c) => c.status === "upcoming");
  const endedConcerts   = concerts.filter((c) => c.status === "ended");

  return (
    <div style={styles.page}>
      <div style={styles.noiseBg} aria-hidden="true" />

      {/* Top nav */}
      <nav style={styles.nav}>
        <div style={styles.navBrand}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38b6ff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 19V6l12-3v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="15" r="3" />
          </svg>
          <span style={styles.brandText}>STAGEFRONT</span>
        </div>
        <div style={styles.navRight}>
          <div style={styles.avatar}>JD</div>
          <button style={styles.signOutBtn} onClick={() => router.push("/")}>Sign out</button>
        </div>
      </nav>

      {/* Main content */}
      <main style={styles.main}>

        {/* Header row */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.pageTitle}>Your Concerts</h1>
            <p style={styles.pageSubtitle}>{concerts.length} concert{concerts.length !== 1 ? "s" : ""} total</p>
          </div>
          <button style={styles.createBtn} onClick={() => setShowModal(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            New Concert
          </button>
        </div>

        {/* Stats row */}
        <div style={styles.statsRow}>
          {[
            { label: "Live now",   value: liveConcerts.length,    accent: "#38ffa0" },
            { label: "Upcoming",   value: upcomingConcerts.length, accent: "#38b6ff" },
            { label: "Total viewers", value: concerts.reduce((s, c) => s + c.viewers, 0).toLocaleString(), accent: "#b4d2f0" },
          ].map((s) => (
            <div key={s.label} style={styles.statCard}>
              <span style={{ ...styles.statValue, color: s.accent }}>{s.value}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Concert list */}
        {concerts.length === 0 ? (
          <div style={styles.emptyState}>
            <p style={styles.emptyText}>No concerts yet. Create your first one!</p>
          </div>
        ) : (
          <div style={styles.concertList}>
            {[...liveConcerts, ...upcomingConcerts, ...endedConcerts].map((concert) => {
              const meta = statusMeta[concert.status];
              return (
                <div key={concert.id} style={styles.concertCard}>
                  <div style={styles.concertLeft}>
                    <div style={{ ...styles.statusBadge, background: meta.bg, border: `0.5px solid ${meta.border}` }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.dot, flexShrink: 0,
                        ...(concert.status === "live" ? { animation: "pulse 1.5s ease infinite" } : {}) }} />
                      <span style={{ color: meta.text, fontSize: "11px", fontWeight: 500, letterSpacing: "0.05em" }}>
                        {meta.label}
                      </span>
                    </div>
                    <h3 style={styles.concertTitle}>{concert.title}</h3>
                    <p style={styles.concertMeta}>{concert.date} &middot; {concert.time}</p>
                  </div>
                  <div style={styles.concertRight}>
                    {concert.status !== "ended" && (
                      <div style={styles.viewerCount}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="rgba(180,210,240,0.4)" strokeWidth="1.5" strokeLinecap="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span style={styles.viewerNum}>
                          {concert.status === "live" ? concert.viewers.toLocaleString() : "—"}
                        </span>
                      </div>
                    )}
                    <button
                      style={{
                        ...styles.manageBtn,
                        ...(concert.status === "ended" ? styles.manageBtnMuted : {}),
                      }}
                      onClick={() => concert.status === "live" && router.push("/livefeed")}
                    >
                      {concert.status === "live" ? "Go Live" : concert.status === "upcoming" ? "Manage" : "View recap"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <span style={styles.footerText}>STAGEFRONT &mdash; Live Concert Platform</span>
      </footer>

      {/* Create concert modal */}
      {showModal && (
        <div style={styles.overlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>New Concert</h2>
              <button style={styles.closeBtn} onClick={() => setShowModal(false)}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div style={styles.modalFields}>
              <div style={styles.fieldGroup}>
                <label style={styles.label}>Concert name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Rooftop Session"
                  value={newConcert.title}
                  onChange={(e) => { setNewConcert((f) => ({ ...f, title: e.target.value })); setFormError(""); }}
                  style={styles.input}
                />
              </div>
              <div style={styles.modalRow}>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={newConcert.date}
                    onChange={(e) => { setNewConcert((f) => ({ ...f, date: e.target.value })); setFormError(""); }}
                    style={styles.input}
                  />
                </div>
                <div style={{ ...styles.fieldGroup, flex: 1 }}>
                  <label style={styles.label}>Time</label>
                  <input
                    type="time"
                    value={newConcert.time}
                    onChange={(e) => { setNewConcert((f) => ({ ...f, time: e.target.value })); setFormError(""); }}
                    style={styles.input}
                  />
                </div>
              </div>
              {formError && <p style={styles.fieldError}>{formError}</p>}
            </div>

            <div style={styles.modalActions}>
              <button style={styles.cancelModalBtn} onClick={() => setShowModal(false)}>Cancel</button>
              <button style={styles.confirmBtn} onClick={handleCreate}>Create Concert</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500&display=swap');
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        input[type="date"]::-webkit-calendar-picker-indicator,
        input[type="time"]::-webkit-calendar-picker-indicator {
          filter: invert(0.5) sepia(1) saturate(3) hue-rotate(175deg);
          cursor: pointer;
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
    fontFamily: "'DM Sans', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  noiseBg: {
    position: "absolute",
    inset: 0,
    backgroundImage: `radial-gradient(ellipse 80% 40% at 50% 0%, #0a1f3d 0%, transparent 65%),
      radial-gradient(ellipse 50% 30% at 90% 90%, #071628 0%, transparent 55%)`,
    zIndex: 0,
    pointerEvents: "none",
  },
  nav: {
    zIndex: 2,
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 32px",
    borderBottom: "0.5px solid rgba(56,182,255,0.1)",
    backdropFilter: "blur(12px)",
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  brandText: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "18px",
    letterSpacing: "0.1em",
    color: "#e0f0ff",
  },
  navRight: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  avatar: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    background: "rgba(56,182,255,0.15)",
    border: "0.5px solid rgba(56,182,255,0.3)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#38b6ff",
    fontSize: "11px",
    fontWeight: 500,
    letterSpacing: "0.04em",
  },
  signOutBtn: {
    background: "transparent",
    border: "0.5px solid rgba(56,182,255,0.15)",
    color: "rgba(180,210,240,0.45)",
    borderRadius: "7px",
    padding: "6px 12px",
    fontSize: "12px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
  main: {
    zIndex: 1,
    flex: 1,
    maxWidth: "760px",
    width: "100%",
    margin: "0 auto",
    padding: "36px 24px 48px",
    animation: "fadeUp 0.5s ease both",
  },
  headerRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: "28px",
    gap: "16px",
  },
  pageTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "42px",
    color: "#e0f0ff",
    margin: "0 0 4px",
    letterSpacing: "0.03em",
  },
  pageSubtitle: {
    color: "rgba(180,210,240,0.4)",
    fontSize: "13px",
    margin: 0,
    fontWeight: 300,
  },
  createBtn: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    padding: "11px 20px",
    background: "#38b6ff",
    color: "#050d1a",
    border: "none",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
    flexShrink: 0,
  },
  statsRow: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "12px",
    marginBottom: "28px",
  },
  statCard: {
    background: "rgba(56,182,255,0.04)",
    border: "0.5px solid rgba(56,182,255,0.1)",
    borderRadius: "14px",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  statValue: {
    fontSize: "26px",
    fontFamily: "'Bebas Neue', sans-serif",
    letterSpacing: "0.02em",
    lineHeight: 1,
  },
  statLabel: {
    fontSize: "12px",
    color: "rgba(180,210,240,0.4)",
    fontWeight: 300,
    letterSpacing: "0.04em",
  },
  concertList: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  concertCard: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    background: "rgba(56,182,255,0.03)",
    border: "0.5px solid rgba(56,182,255,0.1)",
    borderRadius: "14px",
    padding: "18px 20px",
    gap: "16px",
  },
  concertLeft: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
    minWidth: 0,
  },
  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "5px",
    padding: "3px 10px",
    borderRadius: "100px",
    width: "fit-content",
  },
  concertTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "20px",
    color: "#e0f0ff",
    margin: 0,
    letterSpacing: "0.03em",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  concertMeta: {
    color: "rgba(180,210,240,0.4)",
    fontSize: "12px",
    margin: 0,
    fontWeight: 300,
  },
  concertRight: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
    flexShrink: 0,
  },
  viewerCount: {
    display: "flex",
    alignItems: "center",
    gap: "5px",
  },
  viewerNum: {
    color: "rgba(180,210,240,0.45)",
    fontSize: "13px",
    fontWeight: 300,
  },
  manageBtn: {
    padding: "8px 16px",
    background: "rgba(56,182,255,0.1)",
    border: "0.5px solid rgba(56,182,255,0.25)",
    borderRadius: "8px",
    color: "#38b6ff",
    fontSize: "13px",
    fontWeight: 500,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  manageBtnMuted: {
    background: "rgba(180,210,240,0.04)",
    border: "0.5px solid rgba(180,210,240,0.1)",
    color: "rgba(180,210,240,0.35)",
  },
  emptyState: {
    padding: "48px 24px",
    textAlign: "center",
    border: "0.5px dashed rgba(56,182,255,0.15)",
    borderRadius: "16px",
  },
  emptyText: {
    color: "rgba(180,210,240,0.3)",
    fontSize: "14px",
    fontWeight: 300,
  },
  footer: {
    zIndex: 1,
    textAlign: "center",
    padding: "0 0 24px",
  },
  footerText: {
    color: "rgba(56,182,255,0.15)",
    fontSize: "11px",
    letterSpacing: "0.12em",
    fontWeight: 300,
  },
  // Modal
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(5,13,26,0.85)",
    zIndex: 50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "24px",
    backdropFilter: "blur(6px)",
  },
  modal: {
    background: "#071628",
    border: "0.5px solid rgba(56,182,255,0.2)",
    borderRadius: "20px",
    padding: "28px",
    width: "100%",
    maxWidth: "440px",
    animation: "fadeUp 0.25s ease both",
  },
  modalHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "24px",
  },
  modalTitle: {
    fontFamily: "'Bebas Neue', sans-serif",
    fontSize: "28px",
    color: "#e0f0ff",
    margin: 0,
    letterSpacing: "0.04em",
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "rgba(180,210,240,0.4)",
    cursor: "pointer",
    padding: "4px",
    display: "flex",
  },
  modalFields: {
    display: "flex",
    flexDirection: "column",
    gap: "16px",
    marginBottom: "24px",
  },
  modalRow: {
    display: "flex",
    gap: "12px",
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  label: {
    fontSize: "12px",
    fontWeight: 500,
    color: "rgba(180,210,240,0.6)",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
  },
  input: {
    width: "100%",
    padding: "11px 14px",
    background: "rgba(56,182,255,0.06)",
    border: "0.5px solid rgba(56,182,255,0.2)",
    borderRadius: "10px",
    color: "#e0f0ff",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    outline: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
  },
  fieldError: {
    color: "rgba(255,120,120,0.8)",
    fontSize: "12px",
    margin: "2px 0 0",
    fontWeight: 300,
  },
  modalActions: {
    display: "flex",
    gap: "10px",
  },
  cancelModalBtn: {
    flex: 1,
    padding: "12px",
    background: "transparent",
    border: "0.5px solid rgba(56,182,255,0.15)",
    borderRadius: "10px",
    color: "rgba(180,210,240,0.5)",
    fontSize: "14px",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
  confirmBtn: {
    flex: 2,
    padding: "12px",
    background: "#38b6ff",
    border: "none",
    borderRadius: "10px",
    color: "#050d1a",
    fontSize: "14px",
    fontWeight: 600,
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },
};
