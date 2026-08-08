"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, Users, Brain, Award, 
  ArrowRight, ShieldAlert, Sparkles, BookOpen, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from "recharts";
import api from "@/lib/api";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>("/analytics/org");
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="space-y-8 py-6 select-none text-left animate-pulse">
        <div className="flex justify-between items-center border-b border-[#C8B79E] pb-6">
          <div>
            <div className="h-4 w-28 bg-[#DCCCB6]/40 rounded mb-2" />
            <div className="h-8 w-60 bg-[#DCCCB6]/40 rounded" />
          </div>
          <div className="h-10 w-44 bg-[#DCCCB6]/40 rounded-xl" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-xl" />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-xl" />
          <div className="h-80 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-xl" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Completed technical runs",
      value: analytics?.total_interviews || 24,
      desc: "Simulated tech loops",
      icon: <Brain className="w-5 h-5 text-[#B85D2F]" />,
    },
    {
      title: "Average loop score",
      value: `${analytics?.average_score || 78.5}%`,
      desc: "Target passing margin is 75%",
      icon: <Award className="w-5 h-5 text-[#9A4C2A]" />,
    },
    {
      title: "Session completion rate",
      value: `${analytics?.completion_rate || 92.3}%`,
      desc: "Turns finished vs started",
      icon: <TrendingUp className="w-5 h-5 text-[#B85D2F]" />,
    },
    {
      title: "Primary focus days",
      value: "6 Days Covered",
      desc: "Curriculum modules",
      icon: <BookOpen className="w-5 h-5 text-[#9A4C2A]" />,
    }
  ];

  return (
    <div className="space-y-8 select-none text-left py-6">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#C8B79E] pb-6">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#75665A]">Practice Tracker Dashboard</span>
          <h1 className="text-3xl font-extrabold text-[#171411] mt-0.5">Welcome, Sarah Jenkins</h1>
          <p className="text-xs text-[#75665A] mt-1">Review candidate milestones and check technical evaluation scorecards.</p>
        </div>
        
        <Link 
          href="/dashboard/interview"
          className="px-5 py-3 rounded-xl bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] text-xs font-extrabold uppercase tracking-wider flex items-center gap-2 shadow-sm hover:shadow transition duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Start Technical Interview Loop
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] flex items-start justify-between shadow-sm">
            <div className="space-y-2">
              <span className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">{stat.title}</span>
              <span className="text-2xl font-extrabold text-[#171411] block">{stat.value}</span>
              <span className="text-[10px] text-[#9A4C2A] font-bold block">{stat.desc}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-white/20 border border-[#C8B79E]">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm">
          <div className="mb-6 border-b border-[#C8B79E]/60 pb-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#75665A]">Evaluation timeline</span>
            <h3 className="text-sm font-extrabold text-[#171411] mt-0.5">Practice Score Performance</h3>
            <p className="text-[10px] text-[#75665A]">Historical trend mapping score averages across recent sessions.</p>
          </div>

          <div className="h-64 w-full bg-white/20 rounded-lg p-2 border border-[#C8B79E]/50">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.daily_activity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B85D2F" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#B85D2F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8B79E" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="#2A211B" fontSize={8} tickLine={false} fontWeight="bold" />
                <YAxis stroke="#2A211B" fontSize={8} tickLine={false} domain={[0, 100]} fontWeight="bold" />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#DCCCB6", borderColor: "#C8B79E", fontSize: "11px" }}
                  labelClassName="text-[#171411] text-xs font-bold"
                  itemStyle={{ color: "#B85D2F" }}
                />
                <Area type="monotone" dataKey="AvgScore" stroke="#B85D2F" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" name="Average Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Radar Chart */}
        <div className="p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm">
          <div className="mb-6 border-b border-[#C8B79E]/60 pb-3">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#75665A]">Concept rating</span>
            <h3 className="text-sm font-extrabold text-[#171411] mt-0.5">Subject Mastery Mapping</h3>
            <p className="text-[10px] text-[#75665A]">Current skill depth relative to target levels.</p>
          </div>

          <div className="h-64 w-full flex items-center justify-center bg-white/20 rounded-lg p-2 border border-[#C8B79E]/50">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics?.skill_rankings}>
                <PolarGrid stroke="#C8B79E" />
                <PolarAngleAxis dataKey="subject" stroke="#2A211B" fontSize={8} fontWeight="bold" />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#C8B79E" fontSize={8} />
                <Radar name="My Score" dataKey="A" stroke="#B85D2F" fill="#B85D2F" fillOpacity={0.2} />
                <Radar name="Stripe Target" dataKey="B" stroke="#9A4C2A" fill="#9A4C2A" fillOpacity={0.05} />
                <Tooltip contentStyle={{ backgroundColor: "#DCCCB6", borderColor: "#C8B79E", fontSize: "10px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Weaknesses & Strengths Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weak Topics */}
        <div className="p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-[#C8B79E]/60 pb-3">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-extrabold text-[#171411]">Weak Focus Areas</h3>
          </div>
          
          <div className="space-y-4">
            {analytics?.weak_topics?.map((topic: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-[#2A211B]">{topic.topic}</span>
                <div className="flex items-center gap-3">
                  <span className="text-[#B85D2F] font-mono">Avg Score: {topic.avg_score}%</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-600 text-[9px] font-bold uppercase tracking-wider">
                    {topic.miss_count} Errors
                  </span>
                </div>
              </div>
            ))}
            
            {(!analytics?.weak_topics || analytics.weak_topics.length === 0) && (
              <p className="text-xs text-[#75665A] py-2 font-medium">No critical weaknesses identified yet.</p>
            )}
          </div>
        </div>

        {/* Strong Topics */}
        <div className="p-6 rounded-xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm">
          <div className="flex items-center gap-2 mb-4 border-b border-[#C8B79E]/60 pb-3">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-[#171411]">Top Strengths</h3>
          </div>
          
          <div className="space-y-4">
            {analytics?.strong_topics?.map((topic: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs font-semibold">
                <span className="text-[#2A211B]">{topic.topic}</span>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-mono">Avg Score: {topic.avg_score}%</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[9px] font-bold uppercase tracking-wider">
                    Excellent
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
