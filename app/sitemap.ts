import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site/config'

export default function sitemap(): MetadataRoute.Sitemap {
  return ['', '/calculadora', '/distrato', '/venda-de-cotas', '/trocas', '/videos', '/blog', '/politica-de-privacidade', '/termos'].map(
    caminho => ({ url: `${SITE_URL}${caminho}`, changeFrequency: 'weekly', priority: caminho === '' ? 1 : 0.7 })
  )
}
