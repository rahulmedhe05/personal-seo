"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CheckCircle, AlertCircle, Zap } from "lucide-react"

interface CheckItem {
  label: string
  status: "pass" | "fail" | "warning"
  message: string
}

export default function SEOChecker() {
  const [url, setUrl] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [content, setContent] = useState("")
  const [checks, setChecks] = useState<CheckItem[]>([])
  const [loading, setLoading] = useState(false)

  const performChecks = (t: string, d: string, c: string) => {
    const results: CheckItem[] = []

    // Title checks
    if (t.length === 0) {
      results.push({ label: "Page Title", status: "fail", message: "Add a page title" })
    } else if (t.length < 30) {
      results.push({ label: "Page Title", status: "warning", message: "Title too short (30-60 chars recommended)" })
    } else if (t.length > 60) {
      results.push({ label: "Page Title", status: "warning", message: "Title too long (30-60 chars recommended)" })
    } else {
      results.push({ label: "Page Title", status: "pass", message: `Good length (${t.length} chars)` })
    }

    // Meta description checks
    if (d.length === 0) {
      results.push({ label: "Meta Description", status: "fail", message: "Add a meta description" })
    } else if (d.length < 120) {
      results.push({ label: "Meta Description", status: "warning", message: "Description too short (120-160 chars)" })
    } else if (d.length > 160) {
      results.push({ label: "Meta Description", status: "warning", message: "Description too long (120-160 chars)" })
    } else {
      results.push({ label: "Meta Description", status: "pass", message: `Perfect length (${d.length} chars)` })
    }

    // Content checks
    if (c.length === 0) {
      results.push({ label: "Page Content", status: "fail", message: "Add page content" })
    } else if (c.length < 300) {
      results.push({ label: "Page Content", status: "warning", message: "Content too short (300+ words recommended)" })
    } else {
      results.push({
        label: "Page Content",
        status: "pass",
        message: `Good word count (${Math.floor(c.split(/\s+/).length)} words)`,
      })
    }

    // Keyword presence
    if (title.length > 0 && content.toLowerCase().includes(title.toLowerCase().split(" ")[0])) {
      results.push({ label: "Keyword Usage", status: "pass", message: "Primary keyword found in content" })
    } else {
      results.push({ label: "Keyword Usage", status: "warning", message: "Include primary keyword in content" })
    }

    return results
  }

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title && !description && !content) return

    setLoading(true)
    setTimeout(() => {
      const results = performChecks(title, description, content)
      setChecks(results)
      setLoading(false)
    }, 500)
  }

  const getIcon = (status: string) => {
    if (status === "pass") return <CheckCircle className="w-5 h-5 text-green-600" />
    if (status === "fail") return <AlertCircle className="w-5 h-5 text-red-600" />
    return <AlertCircle className="w-5 h-5 text-yellow-600" />
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>On-Page SEO Checker</CardTitle>
          <CardDescription>Analyze your page for SEO optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCheck} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground">Page Title</label>
              <Input
                placeholder="Your page title here"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={70}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{title.length}/70 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Meta Description</label>
              <Textarea
                placeholder="Page description for search results"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={160}
                rows={2}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">{description.length}/160 characters</p>
            </div>

            <div>
              <label className="text-sm font-medium text-foreground">Page Content</label>
              <Textarea
                placeholder="Paste your page content here"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.floor(content.split(/\s+/).filter((w) => w).length)} words
              </p>
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              <Zap className="w-4 h-4 mr-2" />
              {loading ? "Analyzing..." : "Check SEO"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {checks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5" />
              SEO Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {checks.map((check, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg border border-border">
                  <div className="mt-0.5">{getIcon(check.status)}</div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{check.label}</p>
                    <p className="text-sm text-muted-foreground">{check.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
