import { NextRequest, NextResponse } from 'next/server'
import { URL } from 'url'

interface ArticleLink {
  url: string
  title: string
  domain: string
}

interface ExternalLink {
  url: string
  title?: string
  source: string
  sourceArticle: string
  domain: string
}

interface ExtractionResult {
  totalArticles: number
  totalExternalLinks: number
  uniqueDomains: number
  articles: ArticleLink[]
  externalLinks: ExternalLink[]
  processingTime: number
  articlesWithExternalLinks: number
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return ''
  }
}

function isExternalLink(link: string, baseUrl: string): boolean {
  try {
    const linkUrl = new URL(link, baseUrl)
    const baseHost = new URL(baseUrl).hostname
    return linkUrl.hostname !== baseHost
  } catch {
    return false
  }
}

function normalizeUrl(url: string, baseUrl: string): string {
  try {
    // Handle relative URLs
    if (url.startsWith('//')) {
      return `https:${url}`
    }
    if (url.startsWith('/')) {
      return new URL(url, baseUrl).href
    }
    if (!url.startsWith('http')) {
      return new URL(url, baseUrl).href
    }
    return url
  } catch {
    return url
  }
}

function isArticleLink(url: string, title: string): boolean {
  // Common patterns that indicate article links
  const articlePatterns = [
    /\/article\//i,
    /\/blog\//i,
    /\/post\//i,
    /\/news\//i,
    /\/story\//i,
    /\/\d{4}\/\d{2}\//i, // Date-based URLs like /2024/01/
    /-([0-9]+)$/, // URLs ending with numbers
  ]

  // Skip common non-article patterns
  const skipPatterns = [
    /\/category\//i,
    /\/tag\//i,
    /\/author\//i,
    /\/page\//i,
    /\/search/i,
    /\/login/i,
    /\/register/i,
    /\/contact/i,
    /\/about/i,
    /\.pdf$/i,
    /\.jpg$/i,
    /\.png$/i,
    /\.gif$/i,
    /#/,
    /\?/,
  ]

  // Check if URL should be skipped
  for (const pattern of skipPatterns) {
    if (pattern.test(url)) return false
  }

  // Check if URL matches article patterns
  for (const pattern of articlePatterns) {
    if (pattern.test(url)) return true
  }

  // If title contains common article indicators
  const titleIndicators = [
    /\b\d{4}\b/, // Contains year
    /\b(how|what|why|when|where|top|best|guide|tutorial)\b/i,
    /\b(review|analysis|breaking|latest)\b/i,
  ]

  for (const indicator of titleIndicators) {
    if (indicator.test(title)) return true
  }

  // If URL has a reasonable length and title, likely an article
  return url.length > 20 && title.length > 10
}

async function fetchWithTimeout(url: string, timeout: number = 10000): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

async function extractArticleLinks(html: string, baseUrl: string): Promise<ArticleLink[]> {
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
  const matches = [...html.matchAll(linkRegex)]

  const articles: ArticleLink[] = []
  const processedUrls = new Set<string>()

  for (const match of matches) {
    const rawUrl = match[1]
    const title = match[2].trim()
    
    if (!rawUrl || !title || title.length < 5) continue

    const normalizedUrl = normalizeUrl(rawUrl, baseUrl)
    
    if (processedUrls.has(normalizedUrl) || !isValidUrl(normalizedUrl)) continue
    
    // Only include internal links (same domain)
    if (isExternalLink(normalizedUrl, baseUrl)) continue

    // Check if it looks like an article
    if (isArticleLink(normalizedUrl, title)) {
      processedUrls.add(normalizedUrl)
      const domain = getDomain(normalizedUrl)
      
      if (domain) {
        articles.push({
          url: normalizedUrl,
          title,
          domain
        })
      }
    }
  }

  return articles.slice(0, 50) // Limit to 50 articles to avoid overwhelming
}

async function extractExternalLinksFromArticle(articleUrl: string, articleTitle: string): Promise<ExternalLink[]> {
  try {
    const response = await fetchWithTimeout(articleUrl, 10000)
    if (!response.ok) return []

    const html = await response.text()
    const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([^<]*)<\/a>/gi
    const matches = [...html.matchAll(linkRegex)]

    const externalLinks: ExternalLink[] = []
    const processedUrls = new Set<string>()

    for (const match of matches) {
      const rawUrl = match[1]
      const linkText = match[2].trim()
      
      if (!rawUrl || rawUrl.startsWith('#') || rawUrl.startsWith('javascript:') || rawUrl.startsWith('mailto:')) {
        continue
      }

      const normalizedUrl = normalizeUrl(rawUrl, articleUrl)
      
      if (processedUrls.has(normalizedUrl) || !isValidUrl(normalizedUrl)) continue
      
      if (!isExternalLink(normalizedUrl, articleUrl)) continue

      processedUrls.add(normalizedUrl)
      const domain = getDomain(normalizedUrl)
      
      if (domain) {
        externalLinks.push({
          url: normalizedUrl,
          title: linkText || undefined,
          source: articleTitle,
          sourceArticle: articleUrl,
          domain
        })
      }
    }

    return externalLinks
  } catch (error) {
    console.error(`Error extracting links from ${articleUrl}:`, error)
    return []
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const { url } = await request.json()

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'Valid URL is required' },
        { status: 400 }
      )
    }

    if (!isValidUrl(url)) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    // Extract article links from the page
    let response: Response
    try {
      response = await fetchWithTimeout(url, 15000)
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to fetch the URL. Please check if the website is accessible.' },
        { status: 400 }
      )
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: `HTTP ${response.status}: Failed to fetch the webpage` },
        { status: 400 }
      )
    }

    const contentType = response.headers.get('content-type') || ''
    if (!contentType.includes('text/html')) {
      return NextResponse.json(
        { error: 'The URL does not point to an HTML page' },
        { status: 400 }
      )
    }

    const html = await response.text()
    const articles = await extractArticleLinks(html, url)

    if (articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles found on this page. Please try a blog or news page.' },
        { status: 400 }
      )
    }

    // Extract external links from each article
    const allExternalLinks: ExternalLink[] = []

    // Process articles in batches to avoid overwhelming the server
    const batchSize = 5
    for (let i = 0; i < articles.length; i += batchSize) {
      const batch = articles.slice(i, i + batchSize)
      
      const batchPromises = batch.map(async (article) => {
        const links = await extractExternalLinksFromArticle(article.url, article.title)
        return links
      })

      const batchResults = await Promise.all(batchPromises)
      allExternalLinks.push(...batchResults.flat())

      // Small delay between batches to be respectful
      if (i + batchSize < articles.length) {
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Remove duplicate external links
    const uniqueExternalLinks = allExternalLinks.filter((link, index, self) =>
      index === self.findIndex(l => l.url === link.url)
    ).sort((a, b) => a.domain.localeCompare(b.domain))

    const uniqueDomains = new Set(uniqueExternalLinks.map(link => link.domain))
    const articlesWithLinks = new Set(uniqueExternalLinks.map(link => link.sourceArticle))
    const processingTime = (Date.now() - startTime) / 1000

    const result: ExtractionResult = {
      totalArticles: articles.length,
      totalExternalLinks: uniqueExternalLinks.length,
      uniqueDomains: uniqueDomains.size,
      articles,
      externalLinks: uniqueExternalLinks,
      processingTime,
      articlesWithExternalLinks: articlesWithLinks.size
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Link extraction error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred while extracting links' },
      { status: 500 }
    )
  }
}