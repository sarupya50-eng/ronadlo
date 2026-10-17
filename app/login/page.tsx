"use client";

import { useState } from "react";
import { Music2, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: wire up real auth later
    console.log("login attempt (mock)", { email, password });
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-neutral-950 via-neutral-900 to-black px-4">
      {/* ambient glow blobs */}
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-600/20 blur-3xl" />

      <div className="relative w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center mb-3">
            <Music2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-white">Welcome back</h1>
          <p className="text-sm text-white/50 mt-1">Sign in to Auralis</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-white/60 mb-1 block">Email</label>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus-within:border-white/30 transition">
              <Mail className="h-4 w-4 text-white/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-white/60 mb-1 block">Password</label>
            <div className="flex items-center gap-2 rounded-lg bg-white/5 border border-white/10 px-3 py-2 focus-within:border-white/30 transition">
              <Lock className="h-4 w-4 text-white/40" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="bg-transparent outline-none text-sm text-white placeholder:text-white/30 w-full"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="text-white/40 hover:text-white/70 transition"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/50">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="accent-purple-500" />
              Remember me
            </label>
            <a href="#" className="hover:text-white/80 transition">Forgot password?</a>
          </div>

          <button
            type="submit"
            className="w-full rounded-lg bg-white text-black text-sm font-medium py-2.5 hover:bg-white/90 transition"
          >
            Sign In
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className="h-px flex-1 bg-white/10" />
          <span className="text-xs text-white/30">or</span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        <button className="w-full rounded-lg border border-white/10 bg-white/5 text-white text-sm font-medium py-2.5 hover:bg-white/10 transition">
          Continue with Google
        </button>

        <p className="text-center text-xs text-white/40 mt-6">
          Don&apos;t have an account?{" "}
          <a href="#" className="text-white hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
