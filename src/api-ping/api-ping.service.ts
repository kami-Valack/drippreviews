import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiPingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ApiPingService.name);
  private intervalRef?: ReturnType<typeof setInterval>;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const intervalMs = this.getIntervalMs();
    const pingOnStart = this.config.get<string>('PING_ON_START', 'true') !== 'false';

    this.logger.log(
      `API ping ativo — intervalo ${intervalMs / 60_000} min`,
    );

    if (pingOnStart) {
      void this.runPing();
    }

    this.intervalRef = setInterval(() => {
      void this.runPing();
    }, intervalMs);
  }

  onModuleDestroy(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
    }
  }

  private getIntervalMs(): number {
    const minutes = Number(this.config.get('CRON_INTERVAL_MINUTES', 90));
    const safe = Number.isFinite(minutes) && minutes > 0 ? minutes : 90;
    return safe * 60_000;
  }

  private getPingUrls(): string[] {
    const base = this.config
      .get<string>('API_BASE_URL', 'https://api.drip.infinityfree.me/api')
      .replace(/\/$/, '');
    return [`${base}/products`, `${base}/products/1`];
  }

  private async runPing(): Promise<void> {
    this.logger.log('Cron: a contactar API…');

    for (const url of this.getPingUrls()) {
      const started = Date.now();
      try {
        const response = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'DRIP-Preview-SEO/1.0',
          },
          signal: AbortSignal.timeout(60_000),
        });
        const ms = Date.now() - started;
        if (response.ok) {
          this.logger.log(`OK ${response.status} ${url} (${ms}ms)`);
        } else {
          this.logger.warn(`FAIL ${response.status} ${url} (${ms}ms)`);
        }
      } catch (err) {
        const ms = Date.now() - started;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`FAIL ${url} (${ms}ms) — ${msg}`);
      }
    }
  }
}
