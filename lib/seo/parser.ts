/**
 * SEO HTML Parser - Extracts SEO-relevant data from HTML
 */

export interface ParsedSEOData {
  // Meta tags
  title: string
  metaDescription: string
  metaKeywords: string
  canonicalUrl: string
  robots: string
  
  // Open Graph
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogType: string
  ogUrl: string
  
  // Twitter Cards
  twitterCard: string
  twitterTitle: string
  twitterDescription: string
  twitterImage: string
  
  // Headings
  h1: string[]
  h2: string[]
  h3: string[]
  h4: string[]
  h5: string[]
  h6: string[]
  
  // Links
  internalLinks: LinkData[]
  externalLinks: LinkData[]
  
  // Images
  images: ImageData[]
  imagesWithoutAlt: ImageData[]
  
  // Content
  wordCount: number
  textContent: string
  
  // Technical
  hasViewport: boolean
  hasCharset: boolean
  language: string
  schemaMarkup: any[]
}

export interface LinkData {
  href: string
  text: string
  rel: string
  isNofollow: boolean
}

export interface ImageData {
  src: string
  alt: string
  width?: string
  height?: string
  loading?: string
}

/**
 * Extract meta tag content
 */
function getMetaContent(html: string, name: string): string {
  // Try name attribute
  const nameMatch = html.match(new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
  if (nameMatch) return nameMatch[1]
  
  // Try content first then name
  const reverseMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'))
  if (reverseMatch) return reverseMatch[1]
  
  // Try property attribute (for OG tags)
  const propertyMatch = html.match(new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'))
  if (propertyMatch) return propertyMatch[1]
  
  // Try reverse for property
  const reversePropertyMatch = html.match(new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, 'i'))
  if (reversePropertyMatch) return reversePropertyMatch[1]
  
  return ''
}

/**
 * Extract title tag content
 */
function getTitle(html: string): string {
  const match = html.match(/<title[^>]*>([^<]*)<\/title>/i)
  return match ? match[1].trim() : ''
}

/**
 * Extract canonical URL
 */
function getCanonical(html: string): string {
  const match = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
  if (match) return match[1]
  
  const reverseMatch = html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i)
  return reverseMatch ? reverseMatch[1] : ''
}

/**
 * Extract all headings of a specific level
 */
function getHeadings(html: string, level: number): string[] {
  const regex = new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, 'gi')
  const headings: string[] = []
  let match
  
  while ((match = regex.exec(html)) !== null) {
    // Strip HTML tags from heading content
    const text = match[1].replace(/<[^>]+>/g, '').trim()
    if (text) headings.push(text)
  }
  
  return headings
}

/**
 * Extract all links from HTML
 */
function getLinks(html: string, baseUrl: string): { internal: LinkData[], external: LinkData[] } {
  const linkRegex = /<a[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi
  const internal: LinkData[] = []
  const external: LinkData[] = []
  
  let match
  const baseHost = new URL(baseUrl).hostname
  
  while ((match = linkRegex.exec(html)) !== null) {
    const href = match[1]
    const text = match[2].replace(/<[^>]+>/g, '').trim()
    const fullTag = match[0]
    
    // Extract rel attribute
    const relMatch = fullTag.match(/rel=["']([^"']*)["']/i)
    const rel = relMatch ? relMatch[1] : ''
    const isNofollow = rel.toLowerCase().includes('nofollow')
    
    const linkData: LinkData = { href, text, rel, isNofollow }
    
    // Skip empty hrefs, anchors, javascript, mailto, tel
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || 
        href.startsWith('mailto:') || href.startsWith('tel:')) {
      continue
    }
    
    try {
      const linkUrl = new URL(href, baseUrl)
      if (linkUrl.hostname === baseHost) {
        internal.push(linkData)
      } else {
        external.push(linkData)
      }
    } catch {
      // Relative URL - treat as internal
      internal.push(linkData)
    }
  }
  
  return { internal, external }
}

/**
 * Extract all images from HTML
 */
function getImages(html: string): { all: ImageData[], withoutAlt: ImageData[] } {
  const imgRegex = /<img[^>]*>/gi
  const all: ImageData[] = []
  const withoutAlt: ImageData[] = []
  
  let match
  while ((match = imgRegex.exec(html)) !== null) {
    const tag = match[0]
    
    const srcMatch = tag.match(/src=["']([^"']*)["']/i)
    const altMatch = tag.match(/alt=["']([^"']*)["']/i)
    const widthMatch = tag.match(/width=["']([^"']*)["']/i)
    const heightMatch = tag.match(/height=["']([^"']*)["']/i)
    const loadingMatch = tag.match(/loading=["']([^"']*)["']/i)
    
    const imageData: ImageData = {
      src: srcMatch ? srcMatch[1] : '',
      alt: altMatch ? altMatch[1] : '',
      width: widthMatch ? widthMatch[1] : undefined,
      height: heightMatch ? heightMatch[1] : undefined,
      loading: loadingMatch ? loadingMatch[1] : undefined,
    }
    
    if (imageData.src) {
      all.push(imageData)
      if (!imageData.alt) {
        withoutAlt.push(imageData)
      }
    }
  }
  
  return { all, withoutAlt }
}

/**
 * Extract text content and word count
 */
function getTextContent(html: string): { text: string, wordCount: number } {
  // Remove script and style tags
  let text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  text = text.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  text = text.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, '')
  
  // Remove all HTML tags
  text = text.replace(/<[^>]+>/g, ' ')
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
  text = text.replace(/&amp;/g, '&')
  text = text.replace(/&lt;/g, '<')
  text = text.replace(/&gt;/g, '>')
  text = text.replace(/&quot;/g, '"')
  text = text.replace(/&#\d+;/g, '')
  
  // Normalize whitespace
  text = text.replace(/\s+/g, ' ').trim()
  
  // Count words
  const words = text.split(/\s+/).filter(word => word.length > 0)
  
  return { text, wordCount: words.length }
}

/**
 * Extract schema.org JSON-LD markup
 */
function getSchemaMarkup(html: string): any[] {
  const schemas: any[] = []
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  
  let match
  while ((match = regex.exec(html)) !== null) {
    try {
      const schema = JSON.parse(match[1])
      schemas.push(schema)
    } catch {
      // Invalid JSON, skip
    }
  }
  
  return schemas
}

/**
 * Check for viewport meta tag
 */
function hasViewport(html: string): boolean {
  return /<meta[^>]*name=["']viewport["']/i.test(html)
}

/**
 * Check for charset declaration
 */
function hasCharset(html: string): boolean {
  return /<meta[^>]*charset=/i.test(html) || 
         /<meta[^>]*http-equiv=["']Content-Type["']/i.test(html)
}

/**
 * Get document language
 */
function getLanguage(html: string): string {
  const match = html.match(/<html[^>]*lang=["']([^"']*)["']/i)
  return match ? match[1] : ''
}

/**
 * Main parsing function
 */
export function parseHTML(html: string, baseUrl: string): ParsedSEOData {
  const links = getLinks(html, baseUrl)
  const images = getImages(html)
  const { text, wordCount } = getTextContent(html)
  
  return {
    // Meta tags
    title: getTitle(html),
    metaDescription: getMetaContent(html, 'description'),
    metaKeywords: getMetaContent(html, 'keywords'),
    canonicalUrl: getCanonical(html),
    robots: getMetaContent(html, 'robots'),
    
    // Open Graph
    ogTitle: getMetaContent(html, 'og:title'),
    ogDescription: getMetaContent(html, 'og:description'),
    ogImage: getMetaContent(html, 'og:image'),
    ogType: getMetaContent(html, 'og:type'),
    ogUrl: getMetaContent(html, 'og:url'),
    
    // Twitter Cards
    twitterCard: getMetaContent(html, 'twitter:card'),
    twitterTitle: getMetaContent(html, 'twitter:title'),
    twitterDescription: getMetaContent(html, 'twitter:description'),
    twitterImage: getMetaContent(html, 'twitter:image'),
    
    // Headings
    h1: getHeadings(html, 1),
    h2: getHeadings(html, 2),
    h3: getHeadings(html, 3),
    h4: getHeadings(html, 4),
    h5: getHeadings(html, 5),
    h6: getHeadings(html, 6),
    
    // Links
    internalLinks: links.internal,
    externalLinks: links.external,
    
    // Images
    images: images.all,
    imagesWithoutAlt: images.withoutAlt,
    
    // Content
    wordCount,
    textContent: text,
    
    // Technical
    hasViewport: hasViewport(html),
    hasCharset: hasCharset(html),
    language: getLanguage(html),
    schemaMarkup: getSchemaMarkup(html),
  }
}
