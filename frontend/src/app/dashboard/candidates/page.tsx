"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Search, Filter, Calendar, ArrowRight, BookOpen } from "lucide-react";
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
      let data = await api.get<any[]>("/candidates").catch(async () => {
        const self = await api.get<any>("/candidates/me");
        return [self];
      });
      
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
    <div className="space-y-8 select-none max-w-6xl mx-auto text-left py-6">
      
      <div className="border-b border-[#C8B79E] pb-6">
        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B85D2F] block mb-2">Search Evaluations</span>
        <h1 className="text-3xl font-extrabold text-[#171411]">Candidates Directory</h1>
        <p className="text-xs text-[#75665A] mt-1.5 leading-relaxed">
          Verify cohort progress, search developer skill profiles, and analyze custom technical assessment summaries.
        </p>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#DCCCB6]/40 p-4 border border-[#C8B79E] rounded-xl shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-[#75665A]/80">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search candidates or core skills..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-[#C8B79E] bg-white/20 text-xs font-semibold text-[#171411] placeholder-zinc-500 focus:outline-none focus:border-[#B85D2F]"
          />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="px-3.5 py-2.5 rounded-lg border border-[#C8B79E] bg-white/10 text-[#2A211B] text-xs font-bold flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#B85D2F]" />
            Active Profiles: {filteredCandidates.length}
          </div>
        </div>
      </div>

      {/* Candidates List Grid */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-xl" />
          ))}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="p-12 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] text-center space-y-2">
          <Users className="w-8 h-8 text-[#75665A]/70 mx-auto" />
          <p className="text-xs text-[#75665A] font-bold">No candidates found matching your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCandidates.map((c) => (
            <div 
              key={c.id} 
              className="p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] hover:border-[#B85D2F] hover:bg-[#DCCCB6]/60 flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition duration-200 shadow-sm"
            >
              <div className="flex gap-4 items-center">
                <div className="w-11 h-11 rounded-lg bg-white border border-[#C8B79E] flex items-center justify-center text-[#B85D2F] font-extrabold text-sm shadow-sm">
                  {c.name.charAt(0)}
                </div>
                <div className="space-y-1">
                  <span className="font-extrabold text-[#171411] block text-sm">{c.name}</span>
                  
                  {/* Skills tags */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {c.skills.map((skill: string) => (
                      <span 
                        key={skill} 
                        className="px-2 py-0.5 rounded bg-white/40 border border-[#C8B79E]/60 text-[#75665A] text-[9px] font-bold tracking-wider uppercase"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Links */}
              <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-[#C8B79E] pt-3 sm:pt-0">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 text-[#75665A]">
                    <Calendar className="w-4 h-4 text-[#B85D2F]" />
                    <span>Joined: {new Date(c.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <Link 
                  href={`/dashboard/candidates/${c.id}`}
                  className="px-4 py-2.5 rounded-lg border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-[#B85D2F] hover:bg-[#B85D2F]/10 text-xs font-bold flex items-center gap-1.5 transition duration-200"
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
