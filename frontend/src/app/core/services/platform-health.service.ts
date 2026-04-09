import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import { PlatformHealthSnapshot } from '../models/models';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PlatformHealthService {
  constructor(private api: ApiService) {}

  getSnapshot(): Observable<PlatformHealthSnapshot> {
    if (!environment.useMocks) {
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
      ]
    }).pipe(delay(280));
  }
}
