/**
 * SEO Page Fetcher - Fetches and parses web pages for SEO analysis
 */

export interface FetchedPage {
  url: string
  html: string
  statusCode: number
  headers: Record<string, string>
  loadTime: number
  error?: string
}

export async function fetchPage(url: string): Promise<FetchedPage> {
  const startTime = Date.now()
  
  try {
    // Ensure URL has protocol
    const normalizedUrl = url.startsWith('http') ? url : `https://${url}`
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 30000) // 30 second timeout
    
    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SEOToolkit/1.0; +https://seotoolkit.app)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    })
    
    clearTimeout(timeout)
    
    const html = await response.text()
    const loadTime = Date.now() - startTime
    
    // Extract headers
    const headers: Record<string, string> = {}
    response.headers.forEach((value, key) => {
      headers[key] = value
    })
    
    return {
      url: response.url, // Final URL after redirects
      html,
      statusCode: response.status,
      headers,
      loadTime,
    }
  } catch (error: any) {
    return {
      url,
      html: '',
      statusCode: 0,
      headers: {},
      loadTime: Date.now() - startTime,
      error: error.message || 'Failed to fetch page',
    }
  }
}

/**
 * Fetch multiple pages concurrently with rate limiting
 */
export async function fetchPages(urls: string[], concurrency = 3): Promise<FetchedPage[]> {
  const results: FetchedPage[] = []
  
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(fetchPage))
    results.push(...batchResults)
    
    // Small delay between batches to avoid rate limiting
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}
