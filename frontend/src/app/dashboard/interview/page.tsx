"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Play, Pause, Award, Brain, Clock, HelpCircle, 
  MessageSquare, Volume2, VolumeX, Sparkles, Send, 
  CheckCircle, ArrowRight, Shield, Mic, Check, AlertCircle
} from "lucide-react";
import api from "@/lib/api";

interface Question {
  id: number;
  content: string;
  topic: string;
  difficulty: string;
  order_index: number;
  question_type: string;
}

interface Evaluation {
  accuracy_score: number;
  depth_score: number;
  communication_score: number;
  problem_solving_score: number;
  feedback: string;
  weak_points: string[];
  strong_points: string[];
}

export default function InterviewPage() {
  const [mounted, setMounted] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(true);
  
  // Setup configuration state
  const [difficulty, setDifficulty] = useState("Mid");
  const [length, setLength] = useState(8);
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  
  // Interview active states
  const [interview, setInterview] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [chatFeed, setChatFeed] = useState<Array<{ sender: "ai" | "user"; text: string; topic?: string; evaluation?: Evaluation }>>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  
  // Status panel states
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentConfidence, setCurrentConfidence] = useState(80);
  const [lastEvaluation, setLastEvaluation] = useState<Evaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTopicsCovered, setActiveTopicsCovered] = useState<string[]>([]);

  // Speech Recognition (Voice Input) State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Initialize Web Speech Recognition
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = false;
        rec.lang = "en-US";
        rec.onresult = (event: any) => {
          const transcript = event.results[event.results.length - 1][0].transcript;
          setAnswerInput((prev) => prev + (prev ? " " : "") + transcript);
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  // Timer interval
  useEffect(() => {
    if (interview && !isTimerPaused && interview.status !== "completed") {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [interview, isTimerPaused]);

  // Auto scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatFeed, loadingQuestion]);

  // AI Agent Voice synthesis helper
  const speakQuestion = (text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    
    // Stop ongoing speech
    window.speechSynthesis.cancel();
    
    // Strip markdown formatting before reading
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "[Code snippet skipped]")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/parent-child/gi, "parent child")
      .replace(/rag/gi, "R-A-G")
      .replace(/mcp/gi, "M-C-P")
      .replace(/hnsw/gi, "H-N-S-W")
      .replace(/ivf/gi, "I-V-F")
      .replace(/bm25/gi, "B-M 25");

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voices = window.speechSynthesis.getVoices();
    // Prefer clean US/GB english
    const enVoice = voices.find(v => v.lang.startsWith("en-US") || v.lang.startsWith("en-GB"));
    if (enVoice) {
      utterance.voice = enVoice;
    }
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  if (!mounted) return null;

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. Please use Chrome/Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleStartInterview = async () => {
    try {
      setLoadingQuestion(true);
      const candidateId = localStorage.getItem("candidate_id") || "1";
      
      const payload = {
        candidate_id: parseInt(candidateId),
        difficulty,
        focus_topics: focusTopics,
        ai_model: aiModel,
        interview_length: length
      };
      
      const data = await api.post<any>("/interview/start", payload);
      setInterview(data);
      
      // Get first question
      const firstQ = data.questions[0];
      if (firstQ) {
        setCurrentQuestion(firstQ);
        setChatFeed([{ sender: "ai", text: firstQ.content, topic: firstQ.topic }]);
        
        // Speak question if voice enabled
        setTimeout(() => speakQuestion(firstQ.content), 800);
      }
    } catch (err) {
      alert("Failed to initialize interview session.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!answerInput.trim() || !interview || !currentQuestion || loadingQuestion) return;
    
    // Stop recording if active
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const candidateAnswer = answerInput;
    setAnswerInput("");
    setShowHint(false);

    // Push candidate answer to feed
    setChatFeed((prev) => [...prev, { sender: "user", text: candidateAnswer }]);
    setLoadingQuestion(true);

    try {
      const payload = {
        interview_id: interview.id,
        question_id: currentQuestion.id,
        content: candidateAnswer
      };
      
      const res = await api.post<any>("/interview/answer", payload);
      
      // Track evaluations
      const ev: Evaluation = res.evaluation;
      setLastEvaluation(ev);
      
      // Update active confidence meter
      const newConfidence = Math.round(
        (ev.accuracy_score * 0.4) + (ev.communication_score * 0.3) + (ev.depth_score * 0.3)
      );
      setCurrentConfidence(newConfidence);

      // Track topic coverage
      if (currentQuestion.topic) {
        setActiveTopicsCovered((prev) => [...prev, currentQuestion.topic]);
      }

      // If finished, load final feedback report
      if (res.is_finished) {
        // Fetch completed interview details
        const completedData = await api.get<any>(`/interview/${interview.id}`);
        setInterview(completedData);
        setChatFeed((prev) => [
          ...prev, 
          { 
            sender: "ai", 
            text: `Thank you. The technical interview loop is complete. I have generated your multi-agent feedback report. You scored ${completedData.feedback_report.overall_score}% overall.` 
          }
        ]);
        speakQuestion("Thank you. The technical interview loop is complete. I have compiled your feedback report.");
      } else if (res.next_question) {
        // Load next question
        const nextQ: Question = res.next_question;
        setCurrentQuestion(nextQ);
        setChatFeed((prev) => [
          ...prev, 
          { sender: "ai", text: nextQ.content, topic: nextQ.topic, evaluation: ev }
        ]);
        
        // Speak question if voice enabled
        setTimeout(() => speakQuestion(nextQ.content), 800);
      }
    } catch (err) {
      alert("Failed to submit candidate response.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (!interview || interview.status === "completed") return;
    if (!confirm("Are you sure you want to end this interview early? Your feedback will be generated based on completed answers only.")) return;
    
    // Stop recording
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
    
    try {
      setLoadingQuestion(true);
      const data = await api.post<any>(`/interview/${interview.id}/end`, {});
      setInterview(data);
      setChatFeed((prev) => [
        ...prev, 
        { sender: "ai", text: `Technical loop terminated early by candidate. Final feedback compiled. Overall Score: ${data.feedback_report.overall_score}%` }
      ]);
      speakQuestion("Interview terminated. Final feedback report generated.");
    } catch (err) {
      alert("Failed to end interview session.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const topicsList = [
    "RAG Basics & Indexing",
    "Vector Similarity",
    "Retrieval Quality",
    "System Design",
    "Pinecone vs Qdrant",
    "Model Context Protocol",
    "Scaling & Optimization",
    "Best Practices"
  ];

  // ==========================================
  // RENDER SETUP SELECTION SCREEN
  // ==========================================
  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 select-none">
        <div>
          <h1 className="text-2xl font-extrabold text-[#171411]">Interview Customizer</h1>
          <p className="text-xs text-[#2A211B]/80 mt-1">Configure your target loop criteria. Our multi-agent graphs will construct curriculum queries accordingly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Settings Card */}
          <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card space-y-6">
            
            {/* Difficulty Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider block pl-1">Target Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {["Junior", "Mid", "Senior", "Lead"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      difficulty === diff 
                        ? "bg-[#B85D2F] text-black hover:warm-shadow-sm" 
                        : "bg-white/5 text-[#2A211B]/80 hover:text-[#171411] border border-[#C8B79E]"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Model Selector */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider block pl-1">AI Evaluator Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full py-2.5 px-3.5 rounded-xl border border-[#C8B79E] bg-white/5 text-xs text-[#171411] focus:outline-none focus:border-[#B85D2F]/50"
              >
                <option value="gpt-4o-mini" className="bg-[#DCCCB6]">OpenAI GPT-4o Mini (Fast)</option>
                <option value="gpt-4o" className="bg-[#DCCCB6]">OpenAI GPT-4o Enterprise (Deep)</option>
              </select>
            </div>

            {/* Loop Length */}
            <div className="space-y-2">
              <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider block pl-1">Interview Length</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 8, 12].map((len) => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    className={`py-2 rounded-xl text-xs font-bold transition ${
                      length === len 
                        ? "bg-[#9A4C2A] text-black hover:warm-shadow-sm" 
                        : "bg-white/5 text-[#2A211B]/80 hover:text-[#171411] border border-[#C8B79E]"
                    }`}
                  >
                    {len} Questions
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Topics Card */}
          <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card space-y-4">
            <label className="text-[10px] text-[#2A211B]/60 font-bold uppercase tracking-wider block pl-1">Focus Curriculum Topics</label>
            <p className="text-[10px] text-[#2A211B]/60">Selected concepts will be prioritized during planning. Leaving all unchecked uses full randomized matching.</p>
            
            <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
              {topicsList.map((topic) => {
                const isSelected = focusTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    onClick={() => {
                      if (isSelected) {
                        setFocusTopics(focusTopics.filter(t => t !== topic));
                      } else {
                        setFocusTopics([...focusTopics, topic]);
                      }
                    }}
                    className={`py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between border transition ${
                      isSelected 
                        ? "bg-[#B85D2F]/15 text-[#B85D2F] border-[#B85D2F]/30" 
                        : "bg-white/5 text-[#2A211B]/80 border-[#C8B79E] hover:text-[#171411]"
                    }`}
                  >
                    {topic}
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStartInterview}
          disabled={loadingQuestion}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#B85D2F] to-[#9A4C2A] text-[#F6EBDD] font-extrabold text-sm flex items-center justify-center gap-2 hover:warm-shadow transition duration-300 disabled:opacity-50"
        >
          {loadingQuestion ? (
            <>
              <Brain className="w-5 h-5 animate-spin" />
              Multi-Agent Planning Active...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 text-black fill-black" />
              Generate & Launch Interview Loop
            </>
          )}
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDER INTERVIEW SESSION CHAT & SIDEBAR
  // ==========================================
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 select-none max-w-7xl mx-auto h-[calc(100vh-140px)] overflow-hidden">
      
      {/* LEFT CHAT CONTAINER */}
      <div className="lg:col-span-8 flex flex-col justify-between border border-[#C8B79E] bg-[#DCCCB6]/30  rounded-[20px] overflow-hidden editorial-card h-full">
        
        {/* Chat Header Controls */}
        <div className="px-6 py-4 border-b border-[#C8B79E] flex items-center justify-between bg-[#E9DDCC]/50">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#B85D2F] animate-pulse" />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-[#171411]">Interview Engine Active</span>
              <span className="text-[9px] font-mono text-[#2A211B]/60">Model: {aiModel} | Diff: {difficulty}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Voice Toggle */}
            <button 
              onClick={() => {
                const target = !isVoiceEnabled;
                setIsVoiceEnabled(target);
                if (!target && typeof window !== "undefined" && window.speechSynthesis) {
                  window.speechSynthesis.cancel();
                }
              }}
              className={`p-2 rounded-xl border border-[#C8B79E] transition flex items-center gap-1.5 text-xs font-semibold ${
                isVoiceEnabled 
                  ? "bg-[#B85D2F]/15 text-[#B85D2F] border-[#B85D2F]/25" 
                  : "bg-white/5 text-[#2A211B]/60 hover:text-[#2A211B]"
              }`}
              title="Toggle AI voice output"
            >
              {isVoiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              Voice {isVoiceEnabled ? "On" : "Muted"}
            </button>
          </div>
        </div>

        {/* Message Feed Area */}
        <div className="flex-grow overflow-y-auto p-6 space-y-6 text-sm">
          {chatFeed.map((msg, idx) => (
            <div key={idx} className="space-y-4">
              
              {/* Question bubble */}
              {msg.sender === "ai" && (
                <div className="flex flex-col max-w-[85%] self-start items-start">
                  <span className="text-[10px] text-[#2A211B]/60 mb-1 flex items-center gap-1 pl-1">
                    <Brain className="w-3.5 h-3.5 text-[#B85D2F]" /> AI Interviewer
                    {msg.topic && <span className="text-[#9A4C2A] font-mono">[{msg.topic}]</span>}
                  </span>
                  
                  <div className="p-4 rounded-2xl bg-white/5 text-[#2A211B] border border-[#C8B79E] leading-relaxed rounded-tl-none font-medium text-sm">
                    {msg.text.split("\n").map((line, lidx) => (
                      <p key={lidx} className="mb-2 last:mb-0">{line}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Candidate Answer bubble */}
              {msg.sender === "user" && (
                <div className="flex flex-col max-w-[85%] ml-auto items-end">
                  <span className="text-[10px] text-[#2A211B]/60 mb-1 pr-1">Candidate Answer</span>
                  <div className="p-4 rounded-2xl bg-[#B85D2F]/10 text-[#171411] border border-[#B85D2F]/20 leading-relaxed rounded-tr-none text-sm">
                    {msg.text}
                  </div>
                </div>
              )}

              {/* Inline Evaluation scores under user response */}
              {msg.evaluation && (
                <div className="p-4 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/50 text-xs text-[#2A211B]/80 space-y-2 w-full max-w-[85%] ml-auto">
                  <div className="flex items-center justify-between border-b border-[#C8B79E] pb-2">
                    <span className="font-bold text-[#171411] flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-[#B85D2F]" /> Answer Grades
                    </span>
                    <span className="font-mono text-[#2A211B]/60">Evaluator Agent</span>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-bold">
                    <div className="p-2 rounded bg-white/5">
                      <span className="block text-[#2A211B]/60 uppercase">Accuracy</span>
                      <span className="block text-[#B85D2F] mt-0.5">{msg.evaluation.accuracy_score}%</span>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="block text-[#2A211B]/60 uppercase">Depth</span>
                      <span className="block text-[#9A4C2A] mt-0.5">{msg.evaluation.depth_score}%</span>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="block text-[#2A211B]/60 uppercase">Problem Solving</span>
                      <span className="block text-[#171411] mt-0.5">{msg.evaluation.problem_solving_score}%</span>
                    </div>
                    <div className="p-2 rounded bg-white/5">
                      <span className="block text-[#2A211B]/60 uppercase">Communication</span>
                      <span className="block text-[#171411] mt-0.5">{msg.evaluation.communication_score}%</span>
                    </div>
                  </div>

                  <p className="text-[10px] text-[#2A211B]/80 mt-2 leading-relaxed bg-[#E9DDCC]/50 p-2.5 rounded-lg border border-[#C8B79E]">
                    {msg.evaluation.feedback}
                  </p>
                </div>
              )}

            </div>
          ))}

          {loadingQuestion && (
            <div className="flex items-center gap-2 text-[#2A211B]/60 text-xs pl-1">
              <Brain className="w-4 h-4 animate-spin text-[#B85D2F]" />
              AI agent is thinking...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Answer Input Controls Footer */}
        <div className="p-4 border-t border-[#C8B79E] bg-[#E9DDCC]/50">
          {interview.status === "completed" ? (
            <div className="p-4 rounded-xl border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-center space-y-4">
              <p className="text-xs text-[#2A211B]">This technical interview loop has concluded. Click below to review your overall multi-agent score card.</p>
              
              <Link 
                href={`/dashboard/candidates/${localStorage.getItem("candidate_id") || 1}`}
                className="px-6 py-2.5 mx-auto rounded-xl bg-[#B85D2F] text-black text-xs font-extrabold flex items-center gap-1.5 w-fit hover:warm-shadow-sm transition duration-200"
              >
                Go to Profile Reports
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmitAnswer} className="flex gap-2">
              {/* Mic Speech Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`p-3.5 rounded-xl border transition ${
                  isListening 
                    ? "bg-red-500/20 text-red-500 border-red-500/30 animate-pulse" 
                    : "bg-white/5 border-[#C8B79E] text-[#2A211B]/80 hover:text-[#171411]"
                }`}
                title="Speak answer via browser mic"
              >
                <Mic className="w-5 h-5" />
              </button>

              <input
                type="text"
                placeholder={isListening ? "Listening... speak clearly" : "Type your technical answer here..."}
                value={answerInput}
                onChange={(e) => setAnswerInput(e.target.value)}
                disabled={loadingQuestion}
                className="flex-1 px-4 py-3.5 rounded-xl border border-[#C8B79E] bg-white/5 text-xs text-[#171411] placeholder-zinc-600 focus:outline-none focus:border-[#B85D2F]/50 focus:bg-white/10 transition"
              />

              <button
                type="submit"
                disabled={loadingQuestion || !answerInput.trim()}
                className="p-3.5 rounded-xl bg-[#B85D2F] text-[#F6EBDD] font-extrabold disabled:opacity-40 disabled:pointer-events-none hover:warm-shadow-sm transition"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* RIGHT STATUS DASHBOARD */}
      <div className="lg:col-span-4 flex flex-col gap-6 h-full overflow-y-auto pr-1">
        
        {/* Session Stats card */}
        <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card space-y-6">
          
          <div className="flex justify-between items-center border-b border-[#C8B79E] pb-4">
            <span className="text-xs font-bold text-[#171411] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-[#9A4C2A]" /> Elapsed Timer
            </span>
            <span className="font-mono text-sm text-[#171411] font-bold">{formatTimer(timerSeconds)}</span>
          </div>

          {/* Confidence Meter */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#2A211B]/60 font-bold uppercase tracking-wider">Candidate Confidence</span>
              <span className="font-bold font-mono text-[#B85D2F]">{currentConfidence}%</span>
            </div>
            
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-[#C8B79E]">
              <div 
                className="h-full bg-gradient-to-r from-[#06B6D4] to-[#10B981] transition-all duration-500" 
                style={{ width: `${currentConfidence}%` }} 
              />
            </div>
          </div>

          {/* Question order counter */}
          {currentQuestion && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#2A211B]/60 font-bold uppercase tracking-wider">Progress Checklist</span>
              <span className="font-mono font-bold text-[#171411]">Q {currentQuestion.order_index} / {interview.interview_length}</span>
            </div>
          )}

        </div>

        {/* Topic coverage list */}
        <div className="p-6 rounded-[20px] bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-xl editorial-card flex-1 flex flex-col justify-between">
          <div className="space-y-4">
            <span className="text-xs font-bold text-[#171411] block uppercase tracking-wider border-b border-[#C8B79E] pb-2.5">
              Target Concept Areas
            </span>
            
            <div className="space-y-2.5">
              {topicsList.map((topic) => {
                const isCovered = activeTopicsCovered.includes(topic);
                const isCurrent = currentQuestion?.topic === topic;
                
                return (
                  <div key={topic} className="flex items-center justify-between text-xs py-1">
                    <span className={`font-semibold ${isCurrent ? "text-[#B85D2F]" : isCovered ? "text-[#2A211B]" : "text-[#2A211B]/70"}`}>
                      {topic}
                    </span>
                    
                    {isCovered ? (
                      <Check className="w-4 h-4 text-[#B85D2F]" />
                    ) : isCurrent ? (
                      <span className="px-2 py-0.5 rounded bg-[#B85D2F]/10 border border-[#B85D2F]/20 text-[9px] text-[#B85D2F] uppercase font-bold tracking-wider animate-pulse">
                        Active
                      </span>
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-zinc-800" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Controls Footer inside sidebar */}
          {interview.status !== "completed" && (
            <div className="pt-6 border-t border-[#C8B79E] mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  if (currentQuestion?.hint) {
                    setShowHint(true);
                  } else {
                    alert("Think about how chunking strategy or distances impact high-dimensional vectors.");
                  }
                }}
                className="py-2.5 rounded-xl border border-[#C8B79E] hover:border-[#C8B79E]/60 bg-white/5 hover:bg-white/10 text-xs font-bold text-[#2A211B] flex items-center justify-center gap-1.5"
              >
                <HelpCircle className="w-4 h-4 text-[#9A4C2A]" />
                Get Hint
              </button>

              <button
                onClick={handleEndInterviewEarly}
                className="py-2.5 rounded-xl border border-red-500/20 hover:border-red-500/50 bg-red-500/5 hover:bg-red-500/15 text-xs font-bold text-red-400 flex items-center justify-center gap-1.5"
              >
                <AlertCircle className="w-4 h-4" />
                End Loop
              </button>
            </div>
          )}
        </div>

        {/* Inline Hint Card if clicked */}
        {showHint && currentQuestion && (
          <div className="p-4 rounded-xl border border-[#9A4C2A]/30 bg-[#9A4C2A]/5 text-xs text-[#9A4C2A] space-y-1.5 animate-bounce">
            <span className="font-bold flex items-center gap-1">
              <HelpCircle className="w-4 h-4" /> Interviewer Hint
            </span>
            <p className="leading-relaxed text-[11px]">{currentQuestion.hint || "Try explaining the underlying mechanism or any tradeoffs."}</p>
          </div>
        )}

      </div>

    </div>
  );
}
