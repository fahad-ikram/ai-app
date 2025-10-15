'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Loader2, ExternalLink, Globe, Download, Filter, Copy, Check, FileText, Link, Search, BarChart3, Layers, ArrowRight, Zap, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'

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

export default function Home() {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ExtractionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [filterDomain, setFilterDomain] = useState('')
  const [filterArticle, setFilterArticle] = useState('')
  const [domainFilter, setDomainFilter] = useState('')

  const extractLinks = async () => {
    if (!url) {
      setError('Please enter a valid URL')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/extract-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to extract links')
      }

      const data = await response.json()
      setResult(data)
      toast.success(`Found ${data.totalArticles} articles with ${data.totalExternalLinks} external links`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Copied to clipboard')
  }

  const exportToCSV = () => {
    if (!result) return

    // Filter out excluded domains
    const excludedDomains = [
      'youtube.com','facebook.com','instagram.com','twitter.com','linkedin.com','tiktok.com',
      'pinterest.com','snapchat.com','google.com','unsplash.com','.gov','freepik.com','pexels.com',
      'pixabay.com','reddit.com','whatsapp.com','telegram.org','tumblr.com','discord.com','vimeo.com',
      'x.com','bsky.app','threads.net'
    ]

    // Get unique domains with their statistics (excluding filtered domains)
    const domainStats = uniqueDomains
      .filter(domain => {
        return !excludedDomains.some(excluded => 
          domain.includes(excluded) || excluded.includes(domain)
        )
      })
      .map(domain => {
        const links = result.externalLinks.filter(link => link.domain === domain)
        const articles = [...new Set(links.map(link => link.sourceArticle))]
        return {
          domain,
          linkCount: links.length,
          articleCount: articles.length,
          articles: articles.slice(0, 3).join(', ') + (articles.length > 3 ? '...' : '')
        }
      })
      .sort((a, b) => b.linkCount - a.linkCount)

    const csvContent = [
      ['Domain', 'Link Count', 'Article Count', 'Sample Articles'],
      ...domainStats.map(stat => [
        stat.domain,
        stat.linkCount.toString(),
        stat.articleCount.toString(),
        stat.articles
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unique-domains-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Unique domains exported to CSV')
  }

  const exportToJSON = () => {
    if (!result) return

    // Filter out excluded domains
    const excludedDomains = [
      'youtube.com','facebook.com','instagram.com','twitter.com','linkedin.com','tiktok.com',
      'pinterest.com','snapchat.com','google.com','unsplash.com','.gov','freepik.com','pexels.com',
      'pixabay.com','reddit.com','whatsapp.com','telegram.org','tumblr.com','discord.com','vimeo.com',
      'x.com','bsky.app','threads.net'
    ]

    // Get unique domains with their statistics (excluding filtered domains)
    const domainStats = uniqueDomains
      .filter(domain => {
        return !excludedDomains.some(excluded => 
          domain.includes(excluded) || excluded.includes(domain)
        )
      })
      .map(domain => {
        const links = result.externalLinks.filter(link => link.domain === domain)
        const articles = [...new Set(links.map(link => link.sourceArticle))]
        return {
          domain,
          linkCount: links.length,
          articleCount: articles.length,
          articles: articles,
          links: links.map(link => ({
            url: link.url,
            title: link.title,
            source: link.source
          }))
        }
      })
      .sort((a, b) => b.linkCount - a.linkCount)

    const jsonContent = JSON.stringify({
      summary: {
        totalUniqueDomains: domainStats.length,
        totalLinks: domainStats.reduce((sum, domain) => sum + domain.linkCount, 0),
        totalArticles: result.totalArticles,
        sourceUrl: url,
        exportDate: new Date().toISOString(),
        excludedDomains: excludedDomains
      },
      domains: domainStats
    }, null, 2)

    const blob = new Blob([jsonContent], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `unique-domains-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Unique domains exported to JSON')
  }

  const filteredExternalLinks = result?.externalLinks.filter(link => 
    (!filterDomain || link.domain.toLowerCase().includes(filterDomain.toLowerCase())) &&
    (!filterArticle || link.source.toLowerCase().includes(filterArticle.toLowerCase()))
  ) || []

  const uniqueDomains = result ? [...new Set(result.externalLinks.map(link => link.domain))] : []
  
  // Filter out common social media, search engines, and stock photo sites
  const excludedDomains = [
    'youtube.com','facebook.com','instagram.com','twitter.com','linkedin.com','tiktok.com',
    'pinterest.com','snapchat.com','google.com','unsplash.com','.gov','freepik.com','pexels.com',
    'pixabay.com','reddit.com','whatsapp.com','telegram.org','tumblr.com','discord.com','vimeo.com',
    'x.com','bsky.app','threads.net'
  ]
  
  const filteredUniqueDomains = uniqueDomains.filter(domain => {
    const isExcluded = excludedDomains.some(excluded => 
      domain.includes(excluded) || excluded.includes(domain)
    )
    const matchesSearch = !domainFilter || domain.toLowerCase().includes(domainFilter.toLowerCase())
    return !isExcluded && matchesSearch
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Modern Header */}
      <header className="border-b border-slate-200/60 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Layers className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900">LinkAnalyzer</h1>
                <p className="text-xs text-slate-500">Blog Intelligence Platform</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Live
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-2 text-sm font-medium mb-6">
            <Zap className="h-4 w-4" />
            Powered by Advanced AI
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-6">
            Extract & Analyze
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"> Blog Links</span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
            Discover all articles from any blog page and analyze their external links. 
            Perfect for competitive research, SEO analysis, and content strategy.
          </p>
          
          {/* Stats Pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Real-time Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200">
              <Search className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Smart Detection</span>
            </div>
            <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm border border-slate-200">
              <BarChart3 className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium text-slate-700">Detailed Insights</span>
            </div>
          </div>
        </div>

        {/* Main Input Card */}
        <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-900 mb-2">Start Your Analysis</h3>
                <p className="text-slate-600">Enter any blog page URL to extract articles and analyze external links</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
                  <Input
                    type="url"
                    placeholder="https://example.com/blog"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && extractLinks()}
                    className="pl-12 h-14 text-base border-slate-300 focus:border-blue-500 focus:ring-blue-500/20"
                  />
                </div>
                <Button 
                  onClick={extractLinks} 
                  disabled={loading || !url}
                  size="lg"
                  className="h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      Analyze Blog
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-8 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Card className="mb-8 border-0 shadow-xl bg-white/90 backdrop-blur-sm">
            <CardContent className="p-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Loader2 className="h-6 w-6 text-blue-600 animate-spin" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 mb-1">Analyzing Blog Content</p>
                  <p className="text-slate-600 text-sm mb-3">Extracting articles and analyzing external links...</p>
                  <Progress value={75} className="h-2 bg-slate-200" />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <FileText className="h-6 w-6 text-blue-600" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{result.totalArticles}</span>
                  </div>
                  <p className="text-slate-600 font-medium">Articles Found</p>
                  <p className="text-slate-500 text-sm mt-1">Discovered on page</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <Link className="h-6 w-6 text-green-600" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{result.totalExternalLinks}</span>
                  </div>
                  <p className="text-slate-600 font-medium">External Links</p>
                  <p className="text-slate-500 text-sm mt-1">Across all articles</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{result.uniqueDomains}</span>
                  </div>
                  <p className="text-slate-600 font-medium">Unique Domains</p>
                  <p className="text-slate-500 text-sm mt-1">External sources</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-orange-600" />
                    </div>
                    <span className="text-3xl font-bold text-slate-900">{result.articlesWithExternalLinks}</span>
                  </div>
                  <p className="text-slate-600 font-medium">Active Articles</p>
                  <p className="text-slate-500 text-sm mt-1">With external links</p>
                </CardContent>
              </Card>
            </div>

            {/* Export Actions */}
            <Card className="border-0 shadow-lg bg-white">
              <CardContent className="p-6">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-sm font-semibold text-slate-700">Export Unique Domains:</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportToCSV}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    CSV
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={exportToJSON}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    JSON
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(
                      filteredUniqueDomains.join('\n')
                    )}
                    className="border-slate-300 hover:bg-slate-50"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Copy Domains
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Main Content Tabs */}
            <Card className="border-0 shadow-xl bg-white">
              <Tabs defaultValue="articles" className="w-full">
                <div className="border-b border-slate-200">
                  <TabsList className="grid w-full grid-cols-3 bg-transparent p-0 h-auto">
                    <TabsTrigger 
                      value="articles" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-6 py-4 font-medium"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Articles ({result.articles.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="links" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-6 py-4 font-medium"
                    >
                      <Link className="h-4 w-4 mr-2" />
                      External Links ({filteredExternalLinks.length})
                    </TabsTrigger>
                    <TabsTrigger 
                      value="domains" 
                      className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-600 border-b-2 border-transparent rounded-none px-6 py-4 font-medium"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Unique Domains ({filteredUniqueDomains.length})
                    </TabsTrigger>
                  </TabsList>
                </div>

                {/* Articles Tab */}
                <TabsContent value="articles" className="mt-0">
                  <div className="p-6">
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-slate-900 mb-2">Discovered Articles</h3>
                      <p className="text-slate-600">Articles found on the blog page with their external link counts</p>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-lg border border-slate-200">
                      <div className="p-4 space-y-3">
                        {result.articles.map((article, index) => {
                          const externalLinkCount = result.externalLinks.filter(
                            link => link.sourceArticle === article.url
                          ).length
                          return (
                            <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200 group">
                              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-blue-100 transition-colors">
                                <FileText className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-blue-700 transition-colors">{article.title}</h4>
                                <p className="text-sm text-slate-500 mb-3 truncate">{article.url}</p>
                                <div className="flex items-center gap-3">
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                                    {article.domain}
                                  </Badge>
                                  <Badge className={externalLinkCount > 0 ? "bg-green-100 text-green-700 border-green-200" : "bg-slate-100 text-slate-600 border-slate-200"}>
                                    {externalLinkCount} external links
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(article.url, '_blank')}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* External Links Tab */}
                <TabsContent value="links" className="mt-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">External Links</h3>
                        <p className="text-slate-600">All external links discovered across articles</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Filter by domain..."
                            value={filterDomain}
                            onChange={(e) => setFilterDomain(e.target.value)}
                            className="pl-10 w-48 h-10 border-slate-300"
                          />
                        </div>
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            placeholder="Filter by article..."
                            value={filterArticle}
                            onChange={(e) => setFilterArticle(e.target.value)}
                            className="pl-10 w-48 h-10 border-slate-300"
                          />
                        </div>
                      </div>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-lg border border-slate-200">
                      <div className="p-4 space-y-3">
                        {filteredExternalLinks.map((link, index) => (
                          <div key={index} className="flex items-start gap-4 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50/50 transition-all duration-200 group">
                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-green-100 transition-colors">
                              <Link className="h-5 w-5 text-slate-600 group-hover:text-green-600 transition-colors" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-slate-900 mb-1 group-hover:text-green-700 transition-colors truncate">{link.url}</h4>
                              {link.title && (
                                <p className="text-sm text-slate-600 mb-2">{link.title}</p>
                              )}
                              <p className="text-xs text-slate-500 mb-3">From: {link.source}</p>
                              <Badge variant="secondary" className="bg-slate-100 text-slate-700 border-slate-200">
                                {link.domain}
                              </Badge>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(link.url, '_blank')}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Unique Domains Tab */}
                <TabsContent value="domains" className="mt-0">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900 mb-2">Unique Domains</h3>
                        <p className="text-slate-600">All external domains discovered across articles with detailed statistics</p>
                        <p className="text-xs text-slate-500 mt-1">
                          Note: Social media platforms, search engines, and stock photo sites are automatically filtered out
                        </p>
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <Input
                          placeholder="Search domains..."
                          value={domainFilter}
                          onChange={(e) => setDomainFilter(e.target.value)}
                          className="pl-10 w-64 h-10 border-slate-300"
                        />
                      </div>
                    </div>
                    <ScrollArea className="h-96 w-full rounded-lg border border-slate-200">
                      <div className="p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {filteredUniqueDomains
                            .map(domain => {
                              const links = result.externalLinks.filter(link => link.domain === domain)
                              const articles = [...new Set(links.map(link => link.sourceArticle))]
                              return {
                                domain,
                                linkCount: links.length,
                                articleCount: articles.length,
                                articles: articles.slice(0, 2),
                                totalArticles: articles.length
                              }
                            })
                            .sort((a, b) => b.linkCount - a.linkCount)
                            .map((domainData, index) => (
                              <Card key={index} className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 group">
                                <CardContent className="p-4">
                                  <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <Globe className="h-4 w-4 text-white" />
                                      </div>
                                      <div>
                                        <h4 className="font-semibold text-slate-900 group-hover:text-blue-700 transition-colors text-sm">
                                          {domainData.domain}
                                        </h4>
                                        <p className="text-xs text-slate-500">External domain</p>
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-slate-600">Links</span>
                                      <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                                        {domainData.linkCount}
                                      </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                      <span className="text-xs text-slate-600">Articles</span>
                                      <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                        {domainData.articleCount}
                                      </Badge>
                                    </div>
                                  </div>

                                  {domainData.articles.length > 0 && (
                                    <div className="mt-3 pt-3 border-t border-slate-100">
                                      <p className="text-xs text-slate-500 mb-2">Found in:</p>
                                      <div className="space-y-1">
                                        {domainData.articles.map((articleUrl, articleIndex) => {
                                          const article = result.articles.find(a => a.url === articleUrl)
                                          return (
                                            <p key={articleIndex} className="text-xs text-slate-600 truncate">
                                              {article?.title || 'Unknown article'}
                                            </p>
                                          )
                                        })}
                                        {domainData.totalArticles > 2 && (
                                          <p className="text-xs text-slate-400 italic">
                                            +{domainData.totalArticles - 2} more articles
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                        </div>
                      </div>
                    </ScrollArea>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>
          </div>
        )}
      </main>

      {/* Modern Footer */}
      <footer className="mt-16 border-t border-slate-200/60 bg-white/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Layers className="h-4 w-4 text-white" />
              </div>
              <span className="text-lg font-bold text-slate-900">LinkAnalyzer</span>
            </div>
            <p className="text-sm text-slate-600">Professional blog intelligence platform for content research and analysis</p>
            <p className="text-xs text-slate-500 mt-2">Built with modern web technologies for optimal performance</p>
          </div>
        </div>
      </footer>
    </div>
  )
}