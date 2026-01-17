"use client"

import { useState } from "react"

interface SEOIssue {
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  recommendation: string
}

interface AuditResult {
  url: string
  title: string
  titleLength: number
  metaDescription: string
  metaDescriptionLength: number
  canonicalUrl: string
  h1Count: number
  h1Tags: string[]
  h2Count: number
  h2Tags: string[]
  headingStructure: Record<string, number>
  totalImages: number
  imagesWithoutAlt: number
  internalLinks: number
  externalLinks: number
  nofollowLinks: number
  wordCount: number
  readability: {
    fleschReadingEase: number
    fleschKincaidGrade: number
    readabilityLevel: string
  }
  topKeywords: { keyword: string; score: number }[]
  sslEnabled: boolean
  hasViewport: boolean
  hasCharset: boolean
  language: string
  loadTime: number
  statusCode: number
  ogTags: Record<string, string>
  twitterTags: Record<string, string>
  hasSchemaMarkup: boolean
  schemaTypes: string[]
  score: {
    overall: number
    categories: {
      content: number
      technical: number
      onPage: number
      links: number
    }
  }
  issues: SEOIssue[]
  mobileOptimized: boolean
  pageSpeed: number
}

export default function SEOAudit() {
  const [url, setUrl] = useState("")
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [activeTab, setActiveTab] = useState<"overview" | "content" | "technical" | "issues">("overview")

  const handleAudit = async () => {
    if (!url.trim()) return

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/seo-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      })

      const data = await res.json()
      if (res.ok) {
        setAuditResult(data)
        setActiveTab("overview")
      } else {
        setError(data.error || "Failed to audit page")
      }
    } catch (err) {
      setError("Error auditing page. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  const getScoreBg = (score: number) => {
    if (score >= 80) return "from-green-50 to-green-100 border-green-200"
    if (score >= 60) return "from-amber-50 to-amber-100 border-amber-200"
    return "from-red-50 to-red-100 border-red-200"
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Analyze a Page</h3>
        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/page"
            className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleAudit}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:bg-slate-400"
          >
            {loading ? "Auditing..." : "Audit"}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded-lg text-red-700">{error}</div>}

      {auditResult && (
        <>
          {/* Score Overview */}
          <div className={`bg-gradient-to-r ${getScoreBg(auditResult.score.overall)} p-6 rounded-lg border`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Overall SEO Score</h3>
                <p className="text-slate-600 text-sm mt-1">{auditResult.url}</p>
              </div>
              <div className={`text-5xl font-bold ${getScoreColor(auditResult.score.overall)}`}>
                {auditResult.score.overall}
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 mt-6">
              {Object.entries(auditResult.score.categories).map(([key, value]) => (
                <div key={key} className="bg-white/50 p-3 rounded-lg">
                  <div className="text-xs text-slate-500 capitalize">{key}</div>
                  <div className={`text-2xl font-bold ${getScoreColor(value)}`}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-slate-200">
            {(["overview", "content", "technical", "issues"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium text-sm capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab} {tab === "issues" && `(${auditResult.issues.length})`}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Meta Tags</h3>
                <div className="space-y-3">
                  <div className="py-2 border-b border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Title Tag</span>
                      <span className={`text-sm ${auditResult.titleLength >= 50 && auditResult.titleLength <= 60 ? "text-green-600" : "text-amber-600"}`}>
                        {auditResult.titleLength} chars
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 truncate">{auditResult.title || "Missing"}</p>
                  </div>
                  <div className="py-2 border-b border-slate-100">
                    <div className="flex justify-between mb-1">
                      <span className="text-slate-600">Meta Description</span>
                      <span className={`text-sm ${auditResult.metaDescriptionLength >= 150 && auditResult.metaDescriptionLength <= 160 ? "text-green-600" : "text-amber-600"}`}>
                        {auditResult.metaDescriptionLength} chars
                      </span>
                    </div>
                    <p className="text-sm text-slate-900 line-clamp-2">{auditResult.metaDescription || "Missing"}</p>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Canonical URL</span>
                    <span className={`font-medium ${auditResult.canonicalUrl ? "text-green-600" : "text-amber-600"}`}>
                      {auditResult.canonicalUrl ? "✓ Set" : "Not Set"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Quick Stats</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-slate-600">Load Time</div>
                    <div className={`text-2xl font-bold ${auditResult.loadTime < 2000 ? "text-green-600" : "text-amber-600"}`}>
                      {(auditResult.loadTime / 1000).toFixed(2)}s
                    </div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-slate-600">Word Count</div>
                    <div className="text-2xl font-bold text-slate-900">{auditResult.wordCount.toLocaleString()}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-slate-600">Internal Links</div>
                    <div className="text-2xl font-bold text-slate-900">{auditResult.internalLinks}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <div className="text-sm text-slate-600">External Links</div>
                    <div className="text-2xl font-bold text-slate-900">{auditResult.externalLinks}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Tab */}
          {activeTab === "content" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Heading Structure</h3>
                <div className="space-y-2">
                  {Object.entries(auditResult.headingStructure).map(([tag, count]) => (
                    <div key={tag} className="flex items-center gap-3">
                      <span className="w-8 text-sm font-mono bg-slate-100 px-2 py-1 rounded uppercase">{tag}</span>
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full" 
                          style={{ width: `${Math.min(100, count * 10)}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-600 w-8">{count}</span>
                    </div>
                  ))}
                </div>
                {auditResult.h1Tags.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="text-sm text-slate-600 mb-2">H1 Tags:</div>
                    {auditResult.h1Tags.map((h1, idx) => (
                      <p key={idx} className="text-sm text-slate-900 bg-slate-50 p-2 rounded mb-1">{h1}</p>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Readability</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Flesch Reading Ease</span>
                    <span className={`text-2xl font-bold ${auditResult.readability.fleschReadingEase >= 60 ? "text-green-600" : "text-amber-600"}`}>
                      {auditResult.readability.fleschReadingEase}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Grade Level</span>
                    <span className="font-medium text-slate-900">{auditResult.readability.fleschKincaidGrade}</span>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg">
                    <span className="text-sm text-slate-600">Level: </span>
                    <span className="font-medium text-slate-900">{auditResult.readability.readabilityLevel}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm md:col-span-2">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Top Keywords Found</h3>
                <div className="flex flex-wrap gap-2">
                  {auditResult.topKeywords.map((kw, idx) => (
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
            </div>
          )}

          {/* Technical Tab */}
          {activeTab === "technical" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Security & Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">SSL/HTTPS</span>
                    <span className={`font-medium ${auditResult.sslEnabled ? "text-green-600" : "text-red-600"}`}>
                      {auditResult.sslEnabled ? "✓ Enabled" : "✗ Not Secure"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Viewport Meta</span>
                    <span className={`font-medium ${auditResult.hasViewport ? "text-green-600" : "text-red-600"}`}>
                      {auditResult.hasViewport ? "✓ Set" : "✗ Missing"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Character Set</span>
                    <span className={`font-medium ${auditResult.hasCharset ? "text-green-600" : "text-amber-600"}`}>
                      {auditResult.hasCharset ? "✓ Declared" : "Not Found"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Language</span>
                    <span className={`font-medium ${auditResult.language ? "text-green-600" : "text-amber-600"}`}>
                      {auditResult.language || "Not Set"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-600">Schema Markup</span>
                    <span className={`font-medium ${auditResult.hasSchemaMarkup ? "text-green-600" : "text-amber-600"}`}>
                      {auditResult.hasSchemaMarkup ? `✓ ${auditResult.schemaTypes.join(', ')}` : "None Found"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Images</h3>
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Total Images</span>
                    <span className="font-medium text-slate-900">{auditResult.totalImages}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-slate-100">
                    <span className="text-slate-600">Missing Alt Text</span>
                    <span className={`font-medium ${auditResult.imagesWithoutAlt === 0 ? "text-green-600" : "text-red-600"}`}>
                      {auditResult.imagesWithoutAlt}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Open Graph</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(auditResult.ogTags).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-slate-500 w-24">{key}:</span>
                      <span className={`flex-1 truncate ${value ? "text-slate-900" : "text-red-500"}`}>
                        {value || "Missing"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Twitter Cards</h3>
                <div className="space-y-2 text-sm">
                  {Object.entries(auditResult.twitterTags).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-slate-500 w-24">{key}:</span>
                      <span className={`flex-1 truncate ${value ? "text-slate-900" : "text-slate-400"}`}>
                        {value || "Not Set"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Issues Tab */}
          {activeTab === "issues" && (
            <div className="space-y-4">
              {auditResult.issues.length === 0 ? (
                <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-center">
                  <span className="text-4xl">🎉</span>
                  <p className="text-green-700 font-medium mt-2">No major issues found!</p>
                </div>
              ) : (
                auditResult.issues.map((issue, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg border ${
                      issue.severity === 'error' 
                        ? 'bg-red-50 border-red-200' 
                        : issue.severity === 'warning'
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {issue.severity === 'error' ? '🔴' : issue.severity === 'warning' ? '🟡' : '🔵'}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            issue.severity === 'error' 
                              ? 'bg-red-200 text-red-800' 
                              : issue.severity === 'warning'
                              ? 'bg-amber-200 text-amber-800'
                              : 'bg-blue-200 text-blue-800'
                          }`}>
                            {issue.category}
                          </span>
                        </div>
                        <p className="font-medium text-slate-900">{issue.message}</p>
                        <p className="text-sm text-slate-600 mt-1">{issue.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
