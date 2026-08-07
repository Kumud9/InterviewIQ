"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  TrendingUp, Users, Calendar, Brain, Award, 
  ArrowRight, ShieldAlert, Sparkles, BookOpen, AlertTriangle
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-extrabold text-[#171411]">Overview Dashboard</h1>
          <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
        </div>
        
        {/* Metric Skeletons */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-2xl animate-pulse" />
          ))}
        </div>

        {/* Chart Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-2xl animate-pulse" />
          <div className="h-80 bg-[#DCCCB6]/40 border border-[#C8B79E] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Completed practice runs",
      value: analytics?.total_interviews || 24,
      desc: "Simulated tech loops",
      icon: <Brain className="w-5 h-5 text-[#B85D2F]" />,
    },
    {
      title: "Average Interview score",
      value: `${analytics?.average_score || 78.5}%`,
      desc: "Passing margin is 75%",
      icon: <Award className="w-5 h-5 text-[#9A4C2A]" />,
    },
    {
      title: "Session Completion rate",
      value: `${analytics?.completion_rate || 92.3}%`,
      desc: "Completed vs started",
      icon: <TrendingUp className="w-5 h-5 text-[#B85D2F]" />,
    },
    {
      title: "Primary focus days",
      value: "4 days",
      desc: "Curriculum modules",
      icon: <BookOpen className="w-5 h-5 text-[#9A4C2A]" />,
    }
  ];

  return (
    <div className="space-y-8 select-none">
      
      {/* Welcome Hero header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171411]">Welcome, Sarah Jenkins</h1>
          <p className="text-xs text-[#2A211B]/80 mt-1">Review your AI engineering learning track and practice milestones.</p>
        </div>
        
        <Link 
          href="/dashboard/interview"
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#B85D2F] to-[#9A4C2A] text-black text-xs font-bold flex items-center gap-1.5 hover:warm-shadow-sm transition duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Start Practice Interview
        </Link>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] flex items-start justify-between shadow-lg editorial-card">
            <div className="space-y-2">
              <span className="text-xs text-[#2A211B]/60 font-medium block">{stat.title}</span>
              <span className="text-2xl font-extrabold text-[#171411] block">{stat.value}</span>
              <span className="text-[10px] text-[#9A4C2A] block">{stat.desc}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-white/5 border border-[#C8B79E]">
              {stat.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#171411]">Practice Score Performance</h3>
              <p className="text-[10px] text-[#2A211B]/60">Historical trend mapping score averages across recent sessions.</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics?.daily_activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#B85D2F" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#B85D2F" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#C8B79E" />
                <XAxis dataKey="date" stroke="#2A211B" fontSize={10} tickLine={false} />
                <YAxis stroke="#2A211B" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: "#DCCCB6", borderColor: "#C8B79E" }}
                  labelClassName="text-[#171411] text-xs font-bold"
                  itemStyle={{ color: "#B85D2F", fontSize: "11px" }}
                />
                <Area type="monotone" dataKey="AvgScore" stroke="#B85D2F" strokeWidth={2} fillOpacity={1} fill="url(#scoreColor)" name="Average Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Skill Radar Chart */}
        <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card">
          <div>
            <h3 className="text-sm font-bold text-[#171411]">Subject Mastery Mapping</h3>
            <p className="text-[10px] text-[#2A211B]/60">Current skill depth relative to target enterprise levels.</p>
          </div>

          <div className="h-64 w-full mt-4 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" radius="70%" data={analytics?.skill_rankings}>
                <PolarGrid stroke="#C8B79E" />
                <PolarAngleAxis dataKey="subject" stroke="#2A211B" fontSize={9} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#C8B79E" fontSize={8} />
                <Radar name="My Score" dataKey="A" stroke="#B85D2F" fill="#B85D2F" fillOpacity={0.15} />
                <Radar name="Stripe Target" dataKey="B" stroke="#9A4C2A" fill="#9A4C2A" fillOpacity={0.05} />
                <Tooltip contentStyle={{ backgroundColor: "#DCCCB6", borderColor: "#C8B79E", fontSize: "11px" }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Weaknesses / Recommended adjustments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weak Topics */}
        <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <h3 className="text-sm font-bold text-[#171411]">Weak Focus Areas</h3>
          </div>
          
          <div className="space-y-4">
            {analytics?.weak_topics?.map((topic: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-[#2A211B] font-medium">{topic.topic}</span>
                <div className="flex items-center gap-4">
                  <span className="text-red-400 font-mono">Avg Score: {topic.avg_score}%</span>
                  <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-wider">
                    {topic.miss_count} mistakes
                  </span>
                </div>
              </div>
            ))}
            
            {(!analytics?.weak_topics || analytics.weak_topics.length === 0) && (
              <p className="text-xs text-[#2A211B]/60 py-2">No critical weaknesses identified. Practice score is above average!</p>
            )}
          </div>
        </div>

        {/* Strong Topics */}
        <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-[#B85D2F]" />
            <h3 className="text-sm font-bold text-[#171411]">Top Strengths</h3>
          </div>
          
          <div className="space-y-4">
            {analytics?.strong_topics?.map((topic: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <span className="text-[#2A211B] font-medium">{topic.topic}</span>
                <div className="flex items-center gap-4">
                  <span className="text-[#B85D2F] font-mono">Avg Score: {topic.avg_score}%</span>
                  <span className="px-2 py-0.5 rounded bg-[#B85D2F]/10 text-[#B85D2F] text-[10px] font-bold uppercase tracking-wider">
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
