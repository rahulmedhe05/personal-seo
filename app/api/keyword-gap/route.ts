import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { fetchPage } from "@/lib/seo/fetcher"
import { parseHTML } from "@/lib/seo/parser"
import { extractKeywords } from "@/lib/seo/analyzer"

/**
 * Extract keywords from a domain's homepage and key pages
 */
async function extractDomainKeywords(domain: string): Promise<{ keyword: string; score: number }[]> {
  // Normalize domain
  const normalizedDomain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
  const url = `https://${normalizedDomain}`
  
  try {
    const page = await fetchPage(url)
    
    if (page.error || page.statusCode >= 400) {
      return []
    }
    
    const seoData = parseHTML(page.html, url)
    
    // Extract keywords from content
    const contentKeywords = extractKeywords(seoData.textContent, 50)
    
    // Also extract from meta tags and headings for more relevance
    const metaKeywords = extractKeywords(
      [seoData.title, seoData.metaDescription, ...seoData.h1, ...seoData.h2].join(' '),
      20
    )
    
    // Merge and boost meta keywords
    const keywordMap = new Map<string, number>()
    
    for (const kw of contentKeywords) {
      keywordMap.set(kw.keyword, kw.score)
    }
    
    for (const kw of metaKeywords) {
      const existing = keywordMap.get(kw.keyword) || 0
      keywordMap.set(kw.keyword, Math.min(1, existing + kw.score * 0.5))
    }
    
    // Convert back to array and sort
    return Array.from(keywordMap.entries())
      .map(([keyword, score]) => ({ keyword, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 50)
  } catch (error) {
    console.error(`Error fetching ${domain}:`, error)
    return []
  }
}

/**
 * Find keywords that competitor has but you're missing
 */
function findMissingKeywords(
  yourKeywords: { keyword: string; score: number }[],
  competitorKeywords: { keyword: string; score: number }[]
): { keyword: string; score: number; opportunity: string }[] {
  const yourKeywordSet = new Set(yourKeywords.map(k => k.keyword.toLowerCase()))
  
  const missing = competitorKeywords
    .filter(ck => !yourKeywordSet.has(ck.keyword.toLowerCase()))
    .map(ck => ({
      keyword: ck.keyword,
      score: ck.score,
      opportunity: ck.score > 0.7 ? 'High' : ck.score > 0.4 ? 'Medium' : 'Low'
    }))
  
  return missing
}

/**
 * Find common keywords between both domains
 */
function findCommonKeywords(
  yourKeywords: { keyword: string; score: number }[],
  competitorKeywords: { keyword: string; score: number }[]
): { keyword: string; yourScore: number; competitorScore: number }[] {
  const competitorMap = new Map(competitorKeywords.map(k => [k.keyword.toLowerCase(), k.score]))
  
  return yourKeywords
    .filter(yk => competitorMap.has(yk.keyword.toLowerCase()))
    .map(yk => ({
      keyword: yk.keyword,
      yourScore: yk.score,
      competitorScore: competitorMap.get(yk.keyword.toLowerCase()) || 0
    }))
    .sort((a, b) => b.competitorScore - a.competitorScore)
}

export async function POST(request: NextRequest) {
  try {
    const { yourDomain, competitorDomain } = await request.json()

    if (!yourDomain || !competitorDomain) {
      return NextResponse.json({ error: "Both domains are required" }, { status: 400 })
    }

    // Fetch and analyze both domains in parallel
    const [yourKeywords, competitorKeywords] = await Promise.all([
      extractDomainKeywords(yourDomain),
      extractDomainKeywords(competitorDomain)
    ])
    
    if (competitorKeywords.length === 0) {
      return NextResponse.json({ 
        error: `Could not analyze competitor domain: ${competitorDomain}. Make sure the URL is accessible.` 
      }, { status: 400 })
    }

    // Find gaps and opportunities
    const missingKeywords = findMissingKeywords(yourKeywords, competitorKeywords)
    const commonKeywords = findCommonKeywords(yourKeywords, competitorKeywords)
    
    // Unique to you (competitor is missing)
    const yourUniqueKeywords = findMissingKeywords(competitorKeywords, yourKeywords)
    
    // Calculate summary stats
    const summary = {
      totalCompetitorKeywords: competitorKeywords.length,
      totalYourKeywords: yourKeywords.length,
      missingKeywordsCount: missingKeywords.length,
      commonKeywordsCount: commonKeywords.length,
      yourUniqueCount: yourUniqueKeywords.length,
      gapPercentage: yourKeywords.length > 0 
        ? Math.round((missingKeywords.length / competitorKeywords.length) * 100) 
        : 100,
    }

    // Save to Supabase
    const supabase = await getSupabaseServer()
    await supabase.from("keyword_gap_analysis").insert({
      your_domain: yourDomain,
      competitor_domain: competitorDomain,
      competitor_keywords: competitorKeywords.map(k => k.keyword),
      missing_keywords: missingKeywords.map(k => k.keyword),
    })

    return NextResponse.json({
      yourDomain,
      competitorDomain,
      summary,
      competitorKeywords: competitorKeywords.map(k => k.keyword),
      yourKeywords: yourKeywords.map(k => k.keyword),
      missingKeywords: missingKeywords.map(k => ({
        keyword: k.keyword,
        opportunity: k.opportunity
      })),
      commonKeywords: commonKeywords.map(k => k.keyword),
      yourUniqueKeywords: yourUniqueKeywords.map(k => k.keyword),
      
      // Detailed data for advanced views
      detailed: {
        competitor: competitorKeywords,
        yours: yourKeywords,
        missing: missingKeywords,
        common: commonKeywords,
      }
    })
  } catch (error) {
    console.error("Keyword gap analysis error:", error)
    return NextResponse.json({ error: "Failed to analyze keyword gap" }, { status: 500 })
  }
}
