"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Search, TrendingUp } from "lucide-react"

interface Keyword {
  text: string
  difficulty: "Easy" | "Medium" | "Hard"
  volume: number
}

export default function KeywordTool() {
  const [keyword, setKeyword] = useState("")
  const [keywords, setKeywords] = useState<Keyword[]>([])
  const [loading, setLoading] = useState(false)

  const generateKeywordSuggestions = (seed: string) => {
    // Mock keyword data - in production, this would call an API
    const suggestions = [
      { text: `${seed} tips`, difficulty: "Easy", volume: 1200 },
      { text: `${seed} guide`, difficulty: "Medium", volume: 850 },
      { text: `${seed} best practices`, difficulty: "Medium", volume: 620 },
      { text: `${seed} tools`, difficulty: "Hard", volume: 480 },
      { text: `how to ${seed}`, difficulty: "Easy", volume: 2100 },
    ]
    return suggestions
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!keyword.trim()) return

    setLoading(true)
    // Simulate API call
    setTimeout(() => {
      setKeywords(generateKeywordSuggestions(keyword))
      setLoading(false)
    }, 600)
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "text-green-600"
      case "Medium":
        return "text-yellow-600"
      case "Hard":
        return "text-red-600"
      default:
        return "text-gray-600"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Find Keywords</CardTitle>
          <CardDescription>Enter a seed keyword to find related opportunities</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              placeholder="e.g., web design, content marketing..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              {loading ? "Searching..." : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {keywords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Keyword Suggestions
            </CardTitle>
            <CardDescription>{keywords.length} results found</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {keywords.map((kw, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{kw.text}</p>
                    <p className="text-sm text-muted-foreground">{kw.volume.toLocaleString()} searches/month</p>
                  </div>
                  <span className={`font-semibold text-sm ${getDifficultyColor(kw.difficulty)}`}>{kw.difficulty}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
