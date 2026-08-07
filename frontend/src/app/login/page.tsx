"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Brain, Lock, Mail, User, Sparkles, ArrowRight, Shield } from "lucide-react";
import api from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isLogin) {
        // Login
        const data = await api.post<any>("/auth/login", { email, password });
        api.setToken(data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("candidate_id", String(data.candidate_id || ""));
        localStorage.setItem("candidate_name", data.candidate_name || "");
        localStorage.setItem("email", data.email);
        router.push("/dashboard");
      } else {
        // Register
        const data = await api.post<any>("/auth/register", { name, email, password, role: "candidate" });
        api.setToken(data.access_token);
        localStorage.setItem("role", data.role);
        localStorage.setItem("candidate_id", String(data.candidate_id || ""));
        localStorage.setItem("candidate_name", data.candidate_name || "");
        localStorage.setItem("email", data.email);
        router.push("/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Demo bypass to showcase complete system instantly
  const handleDemoBypass = () => {
    // Generate dummy details representing a logged in Candidate
    api.setToken("demo-mock-jwt-token");
    localStorage.setItem("role", "candidate");
    localStorage.setItem("candidate_id", "1");
    localStorage.setItem("candidate_name", "Sarah Jenkins");
    localStorage.setItem("email", "candidate@stripe.com");
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-[#F6EBDD] paper-texture flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden select-none">
      {/* Aurora Background Blobs */}
      <div className="organic-circle aurora-emerald" />
      <div className="organic-circle aurora-cyan" />

      {/* Auth Card Container */}
      <div className="relative w-full max-w-md bg-[#DCCCB6]/60  rounded-[24px] border border-[#C8B79E] p-8 shadow-2xl editorial-card z-10">
        
        {/* Logo and Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-[#B85D2F] to-[#C79B5A] text-black mb-4">
            <Brain className="w-8 h-8 text-black fill-black/10" />
          </div>
          <h2 className="text-2xl font-extrabold text-[#171411] text-center">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="text-xs text-[#2A211B]/60 mt-1.5 text-center max-w-[280px]">
            {isLogin 
              ? "Access your adaptive AI interviewing history and analytics." 
              : "Register your profile to design customized curriculum mock tests."}
          </p>
        </div>

        {error && (
          <div className="p-3.5 mb-5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-semibold leading-relaxed">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider pl-1">Name</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#2A211B]/70">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  required
                  placeholder="E.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8B79E] bg-white/5 text-sm text-[#171411] placeholder-zinc-600 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10 transition"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider pl-1">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#2A211B]/70">
                <Mail className="w-4 h-4" />
              </span>
              <input
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8B79E] bg-white/5 text-sm text-[#171411] placeholder-zinc-600 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10 transition"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider pl-1">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#2A211B]/70">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-[#C8B79E] bg-white/5 text-sm text-[#171411] placeholder-zinc-600 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-2 rounded-xl text-sm font-bold bg-[#B85D2F] hover:bg-[#0ea571] text-black hover:warm-shadow transition duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
          >
            {loading ? "Processing..." : isLogin ? "Login to Platform" : "Create Profile"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="mt-6 flex items-center justify-between text-xs">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-[#9A4C2A] hover:underline"
          >
            {isLogin ? "Create an account" : "Back to Login"}
          </button>
          
          {isLogin && (
            <a href="#" className="text-[#2A211B]/60 hover:text-[#2A211B]">
              Forgot password?
            </a>
          )}
        </div>

        <div className="relative my-6 flex items-center">
          <div className="flex-grow border-t border-[#C8B79E]" />
          <span className="flex-shrink mx-4 text-[10px] font-bold text-[#2A211B]/70 uppercase tracking-widest">
            OR TEST INSTANTLY
          </span>
          <div className="flex-grow border-t border-[#C8B79E]" />
        </div>

        {/* Demo Bypass Action */}
        <button
          onClick={handleDemoBypass}
          className="w-full py-3.5 rounded-xl text-xs font-bold border border-[#9A4C2A]/30 hover:border-[#9A4C2A]/50 bg-[#9A4C2A]/5 hover:bg-[#9A4C2A]/10 text-[#9A4C2A] flex items-center justify-center gap-2 transition duration-200"
        >
          <Sparkles className="w-4 h-4 animate-bounce" />
          Demo Mode (Skip Auth Signup)
        </button>

        <div className="mt-6 border-t border-[#C8B79E] pt-4 text-center">
          <Link href="/" className="text-xs text-[#2A211B]/60 hover:text-[#2A211B]/80">
            Back to landing page
          </Link>
        </div>

      </div>
    </div>
  );
}
