import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { fetchPage } from "@/lib/seo/fetcher"
import { parseHTML } from "@/lib/seo/parser"
import { analyzeIssues, calculateSEOScore, calculateReadability, extractKeywords } from "@/lib/seo/analyzer"

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json()

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 })
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
    
    // Analyze for issues
    const issues = analyzeIssues(seoData, page.url)
    
    // Calculate SEO score
    const score = calculateSEOScore(seoData, issues)
    
    // Calculate readability
    const readability = calculateReadability(seoData.textContent)
    
    // Extract top keywords
    const topKeywords = extractKeywords(seoData.textContent, 10)
    
    // Check if SSL is enabled
    const sslEnabled = page.url.startsWith('https://')
    
    // Build the audit result
    const auditResult = {
      // Basic Meta
      url: page.url,
      title: seoData.title,
      titleLength: seoData.title.length,
      metaDescription: seoData.metaDescription,
      metaDescriptionLength: seoData.metaDescription.length,
      canonicalUrl: seoData.canonicalUrl,
      robots: seoData.robots,
      
      // Headings
      h1Count: seoData.h1.length,
      h1Tags: seoData.h1,
      h2Count: seoData.h2.length,
      h2Tags: seoData.h2.slice(0, 10), // Limit for display
      headingStructure: {
        h1: seoData.h1.length,
        h2: seoData.h2.length,
        h3: seoData.h3.length,
        h4: seoData.h4.length,
        h5: seoData.h5.length,
        h6: seoData.h6.length,
      },
      
      // Images
      totalImages: seoData.images.length,
      imagesWithoutAlt: seoData.imagesWithoutAlt.length,
      imagesWithoutAltList: seoData.imagesWithoutAlt.slice(0, 10),
      
      // Links
      internalLinks: seoData.internalLinks.length,
      externalLinks: seoData.externalLinks.length,
      nofollowLinks: [...seoData.internalLinks, ...seoData.externalLinks]
        .filter(l => l.isNofollow).length,
      
      // Content
      wordCount: seoData.wordCount,
      readability: readability,
      topKeywords: topKeywords,
      
      // Technical
      sslEnabled,
      hasViewport: seoData.hasViewport,
      hasCharset: seoData.hasCharset,
      language: seoData.language,
      loadTime: page.loadTime,
      statusCode: page.statusCode,
      
      // Social
      ogTags: {
        title: seoData.ogTitle,
        description: seoData.ogDescription,
        image: seoData.ogImage,
        type: seoData.ogType,
        url: seoData.ogUrl,
      },
      twitterTags: {
        card: seoData.twitterCard,
        title: seoData.twitterTitle,
        description: seoData.twitterDescription,
        image: seoData.twitterImage,
      },
      
      // Schema
      hasSchemaMarkup: seoData.schemaMarkup.length > 0,
      schemaTypes: seoData.schemaMarkup.map(s => s['@type'] || 'Unknown'),
      
      // Score and Issues
      score: score,
      issues: issues,
      
      // Legacy fields for backward compatibility
      mobileOptimized: seoData.hasViewport,
      pageSpeed: Math.max(0, Math.min(100, Math.round(100 - (page.loadTime / 50)))), // Simple speed score
    }

    // Save to Supabase
    const supabase = await getSupabaseServer()
    await supabase.from("seo_audits").insert({
      url: page.url,
      title: seoData.title,
      meta_description: seoData.metaDescription,
      og_tags: auditResult.ogTags,
      twitter_tags: auditResult.twitterTags,
      headings: auditResult.headingStructure,
      images_without_alt: seoData.imagesWithoutAlt.length,
      internal_links: seoData.internalLinks.length,
      external_links: seoData.externalLinks.length,
      page_speed: auditResult.pageSpeed,
      mobile_friendly: seoData.hasViewport,
      schema_markup: seoData.schemaMarkup,
      ssl_enabled: sslEnabled,
    })

    return NextResponse.json(auditResult)
  } catch (error) {
    console.error("SEO audit error:", error)
    return NextResponse.json({ error: "Failed to audit page" }, { status: 500 })
  }
}
