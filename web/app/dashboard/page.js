// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newConcert, setNewConcert] = useState({ name: "", date: "", time: "" });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // concert id pending delete confirm

  // Load user & concerts from localStorage (mock)
  useEffect(() => {
    let storedUser = null;
    if (process.env.NODE_ENV === "development") {
      const devUser = localStorage.getItem("dev_user");
      if (devUser) storedUser = JSON.parse(devUser);
    }
    if (!storedUser) {
      const realUser = localStorage.getItem("user");
      if (realUser) storedUser = JSON.parse(realUser);
    }
    if (!storedUser) {
      router.push("/onboard_page");
      return;
    }
    setUser(storedUser);

    const savedConcerts = localStorage.getItem("concerts");
    if (savedConcerts) {
      setConcerts(JSON.parse(savedConcerts));
    } else {
      const mockConcerts = [
        { id: 1, name: "Neon Nights Tour", date: "2025-05-15", time: "20:00", status: "upcoming", viewers: 0, joinLink: "" },
        { id: 2, name: "Acoustic Sunset", date: "2025-06-10", time: "18:30", status: "upcoming", viewers: 0, joinLink: "" },
      ];
      setConcerts(mockConcerts);
      localStorage.setItem("concerts", JSON.stringify(mockConcerts));
    }
  }, [router]);

  // Save concerts to localStorage whenever they change
  useEffect(() => {
    if (concerts.length > 0) {
      localStorage.setItem("concerts", JSON.stringify(concerts));
    }
  }, [concerts]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    if (process.env.NODE_ENV === "development") localStorage.removeItem("dev_user");
    router.push("/");
  };

  const handleCreateConcert = () => {
    if (!newConcert.name || !newConcert.date || !newConcert.time) return;
    const concert = {
      id: Date.now(),
      ...newConcert,
      status: "upcoming",
      viewers: 0,
      joinLink: "",
    };
    setConcerts([concert, ...concerts]);
    setShowModal(false);
    setNewConcert({ name: "", date: "", time: "" });
  };

  // Delete concert + all associated live room data
  const handleDeleteConcert = (concertId) => {
    // Remove from concerts list
    const updated = concerts.filter((c) => c.id !== concertId);
    setConcerts(updated);
    // If list is now empty, clear the key entirely so the empty state shows
    if (updated.length === 0) {
      localStorage.removeItem("concerts");
    } else {
      localStorage.setItem("concerts", JSON.stringify(updated));
    }
    // Wipe associated live room data
    localStorage.removeItem(`lightsync_${concertId}`);
    localStorage.removeItem(`chat_${concertId}`);
    setConfirmDeleteId(null);
  };

  const handleGoLive = (concertId) => {
    const updatedConcerts = concerts.map((concert) => {
      if (concert.id === concertId) {
        const joinLink = `${window.location.origin}/livefeed?concertId=${concertId}`;
        return { ...concert, status: "live", joinLink, viewers: Math.floor(Math.random() * 500) + 50 };
      }
      return concert;
    });
    setConcerts(updatedConcerts);
  };

  const handleManage = (concertId) => {
    router.push(`/manage?concertId=${concertId}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#050d1a] via-[#071628] to-[#0a1f3d] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const liveCount = concerts.filter((c) => c.status === "live").length;
  const upcomingCount = concerts.filter((c) => c.status === "upcoming").length;
  const totalViewers = concerts.reduce((sum, c) => sum + (c.viewers || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050d1a] via-[#071628] to-[#0a1f3d]">
      {/* Navbar */}
      <nav className="bg-[#0a1f3d]/80 backdrop-blur-sm border-b border-[#38b6ff]/20 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#38b6ff] flex items-center justify-center">
            <span className="text-[#050d1a] font-bold text-sm">SF</span>
          </div>
          <span className="text-white font-bold text-xl">Concert Companion</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#38b6ff]/20 flex items-center justify-center ring-1 ring-[#38b6ff]/50">
              <span className="text-[#38b6ff] text-sm font-medium">
                {user.name?.charAt(0).toUpperCase() || "U"}
              </span>
            </div>
            <span className="text-white text-sm hidden sm:inline">{user.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-full border border-red-500/50 text-red-400 text-sm hover:bg-red-500/10 transition"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#0a1f3d]/40 backdrop-blur-sm rounded-xl p-4 border border-[#38b6ff]/20">
            <p className="text-[#b0d4ff] text-sm">Live Now</p>
            <p className="text-3xl font-bold text-white">{liveCount}</p>
          </div>
          <div className="bg-[#0a1f3d]/40 backdrop-blur-sm rounded-xl p-4 border border-[#38b6ff]/20">
            <p className="text-[#b0d4ff] text-sm">Upcoming</p>
            <p className="text-3xl font-bold text-white">{upcomingCount}</p>
          </div>
          <div className="bg-[#0a1f3d]/40 backdrop-blur-sm rounded-xl p-4 border border-[#38b6ff]/20">
            <p className="text-[#b0d4ff] text-sm">Total Viewers</p>
            <p className="text-3xl font-bold text-white">{totalViewers.toLocaleString()}</p>
          </div>
        </div>

        {/* Header + New Concert Button */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Your Concerts</h2>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-full bg-[#38b6ff] text-[#050d1a] font-semibold text-sm hover:bg-[#5fc4ff] transition shadow-lg shadow-[#38b6ff]/20"
          >
            + New Concert
          </button>
        </div>

        {/* Concert List */}
        <div className="space-y-4">
          {concerts.length === 0 ? (
            <div className="text-center py-12 bg-[#0a1f3d]/30 rounded-xl border border-[#38b6ff]/10">
              <p className="text-[#b0d4ff]">No concerts yet. Create your first one!</p>
            </div>
          ) : (
            concerts.map((concert) => (
              <div
                key={concert.id}
                className="bg-[#0a1f3d]/40 backdrop-blur-sm rounded-xl p-4 border border-[#38b6ff]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{concert.name}</h3>
                    {concert.status === "live" && (
                      <span className="flex items-center gap-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-500"></span>
                        </span>
                        LIVE
                      </span>
                    )}
                    {concert.status === "upcoming" && (
                      <span className="text-xs bg-[#38b6ff]/20 text-[#38b6ff] px-2 py-0.5 rounded-full">Upcoming</span>
                    )}
                    {concert.status === "ended" && (
                      <span className="text-xs bg-gray-500/20 text-gray-400 px-2 py-0.5 rounded-full">Ended</span>
                    )}
                  </div>
                  <p className="text-[#b0d4ff] text-sm">{concert.date} at {concert.time}</p>
                  {concert.status === "live" && (
                    <p className="text-xs text-[#38b6ff] mt-1">{concert.viewers} watching now</p>
                  )}
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  {concert.status === "upcoming" && (
                    <button
                      onClick={() => handleGoLive(concert.id)}
                      className="px-4 py-1.5 rounded-full bg-[#38b6ff]/20 text-[#38b6ff] text-sm hover:bg-[#38b6ff]/30 transition"
                    >
                      Go Live
                    </button>
                  )}
                  {concert.status === "live" && (
                    <button
                      onClick={() => handleManage(concert.id)}
                      className="px-4 py-1.5 rounded-full border border-[#38b6ff]/50 text-[#38b6ff] text-sm hover:bg-[#38b6ff]/10 transition"
                    >
                      Manage
                    </button>
                  )}
                  {concert.status === "ended" && (
                    <button className="px-4 py-1.5 rounded-full border border-gray-500/50 text-gray-400 text-sm hover:bg-gray-500/10 transition">
                      View Recap
                    </button>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={() => setConfirmDeleteId(concert.id)}
                    className="p-1.5 rounded-full text-red-400/50 hover:text-red-400 hover:bg-red-500/10 transition"
                    title="Delete concert"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* New Concert Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1f3d] rounded-2xl p-6 max-w-md w-full border border-[#38b6ff]/30">
            <h3 className="text-xl font-bold text-white mb-4">Create New Concert</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Concert name"
                value={newConcert.name}
                onChange={(e) => setNewConcert({ ...newConcert, name: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff]"
              />
              <input
                type="date"
                value={newConcert.date}
                onChange={(e) => setNewConcert({ ...newConcert, date: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff]"
              />
              <input
                type="time"
                value={newConcert.time}
                onChange={(e) => setNewConcert({ ...newConcert, time: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff]"
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateConcert}
                className="flex-1 py-2 rounded-full bg-[#38b6ff] text-[#050d1a] font-semibold hover:bg-[#5fc4ff] transition"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0a1f3d] rounded-2xl p-6 max-w-sm w-full border border-red-500/30">
            <h3 className="text-lg font-bold text-white mb-2">Delete Concert?</h3>
            <p className="text-[#b0d4ff] text-sm mb-6">
              This will permanently delete the concert and its live room, including all chat messages and lighting settings. This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-2 rounded-full border border-white/20 text-white hover:bg-white/10 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteConcert(confirmDeleteId)}
                className="flex-1 py-2 rounded-full bg-red-500 text-white font-semibold hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
