"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Brain, Target, BookOpen, Cpu, TrendingUp, FileText, 
  Database, Network, ArrowRight, Star, Play, Check, 
  Menu, X, Sparkles, MessageSquare, Terminal, Shield, Zap,
  UserCheck, Compass, HelpCircle, FileCode, CheckCircle2
} from "lucide-react";

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeHeroStep, setActiveHeroStep] = useState(0);
  const [activeWorkflowStep, setActiveWorkflowStep] = useState(0);

  const heroSteps = [
    { label: "Candidate Profile", desc: "Attempts, skipped days, learning signals parsed" },
    { label: "Curriculum Map", desc: "31-day cohort objectives & topics analyzed" },
    { label: "Interview Planner", desc: "Generates custom 8+ question sequence strategy" },
    { label: "Question Generation", desc: "Dynamic question tailored to experience & history" },
    { label: "Candidate Response", desc: "Candidate submits conceptual or system architecture answer" },
    { label: "Adaptive Follow-up", desc: "AI probes weaknesses or deepens technical challenges" },
    { label: "Structured Feedback", desc: "Grades, strengths, gaps & custom learning path compiled" }
  ];

  // Rotate Hero workflow visualization
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveHeroStep((prev) => (prev + 1) % heroSteps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Rotate "How it works" interactive steps
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveWorkflowStep((prev) => (prev + 1) % 7);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  const features = [
    { icon: <Brain className="w-5 h-5 text-[#B85D2F]" />, title: "Adaptive Interview Engine", description: "Dynamically shifts difficulty curves in response to candidate reasoning precision." },
    { icon: <Target className="w-5 h-5 text-[#B85D2F]" />, title: "Personalized Strategy", description: "Adapts focus based on completed milestones, skipped tasks, and historical failures." },
    { icon: <BookOpen className="w-5 h-5 text-[#B85D2F]" />, title: "Curriculum Aware", description: "Directly mapped to cohort modules to test practical, week-by-week progress." },
    { icon: <Cpu className="w-5 h-5 text-[#B85D2F]" />, title: "Dynamic Follow-ups", description: "Never scripted. AI analyzes response depth to probe underlying conceptual gaps." },
    { icon: <TrendingUp className="w-5 h-5 text-[#B85D2F]" />, title: "Performance Diagnostics", description: "Clean assessment indicators evaluating technical accuracy, depth, and communication." },
    { icon: <FileText className="w-5 h-5 text-[#B85D2F]" />, title: "Structured Feedback", description: "Generates explicit strengths, weaknesses, and concrete recommendations." },
    { icon: <Database className="w-5 h-5 text-[#B85D2F]" />, title: "Fact Retrieval", description: "Retrieves facts from system docs to evaluate answers against correct guidelines." },
    { icon: <Network className="w-5 h-5 text-[#B85D2F]" />, title: "Multi-Agent Graph", description: "Coordination between Planner, Evaluator, and Reporter agents ensures high quality." }
  ];

  const workflowSteps = [
    { title: "Candidate Profile", desc: "Assess completed missions, attempts, and learning signals." },
    { title: "Learning Journey", desc: "Identify focus topics and trace historical milestone context." },
    { title: "AI Interview Planner", desc: "Construct a customized technical coverage strategy (no static question banks)." },
    { title: "Dynamic Question", desc: "AI generates a targeted question for the current curriculum objective." },
    { title: "Candidate Answer", desc: "Developer types or speaks their technical architecture response." },
    { title: "Adaptive Follow-up", desc: "AI probes answer limitations or extends difficulty based on reasoning." },
    { title: "Final Assessment", desc: "Synthesize turn details into a structured capability feedback scorecard." }
  ];

  const pricing = [
    {
      name: "Standard Practice",
      price: "$0",
      description: "Perfect for engineers testing the simulator.",
      features: [
        "1 complete adaptive technical interview",
        "Curriculum objectives coverage",
        "Turn-by-turn answer evaluation",
        "Mock final report generation"
      ],
      cta: "Practice Free",
      popular: false
    },
    {
      name: "Developer Pro",
      price: "$19",
      description: "For engineers preparing for heavy enterprise tech loops.",
      features: [
        "Unlimited practice interview sessions",
        "Dynamic curriculum focus personalization",
        "Detailed multi-agent evaluation cards",
        "Interactive radar mastery mapping",
        "Custom learning path videos & readings"
      ],
      cta: "Start Pro Trial",
      popular: true
    },
    {
      name: "Enterprise Teams",
      price: "$99",
      description: "For cohort managers grading engineer performance.",
      features: [
        "Interactive cohort tracking directories",
        "Custom curriculum configuration loader",
        "Advanced MCP tool validation metrics",
        "Dedicated organizational analytics graphs"
      ],
      cta: "Contact Enterprise",
      popular: false
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#F6EBDD] paper-texture text-[#2A211B] flex flex-col font-sans select-none antialiased">
      
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-[#C8B79E] bg-[#F6EBDD]/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#E9DDCC] border border-[#C8B79E] text-[#B85D2F] shadow-sm">
              <Brain className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight text-[#171411]">
                InterviewIQ <span className="text-[#B85D2F]">AI</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-[#75665A]/80 uppercase">Cohort Interviewer</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-10 text-xs font-bold uppercase tracking-wider text-[#75665A]">
            <a href="#features" className="hover:text-[#B85D2F] transition duration-200">System Features</a>
            <a href="#workflow" className="hover:text-[#B85D2F] transition duration-200">How It Works</a>
            <a href="#pricing" className="hover:text-[#B85D2F] transition duration-200">Plans</a>
          </nav>

          <div className="hidden md:flex items-center gap-5">
            <Link href="/dashboard" className="text-xs font-bold uppercase tracking-wider text-[#75665A] hover:text-[#171411] transition duration-200">
              Sign In
            </Link>
            <Link 
              href="/dashboard" 
              className="px-5 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] shadow-sm hover:shadow transition duration-200"
            >
              Start Interview
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-[#E9DDCC] transition text-[#2A211B]" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#C8B79E] bg-[#F6EBDD] px-6 py-8 flex flex-col gap-6 text-xs font-bold uppercase tracking-wider text-[#75665A]">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>System Features</a>
            <a href="#workflow" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Plans</a>
            <hr className="border-[#C8B79E]" />
            <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
            <Link 
              href="/dashboard" 
              className="py-4 text-center rounded-xl bg-[#B85D2F] text-[#F6EBDD]"
              onClick={() => setMobileMenuOpen(false)}
            >
              Start Interview
            </Link>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-6 sm:px-8 pt-20 pb-28 md:pt-28 md:pb-36 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center flex-1">
        <div className="lg:col-span-6 flex flex-col text-left space-y-8">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-[10px] uppercase font-bold tracking-widest text-[#B85D2F] w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            Adaptive Agentic technical loops
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-[1.08] text-[#171411]">
            BUILD THE INTERVIEWER.<br />
            <span className="text-[#B85D2F]">NOT THE INTERVIEW.</span>
          </h1>

          <p className="text-base sm:text-lg text-[#75665A] max-w-xl leading-relaxed">
            An adaptive technical interviewer that understands a candidate's learning journey, challenges their reasoning, and adapts the conversation in real time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link 
              href="/dashboard"
              className="px-8 py-4.5 rounded-xl bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition duration-200"
            >
              Start Interview
              <ArrowRight className="w-4 h-4 stroke-[2]" />
            </Link>
            <a 
              href="#workflow"
              className="px-8 py-4.5 rounded-xl border border-[#C8B79E] hover:border-[#B85D2F]/30 bg-white/5 hover:bg-white/10 text-[#2A211B] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 transition duration-200"
            >
              <Play className="w-4 h-4 stroke-[2.5] text-[#B85D2F]" />
              See How It Works
            </a>
          </div>

          <div className="pt-8 border-t border-[#C8B79E] grid grid-cols-3 gap-6 max-w-lg">
            <div>
              <span className="block text-xl font-extrabold text-[#171411]">No Static Pools</span>
              <span className="text-[10px] text-[#75665A] font-bold uppercase tracking-wider">Dynamic Generation</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-[#171411]">Multi-Agent</span>
              <span className="text-[10px] text-[#75665A] font-bold uppercase tracking-wider">Interactive planner</span>
            </div>
            <div>
              <span className="block text-xl font-extrabold text-[#171411]">Curriculum-Aware</span>
              <span className="text-[10px] text-[#75665A] font-bold uppercase tracking-wider">Real-time Adaptivity</span>
            </div>
          </div>
        </div>

        {/* Sophisticated Flow Animation */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center w-full">
          <div className="w-full max-w-md p-6 rounded-2xl border border-[#C8B79E] bg-[#E9DDCC]/50 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#C8B79E] pb-3 mb-6">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#75665A] flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-[#B85D2F]" /> AI Interview Engine Graph
              </span>
              <div className="w-2 h-2 rounded-full bg-[#B85D2F] animate-pulse" />
            </div>

            <div className="space-y-3 relative">
              {heroSteps.map((step, idx) => {
                const isActive = activeHeroStep === idx;
                return (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className={`w-full p-3.5 rounded-xl border transition-all duration-500 flex items-center gap-4 ${
                        isActive 
                          ? "bg-white border-[#B85D2F] shadow-md scale-[1.03] z-10" 
                          : "bg-[#DCCCB6]/40 border-[#C8B79E]/60 opacity-50"
                      }`}
                    >
                      <div 
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-extrabold transition-all duration-300 ${
                          isActive ? "bg-[#B85D2F] text-[#F6EBDD]" : "bg-[#C8B79E] text-[#75665A]"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <div className="text-left">
                        <span className={`block text-xs font-extrabold ${isActive ? "text-[#171411]" : "text-[#75665A]"}`}>
                          {step.label}
                        </span>
                        {isActive && (
                          <span className="block text-[10px] text-[#75665A] mt-0.5 animate-fadeIn">
                            {step.desc}
                          </span>
                        )}
                      </div>
                    </div>
                    {idx < heroSteps.length - 1 && (
                      <div className={`w-0.5 h-3 transition-colors duration-500 my-1 ${
                        isActive ? "bg-[#B85D2F]" : "bg-[#C8B79E]/50"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Workflow: How It Works */}
      <section id="workflow" className="relative border-t border-[#C8B79E] bg-[#E9DDCC]/30 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mb-20 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#B85D2F] block mb-3">Interactive Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] tracking-tight leading-tight">
              Real-time Generative Loop. <br />No Predefined Question Banks.
            </h2>
            <p className="text-sm text-[#75665A] mt-4 leading-relaxed max-w-xl">
              Unlike static mock tools with predetermined checklists, InterviewIQ coordinates multiple sub-agents to construct, probe, grade, and path every turn dynamically.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left selector */}
            <div className="lg:col-span-5 space-y-3">
              {workflowSteps.map((step, idx) => {
                const isActive = activeWorkflowStep === idx;
                return (
                  <button
                    key={idx}
                    onClick={() => setActiveWorkflowStep(idx)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-4 transition-all duration-300 ${
                      isActive 
                        ? "bg-white border-[#B85D2F] shadow-sm" 
                        : "bg-[#DCCCB6]/20 border-[#C8B79E] hover:bg-[#DCCCB6]/40"
                    }`}
                  >
                    <span className={`font-mono text-xs font-extrabold ${isActive ? "text-[#B85D2F]" : "text-[#75665A]"}`}>
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <span className="block text-xs font-extrabold text-[#171411]">{step.title}</span>
                      <span className="block text-[11px] text-[#75665A] mt-1 leading-relaxed">
                        {step.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right details display card */}
            <div className="lg:col-span-7 p-8 rounded-2xl border border-[#C8B79E] bg-[#DCCCB6]/40 flex flex-col justify-between min-h-[480px]">
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-2.5 py-1 rounded bg-[#B85D2F]/10 border border-[#B85D2F]/20 text-[9px] uppercase font-bold tracking-wider text-[#B85D2F]">
                    Agent Simulation Phase {activeWorkflowStep + 1}
                  </span>
                </div>

                <div className="space-y-6">
                  <h3 className="text-xl font-extrabold text-[#171411]">
                    {workflowSteps[activeWorkflowStep].title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[#2A211B]/90 pl-4 border-l border-[#B85D2F]">
                    {workflowSteps[activeWorkflowStep].desc}
                  </p>
                </div>
              </div>

              {/* Graphic schema */}
              <div className="mt-12 p-5 rounded-xl border border-[#C8B79E] bg-[#E9DDCC]/50 text-left space-y-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#75665A] block border-b border-[#C8B79E] pb-2">
                  System Engine Activity
                </span>
                <div className="flex flex-wrap gap-2 text-[10px] font-mono text-[#75665A]">
                  <span className={`px-2 py-1 rounded border ${activeWorkflowStep >= 0 ? "border-[#B85D2F] bg-white text-[#171411]" : "border-[#C8B79E]"}`}>
                    Profile Analyzer
                  </span>
                  <span className="pt-1">➔</span>
                  <span className={`px-2 py-1 rounded border ${activeWorkflowStep >= 2 ? "border-[#B85D2F] bg-white text-[#171411]" : "border-[#C8B79E]"}`}>
                    Planner Agent
                  </span>
                  <span className="pt-1">➔</span>
                  <span className={`px-2 py-1 rounded border ${activeWorkflowStep >= 3 ? "border-[#B85D2F] bg-white text-[#171411]" : "border-[#C8B79E]"}`}>
                    Question Generator
                  </span>
                  <span className="pt-1">➔</span>
                  <span className={`px-2 py-1 rounded border ${activeWorkflowStep >= 5 ? "border-[#B85D2F] bg-white text-[#171411]" : "border-[#C8B79E]"}`}>
                    Evaluator Agent
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Feature Grid Section */}
      <section id="features" className="relative border-t border-[#C8B79E] py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mb-20 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#B85D2F] block mb-3">System Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] tracking-tight leading-tight">
              Designed for Deep Concept Probing
            </h2>
            <p className="text-sm text-[#75665A] mt-4 leading-relaxed max-w-xl">
              We leverage clean, robust system prompts and multi-agent coordination rather than superficial chat templates to map technical competence.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, idx) => (
              <div 
                key={idx} 
                className="p-6 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] hover:border-[#B85D2F]/40 hover:bg-white hover:shadow-md transition duration-300 group cursor-default"
              >
                <div className="p-3 bg-[#E9DDCC] w-fit rounded-xl mb-5 group-hover:bg-[#B85D2F]/10 group-hover:text-[#B85D2F] transition duration-300">
                  {feat.icon}
                </div>
                <h3 className="text-sm font-extrabold text-[#171411] mb-2">{feat.title}</h3>
                <p className="text-xs text-[#75665A] leading-relaxed">{feat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Options */}
      <section id="pricing" className="relative border-t border-[#C8B79E] bg-[#E9DDCC]/20 py-24 sm:py-32">
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="max-w-3xl mb-20 text-left">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#B85D2F] block mb-3">Pricing Models</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#171411] tracking-tight leading-tight">
              Honest Plans for Cohorts and Developers
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricing.map((plan, idx) => (
              <div 
                key={idx} 
                className={`p-8 rounded-2xl border relative flex flex-col justify-between min-h-[480px] ${
                  plan.popular 
                    ? "bg-[#DCCCB6]/60 border-[#B85D2F] shadow-lg" 
                    : "bg-[#DCCCB6]/30 border-[#C8B79E]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-6 -translate-y-1/2 px-3 py-1 rounded-full text-[9px] uppercase tracking-wider font-extrabold bg-[#B85D2F] text-[#F6EBDD]">
                    Highly Selected
                  </div>
                )}
                
                <div>
                  <h3 className="text-base font-extrabold text-[#171411] mb-2">{plan.name}</h3>
                  <p className="text-[11px] text-[#75665A] mb-6 leading-relaxed">{plan.description}</p>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-extrabold text-[#171411]">{plan.price}</span>
                    <span className="text-xs text-[#75665A]/80 font-bold uppercase tracking-wider">/ month</span>
                  </div>

                  <hr className="border-[#C8B79E] mb-6" />

                  <ul className="space-y-4 text-xs text-[#2A211B] mb-8 leading-relaxed">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2.5">
                        <Check className="w-4 h-4 text-[#B85D2F] flex-shrink-0" />
                        {feat}
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  href="/dashboard" 
                  className={`py-3.5 text-center rounded-xl text-xs font-extrabold uppercase tracking-wider transition duration-200 ${
                    plan.popular 
                      ? "bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] shadow-sm hover:shadow" 
                      : "bg-[#E9DDCC] hover:bg-[#DCCCB6] text-[#2A211B] border border-[#C8B79E]"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#C8B79E] py-16 bg-[#F6EBDD]">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-[11px] font-bold uppercase tracking-wider text-[#75665A]">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#B85D2F]" />
            <span className="font-extrabold text-sm tracking-tight text-[#171411]">
              InterviewIQ <span className="text-[#B85D2F]">AI</span>
            </span>
          </div>

          <div className="flex gap-8">
            <a href="#" className="hover:text-[#B85D2F]">Docs</a>
            <a href="#" className="hover:text-[#B85D2F]">Privacy</a>
            <a href="#" className="hover:text-[#B85D2F]">Terms</a>
            <a href="#" className="hover:text-[#B85D2F]">Contact</a>
          </div>

          <p className="normal-case font-normal text-slate-500">© 2026 InterviewIQ AI. Build the Interviewer. Not the Interview.</p>
        </div>
      </footer>
    </div>
  );
}
