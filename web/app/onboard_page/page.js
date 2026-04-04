// app/onboard_page/page.js
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OnboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("signup");
  const [email, setEmail] = useState("");
  const [venueName, setVenueName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
<<<<<<< HEAD

  // Dev login - instant redirect, no loading
  const handleDevLogin = () => {
    localStorage.setItem("dev_user", JSON.stringify({ id: "dev123", email: "dev@test.com", name: "Developer" }));
    router.push("/UserOnboarding");
  };
=======
  const [success, setSuccess] = useState(false);
>>>>>>> dbf0526 (start on backend)

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Basic validation
    if (activeTab === "signup") {
      if (!email.includes("@")) {
        setError("Valid email required");
        setLoading(false);
        return;
      }
      if (password.length < 6) {
        setError("Password must be at least 6 characters");
        setLoading(false);
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords don't match");
        setLoading(false);
        return;
      }
    } else {
      if (!email.includes("@") || password.length === 0) {
        setError("Email and password required");
        setLoading(false);
        return;
      }
    }

    // For demo: store user and redirect
    // In real app, replace with your actual auth call (e.g., Firebase, NextAuth)
    try {
      // Simulate network delay (optional, remove if you want instant)
      await new Promise(resolve => setTimeout(resolve, 800));

      localStorage.setItem(
        "user",
        JSON.stringify({ id: "user_" + Date.now(), email: email, name: email.split("@")[0] })
      );
      router.push("/UserOnboarding");
    } catch (err) {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setSuccess(false)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050d1a] via-[#071628] to-[#0a1f3d] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#0a1f3d]/60 backdrop-blur-sm rounded-2xl p-6 border border-[#38b6ff]/20 shadow-xl">
        {/* Back arrow */}
        <button onClick={() => router.push("/")} className="mb-4 text-[#b0d4ff] hover:text-[#38b6ff] transition">
          ← Back
        </button>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6 bg-[#071628] rounded-full p-1">
          <button
            onClick={() => switchTab("signup")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${activeTab === "signup" ? "bg-[#38b6ff] text-[#050d1a]" : "text-[#b0d4ff] hover:text-white"
              }`}
          >
            Sign Up
          </button>
          <button
            onClick={() => switchTab("login")}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition ${activeTab === "login" ? "bg-[#38b6ff] text-[#050d1a]" : "text-[#b0d4ff] hover:text-white"
              }`}
          >
            Log In
          </button>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {activeTab === "signup" ? "Create an account" : "Welcome back"}
        </h1>
        <p className="text-[#b0d4ff] text-sm mb-6">
          {activeTab === "signup" ? "Join Concert Companion to create and manage concerts" : "Sign in to access your dashboard"}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#b0d4ff] text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff] transition"
              required
            />
          </div>

          <div>
            <label className="block text-[#b0d4ff] text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff] transition"
              required
            />
          </div>

          {activeTab === "signup" && (
            <div>
              <label className="block text-[#b0d4ff] text-sm mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff] transition"
                required
              />
            </div>
          )}

          {activeTab === "signup" && (
            <div>
              <label className="block text-[#b0d4ff] text-sm mb-1">Venue Name</label>
              <input
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
                className="w-full px-4 py-2 rounded-xl bg-[#071628] border border-[#38b6ff]/30 text-white focus:outline-none focus:border-[#38b6ff] transition"
                required
              />
            </div>
          )}
          {activeTab === "login" && (
            <div className="text-right">
              <button type="button" className="text-xs text-[#38b6ff] hover:underline" onClick={() => alert("Reset link sent (demo)")}>
                Forgot password?
              </button>
            </div>
          )}

          {error && <div className="text-red-400 text-sm bg-red-500/10 rounded-lg p-2">{error}</div>}
          {success && <div className="text-green-400 text-sm bg-red-500/10 rounded-lg p-2">Account created sucessfully, you can now login</div>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-full bg-[#38b6ff] text-[#050d1a] font-semibold tracking-wide shadow-lg shadow-[#38b6ff]/30 hover:bg-[#5fc4ff] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : activeTab === "signup" ? "Sign Up" : "Log In"}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[#38b6ff]/40">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
}