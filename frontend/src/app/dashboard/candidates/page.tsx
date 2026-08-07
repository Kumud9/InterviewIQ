"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, Filter, Calendar, Brain, ArrowRight, CheckCircle, SearchCode } from "lucide-react";
import api from "@/lib/api";

export default function CandidatesPage() {
  const [mounted, setMounted] = useState(false);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchCandidates();
  }, []);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      // Fetch from candidate route
      // If we are a candidate role, we might only see ourselves. 
      // If we are admin, we see all. We will try admin view first, and fallback gracefully to current user.
      let data = await api.get<any[]>("/candidates").catch(async () => {
        const self = await api.get<any>("/candidates/me");
        return [self];
      });
      
      // Seed details if empty
      if (!data || data.length === 0) {
        data = [
          {
            id: 1,
            name: "Sarah Jenkins",
            skills: ["RAG", "Qdrant", "Python", "LangGraph", "Docker"],
            learning_journey: ["module_1", "module_2"],
            created_at: new Date().toISOString()
          }
        ];
      }
      setCandidates(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const filteredCandidates = candidates.filter((c) => {
    const term = searchTerm.toLowerCase();
    const skillsList = Array.isArray(c.skills) ? c.skills : [];
    return (
      c.name.toLowerCase().includes(term) ||
      skillsList.some((s: string) => s.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-8 select-none max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-extrabold text-[#171411]">Candidates Directory</h1>
        <p className="text-xs text-[#2A211B]/80 mt-1">Search profiles, trace completed curriculum milestones, and view technical evaluations.</p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#DCCCB6]/40 p-4 border border-[#C8B79E] rounded-2xl editorial-card">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#2A211B]/60">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search candidates or skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#C8B79E] bg-white/5 text-xs text-[#171411] placeholder-zinc-500 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10 transition"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="px-3 py-2 rounded-xl border border-[#C8B79E] bg-white/5 text-[#2A211B]/80 text-xs flex items-center gap-1.5 cursor-default">
            <Filter className="w-4 h-4" />
            Showing {filteredCandidates.length} candidate(s)
          </div>
        </div>
      </div>

      {/* Candidates List Grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white/5 rounded-xl" />
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] text-center">
          <Users className="w-8 h-8 text-[#2A211B]/70 mx-auto mb-2" />
          <p className="text-xs text-[#2A211B]/60">No candidates match your search terms.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((c) => (
            <div 
              key={c.id} 
              className="p-5 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] hover:border-[#B85D2F]/20 hover:bg-[#DCCCB6]/70 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition shadow-lg editorial-card"
            >
              <div className="flex gap-4 items-center">
                <div className="w-10 h-10 rounded-xl bg-white/5 border border-[#C8B79E] flex items-center justify-center text-[#B85D2F] font-bold text-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <span className="font-bold text-[#171411] block text-sm">{c.name}</span>
                  
                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.skills.map((skill: string) => (
                      <span 
                        key={skill} 
                        className="px-2 py-0.5 rounded-md bg-[#9A4C2A]/5 border border-[#9A4C2A]/15 text-[#9A4C2A] text-[9px] font-bold tracking-wider uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Status and Profile Link */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-[#C8B79E] pt-3 sm:pt-0">
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-[#2A211B]/80">
                    <Calendar className="w-4 h-4 text-[#2A211B]/60" />
                    <span>Joined: {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Link 
                  href={`/dashboard/candidates/${c.id}`}
                  className="px-4 py-2 rounded-xl border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-[#B85D2F] hover:bg-[#B85D2F]/15 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  View Reports
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
