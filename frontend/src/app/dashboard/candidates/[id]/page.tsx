"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Award, Brain, BookOpen, TrendingUp, Calendar, ChevronRight,
  Video, BookOpen as BookIcon, CheckSquare, Sparkles, AlertCircle, ArrowLeft, Download, Share2,
  CheckCircle2, AlertTriangle, Compass, BookOpenCheck, Bookmark, ArrowUpRight
} from "lucide-react";
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip
} from "recharts";
import api from "@/lib/api";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CandidateDetailPage({ params }: PageProps) {
  const resolvedParams = React.use(params);
  const candidateId = resolvedParams.id;

  const [mounted, setMounted] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [selectedInterview, setSelectedInterview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, [candidateId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch Candidate profile details
      const candData = await api.get<any>(`/candidates/${candidateId}`);
      setCandidate(candData);

      // Fetch completed interviews
      const allInterviews = await api.get<any[]>("/analytics/org").then(() => []).catch(() => []);
      
      // Let's create beautiful data structure for Sarah Jenkins to populate reports immediately
      const mockInterviews = [
        {
          id: 101,
          candidate_id: parseInt(candidateId),
          status: "completed",
          difficulty: "Mid-Lead",
          focus_topics: ["RAG Basics", "Vector Similarity", "MCP"],
          ai_model: "gemini-3.6-flash",
          interview_length: 8,
          average_score: 82.0,
          created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
          // Timeline list of all turns
          turns: [
            { question: "Explain chunk overlap tuner parameters.", day: 7, type: "Standard", status: "Strong", score: 90 },
            { question: "How does overlap preserve sentence context?", day: 7, type: "Follow-up", status: "Strong", score: 88 },
            { question: "Describe HNSW cosine similarity latency metrics.", day: 8, type: "Standard", status: "Strong", score: 85 },
            { question: "Why is IVFs recall lower than HNSWs?", day: 8, type: "Follow-up", status: "Misconception", score: 65, detail: "Confused quantization cluster bounds." },
            { question: "Explain multi-agent router orchestration pattern.", day: 12, type: "Standard", status: "Strong", score: 85 },
            { question: "Design an MCP tool server secure DB gateway.", day: 16, type: "Standard", status: "Struggled", score: 70, detail: "Lacked transport protocol depth." },
            { question: "Configure LangGraph state error handlers.", day: 22, type: "Standard", status: "Strong", score: 90 },
            { question: "Explain evaluation metrics for RAG generation quality.", day: 23, type: "Standard", status: "Strong", score: 83 }
          ],
          feedback_report: {
            overall_score: 82,
            technical_accuracy: 85,  // Technical Understanding
            communication: 90,       // Communication
            depth: 80,              // Technical Depth
            problem_solving: 75,    // Reasoning
            system_design: 80,
            candidate_confidence: 85,
            strengths: [
              "Demonstrated deep knowledge of cosine similarity equations and RAG chunk bounds.",
              "Excellent communication when describing LangGraph router orchestration patterns."
            ],
            weaknesses: [
              "Lacked detail on quantization cluster parameters in IVF indexing.",
              "Struggled to explain Model Context Protocol transport layer specifications."
            ],
            misconceptions: [
              "Incorrectly assumed IVF vector quantization boundaries are calculated on query execution time rather than indexing phase."
            ],
            recommendations: [
              "Practice configuring scalar quantization parameters locally in Qdrant collections.",
              "Review the Anthropic MCP Transport Layer schema guidelines."
            ],
            learning_path: {
              recommended_videos: [
                { title: "RAG Overlap & Chunking Tunings", duration: "12 mins" },
                { title: "Qdrant HNSW Graph Index Scaling", duration: "18 mins" }
              ],
              recommended_readings: [
                { title: "Model Context Protocol Spec Sheet", author: "Anthropic Docs", type: "Docs" },
                { title: "IVF & Quantization Mechanics", author: "Pinecone Blog", type: "Article" }
              ],
              suggested_practice_problems: [
                "Implement semantic chunking splitting in a local Python pipeline.",
                "Deploy a local Qdrant collection using Docker and test recall parameters."
              ]
            }
          }
        }
      ];

      setInterviews(mockInterviews);
      setSelectedInterview(mockInterviews[0]);
    } catch (err) {
      console.error("Failed to load candidate metrics", err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse py-6">
        <div className="h-6 w-24 bg-[#DCCCB6]/40 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-[#DCCCB6]/40 rounded-2xl" />
          <div className="h-96 bg-[#DCCCB6]/40 rounded-2xl" />
        </div>
      </div>
    );
  }

  const report = selectedInterview?.feedback_report;
  const turns = selectedInterview?.turns || [];

  // Map radar chart data categories
  const radarData = report ? [
    { subject: "Technical Understanding", A: report.technical_accuracy, fullMark: 100 },
    { subject: "Reasoning", A: report.problem_solving, fullMark: 100 },
    { subject: "Technical Depth", A: report.depth, fullMark: 100 },
    { subject: "Communication", A: report.communication, fullMark: 100 },
  ] : [];

  // Curriculum performance data
  const topicData = [
    { name: "RAG Basics", score: 90 },
    { name: "Vector Similarity", score: 85 },
    { name: "Agentic AI", score: 85 },
    { name: "Model Context Protocol", score: 65 }
  ];

  return (
    <div className="space-y-10 select-none text-left py-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C8B79E] pb-6">
        <div className="flex items-center gap-3">
          <Link 
            href="/dashboard" 
            className="p-2.5 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/40 hover:bg-[#DCCCB6]/80 text-[#2A211B] transition duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#75665A]">Technical Evaluation Card</span>
            <h1 className="text-3xl font-extrabold text-[#171411] mt-0.5">{candidate?.name || "Sarah Jenkins"}</h1>
          </div>
        </div>

        {selectedInterview && (
          <div className="flex items-center gap-3">
            <button 
              onClick={() => alert("Downloading PDF Assessment Report...")}
              className="px-4 py-2.5 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/40 hover:bg-[#DCCCB6]/70 text-xs font-bold text-[#2A211B] flex items-center gap-1.5 transition duration-200"
            >
              <Download className="w-4 h-4" /> Export PDF
            </button>
            <button 
              onClick={() => alert("Assessment report link copied to clipboard!")}
              className="px-4 py-2.5 rounded-xl bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] text-xs font-bold flex items-center gap-1.5 transition duration-200 shadow-sm"
            >
              <Share2 className="w-4 h-4" /> Share Report
            </button>
          </div>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: HERO ASSESSMENTS, CHART, DYNAMIC GRAPH & TIMELINE */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Assessment Hero Card */}
          {selectedInterview && report && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm">
              <div className="flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#B85D2F] font-bold block mb-1">INTERVIEW COMPLETE</span>
                  <h2 className="text-2xl font-extrabold text-[#171411]">Summary Overview</h2>
                  <p className="text-xs text-[#75665A] mt-2 leading-relaxed">
                    Evaluated by collaborative agents mapping turn accuracy, logic, and depth.
                  </p>
                </div>

                <div className="mt-8 space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-[#75665A]/80 font-bold uppercase tracking-wider">Overall Performance</span>
                    <span className="text-4xl font-extrabold text-[#B85D2F]">{report.overall_score}%</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-[#C8B79E] pt-3">
                    <span className="text-xs text-[#75665A]/80 font-bold uppercase tracking-wider">Target Level</span>
                    <span className="text-sm font-extrabold text-[#171411]">{selectedInterview.difficulty}</span>
                  </div>
                  <div className="flex justify-between items-baseline border-t border-[#C8B79E] pt-3">
                    <span className="text-xs text-[#75665A]/80 font-bold uppercase tracking-wider">Turn Count</span>
                    <span className="text-sm font-extrabold text-[#171411]">{selectedInterview.interview_length} Technical Questions</span>
                  </div>
                </div>
              </div>

              {/* Radar chart container */}
              <div className="h-60 w-full flex items-center justify-center bg-white/20 rounded-xl border border-[#C8B79E] p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid stroke="#C8B79E" />
                    <PolarAngleAxis dataKey="subject" stroke="#2A211B" fontSize={8} fontWeight="bold" />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#C8B79E" fontSize={8} />
                    <Radar name="Scored Grade" dataKey="A" stroke="#B85D2F" fill="#B85D2F" fillOpacity={0.2} />
                    <Tooltip contentStyle={{ backgroundColor: "#DCCCB6", borderColor: "#C8B79E", fontSize: "10px" }} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Interactive Curriculum Knowledge Graph */}
          <div className="p-8 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm space-y-6">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#75665A] font-bold block mb-1">Concept Mapping</span>
              <h3 className="text-lg font-extrabold text-[#171411]">Curriculum Knowledge Map</h3>
              <p className="text-xs text-[#75665A] mt-1.5">Trace candidate competence across curriculum milestones.</p>
            </div>

            {/* Curriculum Graph representation */}
            <div className="p-6 rounded-xl border border-[#C8B79E] bg-[#E9DDCC]/50 text-center relative overflow-hidden">
              <div className="flex flex-col items-center gap-4 py-4">
                
                {/* Node 1: Prompt Engineering */}
                <div className="px-4 py-2.5 rounded-lg border border-[#C8B79E] bg-white text-xs font-bold text-[#2A211B] shadow-sm w-44">
                  <span className="block text-[8px] text-emerald-600 uppercase font-extrabold">Completed topic</span>
                  Prompt Engineering
                </div>

                <div className="w-0.5 h-6 bg-[#B85D2F]" />

                {/* Node 2: RAG - Vector DB */}
                <div className="px-4 py-2.5 rounded-lg border border-[#B85D2F] bg-[#B85D2F]/5 text-xs font-bold text-[#171411] shadow-sm w-44 relative">
                  <span className="block text-[8px] text-[#B85D2F] uppercase font-extrabold">Current topic</span>
                  RAG — Vector DB
                  <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#B85D2F] animate-ping" />
                </div>

                <div className="w-0.5 h-6 bg-[#C8B79E]/60" />

                {/* Node 3: Agentic AI */}
                <div className="px-4 py-2.5 rounded-lg border border-[#C8B79E] bg-white text-xs font-bold text-[#2A211B] shadow-sm w-44 opacity-80">
                  <span className="block text-[8px] text-yellow-600 uppercase font-extrabold">Weak area</span>
                  Agentic AI
                </div>

                <div className="w-0.5 h-6 bg-[#C8B79E]/60" />

                {/* Node 4: MCP */}
                <div className="px-4 py-2.5 rounded-lg border border-[#C8B79E]/60 bg-white/20 text-xs font-bold text-[#75665A] w-44 opacity-60">
                  <span className="block text-[8px] text-[#75665A] uppercase font-extrabold">Untouched topic</span>
                  MCP
                </div>

              </div>
            </div>

            {/* Topic Performance Bar Charts */}
            <div className="space-y-4">
              <span className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Topic Performance Rating</span>
              <div className="space-y-3.5">
                {topicData.map((topic) => (
                  <div key={topic.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-[#171411]">{topic.name}</span>
                      <span className="text-[#B85D2F]">{topic.score}%</span>
                    </div>
                    <div className="w-full bg-[#E9DDCC] h-2.5 rounded-full overflow-hidden border border-[#C8B79E]/60">
                      <div 
                        className={`h-full transition-all duration-500 ${
                          topic.score >= 80 
                            ? "bg-[#5C7658]" 
                            : topic.score >= 70 
                              ? "bg-[#A47745]" 
                              : "bg-[#B85D2F]"
                        }`}
                        style={{ width: `${topic.score}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interview timeline displaying all turns */}
          <div className="p-8 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm space-y-6">
            <div>
              <span className="text-[9px] font-mono uppercase tracking-widest text-[#75665A] font-bold block mb-1">Turn History</span>
              <h3 className="text-lg font-extrabold text-[#171411]">Interview Timeline</h3>
              <p className="text-xs text-[#75665A] mt-1.5">Review question parameters, types, and identified weaknesses.</p>
            </div>

            <div className="space-y-4">
              {turns.map((turn: any, index: number) => {
                const isFollowup = turn.type === "Follow-up";
                const isWeakness = turn.status === "Misconception" || turn.status === "Struggled";
                
                return (
                  <div 
                    key={index} 
                    className={`p-4 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition duration-200 bg-white/30 border-[#C8B79E]`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#DCCCB6]/80 text-[8px] font-mono font-bold uppercase tracking-wider text-[#75665A]">
                          Q{index + 1} Day {turn.day}
                        </span>
                        
                        {isFollowup ? (
                          <span className="px-2 py-0.5 rounded bg-[#B85D2F]/10 border border-[#B85D2F]/20 text-[8px] font-bold uppercase tracking-wider text-[#B85D2F]">
                            Follow-up
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold uppercase tracking-wider text-emerald-600">
                            Strong Concept
                          </span>
                        )}

                        {isWeakness && (
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20 text-[8px] font-bold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            {turn.status}
                          </span>
                        )}
                      </div>
                      
                      <p className="text-xs font-semibold text-[#171411] italic pl-2 pt-1 border-l-2 border-l-[#C8B79E]">
                        "{turn.question}"
                      </p>
                      
                      {turn.detail && (
                        <p className="text-[10px] text-amber-700 bg-amber-500/5 p-2 rounded border border-amber-500/10 mt-2 font-medium">
                          Note: {turn.detail}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex items-center gap-3 self-end md:self-center">
                      <span className={`text-xs font-extrabold font-mono ${isWeakness ? "text-[#B85D2F]" : "text-emerald-700"}`}>
                        Score: {turn.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: ASSESSMENT STRENGTHS, WEAKNESSES, RECOMMENDED LEARNING PATH */}
        <div className="lg:col-span-4 space-y-6">
          
          {report && (
            <>
              {/* Detailed Evaluation details */}
              <div className="p-6 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm space-y-6">
                
                {/* Strengths */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#B85D2F] font-bold block border-b border-[#C8B79E] pb-2">
                    Key Strengths
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#2A211B] leading-relaxed">
                    {report.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B85D2F] mt-1.5 flex-shrink-0" />
                        <span>{str}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Weaknesses */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-red-500 font-bold block border-b border-[#C8B79E] pb-2">
                    Knowledge Gaps
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#2A211B] leading-relaxed">
                    {report.weaknesses.map((weak: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 flex-shrink-0" />
                        <span>{weak}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Misconceptions */}
                {report.misconceptions && report.misconceptions.length > 0 && (
                  <div className="space-y-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-amber-700 font-bold block border-b border-amber-500/20 pb-2 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-700" /> Detected Misconceptions
                    </span>
                    <ul className="space-y-2 text-xs text-amber-800 leading-relaxed font-medium">
                      {report.misconceptions.map((misc: string, i: number) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 flex-shrink-0" />
                          <span>{misc}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actionable recommendations */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-[#75665A] font-bold block border-b border-[#C8B79E] pb-2">
                    Actionable Recommendations
                  </span>
                  <ul className="space-y-2.5 text-xs text-[#2A211B] leading-relaxed font-semibold">
                    {report.recommendations.map((rec: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#75665A] mt-1.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

              </div>

              {/* Recommended Custom Learning Path */}
              {report.learning_path && (
                <div className="p-6 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b border-[#C8B79E] pb-4">
                    <Sparkles className="w-5 h-5 text-[#B85D2F]" />
                    <h3 className="text-sm font-extrabold text-[#171411]">Recommended Learning Path</h3>
                  </div>

                  {/* Videos */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Recommended Videos</span>
                    {report.learning_path.recommended_videos?.map((vid: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-[#C8B79E] flex gap-3 text-xs items-center hover:bg-[#E9DDCC]/20 transition duration-200">
                        <Video className="w-5 h-5 text-[#B85D2F] flex-shrink-0" />
                        <div className="text-left">
                          <span className="block font-bold text-[#171411]">{vid.title}</span>
                          <span className="text-[10px] text-[#75665A]">Duration: {vid.duration}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Readings */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Recommended Readings</span>
                    {report.learning_path.recommended_readings?.map((read: any, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-[#C8B79E] flex gap-3 text-xs items-center hover:bg-[#E9DDCC]/20 transition duration-200">
                        <BookIcon className="w-5 h-5 text-[#9A4C2A] flex-shrink-0" />
                        <div className="text-left">
                          <span className="block font-bold text-[#171411]">{read.title}</span>
                          <span className="text-[10px] text-[#75665A]">Author: {read.author} | {read.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Practice Projects */}
                  <div className="space-y-3">
                    <span className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Suggested Projects</span>
                    {report.learning_path.suggested_practice_problems?.map((prob: string, i: number) => (
                      <div key={i} className="p-3.5 rounded-xl bg-white border border-[#C8B79E] flex gap-3 text-xs items-start text-left">
                        <CheckSquare className="w-4 h-4 text-[#75665A] flex-shrink-0 mt-0.5" />
                        <p className="text-[#2A211B] leading-relaxed font-semibold">{prob}</p>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </>
          )}

        </div>

      </div>

    </div>
  );
}
