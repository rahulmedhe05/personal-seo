"use client"

import { useState } from "react"
import KeywordResearch from "@/components/keyword-research"
import RankTracker from "@/components/rank-tracker"
import SEOAudit from "@/components/seo-audit"
import OnPageChecker from "@/components/on-page-checker"
import CompetitorTracker from "@/components/competitor-tracker"
import KeywordGapAnalysis from "@/components/keyword-gap-analysis"

export default function Home() {
  const [activeTab, setActiveTab] = useState<"keyword" | "rank" | "audit" | "onpage" | "competitor" | "gap">("keyword")

  const tabs = [
    { id: "keyword", label: "Keyword Research", icon: "🔍" },
    { id: "rank", label: "Rank Tracking", icon: "📊" },
    { id: "audit", label: "SEO Audit", icon: "✓" },
    { id: "onpage", label: "On-Page Checker", icon: "📝" },
    { id: "competitor", label: "Competitors", icon: "⚔️" },
    { id: "gap", label: "Keyword Gap", icon: "🎯" },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-slate-900">SEO Toolkit Suite</h1>
          <p className="text-slate-600 mt-2">All-in-one SEO tools for research, tracking, and optimization</p>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-4 font-medium text-sm whitespace-nowrap border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        {activeTab === "keyword" && <KeywordResearch />}
        {activeTab === "rank" && <RankTracker />}
        {activeTab === "audit" && <SEOAudit />}
        {activeTab === "onpage" && <OnPageChecker />}
        {activeTab === "competitor" && <CompetitorTracker />}
        {activeTab === "gap" && <KeywordGapAnalysis />}
      </div>
    </main>
  )
}
