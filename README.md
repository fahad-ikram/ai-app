# LinkAnalyzer - Modern Blog Intelligence Platform

A cutting-edge Next.js tool for comprehensive blog analysis with a modern, professional interface. Extract all articles from a blog page, then analyze external links from each article. Built with a SaaS-inspired design similar to industry leaders like snov.io and hunter.io.

## ✨ Features

### 🎨 Modern Design & UX
- **Professional SaaS Interface**: Clean, modern design inspired by top SaaS platforms
- **Gradient Backgrounds**: Beautiful blue-to-indigo gradients throughout
- **Glass Morphism Effects**: Subtle backdrop blur and transparency effects
- **Smooth Animations**: Hover states, transitions, and micro-interactions
- **Responsive Layout**: Perfect on desktop, tablet, and mobile devices
- **Modern Typography**: Clean hierarchy with professional font weights

### 🔍 Two-Level Analysis
- **Level 1**: Extract all article links from a blog homepage or category page
- **Level 2**: Visit each article and extract external links from them
- **Smart Detection**: Intelligent article identification using URL patterns and content analysis

### 📊 Comprehensive Statistics
- **Real-time Metrics**: Live processing indicators and progress tracking
- **Visual Stats Cards**: Beautiful stat cards with icons and gradients
- **Top Domains Analysis**: Visual bar charts for domain distribution
- **Performance Metrics**: Processing time and efficiency tracking

### 🎯 Advanced Filtering & Search
- **Dual Filtering**: Filter by domain name and article title simultaneously
- **Real-time Search**: Instant results as you type
- **Smart Badges**: Visual indicators for link counts and categories

### 📤 Enhanced Export Options
- **CSV Export**: Structured data with both articles and external links
- **JSON Export**: Complete hierarchical data with metadata
- **Copy to Clipboard**: Quick sharing with visual feedback
- **Export Actions**: Modern button design with hover effects

### 🚀 Modern UI Components
- **Sticky Header**: Professional navigation with live status indicator
- **Hero Section**: Compelling landing area with feature pills
- **Tab System**: Clean tab navigation with underline indicators
- **Card Design**: Modern cards with shadows and hover effects
- **Loading States**: Beautiful progress indicators and animations

## 🎨 Design System

### Color Palette
- **Primary**: Blue to Indigo gradients (#2563eb → #4f46e5)
- **Background**: Subtle slate gradients (#f8fafc → #e0e7ff)
- **Surface**: Clean whites with transparency effects
- **Text**: Professional slate color hierarchy
- **Accent**: Green for success, orange for warnings, purple for insights

### Typography
- **Headings**: Bold, modern sans-serif with gradient text effects
- **Body**: Clean, readable text with proper spacing
- **UI Elements**: Consistent font weights and sizes

### Visual Effects
- **Gradients**: Smooth color transitions throughout
- **Shadows**: Layered shadow system for depth
- **Hover States**: Interactive feedback on all clickable elements
- **Transitions**: Smooth animations for better UX

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 with custom gradients
- **UI Components**: Enhanced shadcn/ui components
- **Icons**: Lucide React with custom styling
- **Notifications**: Sonner toast system

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Step 1: Enter Blog URL
- Input the URL of a blog homepage, category page, or archive page
- The modern input field includes a globe icon and placeholder text

### Step 2: Automatic Analysis
- Click the "Analyze Blog" button with gradient styling
- Watch the real-time progress indicator
- See live status updates during processing

### Step 3: Explore Results
- **Articles Tab**: View all discovered articles with external link counts
- **External Links Tab**: Browse all external links with advanced filtering
- **Statistics Tab**: Comprehensive analysis with visual charts

### Step 4: Export Data
- Use the modern export buttons with hover effects
- Download results in CSV or JSON format
- Copy external links to clipboard with visual feedback

## 🎯 Design Highlights

### Header Section
- **Sticky Navigation**: Always accessible with blur backdrop
- **Logo**: Gradient icon with brand name and tagline
- **Live Status**: Animated pulse indicator showing system status

### Hero Section
- **Compelling Headline**: Gradient text effects for emphasis
- **Feature Pills**: Modern badges highlighting key features
- **Clear Value Proposition**: Professional copy explaining benefits

### Input Section
- **Modern Card Design**: Shadow effects with backdrop blur
- **Icon Integration**: Globe icon in input field
- **Gradient Button**: Eye-catching CTA with hover animations

### Results Display
- **Stats Cards**: Four-column grid with icon-based metrics
- **Tab Navigation**: Clean underline-style tab indicators
- **Data Tables**: Modern scrollable areas with hover effects
- **Export Actions**: Professional button group with icons

### Footer
- **Brand Consistency**: Logo and tagline matching header
- **Professional Copy**: Clean, concise footer text
- **Visual Balance**: Proper spacing and alignment

## API Endpoint

### POST /api/extract-links

Performs two-level extraction: first finds articles, then extracts external links from each article.

**Request Body:**
```json
{
  "url": "https://example.com/blog"
}
```

**Response:**
```json
{
  "totalArticles": 25,
  "totalExternalLinks": 147,
  "uniqueDomains": 89,
  "articlesWithExternalLinks": 22,
  "articles": [
    {
      "url": "https://example.com/blog/article-1",
      "title": "Article Title",
      "domain": "example.com"
    }
  ],
  "externalLinks": [
    {
      "url": "https://external-site.com/resource",
      "title": "Link Title",
      "source": "Article Title",
      "sourceArticle": "https://example.com/blog/article-1",
      "domain": "external-site.com"
    }
  ],
  "processingTime": 12.34
}
```

## 🎨 Design Inspiration

The interface draws inspiration from leading SaaS platforms:

- **snov.io**: Clean layout, professional color scheme, and clear CTAs
- **hunter.io**: Modern card designs, smooth animations, and intuitive navigation
- **Modern SaaS Trends**: Glass morphism, gradients, and micro-interactions

## Performance Features

- **Optimized Rendering**: Efficient component structure
- **Smooth Animations**: Hardware-accelerated transitions
- **Responsive Design**: Mobile-first approach
- **Accessibility**: Semantic HTML and ARIA support

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes maintaining the modern design system
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository.

---

**Built with ❤️ using Next.js and modern design principles for optimal user experience**