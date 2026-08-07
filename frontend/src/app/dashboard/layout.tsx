"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Brain, LayoutDashboard, Users, MessageSquarePlus, 
  Settings, LogOut, ShieldAlert, Sparkles, User, Bell, ChevronDown
} from "lucide-react";
import api from "@/lib/api";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState("Sarah Jenkins");
  const [userEmail, setUserEmail] = useState("candidate@stripe.com");
  const [userRole, setUserRole] = useState("candidate");

  useEffect(() => {
    // Read cached login credentials
    const token = api.getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    const name = localStorage.getItem("candidate_name");
    const email = localStorage.getItem("email");
    const role = localStorage.getItem("role");
    
    if (name) setUserName(name);
    if (email) setUserEmail(email);
    if (role) setUserRole(role);
  }, []);

  const handleLogout = () => {
    api.clearToken();
    router.push("/login");
  };

  const navItems = [
    {
      name: "Dashboard",
      path: "/dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
      allowedRoles: ["candidate", "admin"]
    },
    {
      name: "Candidates Directory",
      path: "/dashboard/candidates",
      icon: <Users className="w-5 h-5" />,
      allowedRoles: ["admin"]  // Normally admin only, but we can bypass or show filter lists
    },
    {
      name: "Interview Setup",
      path: "/dashboard/interview",
      icon: <MessageSquarePlus className="w-5 h-5" />,
      allowedRoles: ["candidate", "admin"]
    },
    {
      name: "Admin Control Panel",
      path: "/dashboard/admin",
      icon: <ShieldAlert className="w-5 h-5" />,
      allowedRoles: ["admin"]
    }
  ];

  const filteredNavItems = navItems.filter(
    (item) => item.allowedRoles.includes(userRole) || userRole === "admin"
  );

  return (
    <div className="flex h-screen bg-[#F6EBDD] paper-texture overflow-hidden select-none">
      {/* Sidebar Panel */}
      <aside className="w-64 border-r border-[#C8B79E] bg-[#DCCCB6]/30  flex flex-col justify-between p-5">
        
        {/* Header Logo */}
        <div className="space-y-6">
          <div className="flex items-center gap-2.5 px-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-[#B85D2F] to-[#C79B5A] text-black">
              <Brain className="w-5 h-5 text-black fill-black/10" />
            </div>
            <span className="font-extrabold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
              InterviewIQ <span className="text-[#B85D2F]">AI</span>
            </span>
          </div>

          <hr className="border-[#C8B79E]" />

          {/* Navigation Links */}
          <nav className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3 py-3.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#B85D2F]/10 text-[#B85D2F] border border-[#B85D2F]/20 warm-shadow-sm"
                      : "text-[#2A211B]/80 hover:text-[#171411] hover:bg-white/5 border border-transparent"
                  }`}
                >
                  {item.icon}
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Card & Action Footer */}
        <div className="space-y-4">
          
          {userRole === "admin" && (
            <div className="px-3 py-2 rounded-xl bg-[#9A4C2A]/10 border border-[#9A4C2A]/20 text-[10px] font-bold text-[#9A4C2A] text-center flex items-center justify-center gap-1.5 animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              ADMINISTRATOR VIEW
            </div>
          )}

          <hr className="border-[#C8B79E]" />

          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/5 border border-[#C8B79E] flex items-center justify-center text-[#B85D2F] font-bold text-sm">
                {userName.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-[#171411] max-w-[120px] truncate">{userName}</span>
                <span className="text-[10px] text-[#2A211B]/60 max-w-[120px] truncate">{userEmail}</span>
              </div>
            </div>
            
            <button 
              onClick={handleLogout}
              className="p-2 rounded-xl border border-[#C8B79E] hover:border-red-500/30 hover:bg-red-500/10 text-[#2A211B]/60 hover:text-red-400 transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </aside>

      {/* Main Content Workspace */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header bar */}
        <header className="h-16 border-b border-[#C8B79E] flex items-center justify-between px-8 bg-[#F6EBDD] paper-texture/50 ">
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#2A211B]/60 uppercase tracking-widest font-bold font-mono">
              / {pathname.split("/").filter(Boolean).join(" / ")}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick System Status Toggle Info */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/40 text-[11px] text-[#2A211B]/80 font-mono">
              <div className="w-2 h-2 rounded-full bg-[#B85D2F]" />
              API: Online
            </div>

            {/* Notification Bell */}
            <button className="p-2.5 rounded-xl border border-[#C8B79E] bg-[#DCCCB6]/40 hover:bg-[#DCCCB6]/80 text-[#2A211B]/80 hover:text-[#171411] transition relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#B85D2F]" />
            </button>
          </div>
        </header>

        {/* Page Inner Container */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* Subtle Glows */}
          <div className="absolute top-12 left-12 w-64 h-64 bg-[#B85D2F]/5 rounded-full filter blur-[100px] pointer-events-none" />
          <div className="absolute bottom-12 right-12 w-64 h-64 bg-[#9A4C2A]/5 rounded-full filter blur-[100px] pointer-events-none" />
          
          <div className="relative z-10">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
