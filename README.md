# DRIP Preview SEO

Servidor NestJS com **server-side rendering** para previews de produtos em redes sociais (WhatsApp, Facebook, Twitter/X, LinkedIn), motores de busca e qualquer API que leia Open Graph / JSON-LD.

Consome a API da loja: `https://api.drip.infinityfree.me/api/products`

## URLs

| Rota | Descrição |
|------|-----------|
| `GET /p/:id` | Página do produto (por ID da API) com meta tags OG, Twitter Card e Schema.org |
| `GET /produto/:id` | Alias em português |
| `GET /sitemap.xml` | Sitemap com todos os produtos |
| `GET /robots.txt` | Aponta para o sitemap |

### Exemplo de link para partilhar

```
https://SEU-DOMINIO/p/1
```

## Configuração

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `SITE_URL` | URL pública deste servidor (obrigatório em produção) |
| `API_BASE_URL` | Base da API DRIP |
| `STORE_NAME` | Nome na meta `og:site_name` |
| `CURRENCY` | Moeda (preços na API vêm em centavos) |
| `STORE_PRODUCT_URL` | URL da loja para compra (`{id}` = ID do produto) |
| `REDIRECT_DELAY_SECONDS` | Segundos até redirect automático (padrão 5) |
| `PORT` | Porta HTTP (padrão 3000) |

## Desenvolvimento

```bash
npm install
npm run start:dev
```

Abra: http://localhost:3000/p/1

## Produção

```bash
npm run build
npm run start:prod
```

Defina `SITE_URL` com o domínio real (HTTPS) para que `og:url`, `canonical` e o sitemap fiquem corretos.

## Integração com a loja

Na app/frontend da loja, ao partilhar um produto use o link deste servidor:

```ts
const previewBase = process.env.PREVIEW_URL; // ex: https://preview.drip.ao
const shareUrl = `${previewBase}/p/${product.id}`;
```

## Validar previews

- [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/)
- [Twitter Card Validator](https://cards-dev.twitter.com/validator)
- [LinkedIn Post Inspector](https://www.linkedin.com/post-inspector/)

## Notas

- Produtos são carregados por **ID** via `GET /api/products/{id}` (alinhado com a API).
- Imagens da API usam `http://`; as meta tags usam `https://` para compatibilidade com WhatsApp/Facebook.
"# drippreviews" 
