// app/dashboard/page.js
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [concerts, setConcerts] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newConcert, setNewConcert] = useState({ concertName: "", startDate: 0, endDate: 0 });
  const [confirmDeleteId, setConfirmDeleteId] = useState(null); // concert id pending delete confirm
  async function getConcerts() {
    let response = await fetch("/api/venue/concert/list");
    let json_response = await response.json()
    setConcerts(json_response.data)
  }


  useEffect(() => {

    async function getUser() {
      let response = await fetch("/api/venue/me");
      let json_response = await response.json()
      if (!json_response.success || !json_response.loggedIn) {
        router.push("/onboard_page")
      } else {
        setUser(json_response)
        getConcerts();
      }
    }
    getUser();
  }, [router]);

  const handleLogout = () => {
    fetch("/api/logout").then(() => router.push("/"));
  };

  const handleCreateConcert = () => {
    fetch('/api/venue/concert/add', {
      method: 'POST',
      body: JSON.stringify({
        concertName: newConcert.concertName,
        startDate: new Date(newConcert.startDate).getTime(),
        endDate: new Date(newConcert.endDate).getTime()
      })
    }).then((response) => {
      getConcerts()
      setShowModal(false)
      close
    })
  };

  const handleDeleteConcert = (concertId) => {
    fetch('/api/venue/concert/delete', {
      method: 'POST',
      body: JSON.stringify({
        concertId: confirmDeleteId
      })
    }).then((response) => {
      getConcerts()
      setConfirmDeleteId(null)
    })
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
                key={concert.concertId}
                className="bg-[#0a1f3d]/40 backdrop-blur-sm rounded-xl p-4 border border-[#38b6ff]/20 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-white font-semibold">{concert.ConcertName}</h3>
                  </div>
                  <p className="text-[#b0d4ff] text-sm">{String(new Date(concert.StartDate))}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleManage(concert.idConcert)}
                    className="px-4 py-1.5 rounded-full border border-[#38b6ff]/50 text-[#38b6ff] text-sm hover:bg-[#38b6ff]/10 transition"
                  >
                    Manage
                  </button>

                  <button
                    onClick={() => setConfirmDeleteId(concert.idConcert)}
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
                value={newConcert.concertName}
                onChange={(e) => setNewConcert({ ...newConcert, concertName: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff]"
              />
              <p>start</p><input
                type="datetime-local"
                value={newConcert.startDate}
                onChange={(e) => setNewConcert({ ...newConcert, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff]"
              />
              <p>end</p><input
                type="datetime-local"
                value={newConcert.endDate}
                onChange={(e) => setNewConcert({ ...newConcert, endDate: e.target.value })}
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
