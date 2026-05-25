import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Product,
  ProductDetailResponse,
  ProductsListResponse,
} from './products.types';

const CACHE_TTL_MS = 5 * 60 * 1000;

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);
  private cache: Product[] | null = null;
  private cacheExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  private get apiBaseUrl(): string {
    return this.config.get<string>(
      'API_BASE_URL',
      'https://api.drip.infinityfree.me/api',
    );
  }

  async findAll(): Promise<Product[]> {
    if (this.cache && Date.now() < this.cacheExpiresAt) {
      return this.cache;
    }

    const products: Product[] = [];
    let page = 1;
    let lastPage = 1;

    do {
      const url = `${this.apiBaseUrl}/products?page=${page}`;
      const response = await fetch(url, {
        headers: { Accept: 'application/json' },
      });

      if (!response.ok) {
        this.logger.error(`API error ${response.status} for ${url}`);
        throw new Error(`Failed to fetch products: ${response.status}`);
      }

      const body = (await response.json()) as ProductsListResponse;
      products.push(...body.data);
      lastPage = body.meta.last_page;
      page += 1;
    } while (page <= lastPage);

    this.cache = products;
    this.cacheExpiresAt = Date.now() + CACHE_TTL_MS;

    return products;
  }

  async findById(id: number): Promise<Product> {
    const url = `${this.apiBaseUrl}/products/${id}`;
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 404) {
      throw new NotFoundException(`Product not found: ${id}`);
    }

    if (!response.ok) {
      throw new Error(`Failed to fetch product ${id}: ${response.status}`);
    }

    const body = (await response.json()) as ProductDetailResponse;
    return body.data;
  }

  invalidateCache(): void {
    this.cache = null;
    this.cacheExpiresAt = 0;
  }
}
