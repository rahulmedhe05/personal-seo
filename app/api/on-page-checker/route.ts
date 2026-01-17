import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { fetchPage } from "@/lib/seo/fetcher"
import { parseHTML } from "@/lib/seo/parser"
import { analyzeKeyword, calculateReadability, extractKeywords } from "@/lib/seo/analyzer"

export async function POST(request: NextRequest) {
  try {
    const { url, keyword } = await request.json()

    if (!url || !keyword) {
      return NextResponse.json({ error: "URL and keyword are required" }, { status: 400 })
    }

    // Fetch the actual page
    const page = await fetchPage(url)
    
    if (page.error) {
      return NextResponse.json({ 
        error: `Failed to fetch page: ${page.error}` 
      }, { status: 400 })
    }

    if (page.statusCode >= 400) {
      return NextResponse.json({ 
        error: `Page returned status code ${page.statusCode}` 
      }, { status: 400 })
    }

    // Parse the HTML
    const seoData = parseHTML(page.html, page.url)
    
    // Analyze keyword usage
    const keywordAnalysis = analyzeKeyword(keyword, seoData, page.url)
    
    // Calculate readability
    const readability = calculateReadability(seoData.textContent)
    
    // Extract related keywords from content
    const contentKeywords = extractKeywords(seoData.textContent, 20)
    
    // Generate optimization suggestions based on actual analysis
    const suggestions: string[] = []
    
    if (!keywordAnalysis.inTitle) {
      suggestions.push(`Add "${keyword}" to your title tag for better relevance signals.`)
    }
    
    if (!keywordAnalysis.inMetaDescription) {
      suggestions.push(`Include "${keyword}" in your meta description to improve click-through rates.`)
    }
    
    if (!keywordAnalysis.inH1) {
      suggestions.push(`Add "${keyword}" to your H1 heading to establish topic relevance.`)
    }
    
    if (!keywordAnalysis.inH2) {
      suggestions.push(`Consider using "${keyword}" in at least one H2 subheading.`)
    }
    
    if (!keywordAnalysis.inUrl) {
      suggestions.push(`If possible, include "${keyword.replace(/\s+/g, '-')}" in the URL slug.`)
    }
    
    if (keywordAnalysis.density < 0.5) {
      suggestions.push(`Keyword density is low (${keywordAnalysis.density}%). Consider adding more mentions naturally.`)
    } else if (keywordAnalysis.density > 3) {
      suggestions.push(`Keyword density might be too high (${keywordAnalysis.density}%). Avoid over-optimization.`)
    }
    
    if (seoData.wordCount < 500) {
      suggestions.push(`Content is thin (${seoData.wordCount} words). Consider expanding to at least 800-1000 words.`)
    }
    
    if (readability.fleschReadingEase < 50) {
      suggestions.push(`Content may be difficult to read (score: ${readability.fleschReadingEase}). Simplify sentences.`)
    }
    
    if (seoData.h2.length < 2) {
      suggestions.push(`Add more H2 subheadings to improve content structure and scanability.`)
    }
    
    if (seoData.imagesWithoutAlt.length > 0) {
      suggestions.push(`${seoData.imagesWithoutAlt.length} images are missing alt text. Add keyword-relevant alt descriptions.`)
    }
    
    if (seoData.internalLinks.length < 3) {
      suggestions.push(`Add more internal links to related content on your site.`)
    }
    
    // Find related keywords from content that could be used
    const relatedKeywords = contentKeywords
      .filter(k => !keyword.toLowerCase().includes(k.keyword))
      .slice(0, 5)
      .map(k => k.keyword)
    
    if (relatedKeywords.length > 0) {
      suggestions.push(`Consider incorporating related terms: ${relatedKeywords.join(', ')}.`)
    }

    // Calculate overall SEO score
    const seoScore = Math.round(
      (keywordAnalysis.inTitle ? 20 : 0) +
      (keywordAnalysis.inMetaDescription ? 15 : 0) +
      (keywordAnalysis.inH1 ? 20 : 0) +
      (keywordAnalysis.inH2 ? 10 : 0) +
      (keywordAnalysis.inUrl ? 10 : 0) +
      (keywordAnalysis.density >= 0.5 && keywordAnalysis.density <= 3 ? 15 : 5) +
      (seoData.wordCount >= 800 ? 10 : seoData.wordCount >= 300 ? 5 : 0)
    )

    const analysis = {
      keyword,
      url: page.url,
      
      // Keyword placement
      titleContainsKeyword: keywordAnalysis.inTitle,
      metaContainsKeyword: keywordAnalysis.inMetaDescription,
      headingsContainKeyword: keywordAnalysis.inH1 || keywordAnalysis.inH2,
      h1ContainsKeyword: keywordAnalysis.inH1,
      h2ContainsKeyword: keywordAnalysis.inH2,
      urlContainsKeyword: keywordAnalysis.inUrl,
      
      // Keyword metrics
      keywordDensity: keywordAnalysis.density,
      keywordCount: keywordAnalysis.count,
      keywordProminence: keywordAnalysis.prominenceScore,
      
      // Content metrics
      contentLength: seoData.wordCount,
      readabilityScore: Math.round(readability.fleschReadingEase),
      readabilityGrade: readability.fleschKincaidGrade,
      readabilityLevel: readability.readabilityLevel,
      
      // Page structure
      title: seoData.title,
      metaDescription: seoData.metaDescription,
      h1Tags: seoData.h1,
      h2Tags: seoData.h2,
      totalHeadings: seoData.h1.length + seoData.h2.length + seoData.h3.length,
      
      // Additional metrics
      internalLinks: seoData.internalLinks.length,
      externalLinks: seoData.externalLinks.length,
      imagesCount: seoData.images.length,
      imagesWithoutAlt: seoData.imagesWithoutAlt.length,
      
      // Analysis results
      suggestions,
      relatedKeywords: contentKeywords.slice(0, 15),
      seoScore,
      
      // Legacy field
      competitorAnalysis: [],
    }

    // Save to Supabase
    const supabase = await getSupabaseServer()
    await supabase.from("on_page_seo").insert({
      url: page.url,
      keyword,
      title_contains_keyword: keywordAnalysis.inTitle,
      meta_contains_keyword: keywordAnalysis.inMetaDescription,
      headings_contain_keyword: keywordAnalysis.inH1 || keywordAnalysis.inH2,
      keyword_density: keywordAnalysis.density,
      content_length: seoData.wordCount,
      readability_score: Math.round(readability.fleschReadingEase),
      optimization_suggestions: suggestions,
    })

    return NextResponse.json(analysis)
  } catch (error) {
    console.error("On-page checker error:", error)
    return NextResponse.json({ error: "Failed to check on-page SEO" }, { status: 500 })
  }
}
