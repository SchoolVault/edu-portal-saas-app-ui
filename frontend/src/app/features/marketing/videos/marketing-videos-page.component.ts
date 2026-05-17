import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MarketingService, MarketingVideo } from '../../../core/services/marketing.service';
import { MarketingSeoService } from '../../../core/services/marketing-seo.service';
import { HeaderComponent } from '../shared/components/header/header.component';
import { CtaBandComponent } from '../shared/components/cta-band/cta-band.component';
import { FooterComponent } from '../shared/components/footer/footer.component';

@Component({
  selector: 'app-marketing-videos-page',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, CtaBandComponent, FooterComponent],
  template: `
    <sv-header />
    <section class="sv-section">
      <div class="sv-container">
        <span class="sv-eyebrow">Video library</span>
        <h1 style="margin-top:10px">SchoolVault product videos</h1>
        <p class="sv-muted" style="max-width:760px; margin-top:10px">
          Watch walkthroughs, feature deep dives, and implementation stories for modern school operations.
        </p>

        <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:20px">
          <input class="form-control" style="max-width:280px" placeholder="Search videos" [(ngModel)]="q" (keyup.enter)="reload()" />
          <input class="form-control" style="max-width:220px" placeholder="Filter by category" [(ngModel)]="category" (keyup.enter)="reload()" />
          <input class="form-control" style="max-width:220px" placeholder="Filter by tag" [(ngModel)]="tag" (keyup.enter)="reload()" />
          <button class="sv-btn sv-btn-secondary" (click)="reload()">Apply</button>
          <button class="sv-btn sv-btn-ghost" (click)="clearFilters()">Clear</button>
        </div>

        <div class="sv-grid" style="margin-top:28px">
          <article class="sv-card" *ngFor="let v of videos()">
            <img [src]="thumbnail(v)" [alt]="v.title + ' thumbnail'" style="width:100%; aspect-ratio:16/9; object-fit:cover; border-radius:12px; cursor:pointer;" (click)="openPlayer(v)" />
            <div style="display:flex; justify-content:space-between; gap:8px; align-items:center; margin-top:8px">
              <small class="sv-eyebrow" style="margin:0">{{ v.category || 'Video' }}</small>
              <span *ngIf="v.featured" class="badge text-bg-success">Featured</span>
            </div>
            <h3 style="margin-top:10px">{{ v.title }}</h3>
            <p class="sv-muted" style="margin-top:8px">{{ v.summary || 'Watch this SchoolVault video.' }}</p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:12px">
              <small class="badge text-bg-light" *ngFor="let t of v.tags">{{ t }}</small>
            </div>
            <div style="margin-top:16px; display:flex; gap:10px; align-items:center; flex-wrap:wrap">
              <button class="sv-btn sv-btn-primary" (click)="openPlayer(v)">Play now</button>
              <a class="sv-btn sv-btn-ghost" [href]="v.youtubeUrl" target="_blank" rel="noopener noreferrer">YouTube</a>
              <small class="sv-muted">Updated {{ v.updatedAt | date:'mediumDate' }}</small>
            </div>
          </article>
        </div>

        <div class="sv-card" *ngIf="videos().length===0" style="margin-top:18px">
          <p class="sv-muted" style="margin:0">
            No videos are published yet. Sales team uploads will appear here automatically once published.
          </p>
        </div>

        <div *ngIf="activeVideo()" (click)="closePlayer()" style="position:fixed; inset:0; z-index:1000; background:rgba(15,23,42,0.8); display:flex; align-items:center; justify-content:center; padding:18px;">
          <div class="sv-card" (click)="$event.stopPropagation()" style="width:min(980px, 96vw); padding:14px">
            <div style="display:flex; justify-content:space-between; align-items:center; gap:12px; margin-bottom:10px">
              <strong>{{ activeVideo()!.title }}</strong>
              <button class="sv-btn sv-btn-ghost" (click)="closePlayer()">Close</button>
            </div>
            <iframe [src]="activeEmbedUrl()" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%; aspect-ratio:16/9; border:0; border-radius:10px;"></iframe>
          </div>
        </div>
      </div>
    </section>
    <sv-cta-band />
    <sv-footer />
  `,
  styles: [`
    :host {
      --sv-primary: var(--clr-primary); --sv-primary-light: var(--clr-primary-light); --sv-accent: var(--clr-accent); --sv-accent-dark: var(--clr-accent-dark);
      --sv-bg: var(--clr-bg); --sv-surface: var(--clr-surface); --sv-ink: var(--clr-text); --sv-muted: var(--clr-text-secondary); --sv-border: var(--clr-border);
      --sv-radius: 12px; --sv-radius-lg: 16px;
      --sv-shadow-sm: 0 1px 2px rgba(28,25,23,.04), 0 1px 3px rgba(28,25,23,.06);
      --sv-shadow: 0 4px 14px rgba(28,25,23,.06), 0 2px 6px rgba(28,25,23,.04);
      --sv-font-heading: 'Fraunces', 'Avenir Next', 'Iowan Old Style', Georgia, serif; --sv-font-body: 'Manrope', 'Segoe UI', system-ui, -apple-system, sans-serif;
      display: block; background: var(--sv-bg); color: var(--sv-ink); font-family: var(--sv-font-body);
    }
    .sv-container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }
    .sv-section { padding: clamp(56px, 9vw, 112px) 0; }
    h1, h3 { font-family: var(--sv-font-heading); color: var(--sv-ink); letter-spacing: -0.02em; line-height: 1.15; margin: 0; }
    h1 { font-weight: 700; font-size: clamp(2.25rem, 4.5vw, 3.5rem); }
    h3 { font-weight: 600; font-size: 1.375rem; }
    .sv-eyebrow { text-transform: uppercase; letter-spacing: 0.16em; font-size: 0.78rem; font-weight: 600; color: var(--sv-accent); }
    .sv-muted { color: var(--sv-muted); }
    .sv-grid { display: grid; gap: 24px; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); }
    .sv-card { background: var(--sv-surface); border: 1px solid var(--sv-border); border-radius: var(--sv-radius-lg); padding: 28px; box-shadow: var(--sv-shadow-sm); transition: box-shadow .2s ease, transform .2s ease, border-color .2s ease; }
    .sv-card:hover { box-shadow: var(--sv-shadow); border-color: #d6d3d1; transform: translateY(-2px); }
    .sv-btn { display: inline-flex; align-items: center; gap: 8px; padding: 12px 22px; border-radius: 999px; font-weight: 600; font-size: 0.95rem; border: 1px solid transparent; cursor: pointer; text-decoration: none; }
    .sv-btn-primary { background: var(--sv-accent); color: #fff; }
    .sv-btn-primary:hover { background: var(--sv-accent-dark); color: #fff; text-decoration: none; transform: translateY(-1px); }
    .sv-btn-secondary { background: var(--sv-primary); color: #fff; }
    .sv-btn-secondary:hover { background: var(--sv-primary-light); color: #fff; text-decoration: none; }
    .sv-btn-ghost { background: transparent; color: var(--sv-primary); border-color: var(--sv-border); }
    .sv-btn-ghost:hover { background: var(--sv-surface); border-color: var(--sv-primary); text-decoration: none; }
    .form-control { width: 100%; padding: 12px 14px; border: 1px solid var(--sv-border); border-radius: var(--sv-radius); background: var(--sv-surface); color: var(--sv-ink); font-family: inherit; font-size: 1rem; }
    .form-control:focus { outline: none; border-color: var(--sv-primary); box-shadow: 0 0 0 3px rgba(27,58,48,.12); }
    @media (max-width: 720px) {
      .sv-container { padding: 0 16px; }
      .sv-card { padding: 18px; }
      .sv-btn { width: 100%; justify-content: center; }
    }
  `]
})
export class MarketingVideosPageComponent implements OnInit {
  readonly videos = signal<MarketingVideo[]>([]);
  q = '';
  category = '';
  tag = '';
  readonly activeVideo = signal<MarketingVideo | null>(null);
  readonly activeEmbedUrl = signal<SafeResourceUrl | null>(null);

  constructor(
    private readonly marketing: MarketingService,
    private readonly seo: MarketingSeoService,
    private readonly sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.seo.apply({
      title: 'EduPortal Videos - Product and Module Walkthroughs',
      description: 'Watch EduPortal videos for product overview, module deep dives, and deployment guidance.',
      canonicalPath: '/videos'
    });
    this.reload();
  }

  reload(): void {
    this.marketing.listVideos({
      q: this.q || undefined,
      category: this.category || undefined,
      tag: this.tag || undefined
    }).subscribe({
      next: list => this.videos.set(list),
      error: () => this.videos.set([])
    });
  }

  clearFilters(): void {
    this.q = '';
    this.category = '';
    this.tag = '';
    this.reload();
  }

  openPlayer(video: MarketingVideo): void {
    this.activeVideo.set(video);
    this.activeEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.toEmbedUrl(video.youtubeUrl)));
  }

  closePlayer(): void {
    this.activeVideo.set(null);
    this.activeEmbedUrl.set(null);
  }

  thumbnail(v: MarketingVideo): string {
    if (v.thumbnailUrl) {
      return v.thumbnailUrl;
    }
    const match = v.youtubeUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
    const id = match?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : '';
  }

  private toEmbedUrl(url: string): string {
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{6,})/);
    const id = match?.[1];
    return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : url;
  }
}
