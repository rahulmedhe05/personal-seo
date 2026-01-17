"use client"

import type React from "react"

import { useState } from "react"
import useSWR from "swr"

interface KeywordResult {
  keyword: string
  suggestions: string[]
  longTailKeywords: string[]
  relatedTerms: string[]
  questions: string[]
  difficulty: number
  volume: number
  opportunity: string
  metrics: {
    estimatedCPC: string
    competition: string
    trend: string
  }
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function KeywordResearch() {
  const [keyword, setKeyword] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [activeTab, setActiveTab] = useState<"suggestions" | "questions" | "longtail">("suggestions")

  const { data, isLoading, error } = useSWR<KeywordResult>(
    submitted && keyword ? `/api/keyword-research?keyword=${encodeURIComponent(keyword)}` : null,
    fetcher,
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (keyword.trim()) {
      setSubmitted(true)
    }
  }

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 30) return "text-green-600"
    if (difficulty <= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 30) return "Easy"
    if (difficulty <= 60) return "Medium"
    return "Hard"
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-900 mb-2">Enter a keyword to research</label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., best productivity apps"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            {isLoading ? "Researching..." : "Research Keyword"}
          </button>
        </div>
      </form>

      {isLoading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
          <p className="text-slate-600 mt-4">Fetching keyword data from Google...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">
          Error fetching keyword data. Please try again.
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* Metrics Overview */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Keyword Metrics: "{data.keyword}"</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Est. Search Volume</div>
                <div className="text-2xl font-bold text-blue-600">{data.volume?.toLocaleString() || "N/A"}</div>
                <div className="text-xs text-slate-500">monthly</div>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-4 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Difficulty</div>
                <div className={`text-2xl font-bold ${getDifficultyColor(data.difficulty)}`}>
                  {data.difficulty}/100
                </div>
                <div className="text-xs text-slate-500">{getDifficultyLabel(data.difficulty)}</div>
              </div>
              <div className={`p-4 rounded-lg ${
                data.opportunity === 'High' ? 'bg-gradient-to-br from-green-50 to-green-100' :
                data.opportunity === 'Medium' ? 'bg-gradient-to-br from-yellow-50 to-yellow-100' :
                'bg-gradient-to-br from-red-50 to-red-100'
              }`}>
                <div className="text-sm text-slate-600 mb-1">Opportunity</div>
                <div className={`text-2xl font-bold ${
                  data.opportunity === 'High' ? 'text-green-600' :
                  data.opportunity === 'Medium' ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {data.opportunity}
                </div>
                <div className="text-xs text-slate-500">score</div>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Est. CPC</div>
                <div className="text-2xl font-bold text-purple-600">{data.metrics?.estimatedCPC || "N/A"}</div>
                <div className="text-xs text-slate-500">per click</div>
              </div>
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 p-4 rounded-lg">
                <div className="text-sm text-slate-600 mb-1">Trend</div>
                <div className="text-2xl font-bold text-indigo-600">
                  {data.metrics?.trend === 'Rising' ? '📈' : '➡️'} {data.metrics?.trend}
                </div>
                <div className="text-xs text-slate-500">direction</div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("suggestions")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "suggestions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Related Keywords ({data.suggestions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("questions")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "questions"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Questions ({data.questions?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("longtail")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "longtail"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Long-Tail ({data.longTailKeywords?.length || 0})
            </button>
          </div>

          {/* Suggestions Tab */}
          {activeTab === "suggestions" && data.suggestions && data.suggestions.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Keywords from Google</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.suggestions.map((suggestion: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-4 py-3 bg-slate-50 rounded-lg text-slate-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                    onClick={() => {
                      setKeyword(suggestion)
                      setSubmitted(true)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-blue-500">🔍</span>
                      {suggestion}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Questions Tab */}
          {activeTab === "questions" && data.questions && data.questions.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">People Also Ask</h3>
              <div className="space-y-3">
                {data.questions.map((question: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-4 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg text-slate-700 border border-purple-100"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-purple-500">❓</span>
                      {question}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-slate-500 mt-4">
                💡 Tip: Create content that directly answers these questions to improve your chances of appearing in featured snippets.
              </p>
            </div>
          )}

          {/* Long-tail Tab */}
          {activeTab === "longtail" && data.longTailKeywords && data.longTailKeywords.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Long-Tail Keywords</h3>
              <p className="text-sm text-slate-600 mb-4">
                These longer, more specific keywords typically have lower competition and higher conversion rates.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.longTailKeywords.map((kw: string, idx: number) => (
                  <div
                    key={idx}
                    className="px-4 py-3 bg-green-50 rounded-lg text-slate-700 border border-green-100 hover:bg-green-100 cursor-pointer transition-colors"
                    onClick={() => {
                      setKeyword(kw)
                      setSubmitted(true)
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-green-500">🎯</span>
                      {kw}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips Section */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-6 rounded-lg border border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">💡 Keyword Research Tips</h3>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>• <strong>Low difficulty + High volume</strong> = Best opportunities for quick wins</li>
              <li>• <strong>Long-tail keywords</strong> are easier to rank for and often convert better</li>
              <li>• <strong>Question keywords</strong> are great for featured snippet opportunities</li>
              <li>• Click on any keyword to research it further</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
