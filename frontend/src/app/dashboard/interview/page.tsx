"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Play, Brain, Clock, HelpCircle, 
  Send, ArrowRight, Mic, Check, AlertCircle, Sparkles,
  ArrowLeft, Terminal, Cpu, Award, RefreshCw
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
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  
  // Configuration settings
  const [difficulty, setDifficulty] = useState("Mid");
  const [length, setLength] = useState(8);
  const [focusTopics, setFocusTopics] = useState<string[]>([]);
  const [aiModel, setAiModel] = useState("gemini-3.6-flash");
  
  // Session states
  const [interview, setInterview] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [answerInput, setAnswerInput] = useState("");
  const [chatFeed, setChatFeed] = useState<Array<{ sender: "ai" | "user"; text: string; topic?: string; evaluation?: Evaluation }>>([]);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  
  // Analytics and visual indicators
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [currentConfidence, setCurrentConfidence] = useState(80);
  const [lastEvaluation, setLastEvaluation] = useState<Evaluation | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [activeTopicsCovered, setActiveTopicsCovered] = useState<string[]>([]);

  // Agent activity simulation steps
  const [agentActivityStep, setAgentActivityStep] = useState(0);

  // Speech input state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
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

  // Timer runner
  useEffect(() => {
    if (interview && !isTimerPaused && interview.status !== "completed") {
      const interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [interview, isTimerPaused]);

  // Scroll chat
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatFeed, loadingQuestion]);

  // Simulating the agent activity status updates during loading
  useEffect(() => {
    if (loadingQuestion) {
      setAgentActivityStep(0);
      const t1 = setTimeout(() => setAgentActivityStep(1), 800);
      const t2 = setTimeout(() => setAgentActivityStep(2), 2000);
      const t3 = setTimeout(() => setAgentActivityStep(3), 3500);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } else {
      setAgentActivityStep(4);
    }
  }, [loadingQuestion]);

  // Text voice helper
  const speakQuestion = (text: string) => {
    if (!isVoiceEnabled || typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const cleanText = text
      .replace(/```[\s\S]*?```/g, "[Code snippet skipped]")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/\*\*([^*]+)\*\*/g, "$1");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    window.speechSynthesis.speak(utterance);
  };

  if (!mounted) return null;

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser.");
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
      
      const firstQ = data.questions[0];
      if (firstQ) {
        setCurrentQuestion(firstQ);
        setChatFeed([{ sender: "ai", text: firstQ.content, topic: firstQ.topic }]);
        setTimeout(() => speakQuestion(firstQ.content), 600);
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
    
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const candidateAnswer = answerInput;
    setAnswerInput("");
    setShowHint(false);

    setChatFeed((prev) => [...prev, { sender: "user", text: candidateAnswer }]);
    setLoadingQuestion(true);

    try {
      const payload = {
        interview_id: interview.id,
        question_id: currentQuestion.id,
        content: candidateAnswer
      };
      
      const res = await api.post<any>("/interview/answer", payload);
      const ev: Evaluation = res.evaluation;
      setLastEvaluation(ev);
      
      const newConfidence = Math.round(
        (ev.accuracy_score * 0.4) + (ev.communication_score * 0.3) + (ev.depth_score * 0.3)
      );
      setCurrentConfidence(newConfidence);

      if (currentQuestion.topic) {
        setActiveTopicsCovered((prev) => [...prev, currentQuestion.topic]);
      }

      if (res.is_finished) {
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
        const nextQ: Question = res.next_question;
        setCurrentQuestion(nextQ);
        setChatFeed((prev) => [
          ...prev, 
          { sender: "ai", text: nextQ.content, topic: nextQ.topic, evaluation: ev }
        ]);
        setTimeout(() => speakQuestion(nextQ.content), 600);
      }
    } catch (err) {
      alert("Failed to submit candidate response.");
    } finally {
      setLoadingQuestion(false);
    }
  };

  const handleEndInterviewEarly = async () => {
    if (!interview || interview.status === "completed") return;
    if (!confirm("Are you sure you want to end this interview early?")) return;
    
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
        { sender: "ai", text: `Technical loop terminated early by candidate. Final feedback compiled.` }
      ]);
      speakQuestion("Interview terminated.");
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

  // List of standard curriculum days for layout indicator
  const curriculumSequence = [7, 8, 12, 16, 22, 23];

  // Render Customizer setup screen
  if (!interview) {
    return (
      <div className="max-w-4xl mx-auto space-y-10 py-6 select-none text-left">
        <div className="border-b border-[#C8B79E] pb-6">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#B85D2F] block mb-2">Configure Loop Parameters</span>
          <h1 className="text-3xl font-extrabold text-[#171411]">Interview Setup</h1>
          <p className="text-xs text-[#75665A] mt-1.5 leading-relaxed">
            Construct target criteria. Our AI agents will dynamically compile curriculum coverage plans based on your candidate history and selection constraints.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Loop Criteria Settings */}
          <div className="p-8 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm space-y-6">
            
            <div className="space-y-3">
              <label className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Target Difficulty</label>
              <div className="grid grid-cols-4 gap-2">
                {["Junior", "Mid", "Senior", "Lead"].map((diff) => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition duration-200 border ${
                      difficulty === diff 
                        ? "bg-[#B85D2F] text-[#F6EBDD] border-[#B85D2F] shadow-sm" 
                        : "bg-white/10 text-[#2A211B] border-[#C8B79E] hover:bg-white/30"
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">AI LLM Provider Model</label>
              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full py-3 px-4 rounded-xl border border-[#C8B79E] bg-white/20 text-xs font-bold text-[#171411] focus:outline-none focus:border-[#B85D2F] focus:ring-1 focus:ring-[#B85D2F]"
              >
                <option value="gemini-3.6-flash" className="bg-[#DCCCB6]">Gemini 3.6 Flash (Recommended)</option>
                <option value="gemini-3.5-flash" className="bg-[#DCCCB6]">Gemini 3.5 Flash</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Loop Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {[5, 8, 12].map((len) => (
                  <button
                    key={len}
                    onClick={() => setLength(len)}
                    className={`py-2.5 rounded-lg text-xs font-bold transition duration-200 border ${
                      length === len 
                        ? "bg-[#B85D2F] text-[#F6EBDD] border-[#B85D2F] shadow-sm" 
                        : "bg-white/10 text-[#2A211B] border-[#C8B79E] hover:bg-white/30"
                    }`}
                  >
                    {len} Turns
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Topics selection card */}
          <div className="p-8 rounded-2xl bg-[#DCCCB6]/40 border border-[#C8B79E] shadow-sm flex flex-col justify-between">
            <div className="space-y-4">
              <label className="text-[10px] text-[#75665A] font-extrabold uppercase tracking-wider block">Prioritized Focus Topics</label>
              <p className="text-[11px] text-[#75665A] leading-relaxed">
                Selected areas are guaranteed to appear in the planning phase. Leave all unchecked to cover standard curriculum sequence.
              </p>
              
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
                      className={`py-2.5 px-3 rounded-xl text-left text-xs font-bold flex items-center justify-between border transition duration-200 ${
                        isSelected 
                          ? "bg-[#B85D2F]/10 text-[#B85D2F] border-[#B85D2F]" 
                          : "bg-white/10 text-[#2A211B]/80 border-[#C8B79E] hover:bg-white/30"
                      }`}
                    >
                      {topic}
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#B85D2F]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={loadingQuestion}
          className="w-full py-4.5 rounded-xl bg-[#B85D2F] hover:bg-[#9A4C2A] text-[#F6EBDD] font-extrabold uppercase tracking-wider text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition duration-200 disabled:opacity-50"
        >
          {loadingQuestion ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-[#F6EBDD]" />
              Planning Customized Interview Strategy...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-[#F6EBDD] fill-[#F6EBDD]" />
              Generate & Launch Interview Loop
            </>
          )}
        </button>
      </div>
    );
  }

  // Active Interview Session Screen (Primary Split Layout)
  const currentTurnDay = currentQuestion ? (currentQuestion.order_index <= 2 ? 7 : currentQuestion.order_index <= 4 ? 8 : currentQuestion.order_index === 5 ? 12 : currentQuestion.order_index === 6 ? 16 : currentQuestion.order_index === 7 ? 22 : 23) : 7;
  const isFinished = interview.status === "completed";

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] justify-between select-none text-left">
      
      {/* Upper Split Screen Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 overflow-hidden min-h-0">
        
        {/* LEFT COLUMN: AI INTERVIEWER QUESTION DISPLAY (Visual focal point) */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-[#C8B79E] bg-[#DCCCB6]/20 rounded-2xl overflow-hidden p-8 h-full">
          
          <div className="space-y-6">
            
            {/* Header info */}
            <div className="flex justify-between items-center border-b border-[#C8B79E] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#75665A]">Curriculum Context</span>
                {currentQuestion && (
                  <h2 className="text-sm font-extrabold text-[#171411] mt-0.5">
                    Day {currentTurnDay} — {currentQuestion.topic}
                  </h2>
                )}
              </div>
              <span className="px-2.5 py-1 rounded bg-[#B85D2F]/10 border border-[#B85D2F]/20 text-[9px] font-mono uppercase tracking-wider text-[#B85D2F] font-bold">
                QUESTION {currentQuestion ? String(currentQuestion.order_index).padStart(2, '0') : "01"} / {String(length).padStart(2, '0')}+
              </span>
            </div>

            {/* Main large question: The Visual Focal Point */}
            <div className="py-6 space-y-4">
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#B85D2F] flex items-center gap-1.5 pl-1">
                <Brain className="w-4 h-4 text-[#B85D2F]" /> AI Technical Inquiry
              </span>
              
              {currentQuestion ? (
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#171411] leading-relaxed tracking-tight select-text pl-1">
                  {currentQuestion.content}
                </h1>
              ) : (
                <div className="h-28 flex items-center justify-center text-xs text-[#75665A]">
                  <RefreshCw className="w-5 h-5 animate-spin text-[#B85D2F]" />
                </div>
              )}
            </div>

          </div>

          {/* High-level Agent Activity indicator */}
          <div className="p-4 rounded-xl border border-[#C8B79E] bg-[#E9DDCC]/60 space-y-2.5 text-xs text-[#75665A]">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#75665A]/80 font-bold block mb-1">
              Agent Activity Status
            </span>
            
            <div className="space-y-1.5 font-bold">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Candidate profile analyzed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold">✓</span>
                <span>Curriculum topic selected</span>
              </div>
              
              {agentActivityStep >= 1 ? (
                <div className="flex items-center gap-2 transition duration-300">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Previous response evaluated</span>
                </div>
              ) : (
                loadingQuestion && (
                  <div className="flex items-center gap-2 text-[#171411] transition duration-300 animate-pulse">
                    <span className="text-[#B85D2F] font-bold">→</span>
                    <span>Evaluating response accuracy...</span>
                  </div>
                )
              )}

              {agentActivityStep >= 2 ? (
                <div className="flex items-center gap-2 transition duration-300">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>Target question generated</span>
                </div>
              ) : (
                loadingQuestion && agentActivityStep === 1 && (
                  <div className="flex items-center gap-2 text-[#171411] transition duration-300 animate-pulse">
                    <span className="text-[#B85D2F] font-bold">→</span>
                    <span>Preparing follow-up...</span>
                  </div>
                )
              )}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: CANDIDATE EDITOR & HISTORY */}
        <div className="lg:col-span-6 flex flex-col justify-between border border-[#C8B79E] bg-[#DCCCB6]/20 rounded-2xl overflow-hidden h-full">
          
          {/* Conversation context and history list */}
          <div className="flex-grow overflow-y-auto p-6 space-y-6 text-xs">
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#75665A]/80 font-bold block border-b border-[#C8B79E] pb-2">
              Interview Feed & Grades
            </span>
            
            {chatFeed.map((msg, idx) => (
              <div key={idx} className="space-y-3">
                {msg.sender === "ai" && (
                  <div className="flex flex-col max-w-[85%] self-start items-start">
                    <span className="text-[9px] text-[#75665A]/80 font-bold mb-1 pl-1">AI Interviewer</span>
                    <div className="p-3.5 rounded-xl bg-white border border-[#C8B79E] leading-relaxed text-[#2A211B]">
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.sender === "user" && (
                  <div className="flex flex-col max-w-[85%] ml-auto items-end">
                    <span className="text-[9px] text-[#75665A]/80 font-bold mb-1 pr-1">Candidate Answer</span>
                    <div className="p-3.5 rounded-xl bg-[#B85D2F]/15 text-[#171411] border border-[#B85D2F]/30 leading-relaxed font-semibold">
                      {msg.text}
                    </div>
                  </div>
                )}
                {msg.evaluation && (
                  <div className="p-4 rounded-xl border border-[#C8B79E] bg-[#E9DDCC]/80 text-[10px] text-[#2A211B] space-y-2.5 w-full max-w-[85%] ml-auto shadow-sm">
                    <div className="flex justify-between items-center border-b border-[#C8B79E] pb-1.5 font-bold uppercase tracking-wider text-[#75665A]">
                      <span>Turn Evaluation Card</span>
                      <span className="font-mono text-[9px] text-emerald-600">Evaluator Agent Passed</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-center font-bold">
                      <div className="p-1 rounded bg-[#DCCCB6]/40">
                        <span className="block text-[8px] text-[#75665A] uppercase">Accuracy</span>
                        <span className="block text-[#B85D2F] mt-0.5">{msg.evaluation.accuracy_score}%</span>
                      </div>
                      <div className="p-1 rounded bg-[#DCCCB6]/40">
                        <span className="block text-[8px] text-[#75665A] uppercase">Depth</span>
                        <span className="block text-[#9A4C2A] mt-0.5">{msg.evaluation.depth_score}%</span>
                      </div>
                      <div className="p-1 rounded bg-[#DCCCB6]/40">
                        <span className="block text-[8px] text-[#75665A] uppercase">Problem</span>
                        <span className="block text-[#171411] mt-0.5">{msg.evaluation.problem_solving_score}%</span>
                      </div>
                      <div className="p-1 rounded bg-[#DCCCB6]/40">
                        <span className="block text-[8px] text-[#75665A] uppercase">Comm</span>
                        <span className="block text-[#171411] mt-0.5">{msg.evaluation.communication_score}%</span>
                      </div>
                    </div>
                    <p className="text-[10px] leading-relaxed text-[#75665A] bg-white/40 p-2.5 rounded border border-[#C8B79E]/60 italic pl-3 border-l-2 border-l-[#B85D2F]">
                      {msg.evaluation.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
            
            {loadingQuestion && (
              <div className="flex items-center gap-2 text-[#75665A]/80 text-xs pl-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#B85D2F]" />
                Agent generation loop computing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Response Editor Form Footer */}
          <div className="p-4 border-t border-[#C8B79E] bg-[#E9DDCC]/50">
            {isFinished ? (
              <div className="p-4 rounded-xl border border-[#B85D2F]/20 bg-[#B85D2F]/5 text-center space-y-4">
                <p className="text-xs text-[#2A211B] font-bold">This technical interview loop has concluded. Review candidate capability report card below.</p>
                <Link 
                  href={`/dashboard/candidates/${localStorage.getItem("candidate_id") || 1}`}
                  className="px-6 py-3.5 mx-auto rounded-xl bg-[#B85D2F] text-[#F6EBDD] text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5 w-fit shadow-md hover:shadow-lg transition duration-200"
                >
                  Review Capability Report Card
                  <ArrowRight className="w-4 h-4 stroke-[2]" />
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmitAnswer} className="flex gap-2">
                <button
                  type="button"
                  onClick={toggleVoiceInput}
                  className={`p-3.5 rounded-xl border transition duration-200 ${
                    isListening 
                      ? "bg-red-500/10 text-red-500 border-red-500/30 animate-pulse" 
                      : "bg-white/10 border-[#C8B79E] text-[#2A211B]/80 hover:bg-white/30"
                  }`}
                  title="Voice dictation input"
                >
                  <Mic className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder={isListening ? "Listening... speak clearly" : "Type your conceptual or technical architecture answer..."}
                  value={answerInput}
                  onChange={(e) => setAnswerInput(e.target.value)}
                  disabled={loadingQuestion}
                  className="flex-1 px-4 py-3.5 rounded-xl border border-[#C8B79E] bg-white/20 text-xs text-[#171411] placeholder-zinc-500 focus:outline-none focus:border-[#B85D2F]"
                />

                <button
                  type="submit"
                  disabled={loadingQuestion || !answerInput.trim()}
                  className="p-3.5 rounded-xl bg-[#B85D2F] text-[#F6EBDD] font-extrabold disabled:opacity-40 hover:bg-[#9A4C2A] transition duration-200"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}
          </div>

        </div>

      </div>

      {/* BOTTOM ACTION & DYNAMIC CURRICULUM COVERAGE MAP */}
      <div className="mt-6 border-t border-[#C8B79E] pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Dynamic Curriculum coverage list */}
        <div className="flex flex-wrap gap-4 text-xs font-bold items-center">
          <span className="text-[10px] font-mono uppercase tracking-widest text-[#75665A] mr-2">Curriculum Sequence Coverage:</span>
          {curriculumSequence.map((dayNum) => {
            const isCompleted = currentTurnDay > dayNum;
            const isActive = currentTurnDay === dayNum;
            
            return (
              <div 
                key={dayNum} 
                className={`px-3 py-1.5 rounded-lg border font-mono flex items-center gap-1.5 ${
                  isActive 
                    ? "border-[#B85D2F] bg-[#B85D2F]/5 text-[#B85D2F]" 
                    : isCompleted 
                      ? "border-[#C8B79E] bg-[#DCCCB6]/40 text-[#2A211B]" 
                      : "border-[#C8B79E] bg-white/5 text-[#75665A] opacity-60"
                }`}
              >
                <span>Day {dayNum}</span>
                <span>
                  {isCompleted ? "✓" : isActive ? "●" : "○"}
                </span>
              </div>
            );
          })}
        </div>

        {/* Hint and End session action panel */}
        {!isFinished && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (currentQuestion) {
                  setShowHint(true);
                } else {
                  alert("Focus on standard vectors distance metrics and latency constraints.");
                }
              }}
              className="px-4 py-2.5 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/40 hover:bg-[#DCCCB6]/70 text-xs font-bold text-[#2A211B] flex items-center gap-1.5 transition"
            >
              <HelpCircle className="w-4 h-4 text-[#9A4C2A]" /> Hint
            </button>
            <button
              onClick={handleEndInterviewEarly}
              className="px-4 py-2.5 rounded-xl border border-red-500/10 hover:border-red-500/30 bg-red-500/5 hover:bg-red-500/10 text-xs font-bold text-red-500 flex items-center gap-1.5 transition"
            >
              End Session early
            </button>
          </div>
        )}

      </div>

      {/* Hint Alert Dialog */}
      {showHint && currentQuestion && (
        <div className="fixed bottom-24 right-8 max-w-sm p-4 rounded-xl border border-[#B85D2F] bg-white shadow-xl space-y-1.5 animate-bounce z-50 text-xs text-[#2A211B]">
          <span className="font-bold flex items-center gap-1 text-[#B85D2F]">
            <HelpCircle className="w-4.5 h-4.5" /> AI Interviewer Hint
          </span>
          <p className="leading-relaxed text-[11px] select-text">{currentQuestion.content.includes("overlap") ? "Think about how chunk border split affects semantic sentence context." : "Explain tradeoffs between accuracy recall, index memory, and latency."}</p>
          <button 
            onClick={() => setShowHint(false)} 
            className="text-[9px] uppercase tracking-wider font-extrabold text-[#75665A] block pt-1 hover:text-[#171411]"
          >
            Dismiss Hint
          </button>
        </div>
      )}

    </div>
  );
}
