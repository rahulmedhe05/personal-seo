// Free SERP scraper with rotation and delays
// Use responsibly - Google may block excessive requests

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
]

const GOOGLE_DOMAINS: Record<string, string> = {
  'IN': 'google.co.in',
  'US': 'google.com',
  'UK': 'google.co.uk',
  'CA': 'google.ca',
  'AU': 'google.com.au',
  'DE': 'google.de',
  'FR': 'google.fr',
  'AE': 'google.ae',
  'SG': 'google.com.sg',
}

export interface SerpResult {
  position: number
  url: string
  title: string
  description: string
  domain: string
}

export interface RankCheckResult {
  keyword: string
  targetDomain: string
  position: number | null
  url: string | null
  topResults: SerpResult[]
  checkedAt: string
  location: string
}

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}

export async function checkGoogleRank(
  keyword: string,
  targetDomain: string,
  country: string = 'IN',
  city?: string
): Promise<RankCheckResult> {
  const googleDomain = GOOGLE_DOMAINS[country] || 'google.com'
  const userAgent = getRandomUserAgent()
  
  // Build search URL with location parameters
  let searchUrl = `https://www.${googleDomain}/search?q=${encodeURIComponent(keyword)}&num=100&hl=en`
  
  // Add location for local searches
  if (city) {
    searchUrl += `&near=${encodeURIComponent(city)}`
  }
  
  // Add country-specific parameter
  const glParam = country.toLowerCase()
  searchUrl += `&gl=${glParam}`

  try {
    // Add random delay to avoid rate limiting (2-5 seconds)
    await delay(2000 + Math.random() * 3000)
    
    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      },
    })

    if (!response.ok) {
      throw new Error(`Google returned ${response.status}`)
    }

    const html = await response.text()
    
    // Parse search results
    const results = parseGoogleResults(html)
    
    // Find target domain position
    const targetDomainClean = targetDomain.replace('www.', '').toLowerCase()
    let position: number | null = null
    let foundUrl: string | null = null
    
    for (let i = 0; i < results.length; i++) {
      if (results[i].domain.toLowerCase().includes(targetDomainClean)) {
        position = i + 1
        foundUrl = results[i].url
        break
      }
    }

    return {
      keyword,
      targetDomain,
      position,
      url: foundUrl,
      topResults: results.slice(0, 10),
      checkedAt: new Date().toISOString(),
      location: city ? `${city}, ${country}` : country
    }
  } catch (error) {
    console.error('SERP check error:', error)
    
    // Return with null position on error
    return {
      keyword,
      targetDomain,
      position: null,
      url: null,
      topResults: [],
      checkedAt: new Date().toISOString(),
      location: city ? `${city}, ${country}` : country
    }
  }
}

function parseGoogleResults(html: string): SerpResult[] {
  const results: SerpResult[] = []
  
  // Multiple patterns to extract results
  // Pattern 1: Standard organic results with data-ved
  const pattern1 = /<a[^>]*href="(https?:\/\/[^"]+)"[^>]*><h3[^>]*>([^<]+)<\/h3>/gi
  
  // Pattern 2: Results in div structure  
  const pattern2 = /<div class="[^"]*"[^>]*><a href="(https?:\/\/(?!www\.google)[^"]+)"[^>]*>.*?<h3[^>]*>([^<]+)<\/h3>/gi
  
  // Pattern 3: Cite elements for URLs
  const pattern3 = /<cite[^>]*>([^<]+)<\/cite>/gi
  
  // Extract URLs from href attributes (most reliable)
  const urlPattern = /href="(https?:\/\/(?!www\.google|support\.google|accounts\.google|maps\.google)[^"]+)"/gi
  const titlePattern = /<h3[^>]*class="[^"]*"[^>]*>([^<]+)<\/h3>/gi
  
  // Find all external URLs
  const urls: string[] = []
  let urlMatch
  while ((urlMatch = urlPattern.exec(html)) !== null) {
    const url = urlMatch[1]
    // Filter out Google's own URLs and duplicates
    if (!url.includes('google.com') && 
        !url.includes('youtube.com/results') &&
        !url.includes('webcache') &&
        !urls.includes(url)) {
      urls.push(url)
    }
  }
  
  // Create results from URLs
  urls.slice(0, 100).forEach((url, index) => {
    results.push({
      position: index + 1,
      url,
      title: '', // Title extraction can be unreliable
      description: '',
      domain: extractDomain(url)
    })
  })
  
  return results
}

// Batch check multiple keywords with delays
export async function batchCheckRanks(
  keywords: string[],
  targetDomain: string,
  country: string = 'IN',
  city?: string
): Promise<RankCheckResult[]> {
  const results: RankCheckResult[] = []
  
  for (const keyword of keywords) {
    const result = await checkGoogleRank(keyword, targetDomain, country, city)
    results.push(result)
    
    // Longer delay between batch requests (5-10 seconds)
    if (keywords.indexOf(keyword) < keywords.length - 1) {
      await delay(5000 + Math.random() * 5000)
    }
  }
  
  return results
}
