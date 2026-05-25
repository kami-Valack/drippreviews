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
    :root {
      --bg: #09090b;
      --surface: #18181b;
      --border: #27272a;
      --text: #fafafa;
      --muted: #a1a1aa;
      --accent: #4ade80;
      --accent-dim: #14532d;
      --danger: #f87171;
      --radius: 16px;
      --max: 1040px;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      min-height: 100dvh;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: max(14px, env(safe-area-inset-top)) 20px 14px;
      background: rgba(9, 9, 11, 0.92);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border);
    }
    .brand { text-align: center; }
    .brand-name {
      font-size: clamp(1.25rem, 4vw, 1.75rem);
      font-weight: 800;
      letter-spacing: 0.28em;
      text-indent: 0.28em;
    }
    .brand-tag {
      margin-top: 4px;
      font-size: 0.65rem;
      color: var(--muted);
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .page {
      width: min(100%, var(--max));
      margin: 0 auto;
      padding: 20px 16px max(28px, env(safe-area-inset-bottom));
    }
    .product-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      align-items: start;
    }
    @media (min-width: 768px) {
      .page { padding: 32px 24px 48px; }
      .product-grid {
        grid-template-columns: minmax(280px, 1fr) minmax(300px, 1fr);
        gap: 40px;
      }
    }
    .gallery {
      position: relative;
      border-radius: var(--radius);
      overflow: hidden;
      background: var(--surface);
      border: 1px solid var(--border);
      aspect-ratio: 1;
    }
    .gallery img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
    .details {
      display: flex;
      flex-direction: column;
      gap: 16px;
      min-width: 0;
    }
    .meta-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 12px;
    }
    .category {
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--muted);
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .badge {
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .badge.in-stock {
      color: var(--accent);
      background: rgba(74, 222, 128, 0.12);
      border: 1px solid rgba(74, 222, 128, 0.35);
    }
    .badge.out-of-stock {
      color: var(--danger);
      background: rgba(248, 113, 113, 0.12);
      border: 1px solid rgba(248, 113, 113, 0.35);
    }
    h1 {
      font-size: clamp(1.35rem, 4vw, 1.85rem);
      font-weight: 700;
      line-height: 1.25;
      letter-spacing: -0.02em;
    }
    .price-box {
      padding: 20px;
      border-radius: var(--radius);
      background: linear-gradient(145deg, var(--accent-dim), #052e16);
      border: 1px solid rgba(74, 222, 128, 0.25);
      text-align: center;
    }
    .price-label {
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #86efac;
      margin-bottom: 8px;
    }
    .price-old {
      display: block;
      font-size: 0.95rem;
      color: var(--muted);
      text-decoration: line-through;
      margin-bottom: 4px;
    }
    .price-current {
      font-size: clamp(1.75rem, 6vw, 2.5rem);
      font-weight: 800;
      color: var(--accent);
      line-height: 1.1;
    }
    .description {
      color: #d4d4d8;
      font-size: 0.95rem;
      line-height: 1.65;
    }
    .cta-card {
      margin-top: 4px;
      padding: 18px;
      border-radius: var(--radius);
      background: var(--surface);
      border: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .cta-text {
      font-size: 0.9rem;
      color: var(--muted);
      text-align: center;
    }
    .cta-text strong { color: var(--accent); font-weight: 700; }
    .progress-track {
      height: 4px;
      border-radius: 999px;
      background: var(--border);
      overflow: hidden;
    }
    .progress-bar {
      height: 100%;
      width: 100%;
      background: var(--accent);
      border-radius: inherit;
      transition: width 1s linear;
    }
    .btn-buy {
      display: block;
      width: 100%;
      padding: 14px 20px;
      text-align: center;
      font-size: 1rem;
      font-weight: 700;
      color: #09090b;
      background: #fff;
      border: none;
      border-radius: 12px;
      text-decoration: none;
      cursor: pointer;
      transition: transform 0.15s, opacity 0.15s;
    }
    .btn-buy:hover { opacity: 0.92; transform: translateY(-1px); }
    .btn-buy:active { transform: translateY(0); }
  </style>
</head>
<body>
  <header class="topbar">
    <div class="brand">
      <div class="brand-name">${this.escapeHtml(this.storeName)}</div>
      <p class="brand-tag">Loja online</p>
    </div>
  </header>

  <div class="page">
    <main class="product-grid">
      <section class="gallery">
        <img src="${this.escapeHtml(image)}" alt="${this.escapeHtml(product.name)}" width="800" height="800" loading="eager">
      </section>

      <section class="details">
        <div class="meta-row">
          <span class="category">${this.escapeHtml(product.category.name)}</span>
          <span class="badge ${product.is_in_stock ? 'in-stock' : 'out-of-stock'}">
            ${product.is_in_stock ? 'Em stock' : 'Esgotado'}
          </span>
        </div>

        <h1>${this.escapeHtml(product.name)}</h1>

        <div class="price-box">
          <p class="price-label">Preço</p>
          ${originalPriceHtml}
          <p class="price-current" itemprop="price">${this.escapeHtml(priceFormatted)}</p>
        </div>

        <p class="description">${this.escapeHtml(product.description)}</p>

        <div class="cta-card">
          <p class="cta-text">
            A redirecionar para a loja em <strong id="countdown">${redirectSeconds}</strong>s
          </p>
          <div class="progress-track" aria-hidden="true">
            <div class="progress-bar" id="progress"></div>
          </div>
          <a class="btn-buy" href="${this.escapeHtml(storeUrl)}">Comprar agora</a>
        </div>
      </section>
    </main>
  </div>

  <script>
    (function () {
      var target = ${JSON.stringify(storeUrl)};
      var total = ${redirectSeconds};
      var remaining = total;
      var countdownEl = document.getElementById('countdown');
      var progressEl = document.getElementById('progress');
      var tick = setInterval(function () {
        remaining -= 1;
        if (countdownEl && remaining >= 0) countdownEl.textContent = String(remaining);
        if (progressEl && total > 0) {
          progressEl.style.width = Math.max(0, (remaining / total) * 100) + '%';
        }
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
  <style>
    :root { --bg:#09090b; --surface:#18181b; --border:#27272a; --text:#fafafa; --muted:#a1a1aa; --accent:#4ade80; --max:720px; }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:system-ui,sans-serif; background:var(--bg); color:var(--text); min-height:100dvh; }
    .wrap { width:min(100%,var(--max)); margin:0 auto; padding:max(24px,env(safe-area-inset-top)) 20px 40px; }
    .hero { text-align:center; padding:32px 0 28px; border-bottom:1px solid var(--border); margin-bottom:28px; }
    .logo { font-size:clamp(1.5rem,5vw,2rem); font-weight:800; letter-spacing:.25em; text-indent:.25em; }
    .sub { margin-top:8px; color:var(--muted); font-size:.85rem; }
    h2 { font-size:1.1rem; margin-bottom:16px; font-weight:600; }
    .stats {
      display:grid; grid-template-columns:repeat(auto-fit,minmax(140px,1fr)); gap:12px; margin-bottom:28px;
    }
    .stat {
      padding:18px; border-radius:14px; background:var(--surface); border:1px solid var(--border); text-align:center;
    }
    .stat-num { font-size:1.75rem; font-weight:800; color:var(--accent); }
    .stat-label { font-size:.75rem; color:var(--muted); margin-top:4px; text-transform:uppercase; letter-spacing:.06em; }
    .links { display:flex; flex-direction:column; gap:10px; }
    .link-card {
      display:flex; align-items:center; justify-content:space-between; gap:12px;
      padding:14px 16px; border-radius:12px; background:var(--surface); border:1px solid var(--border);
      color:var(--text); text-decoration:none; transition:border-color .15s;
    }
    .link-card:hover { border-color:var(--accent); }
    .hint { margin-top:24px; padding:14px; border-radius:12px; background:var(--surface); border:1px solid var(--border); font-size:.85rem; color:var(--muted); }
    code { color:var(--accent); font-size:.8rem; word-break:break-all; }
  </style>
</head>
<body>
  <div class="wrap">
    <header class="hero">
      <div class="logo">${this.escapeHtml(this.storeName)}</div>
      <p class="sub">Preview SEO · Partilha de produtos</p>
    </header>

    <div class="stats">
      <div class="stat">
        <div class="stat-num">${productCount}</div>
        <div class="stat-label">Produtos</div>
      </div>
      <div class="stat">
        <div class="stat-num">/p/</div>
        <div class="stat-label">Formato do link</div>
      </div>
    </div>

    <h2>Recursos</h2>
    <nav class="links">
      <a class="link-card" href="/sitemap.xml">sitemap.xml <span>→</span></a>
      <a class="link-card" href="/robots.txt">robots.txt <span>→</span></a>
      <a class="link-card" href="/p/1">Exemplo produto /p/1 <span>→</span></a>
    </nav>

    <p class="hint">Partilhe: <code>${this.escapeHtml(this.siteUrl)}/p/{id}</code></p>
  </div>
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
