import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Preview SEO (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('/ (GET) returns HTML', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Content-Type', /text\/html/);
  });

  it('/p/:id (GET) returns product preview', () => {
    return request(app.getHttpServer())
      .get('/p/1')
      .expect(200)
      .expect('Content-Type', /text\/html/)
      .expect((res) => {
        expect(res.text).toContain('og:title');
        expect(res.text).toContain('application/ld+json');
        expect(res.text).toContain('/p/1');
      });
  });

  it('/sitemap.xml (GET)', () => {
    return request(app.getHttpServer())
      .get('/sitemap.xml')
      .expect(200)
      .expect('Content-Type', /xml/)
      .expect((res) => {
        expect(res.text).toContain('<urlset');
        expect(res.text).toContain('/p/1');
      });
  });
});
