"use client"

import { useState } from "react"

interface GapAnalysisResult {
  yourDomain: string
  competitorDomain: string
  summary: {
    totalCompetitorKeywords: number
    totalYourKeywords: number
    missingKeywordsCount: number
    commonKeywordsCount: number
    yourUniqueCount: number
    gapPercentage: number
  }
  competitorKeywords: string[]
  yourKeywords: string[]
  missingKeywords: { keyword: string; opportunity: string }[]
  commonKeywords: string[]
  yourUniqueKeywords: string[]
}

export default function KeywordGapAnalysis() {
  const [yourDomain, setYourDomain] = useState("")
  const [competitorDomain, setCompetitorDomain] = useState("")
  const [analysis, setAnalysis] = useState<GapAnalysisResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"missing" | "common" | "unique">("missing")

  const handleAnalyze = async () => {
    if (!yourDomain.trim() || !competitorDomain.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/keyword-gap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ yourDomain, competitorDomain }),
      })

      const data = await res.json()
      if (res.ok) {
        setAnalysis(data)
        setActiveTab("missing")
      } else {
        setError(data.error || "Failed to analyze keyword gap")
      }
    } catch (err) {
      setError("Error analyzing keyword gap. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Analyze Keyword Gap</h3>
        <p className="text-slate-600 text-sm mb-4">
          Compare your domain with a competitor to find keyword opportunities you're missing.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={yourDomain}
            onChange={(e) => setYourDomain(e.target.value)}
            placeholder="Your domain (e.g., example.com)"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={competitorDomain}
            onChange={(e) => setCompetitorDomain(e.target.value)}
            placeholder="Competitor domain"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-slate-400"
          >
            {loading ? "Analyzing..." : "Analyze Gap"}
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full"></div>
          <p className="text-slate-600 mt-4">Analyzing both domains... This may take a moment.</p>
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      {analysis && (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-lg border border-indigo-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Gap Analysis Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-slate-600 mb-1">Your Keywords</div>
                <div className="text-2xl font-bold text-indigo-600">{analysis.summary.totalYourKeywords}</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-slate-600 mb-1">Competitor Keywords</div>
                <div className="text-2xl font-bold text-purple-600">{analysis.summary.totalCompetitorKeywords}</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-slate-600 mb-1">Keywords You're Missing</div>
                <div className="text-2xl font-bold text-red-600">{analysis.summary.missingKeywordsCount}</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-slate-600 mb-1">Common Keywords</div>
                <div className="text-2xl font-bold text-green-600">{analysis.summary.commonKeywordsCount}</div>
              </div>
              <div className="bg-white p-4 rounded-lg text-center">
                <div className="text-sm text-slate-600 mb-1">Gap Percentage</div>
                <div className={`text-2xl font-bold ${
                  analysis.summary.gapPercentage > 50 ? 'text-red-600' : 
                  analysis.summary.gapPercentage > 25 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {analysis.summary.gapPercentage}%
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("missing")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "missing"
                  ? "border-red-600 text-red-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Missing Keywords ({analysis.missingKeywords?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("common")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "common"
                  ? "border-green-600 text-green-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Common Keywords ({analysis.commonKeywords?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab("unique")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === "unique"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-600 hover:text-slate-900"
              }`}
            >
              Your Unique ({analysis.yourUniqueKeywords?.length || 0})
            </button>
          </div>

          {/* Missing Keywords Tab */}
          {activeTab === "missing" && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Keywords Your Competitor Has</h3>
              <p className="text-slate-600 text-sm mb-4">
                These are keywords found on {analysis.competitorDomain} that aren't prominent on your site.
              </p>
              {analysis.missingKeywords && analysis.missingKeywords.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {analysis.missingKeywords.map((item, idx: number) => (
                    <div
                      key={idx}
                      className={`px-4 py-3 rounded-lg border ${
                        item.opportunity === 'High' 
                          ? 'bg-green-50 border-green-200 text-green-800' 
                          : item.opportunity === 'Medium'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{item.keyword}</span>
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          item.opportunity === 'High' 
                            ? 'bg-green-200' 
                            : item.opportunity === 'Medium'
                            ? 'bg-amber-200'
                            : 'bg-slate-200'
                        }`}>
                          {item.opportunity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No missing keywords found - great job!</p>
              )}
            </div>
          )}

          {/* Common Keywords Tab */}
          {activeTab === "common" && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Keywords You Both Target</h3>
              <p className="text-slate-600 text-sm mb-4">
                These keywords appear on both sites. Consider optimizing your content to outrank the competitor.
              </p>
              {analysis.commonKeywords && analysis.commonKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                  {analysis.commonKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-green-50 text-green-700 rounded-lg text-sm border border-green-200"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No common keywords found.</p>
              )}
            </div>
          )}

          {/* Your Unique Keywords Tab */}
          {activeTab === "unique" && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Your Unique Advantages</h3>
              <p className="text-slate-600 text-sm mb-4">
                Keywords you have that your competitor is missing. These are your competitive advantages!
              </p>
              {analysis.yourUniqueKeywords && analysis.yourUniqueKeywords.length > 0 ? (
                <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
                  {analysis.yourUniqueKeywords.map((keyword: string, idx: number) => (
                    <span
                      key={idx}
                      className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-200"
                    >
                      ✓ {keyword}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 text-center py-8">No unique keywords found.</p>
              )}
            </div>
          )}

          {/* Action Items */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-lg border border-amber-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-3">📋 Recommended Actions</h3>
            <ul className="space-y-2 text-sm text-slate-700">
              {analysis.summary.missingKeywordsCount > 10 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>You're missing {analysis.summary.missingKeywordsCount} keywords. Prioritize creating content for "High" opportunity keywords first.</span>
                </li>
              )}
              {analysis.summary.commonKeywordsCount > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>You share {analysis.summary.commonKeywordsCount} keywords with your competitor. Review and improve your content to outrank them.</span>
                </li>
              )}
              {analysis.summary.yourUniqueCount > 0 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-600">•</span>
                  <span>You have {analysis.summary.yourUniqueCount} unique keywords. Strengthen your position on these topics.</span>
                </li>
              )}
              <li className="flex items-start gap-2">
                <span className="text-amber-600">•</span>
                <span>Run regular gap analyses to track your progress and discover new opportunities.</span>
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
