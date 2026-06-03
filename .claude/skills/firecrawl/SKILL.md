---
name: firecrawl
description: Web scraping and crawling tool that returns clean markdown output. Use when you need to extract content from websites, monitor pages, or gather structured data from the web.
trigger: explicit
---

# Firecrawl Skill

Source: firecrawl.dev | github.com/mendableai/firecrawl

Reliable web data extraction without manual parsing. Converts any webpage to clean, structured markdown automatically.

## Setup

```bash
# Install Firecrawl CLI
npx -y firecrawl-cli@latest init --all --browser

# Or install as npm package
npm install @mendable/firecrawl-js

# Set API key (get from firecrawl.dev)
export FIRECRAWL_API_KEY=fc-your-key-here
```

## Core Operations

### Scrape a Single URL

```typescript
import FirecrawlApp from '@mendable/firecrawl-js';

const app = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

const result = await app.scrapeUrl('https://example.com', {
  formats: ['markdown', 'html'],
});

console.log(result.markdown);
```

### Crawl an Entire Site

```typescript
const crawlResult = await app.crawlUrl('https://example.com', {
  limit: 100,
  scrapeOptions: { formats: ['markdown'] },
});

for (const page of crawlResult.data) {
  console.log(page.url, page.markdown);
}
```

### Search the Web

```typescript
const searchResult = await app.search('Claude Code skills 2026', {
  limit: 10,
  scrapeOptions: { formats: ['markdown'] },
});
```

### Map a Website (list all URLs)

```typescript
const mapResult = await app.mapUrl('https://example.com', {
  search: 'documentation',
});
console.log(mapResult.links);
```

## CLI Usage

```bash
# Scrape a single page
firecrawl scrape https://example.com

# Crawl a site
firecrawl crawl https://example.com --limit 50

# Search
firecrawl search "query here"
```

## Output Formats

| Format     | Use case                          |
|------------|-----------------------------------|
| `markdown` | LLM ingestion, documentation      |
| `html`     | Structured parsing, CSS selectors |
| `links`    | URL discovery, sitemap building   |
| `screenshot` | Visual validation               |

## Monitoring Pattern (for monitor-pje-cloud)

```typescript
async function monitorPage(url: string) {
  const result = await app.scrapeUrl(url, {
    formats: ['markdown'],
    actions: [{ type: 'wait', milliseconds: 2000 }],
  });
  
  return {
    url,
    content: result.markdown,
    timestamp: new Date().toISOString(),
    status: result.metadata?.statusCode,
  };
}
```

## Error Handling

```typescript
try {
  const result = await app.scrapeUrl(url);
  if (!result.success) {
    console.error('Scrape failed:', result.error);
  }
} catch (error) {
  if (error.statusCode === 429) {
    // Rate limited — wait and retry
  }
}
```
