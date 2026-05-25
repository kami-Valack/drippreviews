import {
  Controller,
  Get,
  Header,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { SeoService } from '../seo/seo.service';

@Controller()
export class ProductsController {
  constructor(
    private readonly products: ProductsService,
    private readonly seo: SeoService,
  ) {}

  @Get()
  @Header('Content-Type', 'text/html; charset=utf-8')
  async home() {
    const products = await this.products.findAll();
    return this.seo.renderHomePage(products.length);
  }

  @Get(['p/:id', 'produto/:id'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  async productPreview(@Param('id', ParseIntPipe) id: number) {
    const product = await this.products.findById(id);
    return this.seo.renderProductPage(product);
  }

  @Get('sitemap.xml')
  @Header('Content-Type', 'application/xml; charset=utf-8')
  async sitemap() {
    const products = await this.products.findAll();
    return this.seo.renderSitemap(products);
  }

  @Get('robots.txt')
  @Header('Content-Type', 'text/plain; charset=utf-8')
  robots() {
    return this.seo.renderRobotsTxt();
  }
}
