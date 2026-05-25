import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Product } from '../products/products.types';

@Injectable()
export class SeoService {
  constructor(private readonly config: ConfigService) {}

  private get siteUrl(): string {
    return this.config
      .get<string>('SITE_URL', 'http://localhost:3000')
      .replace(/\/$/, '');
  }

  private get storeName(): string {
    return this.config.get<string>('STORE_NAME', 'DRIP');
  }

  private get currency(): string {
    return this.config.get<string>('CURRENCY', 'AOA');
  }

  private get redirectDelayMs(): number {
    const seconds = Number(this.config.get('REDIRECT_DELAY_SECONDS', 5));
    return Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 5000;
  }

  storeProductUrl(id: number): string {
    const template = this.config.get<string>(
      'STORE_PRODUCT_URL',
      'https://store-eight-ashen.vercel.app/product/{id}',
    );
    return template.replace(/\{id\}/g, String(id));
  }

  formatPrice(cents: number): string {
    const amount = Number(cents);
    if (!Number.isFinite(amount)) return '—';
    const value = amount / 100;
    try {
      const formatted = new Intl.NumberFormat('pt-AO', {
        style: 'currency',
        currency: this.currency,
      }).format(value);
      if (formatted && !formatted.includes('NaN')) return formatted;
    } catch {
      /* fallback below */
    }
    return `${value.toFixed(2).replace('.', ',')} Kz`;
  }

  productUrl(id: number): string {
    return `${this.siteUrl}/p/${id}`;
  }

  /** HTTPS URLs are required by Facebook, WhatsApp, etc. */
  secureImageUrl(url: string): string {
    return url.replace(/^http:\/\//i, 'https://');
  }

  renderProductPage(product: Product): string {
    const priceFormatted = this.formatPrice(product.final_price);
    const title = `${product.name} — ${priceFormatted} | ${this.storeName}`;
    const description = this.truncate(product.description, 120);
    const ogDescription = this.truncate(
      `${priceFormatted} · ${product.name} · ${this.storeName} — ${product.description}`,
      200,
    );
    const ogTitle = `${this.storeName} — ${product.name} — ${priceFormatted}`;
    const url = this.productUrl(product.id);
    const storeUrl = this.storeProductUrl(product.id);
    const redirectSeconds = this.redirectDelayMs / 1000;
    const image = this.secureImageUrl(product.primary_image);
    const price = (product.final_price / 100).toFixed(2);
    const hasDiscount =
      product.sale_price != null && product.sale_price < product.price;
    const originalPriceHtml = hasDiscount
      ? `<span class="price-old">${this.escapeHtml(this.formatPrice(product.price))}</span>`
      : '';
    const availability = product.is_in_stock
      ? 'https://schema.org/InStock'
      : 'https://schema.org/OutOfStock';
    const jsonLd = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      description: product.description,
      image: product.images.map((img) => this.secureImageUrl(img.url)),
      sku: product.sku,
      brand: { '@type': 'Brand', name: this.storeName },
      offers: {
        '@type': 'Offer',
        url: storeUrl,
        priceCurrency: this.currency,
        price,
        availability,
        itemCondition: 'https://schema.org/NewCondition',
      },
      category: product.category.name,
    });

    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(title)}</title>
  <meta name="description" content="${this.escapeHtml(description)}">
  <link rel="canonical" href="${this.escapeHtml(url)}">

  <!-- Open Graph (Facebook, WhatsApp, LinkedIn, etc.) -->
  <meta property="og:type" content="product">
  <meta property="og:site_name" content="${this.escapeHtml(this.storeName)}">
  <meta property="og:title" content="${this.escapeHtml(ogTitle)}">
  <meta property="og:description" content="${this.escapeHtml(ogDescription)}">
  <meta property="og:url" content="${this.escapeHtml(url)}">
  <meta property="og:image" content="${this.escapeHtml(image)}">
  <meta property="og:image:secure_url" content="${this.escapeHtml(image)}">
  <meta property="og:image:alt" content="${this.escapeHtml(product.name)}">
  <meta property="og:locale" content="pt_AO">
  <meta property="product:price:amount" content="${price}">
  <meta property="product:price:currency" content="${this.currency}">
  <meta property="product:availability" content="${product.is_in_stock ? 'in stock' : 'out of stock'}">

  <!-- Twitter / X Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${this.escapeHtml(ogTitle)}">
  <meta name="twitter:description" content="${this.escapeHtml(ogDescription)}">
  <meta name="twitter:image" content="${this.escapeHtml(image)}">

  <!-- Structured data for Google -->
  <script type="application/ld+json">${jsonLd}</script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: system-ui, -apple-system, sans-serif; background: #0a0a0a; color: #f5f5f5; min-height: 100vh; }
    .store-header {
      display: flex; align-items: center; justify-content: center;
      padding: 20px 16px; border-bottom: 1px solid #262626;
      background: linear-gradient(180deg, #141414 0%, #0a0a0a 100%);
    }
    .store-logo {
      font-size: 2rem; font-weight: 800; letter-spacing: 0.35em;
      text-indent: 0.35em; color: #fff;
    }
    .store-tagline { font-size: 0.7rem; color: #737373; letter-spacing: 0.2em; text-transform: uppercase; margin-top: 4px; text-align: center; }
    main { max-width: 480px; margin: 0 auto; padding: 20px 16px 32px; }
    img { width: 100%; border-radius: 12px; aspect-ratio: 1; object-fit: cover; }
    h1 { font-size: 1.35rem; font-weight: 600; margin: 14px 0 0; line-height: 1.3; }
    .category { color: #a3a3a3; font-size: 0.8rem; margin-top: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
    .price-box {
      margin: 16px 0; padding: 18px 20px;
      background: linear-gradient(135deg, #14532d 0%, #052e16 100%);
      border: 1px solid #22c55e44; border-radius: 14px;
      text-align: center;
    }
    .price-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.15em; color: #86efac; margin-bottom: 6px; }
    .price-current { font-size: 2.25rem; font-weight: 800; color: #4ade80; line-height: 1.1; }
    .price-old { display: block; font-size: 1rem; color: #737373; text-decoration: line-through; margin-bottom: 4px; font-weight: 400; }
    .description { color: #d4d4d4; line-height: 1.55; font-size: 0.95rem; margin-top: 4px; }
    .badge { display: inline-block; margin-top: 14px; padding: 6px 14px; border-radius: 999px; font-size: 0.75rem; font-weight: 600; background: #262626; }
    .badge.in-stock { color: #22c55e; border: 1px solid #22c55e33; }
    .badge.out-of-stock { color: #ef4444; border: 1px solid #ef444433; }
    .redirect-banner {
      margin-top: 20px; padding: 14px 16px; border-radius: 12px;
      background: #171717; border: 1px solid #404040; text-align: center;
      font-size: 0.9rem; color: #d4d4d4;
    }
    .redirect-banner a {
      display: inline-block; margin-top: 10px; padding: 10px 20px;
      background: #fff; color: #0a0a0a; font-weight: 700; text-decoration: none;
      border-radius: 8px;
    }
    .redirect-banner #countdown { color: #4ade80; font-weight: 700; }
  </style>
</head>
<body>
  <header class="store-header">
    <div>
      <div class="store-logo">${this.escapeHtml(this.storeName)}</div>
      <p class="store-tagline">Loja online</p>
    </div>
  </header>
  <main>
    <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(product.name)}" width="600" height="600">
    <p class="category">${this.escapeHtml(product.category.name)}</p>
    <h1>${this.escapeHtml(product.name)}</h1>
    <div class="price-box">
      <p class="price-label">Preço</p>
      ${originalPriceHtml}
      <p class="price-current" itemprop="price">${this.escapeHtml(priceFormatted)}</p>
    </div>
    <p class="description">${this.escapeHtml(product.description)}</p>
    <span class="badge ${product.is_in_stock ? 'in-stock' : 'out-of-stock'}">
      ${product.is_in_stock ? 'Em stock' : 'Esgotado'}
    </span>
    <div class="redirect-banner">
      A redirecionar para a loja em <span id="countdown">${redirectSeconds}</span>s…
      <br>
      <a href="${this.escapeHtml(storeUrl)}">Comprar agora</a>
    </div>
  </main>
  <script>
    (function () {
      var target = ${JSON.stringify(storeUrl)};
      var remaining = ${redirectSeconds};
      var el = document.getElementById('countdown');
      var tick = setInterval(function () {
        remaining -= 1;
        if (el && remaining >= 0) el.textContent = String(remaining);
        if (remaining <= 0) clearInterval(tick);
      }, 1000);
      setTimeout(function () {
        window.location.replace(target);
      }, ${this.redirectDelayMs});
    })();
  </script>
</body>
</html>`;
  }

  renderSitemap(products: Product[]): string {
    const urls = products
      .map((p) => {
        const loc = this.productUrl(p.id);
        const lastmod = p.updated_at.split('T')[0];
        return `  <url>
    <loc>${this.escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
      })
      .join('\n');

    const home = `  <url>
    <loc>${this.escapeXml(this.siteUrl)}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${home}
${urls}
</urlset>`;
  }

  renderRobotsTxt(): string {
    return `User-agent: *
Allow: /

Sitemap: ${this.siteUrl}/sitemap.xml
`;
  }

  renderHomePage(productCount: number): string {
    return `<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(this.storeName)} — Preview SEO</title>
  <meta name="description" content="Servidor de preview e SEO para produtos ${this.escapeHtml(this.storeName)}">
  <meta property="og:title" content="${this.escapeHtml(this.storeName)}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${this.escapeHtml(this.siteUrl)}">
</head>
<body style="font-family:system-ui,sans-serif;max-width:600px;margin:40px auto;padding:0 16px;">
  <h1>${this.escapeHtml(this.storeName)} Preview SEO</h1>
  <p>${productCount} produtos indexados para partilha e motores de busca.</p>
  <ul>
    <li><a href="/sitemap.xml">sitemap.xml</a></li>
    <li><a href="/robots.txt">robots.txt</a></li>
  </ul>
  <p style="color:#666;font-size:0.875rem;">Partilhe links no formato: <code>/p/{id-do-produto}</code> (ex: <code>/p/1</code>)</p>
</body>
</html>`;
  }

  private truncate(text: string, max: number): string {
    if (text.length <= max) return text;
    return text.slice(0, max - 3) + '...';
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
