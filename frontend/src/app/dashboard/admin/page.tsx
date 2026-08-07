"use client";

import React, { useState, useEffect } from "react";
import { 
  Shield, Upload, FileText, CheckCircle, Database, 
  Brain, Sparkles, Terminal, BookOpen, AlertCircle
} from "lucide-react";
import api from "@/lib/api";

export default function AdminPage() {
  const [mounted, setMounted] = useState(false);
  const [curriculumList, setCurriculumList] = useState<any[]>([]);
  const [curriculumJson, setCurriculumJson] = useState("");
  const [selectedCurriculum, setSelectedCurriculum] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchCurriculums();
  }, []);

  const fetchCurriculums = async () => {
    try {
      setLoading(true);
      const data = await api.get<any[]>("/curriculum");
      setCurriculumList(data);
      if (data && data.length > 0) {
        setSelectedCurriculum(data[0]);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleJsonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // Parse JSON client side first
      const parsed = JSON.parse(curriculumJson);
      if (!parsed.name || !parsed.modules || !Array.isArray(parsed.modules)) {
        throw new Error("Invalid format. Root object must contain 'name' (string) and 'modules' (array).");
      }
      
      const payload = {
        name: parsed.name,
        modules: parsed.modules,
        version: parsed.version || "1.0"
      };

      const res = await api.post<any>("/curriculum/upload", payload);
      setSuccess("Curriculum uploaded and compiled successfully into Qdrant collection!");
      setCurriculumJson("");
      fetchCurriculums();
    } catch (err: any) {
      setError(err.message || "Failed to upload curriculum. Check JSON syntax.");
    } finally {
      setLoading(false);
    }
  };

  const loadSampleCurriculumTemplate = () => {
    const sample = {
      name: "Custom Enterprise AI Course",
      version: "2.1",
      modules: [
        {
          id: "mod_custom_1",
          name: "Semantic Parsing & Graph RAG",
          objectives: [
            "Configure Knowledge Graphs (Neo4j) alongside Vector Stores.",
            "Understand Entity Extraction prompts.",
            "Evaluate retrieval latency tradeoffs."
          ]
        },
        {
          id: "mod_custom_2",
          name: "Model Optimization & Quantization",
          objectives: [
            "Quantize model matrices using AWQ or GGUF methods.",
            "Benchmark local GPU context limits.",
            "Implement prefix caching in vLLM engines."
          ]
        }
      ]
    };
    setCurriculumJson(JSON.stringify(sample, null, 2));
  };

  if (!mounted) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 select-none">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-[#171411] flex items-center gap-2">
          <Shield className="w-6 h-6 text-[#B85D2F]" />
          Admin Control Panel
        </h1>
        <p className="text-xs text-[#2A211B]/80 mt-1">Manage AI curriculum objectives, edit prompt templates, and review vector search collection indexes.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: CURRICULUM EDITOR & LOADER */}
        <div className="lg:col-span-7 space-y-6">
          <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card space-y-4">
            <h3 className="text-sm font-bold text-[#171411] flex items-center gap-2">
              <Upload className="w-5 h-5 text-[#9A4C2A]" />
              Upload Curriculum JSON
            </h3>
            <p className="text-[10px] text-[#2A211B]/60">Paste curriculum modules below. Uploading compiles definitions and pushes metadata structures to databases.</p>
            
            {error && (
              <div className="p-3.5 rounded-xl border border-red-500/20 bg-red-500/5 text-xs text-red-400 font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}

            {success && (
              <div className="p-3.5 rounded-xl border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-xs text-[#B85D2F] font-semibold flex items-center gap-2">
                <CheckCircle className="w-4 h-4" /> {success}
              </div>
            )}

            <form onSubmit={handleJsonSubmit} className="space-y-4">
              <textarea
                value={curriculumJson}
                onChange={(e) => setCurriculumJson(e.target.value)}
                placeholder='{
  "name": "AI Engineering",
  "version": "1.0",
  "modules": [
    { "id": "m1", "name": "RAG Indexing", "objectives": ["Implement chunking"] }
  ]
}'
                className="w-full h-64 p-4 rounded-xl border border-[#C8B79E] bg-white/5 text-xs font-mono text-[#2A211B] placeholder-zinc-700 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10"
              />

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading || !curriculumJson.trim()}
                  className="flex-grow py-3 rounded-xl bg-[#B85D2F] hover:bg-[#0ea571] text-black text-xs font-bold transition disabled:opacity-40"
                >
                  Compile & Pave Curriculum
                </button>
                
                <button
                  type="button"
                  onClick={loadSampleCurriculumTemplate}
                  className="px-4 py-3 rounded-xl border border-[#C8B79E] bg-white/5 text-[#2A211B]/80 hover:text-[#171411] text-xs font-bold transition"
                >
                  Load Sample JSON
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* RIGHT COLUMN: PREVIEW OF ACTIVE CURRICULUM */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card space-y-4">
            <span className="text-xs font-bold text-[#171411] block uppercase tracking-wider border-b border-[#C8B79E] pb-2.5">
              Active Curriculum Modules
            </span>

            {selectedCurriculum ? (
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold text-[#171411] block">{selectedCurriculum.name}</span>
                  <span className="text-[10px] text-[#2A211B]/60 font-mono block">Version: {selectedCurriculum.version} | Synced</span>
                </div>

                <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                  {selectedCurriculum.modules?.map((mod: any) => (
                    <div key={mod.id} className="p-4 rounded-xl bg-white/5 border border-[#C8B79E] space-y-2">
                      <span className="text-xs font-bold text-[#B85D2F] block">{mod.name}</span>
                      <ul className="space-y-1.5 text-[10px] text-[#2A211B]/80 leading-relaxed list-disc list-inside pl-1">
                        {mod.objectives?.map((obj: string, i: number) => (
                          <li key={i}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-xs text-[#2A211B]/60">
                No active curriculum loaded.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
