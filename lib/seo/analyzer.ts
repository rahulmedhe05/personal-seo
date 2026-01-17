/**
 * SEO Content Analyzer - Analyzes content for SEO optimization
 */

import { ParsedSEOData } from './parser'

export interface SEOScore {
  overall: number
  categories: {
    content: number
    technical: number
    onPage: number
    links: number
  }
}

export interface SEOIssue {
  severity: 'error' | 'warning' | 'info'
  category: string
  message: string
  recommendation: string
}

export interface KeywordAnalysis {
  keyword: string
  inTitle: boolean
  inMetaDescription: boolean
  inH1: boolean
  inH2: boolean
  inUrl: boolean
  density: number
  count: number
  prominenceScore: number
}

export interface ReadabilityMetrics {
  fleschReadingEase: number
  fleschKincaidGrade: number
  avgSentenceLength: number
  avgWordLength: number
  readabilityLevel: string
}

/**
 * Calculate Flesch Reading Ease score
 * Score: 0-100 (higher = easier to read)
 */
export function calculateReadability(text: string): ReadabilityMetrics {
  // Split into sentences (rough approximation)
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const words = text.split(/\s+/).filter(w => w.length > 0)
  
  if (words.length === 0 || sentences.length === 0) {
    return {
      fleschReadingEase: 0,
      fleschKincaidGrade: 0,
      avgSentenceLength: 0,
      avgWordLength: 0,
      readabilityLevel: 'N/A'
    }
  }
  
  // Count syllables (rough approximation)
  const countSyllables = (word: string): number => {
    word = word.toLowerCase().replace(/[^a-z]/g, '')
    if (word.length <= 3) return 1
    
    // Count vowel groups
    const vowelGroups = word.match(/[aeiouy]+/g)
    let syllables = vowelGroups ? vowelGroups.length : 1
    
    // Adjust for silent e
    if (word.endsWith('e')) syllables--
    // Adjust for -le endings
    if (word.endsWith('le') && word.length > 2 && !/[aeiouy]/.test(word[word.length - 3])) {
      syllables++
    }
    
    return Math.max(1, syllables)
  }
  
  const totalSyllables = words.reduce((sum, word) => sum + countSyllables(word), 0)
  const avgSentenceLength = words.length / sentences.length
  const avgSyllablesPerWord = totalSyllables / words.length
  const avgWordLength = words.reduce((sum, w) => sum + w.length, 0) / words.length
  
  // Flesch Reading Ease formula
  const fleschReadingEase = Math.max(0, Math.min(100,
    206.835 - (1.015 * avgSentenceLength) - (84.6 * avgSyllablesPerWord)
  ))
  
  // Flesch-Kincaid Grade Level formula
  const fleschKincaidGrade = Math.max(0,
    (0.39 * avgSentenceLength) + (11.8 * avgSyllablesPerWord) - 15.59
  )
  
  // Determine readability level
  let readabilityLevel: string
  if (fleschReadingEase >= 90) readabilityLevel = 'Very Easy (5th grade)'
  else if (fleschReadingEase >= 80) readabilityLevel = 'Easy (6th grade)'
  else if (fleschReadingEase >= 70) readabilityLevel = 'Fairly Easy (7th grade)'
  else if (fleschReadingEase >= 60) readabilityLevel = 'Standard (8th-9th grade)'
  else if (fleschReadingEase >= 50) readabilityLevel = 'Fairly Difficult (10th-12th grade)'
  else if (fleschReadingEase >= 30) readabilityLevel = 'Difficult (College)'
  else readabilityLevel = 'Very Difficult (Graduate)'
  
  return {
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    fleschKincaidGrade: Math.round(fleschKincaidGrade * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    readabilityLevel
  }
}

/**
 * Analyze keyword usage and density
 */
export function analyzeKeyword(keyword: string, data: ParsedSEOData, url: string): KeywordAnalysis {
  const keywordLower = keyword.toLowerCase()
  const textLower = data.textContent.toLowerCase()
  
  // Count keyword occurrences
  const keywordRegex = new RegExp(`\\b${escapeRegex(keywordLower)}\\b`, 'gi')
  const matches = textLower.match(keywordRegex)
  const count = matches ? matches.length : 0
  
  // Calculate density
  const words = data.textContent.split(/\s+/).filter(w => w.length > 0)
  const keywordWords = keyword.split(/\s+/).length
  const density = words.length > 0 ? (count * keywordWords / words.length) * 100 : 0
  
  // Check positions
  const inTitle = data.title.toLowerCase().includes(keywordLower)
  const inMetaDescription = data.metaDescription.toLowerCase().includes(keywordLower)
  const inH1 = data.h1.some(h => h.toLowerCase().includes(keywordLower))
  const inH2 = data.h2.some(h => h.toLowerCase().includes(keywordLower))
  const inUrl = url.toLowerCase().includes(keywordLower.replace(/\s+/g, '-'))
  
  // Calculate prominence score (0-100)
  let prominenceScore = 0
  if (inTitle) prominenceScore += 25
  if (inMetaDescription) prominenceScore += 20
  if (inH1) prominenceScore += 25
  if (inH2) prominenceScore += 15
  if (inUrl) prominenceScore += 15
  
  return {
    keyword,
    inTitle,
    inMetaDescription,
    inH1,
    inH2,
    inUrl,
    density: Math.round(density * 100) / 100,
    count,
    prominenceScore
  }
}

/**
 * Generate SEO issues and recommendations
 */
export function analyzeIssues(data: ParsedSEOData, url: string): SEOIssue[] {
  const issues: SEOIssue[] = []
  
  // Title checks
  if (!data.title) {
    issues.push({
      severity: 'error',
      category: 'Meta Tags',
      message: 'Missing title tag',
      recommendation: 'Add a unique, descriptive title tag between 50-60 characters.'
    })
  } else if (data.title.length < 30) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `Title tag too short (${data.title.length} characters)`,
      recommendation: 'Expand your title to 50-60 characters for better SEO impact.'
    })
  } else if (data.title.length > 60) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `Title tag too long (${data.title.length} characters)`,
      recommendation: 'Shorten your title to 60 characters or less to avoid truncation in search results.'
    })
  }
  
  // Meta description checks
  if (!data.metaDescription) {
    issues.push({
      severity: 'error',
      category: 'Meta Tags',
      message: 'Missing meta description',
      recommendation: 'Add a compelling meta description between 150-160 characters.'
    })
  } else if (data.metaDescription.length < 120) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `Meta description too short (${data.metaDescription.length} characters)`,
      recommendation: 'Expand your meta description to 150-160 characters.'
    })
  } else if (data.metaDescription.length > 160) {
    issues.push({
      severity: 'warning',
      category: 'Meta Tags',
      message: `Meta description too long (${data.metaDescription.length} characters)`,
      recommendation: 'Shorten your meta description to avoid truncation in search results.'
    })
  }
  
  // H1 checks
  if (data.h1.length === 0) {
    issues.push({
      severity: 'error',
      category: 'Headings',
      message: 'Missing H1 tag',
      recommendation: 'Add exactly one H1 tag that describes the main topic of the page.'
    })
  } else if (data.h1.length > 1) {
    issues.push({
      severity: 'warning',
      category: 'Headings',
      message: `Multiple H1 tags found (${data.h1.length})`,
      recommendation: 'Use only one H1 tag per page for better SEO structure.'
    })
  }
  
  // Image alt text checks
  if (data.imagesWithoutAlt.length > 0) {
    issues.push({
      severity: 'warning',
      category: 'Images',
      message: `${data.imagesWithoutAlt.length} image(s) missing alt text`,
      recommendation: 'Add descriptive alt text to all images for accessibility and SEO.'
    })
  }
  
  // Content length check
  if (data.wordCount < 300) {
    issues.push({
      severity: 'warning',
      category: 'Content',
      message: `Thin content (${data.wordCount} words)`,
      recommendation: 'Aim for at least 300-500 words of quality content. Consider expanding with relevant information.'
    })
  }
  
  // Viewport check
  if (!data.hasViewport) {
    issues.push({
      severity: 'error',
      category: 'Technical',
      message: 'Missing viewport meta tag',
      recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1"> for mobile responsiveness.'
    })
  }
  
  // Language check
  if (!data.language) {
    issues.push({
      severity: 'warning',
      category: 'Technical',
      message: 'Missing language attribute',
      recommendation: 'Add lang attribute to the HTML tag (e.g., <html lang="en">).'
    })
  }
  
  // Canonical URL check
  if (!data.canonicalUrl) {
    issues.push({
      severity: 'info',
      category: 'Technical',
      message: 'No canonical URL specified',
      recommendation: 'Add a canonical URL to prevent duplicate content issues.'
    })
  }
  
  // Open Graph checks
  if (!data.ogTitle || !data.ogDescription || !data.ogImage) {
    issues.push({
      severity: 'info',
      category: 'Social',
      message: 'Incomplete Open Graph tags',
      recommendation: 'Add og:title, og:description, and og:image for better social media sharing.'
    })
  }
  
  // Schema markup check
  if (data.schemaMarkup.length === 0) {
    issues.push({
      severity: 'info',
      category: 'Technical',
      message: 'No structured data (Schema.org) found',
      recommendation: 'Add JSON-LD structured data to help search engines understand your content.'
    })
  }
  
  // Internal links check
  if (data.internalLinks.length < 3) {
    issues.push({
      severity: 'warning',
      category: 'Links',
      message: `Few internal links (${data.internalLinks.length})`,
      recommendation: 'Add more internal links to improve site navigation and distribute page authority.'
    })
  }
  
  return issues
}

/**
 * Calculate overall SEO score
 */
export function calculateSEOScore(data: ParsedSEOData, issues: SEOIssue[]): SEOScore {
  let contentScore = 100
  let technicalScore = 100
  let onPageScore = 100
  let linksScore = 100
  
  // Deduct points for issues
  for (const issue of issues) {
    const deduction = issue.severity === 'error' ? 15 : issue.severity === 'warning' ? 8 : 3
    
    switch (issue.category) {
      case 'Content':
        contentScore = Math.max(0, contentScore - deduction)
        break
      case 'Technical':
        technicalScore = Math.max(0, technicalScore - deduction)
        break
      case 'Meta Tags':
      case 'Headings':
      case 'Images':
        onPageScore = Math.max(0, onPageScore - deduction)
        break
      case 'Links':
        linksScore = Math.max(0, linksScore - deduction)
        break
      case 'Social':
        // Social impacts on-page
        onPageScore = Math.max(0, onPageScore - deduction / 2)
        break
    }
  }
  
  // Bonus points for good practices
  if (data.wordCount >= 1000) contentScore = Math.min(100, contentScore + 5)
  if (data.schemaMarkup.length > 0) technicalScore = Math.min(100, technicalScore + 5)
  if (data.h2.length >= 3) onPageScore = Math.min(100, onPageScore + 5)
  if (data.internalLinks.length >= 10) linksScore = Math.min(100, linksScore + 5)
  
  const overall = Math.round(
    (contentScore * 0.3) + 
    (technicalScore * 0.25) + 
    (onPageScore * 0.3) + 
    (linksScore * 0.15)
  )
  
  return {
    overall,
    categories: {
      content: Math.round(contentScore),
      technical: Math.round(technicalScore),
      onPage: Math.round(onPageScore),
      links: Math.round(linksScore)
    }
  }
}

/**
 * Escape special regex characters
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Extract keywords from text using TF-IDF-like scoring
 */
export function extractKeywords(text: string, topN = 20): { keyword: string, score: number }[] {
  // Common stop words to filter out
  const stopWords = new Set([
    'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'he',
    'in', 'is', 'it', 'its', 'of', 'on', 'that', 'the', 'to', 'was', 'were',
    'will', 'with', 'the', 'this', 'but', 'they', 'have', 'had', 'what', 'when',
    'where', 'who', 'which', 'why', 'how', 'all', 'each', 'every', 'both', 'few',
    'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own',
    'same', 'so', 'than', 'too', 'very', 'just', 'can', 'should', 'now', 'also',
    'been', 'being', 'do', 'does', 'did', 'done', 'get', 'got', 'your', 'you',
    'our', 'we', 'us', 'my', 'me', 'i', 'if', 'or', 'any', 'about', 'into',
    'through', 'during', 'before', 'after', 'above', 'below', 'up', 'down',
    'out', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here',
    'there', 'these', 'those', 'am', 'would', 'could', 'may', 'might', 'must',
    'shall', 'need', 'let', 'like', 'new', 'one', 'two', 'first', 'last', 'many'
  ])
  
  // Tokenize and clean
  const words = text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word))
  
  // Count word frequencies
  const frequency: Record<string, number> = {}
  for (const word of words) {
    frequency[word] = (frequency[word] || 0) + 1
  }
  
  // Calculate scores (TF normalized by max frequency)
  const maxFreq = Math.max(...Object.values(frequency))
  const scored = Object.entries(frequency).map(([keyword, count]) => ({
    keyword,
    score: Math.round((count / maxFreq) * 100) / 100
  }))
  
  // Sort by score and return top N
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, topN)
}
