import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "InterviewIQ AI - Enterprise AI Interview Platform",
  description: "Practice technical interviews with an adaptive, curriculum-aware AI. Master RAG, vector similarity search, and Model Context Protocol architectures.",
  keywords: ["AI Interviewer", "Tech Interview", "RAG Practicing", "System Design Simulator", "LangGraph", "InterviewIQ"],
  openGraph: {
    title: "InterviewIQ AI - Practice Smarter. Interview Better.",
    description: "Adaptive AI interviewer that asks personalized technical questions based on your learning journey.",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full scroll-smooth">
      <body className={`${inter.variable} min-h-full flex flex-col font-sans antialiased bg-[#F6EBDD] paper-texture text-[#F4F4F5]`}>
        {children}
      </body>
    </html>
  );
}
