import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PlatformHealthSnapshot } from '../models/models';
import { ApiService } from './api.service';
import { runtimeConfig } from '../config/runtime-config';

@Injectable({ providedIn: 'root' })
export class PlatformHealthService {
  constructor(private api: ApiService) {}

  getSnapshot(): Observable<PlatformHealthSnapshot> {
    if (!runtimeConfig.useMocks) {
      return this.api.get<PlatformHealthSnapshot>('/platform/health');
    }
    const heapMax = 512 * 1024 * 1024;
    const heapUsed = Math.floor(heapMax * 0.42);
    return of({
      checkedAt: new Date().toISOString(),
      jvm: {
        heapUsedBytes: heapUsed,
        heapMaxBytes: heapMax,
        heapUsagePercent: 42
      },
      disk: {
        path: '/var/platform',
        totalBytes: 500_000_000_000,
        usableBytes: 220_000_000_000,
        usagePercent: 56
      },
      components: [
        { name: 'API runtime', status: 'UP', detail: 'Mock — Spring process healthy' },
        { name: 'Database', status: 'UP', detail: 'Mock — primary replica lag 0 ms' },
        { name: 'Redis cache', status: 'WARN', detail: 'Mock — optional; not configured in dev' },
        { name: 'Job runner', status: 'UP', detail: 'Mock — scheduled tasks nominal' }
      ],
      sloSignals: [
        { key: 'report_read_p95_ms', label: 'Report read P95 latency', unit: 'ms', value: 540, warnThreshold: 800, criticalThreshold: 1500, status: 'OK' },
        { key: 'snapshot_hit_rate_pct', label: 'Dashboard snapshot hit rate', unit: '%', value: 76, warnThreshold: 70, criticalThreshold: 50, status: 'OK' },
        { key: 'snapshot_refresh_backlog', label: 'Snapshot refresh backlog', unit: 'count', value: 62, warnThreshold: 50, criticalThreshold: 120, status: 'WARN' },
      ],
      alerts: [
        {
          severity: 'warning',
          code: 'snapshot_refresh_backlog',
          title: 'Snapshot refresh backlog is WARN',
          detail: 'Current 62 count, warn 50, critical 120',
          suggestedAction: 'Increase refresh job batch size and run warmup.',
        },
      ],
    }).pipe(delay(280));
  }
}
