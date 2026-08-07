"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Brain, Target, BookOpen, Cpu, TrendingUp, FileText, 
  Database, Network, ArrowRight, Star, Play, Check, 
  Menu, X, Sparkles, MessageSquare, Terminal, Shield, Zap
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [chatMessageIndex, setChatMessageIndex] = useState(0);
  const [chatHistory, setChatHistory] = useState<Array<{ sender: "ai" | "user"; text: string }>>([]);
  const [activeStep, setActiveStep] = useState(0);

  const interviewSimulation = [
    { sender: "ai" as const, text: "Welcome. Let's start. Explain what Retrieval-Augmented Generation (RAG) is and how it solves LLM hallucination." },
    { sender: "user" as const, text: "RAG retrieves relevant doc chunks from a vector DB like Qdrant and appends them to the LLM's prompt window. This anchors the LLM's response in factual source text." },
    { sender: "ai" as const, text: "Excellent answer. Let's dive deeper: when dividing documents into chunks, why is it critical to configure a 'chunk overlap'?" },
    { sender: "user" as const, text: "Chunk overlap prevents splitting sentence context in half at block boundaries, ensuring semantic coherence is maintained across contiguous chunks." },
    { sender: "ai" as const, text: "Correct. Now, how would you design a tool server using Model Context Protocol (MCP) to access databases securely?" }
  ];

  // Auto typing simulator for hero chat widget
  useEffect(() => {
    setChatHistory([interviewSimulation[0]]);
    const timer = setInterval(() => {
      setChatMessageIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % interviewSimulation.length;
        // Rebuild history
        const newHistory = interviewSimulation.slice(0, nextIndex + 1);
        setChatHistory(newHistory);
        return nextIndex;
      });
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Cycle "How it works" highlight step
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % 6);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: <Brain className="w-6 h-6 text-[#B85D2F]" />, title: "Adaptive Interview Engine", description: "Dynamically changes difficulty curve based on your conceptual precision." },
    { icon: <Target className="w-6 h-6 text-[#9A4C2A]" />, title: "Personalized Questions", description: "Targets specific engineering stacks instead of presenting generic algorithmic puzzles." },
    { icon: <BookOpen className="w-6 h-6 text-[#B85D2F]" />, title: "Curriculum Aware", description: "Directly syncs with course modules, testing actual week-over-week progress." },
    { icon: <Cpu className="w-6 h-6 text-[#9A4C2A]" />, title: "AI Follow-ups", description: "Never scripted. Probes candidate answers with deep, context-driven questions." },
    { icon: <TrendingUp className="w-6 h-6 text-[#B85D2F]" />, title: "Performance Analytics", description: "Beautiful radar diagrams mapping technical depth, communication, and speed." },
    { icon: <FileText className="w-6 h-6 text-[#9A4C2A]" />, title: "Detailed Feedback Reports", description: "Provides line-by-line feedback, strengths, weak areas, and exact reference answers." },
    { icon: <Database className="w-6 h-6 text-[#B85D2F]" />, title: "RAG Powered", description: "Queries live documentation repositories to match answers against current specifications." },
    { icon: <Network className="w-6 h-6 text-[#9A4C2A]" />, title: "Multi-Agent Architecture", description: "Planner, Evaluator, Retriever, and Reporter agents collaborate to evaluate candidates." }
  ];

  const steps = [
    { title: "Upload Profile", desc: "Sync resume or curriculum" },
    { title: "Generate Strategy", desc: "Multi-agent planning" },
    { title: "Live Technical Test", desc: "Adaptive 8-question stream" },
    { title: "Context Follow-ups", desc: "Deep concept validation" },
    { title: "AI Evaluation", desc: "Keyword & semantic rating" },
    { title: "Feedback Report", desc: "Custom learning path generated" }
  ];

  const pricing = [
    {
      name: "Free Trial",
      price: "$0",
      description: "Perfect for students practicing single interviews.",
      features: [
        "1 full adaptive interview session",
        "Basic performance score dashboard",
        "Conceptual & scenario-based questions",
        "SQLite local history",
      ],
      cta: "Practice Free",
      popular: false
    },
    {
      name: "Developer Pro",
      price: "$19",
      description: "For engineers preparing for heavy enterprise tech cycles.",
      features: [
        "Unlimited mock interviews",
        "Detailed Multi-Agent Feedback Reports",
        "Advanced MCP tool design modules",
        "Custom curriculum uploading (JSON)",
        "Voice speech synthesis enabled",
        "Interactive radar performance graphs"
      ],
      cta: "Upgrade to Pro",
      popular: true
    },
    {
      name: "Enterprise Teams",
      price: "$99",
      description: "For engineering managers seeking to screen candidates.",
      features: [
        "Dynamic cohort ranking leaderboard",
        "Custom assessment creation API",
        "Dedicated Qdrant index namespaces",
        "Pre-filtered tenant security access",
        "Priority support & API integration"
      ],
      cta: "Contact Enterprise",
      popular: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F6EBDD] paper-texture overflow-hidden select-none">
      {/* Background Aurora Blobs */}
      <div className="organic-circle aurora-emerald" />
      <div className="organic-circle aurora-cyan" />

      {/* Navigation */}
      <header className="sticky top-0 z-50 border-b border-[#C8B79E] bg-[#F6EBDD] paper-texture/80 ">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#B85D2F] to-[#C79B5A] text-black">
              <Brain className="w-6 h-6 text-black fill-black/10" />
            </div>
            <span className="font-extrabold text-xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              InterviewIQ <span className="text-[#B85D2F]">AI</span>
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm text-[#2A211B]/80 font-medium">
            <a href="#features" className="hover:text-[#171411] transition">Features</a>
            <a href="#workflow" className="hover:text-[#171411] transition">Workflow</a>
            <a href="#architecture" className="hover:text-[#171411] transition">Architecture</a>
            <a href="#pricing" className="hover:text-[#171411] transition">Pricing</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Link href="/login" className="text-[#2A211B] hover:text-[#171411] text-sm transition">
              Sign In
            </Link>
            <Link 
              href="/login" 
              className="px-4 py-2 text-sm font-semibold rounded-xl bg-[#B85D2F] hover:bg-[#0ea571] text-black hover:warm-shadow transition-all duration-300"
            >
              Start Interview
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-[#2A211B]/80" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#C8B79E] bg-[#F6EBDD] paper-texture/95  px-4 py-6 flex flex-col gap-4 text-[#2A211B]">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>Workflow</a>
            <a href="#architecture" onClick={() => setMobileMenuOpen(false)}>Architecture</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <hr className="border-[#C8B79E] my-2" />
            <Link href="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link 
              href="/login" 
              className="py-2 text-center font-bold rounded-xl bg-[#B85D2F] text-black"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Interview
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 md:pt-28 md:pb-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-7 flex flex-col text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-xs text-[#B85D2F] font-semibold w-fit mb-6 animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive Agentic Simulator
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight text-[#171411] mb-6">
            Master AI Interviews <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#B85D2F] to-[#9A4C2A]">
              Before the Real One.
            </span>
          </h1>

          <p className="text-lg text-[#2A211B]/80 max-w-xl mb-8 leading-relaxed">
            InterviewIQ AI is an adaptive AI interviewer that simulates enterprise technical loops, generating context-driven follow-ups based on your personal AI engineering learning journey.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link 
              href="/login"
              className="px-8 py-4 text-base font-bold rounded-2xl bg-gradient-to-r from-[#B85D2F] to-[#9A4C2A] text-black flex items-center justify-center gap-2 group hover:warm-shadow transition duration-300"
            >
              Start Practice Interview
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a 
              href="#workflow"
              className="px-8 py-4 text-base font-semibold rounded-2xl border border-[#C8B79E] hover:border-[#C8B79E]/60 bg-white/5 hover:bg-white/10 text-[#171411] flex items-center justify-center gap-2 transition duration-200"
            >
              <Play className="w-5 h-5 text-[#9A4C2A] fill-[#06B6D4]/10" />
              Watch Demo Flow
            </a>
          </div>

          {/* Social Stats Proof */}
          <div className="mt-12 pt-8 border-t border-[#C8B79E] flex gap-8">
            <div>
              <span className="block text-2xl font-bold text-[#171411]">98.2%</span>
              <span className="text-xs text-[#2A211B]/60">Evaluation Accuracy</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#171411]">1,500+</span>
              <span className="text-xs text-[#2A211B]/60">Adaptive Questions</span>
            </div>
            <div>
              <span className="block text-2xl font-bold text-[#171411]">4.9/5</span>
              <span className="text-xs text-[#2A211B]/60">Candidate Rating</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive Interview Chat Preview */}
        <div className="lg:col-span-5 relative w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-[#10B981]/10 to-[#06B6D4]/10 rounded-[24px] blur-2xl" />
          
          <div className="relative rounded-[20px] border border-[#C8B79E] bg-[#DCCCB6]/60  p-5 overflow-hidden shadow-2xl editorial-card">
            {/* Header Toolbar */}
            <div className="flex items-center justify-between border-b border-[#C8B79E] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
              </div>
              <div className="text-xs text-[#2A211B]/60 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" />
                ai_interview_session.sh
              </div>
              <div className="px-2 py-0.5 rounded bg-emerald-500/10 text-[10px] text-[#B85D2F] font-bold">
                LIVE
              </div>
            </div>

            {/* Chat Content Panel */}
            <div className="space-y-4 min-h-[300px] flex flex-col justify-end text-sm">
              {chatHistory.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`flex flex-col max-w-[85%] ${
                    msg.sender === "user" ? "self-end items-end" : "self-start items-start"
                  } transition-all duration-500 ease-out`}
                >
                  <span className="text-[10px] text-[#2A211B]/60 mb-1 flex items-center gap-1">
                    {msg.sender === "ai" ? (
                      <>
                        <Brain className="w-3 h-3 text-[#B85D2F]" /> AI Interviewer
                      </>
                    ) : (
                      "Candidate"
                    )}
                  </span>
                  <div 
                    className={`p-3 rounded-2xl leading-relaxed ${
                      msg.sender === "user" 
                        ? "bg-[#B85D2F]/15 text-[#B85D2F] rounded-tr-none border border-[#B85D2F]/20" 
                        : "bg-white/5 text-[#2A211B] rounded-tl-none border border-[#C8B79E]"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {/* Simulator thinking state indicator */}
              <div className="flex items-center gap-1.5 self-start text-xs text-[#2A211B]/60 pl-1 py-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D2F] animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D2F] animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#B85D2F] animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-[10px] text-[#2A211B]/70 ml-1 font-mono">evaluating concepts...</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#C8B79E]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm text-[#9A4C2A] font-bold tracking-wider uppercase">Built for Scale</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] mt-2">
            Powerful Multi-Agent Architecture
          </h2>
          <p className="text-[#2A211B]/80 mt-4 leading-relaxed">
            InterviewIQ uses localized agents to deliver a granular, adaptive loop that is curriculum-aware.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, index) => (
            <div 
              key={index} 
              className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] hover:border-[#B85D2F]/20 hover:bg-[#DCCCB6]/70 editorial-card-hover group cursor-default"
            >
              <div className="p-3 bg-white/5 w-fit rounded-xl mb-4 group-hover:scale-110 group-hover:bg-[#B85D2F]/10 transition duration-300">
                {feat.icon}
              </div>
              <h3 className="text-lg font-bold text-[#171411] mb-2">{feat.title}</h3>
              <p className="text-sm text-[#2A211B]/80 leading-relaxed">{feat.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Interactive How It Works Workflow */}
      <section id="workflow" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#C8B79E] bg-[#F6EBDD] paper-texture/50">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm text-[#B85D2F] font-bold tracking-wider uppercase">Interactive Cycle</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] mt-2">
            Adaptive Loop Generation
          </h2>
          <p className="text-[#2A211B]/80 mt-4 leading-relaxed">
            The platform guides candidates through an adaptive, fully automated interview pipeline from upload to reports.
          </p>
        </div>

        {/* Step Cards with Connected Flow Lines */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 relative">
          {steps.map((step, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-[20px] border transition-all duration-500 ${
                activeStep === idx 
                  ? "bg-[#B85D2F]/10 border-[#B85D2F]/40 scale-105 shadow-[0_0_20px_rgba(16,185,129,0.1)]" 
                  : "bg-[#DCCCB6]/40 border-[#C8B79E] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-2xl font-bold font-mono ${activeStep === idx ? "text-[#B85D2F]" : "text-[#2A211B]/70"}`}>
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className={`w-2 h-2 rounded-full ${activeStep === idx ? "bg-[#B85D2F] animate-ping" : "bg-zinc-700"}`} />
              </div>
              <h4 className="text-sm font-bold text-[#171411] mb-1.5">{step.title}</h4>
              <p className="text-xs text-[#2A211B]/80 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture System Diagram */}
      <section id="architecture" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#C8B79E]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm text-[#9A4C2A] font-bold tracking-wider uppercase">System Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] mt-2">
            Multi-Agent Stateflow Graph
          </h2>
          <p className="text-[#2A211B]/80 mt-4 leading-relaxed">
            Understand how our agents leverage LangGraph states to retrieve facts, execute follow-ups, and compile evaluations.
          </p>
        </div>

        {/* Beautiful Interactive Flow Diagram */}
        <div className="relative p-8 rounded-[24px] border border-[#C8B79E] bg-[#DCCCB6]/30  overflow-x-auto">
          <div className="flex items-center justify-between min-w-[900px] gap-4 px-4 py-8">
            
            <div className="flex flex-col items-center">
              <div className="p-4 rounded-2xl border border-[#C8B79E] bg-[#DCCCB6] text-center w-36 shadow-lg">
                <span className="text-xs font-bold block text-[#B85D2F] mb-1">CANDIDATE</span>
                <span className="text-[10px] text-[#2A211B]/80">Profile Sync</span>
              </div>
            </div>

            <div className="text-[#2A211B]/70 font-bold">➔</div>

            <div className="flex flex-col items-center relative">
              <div className="p-4 rounded-2xl border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-center w-36 shadow-lg">
                <span className="text-xs font-bold block text-[#171411] mb-1">PLANNER</span>
                <span className="text-[10px] text-[#2A211B]/80">Generates Loop</span>
              </div>
            </div>

            <div className="text-[#2A211B]/70 font-bold">➔</div>

            <div className="flex flex-col items-center">
              <div className="p-4 rounded-2xl border border-[#C8B79E] bg-[#DCCCB6] text-center w-36 shadow-lg">
                <span className="text-xs font-bold block text-[#9A4C2A] mb-1">RETRIEVER</span>
                <span className="text-[10px] text-[#2A211B]/80">Qdrant Vector DB</span>
              </div>
            </div>

            <div className="text-[#2A211B]/70 font-bold">➔</div>

            <div className="flex flex-col items-center">
              <div className="p-4 rounded-2xl border border-[#9A4C2A]/30 bg-[#9A4C2A]/5 text-center w-38 shadow-lg">
                <span className="text-xs font-bold block text-[#171411] mb-1">GENERATOR</span>
                <span className="text-[10px] text-[#2A211B]/80">Context Questions</span>
              </div>
            </div>

            <div className="text-[#2A211B]/70 font-bold">➔</div>

            <div className="flex flex-col items-center">
              <div className="p-4 rounded-2xl border border-[#C8B79E] bg-[#DCCCB6] text-center w-36 shadow-lg">
                <span className="text-xs font-bold block text-red-500 mb-1">EVALUATOR</span>
                <span className="text-[10px] text-[#2A211B]/80">Keyword Scorer</span>
              </div>
            </div>

            <div className="text-[#2A211B]/70 font-bold">➔</div>

            <div className="flex flex-col items-center">
              <div className="p-4 rounded-2xl border border-[#C8B79E] bg-[#DCCCB6] text-center w-36 shadow-lg">
                <span className="text-xs font-bold block text-[#B85D2F] mb-1">REPORTER</span>
                <span className="text-[10px] text-[#2A211B]/80">Custom Path</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#C8B79E]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm text-[#B85D2F] font-bold tracking-wider uppercase">Endorsements</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] mt-2">
            Loved by Engineers
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              name: "Sarah Jenkins",
              role: "Senior AI Engineer @ Stripe",
              comment: "The adaptive questions on chunk overlap and hybrid retrieval merged BM25 are exactly what Stripe asks. Incredible practice system.",
              rating: 5
            },
            {
              name: "David Chen",
              role: "Platform Engineer @ Notion",
              comment: "Evaluating dynamic context loop errors in the debugging questions helped me understand model limitations before my system design cycles.",
              rating: 5
            },
            {
              name: "Marcus Aurelius",
              role: "Staff Engineer @ Linear",
              comment: "No purple dashboards. Just plain, blazing fast execution, code blocks that parse natively, and robust LangGraph execution. Perfect SaaS styling.",
              rating: 5
            }
          ].map((t, index) => (
            <div key={index} className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card">
              <div className="flex items-center gap-1 mb-4 text-[#B85D2F]">
                {[...Array(t.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <p className="text-sm text-[#2A211B] leading-relaxed mb-6">"{t.comment}"</p>
              <div>
                <span className="block font-bold text-[#171411] text-sm">{t.name}</span>
                <span className="text-xs text-[#9A4C2A]">{t.role}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Options */}
      <section id="pricing" className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-[#C8B79E]">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-sm text-[#9A4C2A] font-bold tracking-wider uppercase">Fair Plans</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] mt-2">
            Pricing Tailored to your Goals
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {pricing.map((plan, index) => (
            <div 
              key={index} 
              className={`p-8 rounded-[24px] border relative flex flex-col justify-between ${
                plan.popular 
                  ? "bg-[#DCCCB6] border-[#B85D2F] shadow-[0_0_30px_rgba(16,185,129,0.15)]" 
                  : "bg-[#DCCCB6]/40 border-[#C8B79E]"
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-8 -translate-y-1/2 px-3 py-1 rounded-full text-xs font-bold bg-[#B85D2F] text-black">
                  POPULAR
                </div>
              )}
              
              <div>
                <h3 className="text-xl font-bold text-[#171411] mb-2">{plan.name}</h3>
                <p className="text-xs text-[#2A211B]/80 mb-6">{plan.description}</p>
                
                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-4xl font-extrabold text-[#171411]">{plan.price}</span>
                  <span className="text-xs text-[#2A211B]/60">/ month</span>
                </div>

                <hr className="border-[#C8B79E] mb-6" />

                <ul className="space-y-4 text-sm text-[#2A211B] mb-8">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2.5">
                      <Check className="w-4 h-4 text-[#B85D2F] flex-shrink-0" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <Link 
                href="/login" 
                className={`py-3 text-center rounded-xl text-sm font-semibold transition ${
                  plan.popular 
                    ? "bg-[#B85D2F] hover:bg-[#0ea571] text-[#F6EBDD] hover:shadow-[0_0_20px_rgba(16,185,129,0.25)]" 
                    : "bg-white/5 hover:bg-white/10 text-[#171411] border border-[#C8B79E]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#C8B79E] bg-[#F6EBDD] paper-texture py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-[#2A211B]/60">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#B85D2F]" />
            <span className="font-extrabold text-[#171411] tracking-tight">
              InterviewIQ <span className="text-[#B85D2F]">AI</span>
            </span>
          </div>

          <div className="flex gap-8">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#2A211B]">GitHub</a>
            <a href="#" className="hover:text-[#2A211B]">Docs</a>
            <a href="#" className="hover:text-[#2A211B]">Privacy</a>
            <a href="#" className="hover:text-[#2A211B]">Terms</a>
            <a href="#" className="hover:text-[#2A211B]">Contact</a>
          </div>

          <p>© 2026 InterviewIQ AI. Practice Smarter. Interview Better.</p>
        </div>
      </footer>
    </div>
  );
}
