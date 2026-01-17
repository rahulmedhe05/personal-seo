"use client"

import { useState } from "react"

interface OnPageAnalysis {
  keyword: string
  url: string
  titleContainsKeyword: boolean
  metaContainsKeyword: boolean
  headingsContainKeyword: boolean
  h1ContainsKeyword: boolean
  h2ContainsKeyword: boolean
  urlContainsKeyword: boolean
  keywordDensity: number
  keywordCount: number
  keywordProminence: number
  contentLength: number
  readabilityScore: number
  readabilityGrade: number
  readabilityLevel: string
  title: string
  metaDescription: string
  h1Tags: string[]
  h2Tags: string[]
  totalHeadings: number
  internalLinks: number
  externalLinks: number
  imagesCount: number
  imagesWithoutAlt: number
  suggestions: string[]
  relatedKeywords: { keyword: string; score: number }[]
  seoScore: number
  competitorAnalysis: any[]
}

export default function OnPageChecker() {
  const [url, setUrl] = useState("")
  const [keyword, setKeyword] = useState("")
  const [analysis, setAnalysis] = useState<OnPageAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleAnalyze = async () => {
    if (!url.trim() || !keyword.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/on-page-checker", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, keyword }),
      })

      const data = await res.json()
      if (res.ok) {
        setAnalysis(data)
      } else {
        setError(data.error || "Failed to analyze page")
      }
    } catch (err) {
      setError("Error analyzing page. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Check On-Page Optimization</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Target keyword"
            className="px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors disabled:bg-slate-400"
          >
            {loading ? "Analyzing..." : "Analyze"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      {analysis && (
        <div className="space-y-6">
          {/* SEO Score Banner */}
          <div className={`p-6 rounded-lg border ${
            analysis.seoScore >= 80 ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' :
            analysis.seoScore >= 50 ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200' :
            'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">On-Page SEO Score for "{analysis.keyword}"</h3>
                <p className="text-slate-600 text-sm mt-1">{analysis.url}</p>
              </div>
              <div className={`text-5xl font-bold ${
                analysis.seoScore >= 80 ? 'text-green-600' :
                analysis.seoScore >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>
                {analysis.seoScore}
              </div>
            </div>
          </div>

          {/* Keyword Placement */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Keyword Placement</h3>
            <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">Title</div>
                <div className={`text-xl font-bold ${analysis.titleContainsKeyword ? "text-green-600" : "text-red-600"}`}>
                  {analysis.titleContainsKeyword ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">Meta Desc</div>
                <div className={`text-xl font-bold ${analysis.metaContainsKeyword ? "text-green-600" : "text-red-600"}`}>
                  {analysis.metaContainsKeyword ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">H1</div>
                <div className={`text-xl font-bold ${analysis.h1ContainsKeyword ? "text-green-600" : "text-red-600"}`}>
                  {analysis.h1ContainsKeyword ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">H2</div>
                <div className={`text-xl font-bold ${analysis.h2ContainsKeyword ? "text-green-600" : "text-red-600"}`}>
                  {analysis.h2ContainsKeyword ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">URL</div>
                <div className={`text-xl font-bold ${analysis.urlContainsKeyword ? "text-green-600" : "text-red-600"}`}>
                  {analysis.urlContainsKeyword ? "✓" : "✗"}
                </div>
              </div>
              <div className="bg-white p-3 rounded-lg text-center">
                <div className="text-xs text-slate-600 mb-1">Prominence</div>
                <div className="text-xl font-bold text-blue-600">{analysis.keywordProminence}%</div>
              </div>
            </div>
          </div>

          {/* Content Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Keyword Metrics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Density</div>
                  <div className={`text-2xl font-bold ${
                    analysis.keywordDensity >= 0.5 && analysis.keywordDensity <= 3 ? 'text-green-600' : 'text-amber-600'
                  }`}>
                    {analysis.keywordDensity}%
                  </div>
                  <div className="text-xs text-slate-500">Optimal: 0.5-3%</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Occurrences</div>
                  <div className="text-2xl font-bold text-slate-900">{analysis.keywordCount}</div>
                  <div className="text-xs text-slate-500">times found</div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Content Quality</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Word Count</div>
                  <div className={`text-2xl font-bold ${analysis.contentLength >= 800 ? 'text-green-600' : 'text-amber-600'}`}>
                    {analysis.contentLength.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500">Recommended: 800+</div>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                  <div className="text-sm text-slate-600 mb-1">Readability</div>
                  <div className={`text-2xl font-bold ${analysis.readabilityScore >= 60 ? 'text-green-600' : 'text-amber-600'}`}>
                    {analysis.readabilityScore}
                  </div>
                  <div className="text-xs text-slate-500">{analysis.readabilityLevel}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Page Structure */}
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Page Structure</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Headings</div>
                <div className="text-xl font-bold text-slate-900">{analysis.totalHeadings}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Internal Links</div>
                <div className="text-xl font-bold text-slate-900">{analysis.internalLinks}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">External Links</div>
                <div className="text-xl font-bold text-slate-900">{analysis.externalLinks}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Images</div>
                <div className="text-xl font-bold text-slate-900">{analysis.imagesCount}</div>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <div className="text-sm text-slate-600">Missing Alt</div>
                <div className={`text-xl font-bold ${analysis.imagesWithoutAlt === 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {analysis.imagesWithoutAlt}
                </div>
              </div>
            </div>
            
            {analysis.h1Tags && analysis.h1Tags.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="text-sm text-slate-600 mb-2">H1 Tag:</div>
                <p className="text-slate-900 bg-slate-50 p-2 rounded">{analysis.h1Tags[0]}</p>
              </div>
            )}
          </div>

          {/* Related Keywords */}
          {analysis.relatedKeywords && analysis.relatedKeywords.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Related Keywords in Content</h3>
              <div className="flex flex-wrap gap-2">
                {analysis.relatedKeywords.map((kw: { keyword: string; score: number }, idx: number) => (
                  <span 
                    key={idx} 
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                    style={{ opacity: 0.5 + kw.score * 0.5 }}
                  >
                    {kw.keyword}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                Optimization Suggestions ({analysis.suggestions.length})
              </h3>
              <ul className="space-y-3">
                {analysis.suggestions.map((suggestion: string, idx: number) => (
                  <li key={idx} className="flex gap-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                    <span className="text-amber-600 font-bold">💡</span>
                    <span className="text-slate-700">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
