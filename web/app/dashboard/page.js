// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ConsoleShell from "../components/ConsoleShell";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newConcert, setNewConcert] = useState({ concertName: "", startDate: 0, endDate: 0 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  async function getConcerts() {
    const res = await fetch("/api/venue/concert/list");
    const json = await res.json();
    setConcerts(json.data || []);
  }

  useEffect(() => {
    async function getUser() {
      const res = await fetch("/api/venue/me");
      const json = await res.json();
      if (!json.success || !json.loggedIn) {
        router.push("/onboard_page");
      } else {
        setUser(json);
        getConcerts();
      }
    }
    getUser();
  }, [router]);

  const handleLogout = () => fetch("/api/logout").then(() => router.push("/"));

  const handleCreateConcert = () => {
    fetch("/api/venue/concert/add", {
      method: "POST",
      body: JSON.stringify({
        concertName: newConcert.concertName,
        startDate: new Date(newConcert.startDate).getTime(),
        endDate:   new Date(newConcert.endDate).getTime(),
      }),
    }).then(() => {
      getConcerts();
      setShowModal(false);
      setNewConcert({ concertName: "", startDate: 0, endDate: 0 });
    });
  };

  const handleDeleteConcert = () => {
    fetch("/api/venue/concert/delete", {
      method: "POST",
      body: JSON.stringify({ concertId: confirmDeleteId }),
    }).then(() => {
      getConcerts();
      setConfirmDeleteId(null);
    });
  };

  const handleManage = (concertId) => router.push(`/manage?concertId=${concertId}`);

  if (!user) {
    return (
      <ConsoleShell>
        <div className="cc-mono" style={{ color: "var(--text-muted)", padding: 40 }}>
          ► Booting venue session…
        </div>
      </ConsoleShell>
    );
  }

  return (
    <ConsoleShell>
      <section className="cc-hero">
        <div className="cc-hero__status">Status: Online</div>
        <h1 className="cc-hero__title">Venue Console</h1>
        <p className="cc-hero__sub">
          Signed in as <span className="cc-mono" style={{ color: "var(--accent)" }}>{user.email}</span>
        </p>
      </section>

      <div className="cc-stat-grid">
        <Stat num={concerts.length} label="My Concerts" sub="Active in your roster" />
        <Stat num={concerts.length > 0 ? "LIVE" : "—"} label="Status" sub="Broadcast state" />
        <Stat num="∞" label="Capacity" sub="Per live room" />
        <Stat num="0ms" label="Latency" sub="Console to edge" />
      </div>

      <div className="cc-panel" style={{ marginBottom: 20 }}>
        <div
          className="cc-panel__head"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
        >
          <span>Your Concerts</span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="cc-btn cc-btn--sm" onClick={() => setShowModal(true)}>
              + New Concert
            </button>
            <button className="cc-btn cc-btn--sm cc-btn--danger" onClick={handleLogout}>
              Sign Out
            </button>
          </div>
        </div>

        <div style={{ padding: 0 }}>
          {concerts.length === 0 ? (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
              No concerts yet. Press <span className="cc-mono" style={{ color: "var(--accent)" }}>+ New Concert</span> to schedule your first.
            </div>
          ) : (
            <table className="cc-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Concert Name</th>
                  <th>Start</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {concerts.map((c) => (
                  <tr key={c.idConcert}>
                    <td className="cc-mono" style={{ color: "var(--text-muted)" }}>
                      {String(c.idConcert).padStart(6, "0")}
                    </td>
                    <td style={{ fontWeight: 600 }}>{c.ConcertName}</td>
                    <td className="cc-mono" style={{ color: "var(--text-muted)", fontSize: 12 }}>
                      {new Date(c.StartDate).toLocaleString()}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="cc-btn cc-btn--sm cc-btn--ghost"
                        style={{ marginRight: 8 }}
                        onClick={() => handleManage(c.idConcert)}
                      >
                        Manage
                      </button>
                      <button
                        className="cc-btn cc-btn--sm cc-btn--danger"
                        onClick={() => setConfirmDeleteId(c.idConcert)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showModal && (
        <Modal onClose={() => setShowModal(false)} title="+ Schedule New Concert">
          <div className="cc-field">
            <label className="cc-field__label">Concert Name</label>
            <input
              type="text"
              className="cc-input"
              placeholder="e.g. Sunset Sessions"
              value={newConcert.concertName}
              onChange={(e) => setNewConcert({ ...newConcert, concertName: e.target.value })}
            />
          </div>
          <div className="cc-field">
            <label className="cc-field__label">Start Time</label>
            <input
              type="datetime-local"
              className="cc-input"
              value={newConcert.startDate}
              onChange={(e) => setNewConcert({ ...newConcert, startDate: e.target.value })}
            />
          </div>
          <div className="cc-field">
            <label className="cc-field__label">End Time</label>
            <input
              type="datetime-local"
              className="cc-input"
              value={newConcert.endDate}
              onChange={(e) => setNewConcert({ ...newConcert, endDate: e.target.value })}
            />
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button className="cc-btn cc-btn--ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
              Cancel
            </button>
            <button className="cc-btn" style={{ flex: 1 }} onClick={handleCreateConcert}>
              Create
            </button>
          </div>
        </Modal>
      )}

      {confirmDeleteId && (
        <Modal onClose={() => setConfirmDeleteId(null)} title="! Confirm Deletion" danger>
          <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, marginBottom: 22 }}>
            This will permanently destroy the concert, its live room, all chat messages, and lighting state.
            <br />
            <span className="cc-mono" style={{ color: "var(--danger)" }}>
              [ WARN ] This action cannot be undone.
            </span>
          </p>
          <div style={{ display: "flex", gap: 10 }}>
            <button className="cc-btn cc-btn--ghost" style={{ flex: 1 }} onClick={() => setConfirmDeleteId(null)}>
              Cancel
            </button>
            <button className="cc-btn cc-btn--danger" style={{ flex: 1 }} onClick={handleDeleteConcert}>
              Delete
            </button>
          </div>
        </Modal>
      )}
    </ConsoleShell>
  );
}

function Stat({ num, label, sub }) {
  return (
    <div className="cc-stat">
      <div className="cc-stat__num">{num}</div>
      <div className="cc-stat__label">{label}</div>
      <div className="cc-stat__sub">{sub}</div>
    </div>
  );
}

function Modal({ children, onClose, title, danger }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 50,
        background: "rgba(0,0,0,0.78)", backdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cc-panel"
        style={{
          maxWidth: 460, width: "100%",
          borderTop: `2px solid ${danger ? "var(--danger)" : "var(--accent)"}`,
        }}
      >
        <div
          className="cc-panel__head"
          style={{ color: danger ? "var(--danger)" : "var(--accent)" }}
        >
          {title}
        </div>
        <div className="cc-panel__body">{children}</div>
      </div>
    </div>
  );
}
