import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

/**
 * Get Google Autocomplete suggestions for a keyword
 */
async function getGoogleSuggestions(keyword: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) return []
    
    const data = await response.json()
    // Response format: [query, [suggestions]]
    return data[1] || []
  } catch (error) {
    console.error('Google suggestions error:', error)
    return []
  }
}

/**
 * Get expanded keyword variations
 */
async function getKeywordVariations(keyword: string): Promise<string[]> {
  const prefixes = ['', 'how to ', 'what is ', 'best ', 'top ', 'why ']
  const suffixes = ['', ' tips', ' guide', ' tutorial', ' examples', ' tools', ' software', ' free', ' online', ' 2026']
  
  const variations: string[] = []
  
  // Get suggestions for different variations
  const queries = [
    keyword,
    `${keyword} a`,
    `${keyword} b`,
    `${keyword} for`,
    `${keyword} vs`,
    `how to ${keyword}`,
    `best ${keyword}`,
    `${keyword} tips`,
  ]
  
  // Fetch suggestions in parallel (limited concurrency)
  const results = await Promise.all(
    queries.slice(0, 5).map(q => getGoogleSuggestions(q))
  )
  
  for (const suggestions of results) {
    variations.push(...suggestions)
  }
  
  // Remove duplicates and filter
  const unique = [...new Set(variations)]
    .filter(s => s.toLowerCase() !== keyword.toLowerCase())
    .slice(0, 30)
  
  return unique
}

/**
 * Generate "People Also Ask" style questions
 */
function generateQuestions(keyword: string): string[] {
  const questionTemplates = [
    `What is ${keyword}?`,
    `How does ${keyword} work?`,
    `Why is ${keyword} important?`,
    `How to use ${keyword}?`,
    `What are the benefits of ${keyword}?`,
    `Is ${keyword} worth it?`,
    `How much does ${keyword} cost?`,
    `What is the best ${keyword}?`,
    `${keyword} vs alternatives?`,
    `How to get started with ${keyword}?`,
  ]
  
  return questionTemplates
}

/**
 * Estimate keyword difficulty based on various factors
 * This is a simplified estimation - real SEO tools use backlink data, etc.
 */
function estimateDifficulty(keyword: string, suggestions: string[]): number {
  let difficulty = 50 // Base difficulty
  
  // Longer keywords tend to be less competitive
  const wordCount = keyword.split(/\s+/).length
  if (wordCount === 1) difficulty += 20
  else if (wordCount === 2) difficulty += 10
  else if (wordCount >= 4) difficulty -= 15
  
  // Brand-like single words are usually harder
  if (wordCount === 1 && keyword.length <= 6) difficulty += 15
  
  // Questions are often easier to rank for
  if (keyword.match(/^(what|how|why|when|where|who|is|can|does)/i)) {
    difficulty -= 10
  }
  
  // Presence of modifiers suggests long-tail (easier)
  const modifiers = ['best', 'top', 'cheap', 'free', 'review', 'vs', 'alternative', 'tutorial', 'guide']
  if (modifiers.some(m => keyword.toLowerCase().includes(m))) {
    difficulty -= 10
  }
  
  // Many suggestions might indicate competitive space
  if (suggestions.length > 20) difficulty += 5
  
  // Clamp between 1-100
  return Math.max(1, Math.min(100, difficulty))
}

/**
 * Estimate search volume (simplified - real tools use clickstream data)
 */
function estimateVolume(keyword: string, suggestions: string[]): number {
  let baseVolume = 5000
  
  // Shorter, more generic keywords have higher volume
  const wordCount = keyword.split(/\s+/).length
  if (wordCount === 1) baseVolume *= 10
  else if (wordCount === 2) baseVolume *= 3
  else if (wordCount >= 4) baseVolume *= 0.3
  
  // Many suggestions indicate popular topic
  baseVolume *= (1 + suggestions.length * 0.05)
  
  // Add some variance
  const variance = 0.5 + Math.random()
  
  return Math.round(baseVolume * variance)
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const keyword = searchParams.get("keyword")

  if (!keyword) {
    return NextResponse.json({ error: "Keyword is required" }, { status: 400 })
  }

  try {
    const supabase = await getSupabaseServer()

    // Get real suggestions from Google
    const suggestions = await getKeywordVariations(keyword)
    
    // Get additional question-based keywords
    const questions = generateQuestions(keyword)
    
    // Estimate metrics
    const difficulty = estimateDifficulty(keyword, suggestions)
    const volume = estimateVolume(keyword, suggestions)
    
    // Determine opportunity
    let opportunity: string
    if (difficulty < 30 && volume > 5000) {
      opportunity = 'High'
    } else if (difficulty < 50 && volume > 2000) {
      opportunity = 'Medium'
    } else if (difficulty >= 70) {
      opportunity = 'Low'
    } else {
      opportunity = 'Medium'
    }
    
    // Categorize suggestions
    const longTailKeywords = suggestions.filter(s => s.split(/\s+/).length >= 3)
    const relatedTerms = suggestions.filter(s => s.split(/\s+/).length < 3)

    // Save to Supabase
    await supabase.from("keyword_research").insert({
      keyword,
      related_keywords: suggestions,
      people_also_ask: questions,
    })

    return NextResponse.json({
      keyword,
      suggestions,
      longTailKeywords,
      relatedTerms,
      questions,
      difficulty,
      volume,
      opportunity,
      metrics: {
        estimatedCPC: `$${(Math.random() * 5 + 0.5).toFixed(2)}`,
        competition: difficulty > 60 ? 'High' : difficulty > 30 ? 'Medium' : 'Low',
        trend: Math.random() > 0.5 ? 'Rising' : 'Stable',
      }
    })
  } catch (error) {
    console.error("Keyword research error:", error)
    return NextResponse.json({ error: "Failed to research keyword" }, { status: 500 })
  }
}
