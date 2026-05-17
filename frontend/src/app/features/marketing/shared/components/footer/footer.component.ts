import { NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MarketingService } from '../../../../../core/services/marketing.service';

@Component({
  selector: 'sv-footer',
  standalone: true,
  imports: [FormsModule, RouterLink, NgIf],
  template: `
    <footer class="sv-footer" data-testid="site-footer">
      <div class="sv-container">
        <div class="sv-footer__cols">
          <div class="sv-footer-brand">
            <div class="sv-logo-wrap">
              <span class="sv-logo-mark" aria-hidden="true">SV</span>
              <div class="sv-logo">SchoolVault</div>
            </div>
            <p class="sv-copy">
              The trusted operating system for schools. Academics, fees, payroll, communication and operations - unified.
            </p>
            <div class="sv-footer-chips">
              <span>99.9% Uptime</span>
              <span>Role-based Access</span>
              <span>Implementation Support</span>
            </div>
            <form (ngSubmit)="subscribe()" class="sv-newsletter">
              <input class="form-control" type="email" placeholder="you@school.edu" name="email" [(ngModel)]="email" required />
              <button class="sv-btn sv-btn-primary" type="submit">Subscribe</button>
            </form>
            <small *ngIf="message()">{{ message() }}</small>
          </div>
          <div>
            <h4>Product</h4>
            <ul>
              <li><a routerLink="/features">Features</a></li>
              <li><a routerLink="/videos">Videos</a></li>
              <li><a routerLink="/testimonials">Customers</a></li>
              <li><a routerLink="/request-demo">Request demo</a></li>
            </ul>
          </div>
          <div>
            <h4>Solutions</h4>
            <ul>
              <li><a routerLink="/features">Admissions</a></li>
              <li><a routerLink="/features">Academics</a></li>
              <li><a routerLink="/features">Fees and Finance</a></li>
              <li><a routerLink="/features">HR and Payroll</a></li>
            </ul>
          </div>
          <div>
            <h4>Company</h4>
            <ul>
              <li><a routerLink="/request-demo">Contact</a></li>
              <li><a [href]="brochureUrl" target="_blank" rel="noopener noreferrer">Brochure</a></li>
              <li><a routerLink="/login">Login</a></li>
            </ul>
            <div class="sv-footer-contact">
              <p><strong>Email:</strong> hello&#64;schoolvault.com</p>
              <p><strong>Sales:</strong> +1 (512) 555-0140</p>
            </div>
          </div>
        </div>
        <div class="sv-footer-bottom">
          <p>© {{ currentYear }} SchoolVault. All rights reserved.</p>
          <div class="sv-footer-bottom__links">
            <a routerLink="/request-demo">Privacy</a>
            <a routerLink="/request-demo">Terms</a>
            <a routerLink="/request-demo">Security</a>
            <a [href]="brochureUrl" target="_blank" rel="noopener noreferrer">Brochure</a>
          </div>
        </div>
      </div>
    </footer>
  `,
  styles: [`
    :host { display:block; }
    .sv-footer {
      --footer-bg: linear-gradient(
        150deg,
        color-mix(in srgb, var(--clr-surface) 92%, var(--clr-primary) 8%) 0%,
        color-mix(in srgb, var(--clr-surface-alt) 90%, var(--clr-primary) 10%) 100%
      );
      --footer-text: var(--clr-text);
      --footer-muted: var(--clr-text-secondary);
      --footer-link: color-mix(in srgb, var(--clr-text) 88%, var(--clr-primary) 12%);
      --footer-input-bg: var(--clr-surface);
      --footer-input-border: var(--clr-border);
      background: var(--footer-bg);
      color: var(--footer-text);
      border-top: 1px solid color-mix(in srgb, var(--clr-primary) 24%, var(--clr-border));
      padding: 56px 0 40px;
      margin-top: 40px;
    }
    .sv-container { width: 100%; max-width: 100%; margin: 0 auto; padding: 0 clamp(14px, 2.2vw, 32px); }
    .sv-footer__cols { display:grid; grid-template-columns:1.6fr 1fr 1fr 1.1fr; gap:24px; }
    .sv-footer-brand { min-width: 0; }
    .sv-logo-wrap {
      display: inline-flex;
      align-items: center;
      gap: 10px;
    }
    .sv-logo-mark {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: .72rem;
      font-weight: 800;
      color: #fff;
      background: linear-gradient(145deg, var(--clr-primary) 0%, color-mix(in srgb, var(--clr-primary) 72%, #000) 100%);
      box-shadow: 0 6px 14px color-mix(in srgb, var(--clr-primary) 24%, transparent);
    }
    .sv-logo { font-family: 'Fraunces', Georgia, serif; font-size: 1.4rem; font-weight: 700; }
    .sv-copy { margin-top:14px; max-width:380px; color:var(--footer-muted); }
    .sv-footer-chips {
      margin-top: 14px;
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .sv-footer-chips span {
      border-radius: 999px;
      padding: 6px 10px;
      font-size: .72rem;
      border: 1px solid color-mix(in srgb, var(--clr-border) 88%, transparent);
      background: color-mix(in srgb, var(--clr-surface) 90%, var(--clr-primary) 10%);
      color: var(--footer-muted);
    }
    .sv-newsletter { display:flex; gap:8px; margin-top:16px; max-width:420px; }
    .form-control {
      width: 100%;
      padding: 10px 12px;
      border-radius: 10px;
      border:1px solid var(--footer-input-border);
      background: var(--footer-input-bg);
      color: var(--footer-text);
    }
    .form-control::placeholder {
      color: color-mix(in srgb, var(--footer-muted) 90%, var(--footer-text) 10%);
      opacity: 1;
    }
    .sv-btn { border: none; border-radius: 999px; padding: 10px 18px; font-weight: 600; cursor: pointer; }
    .sv-btn-primary { background:var(--clr-accent); color:#fff; }
    h4 { margin:0 0 10px; }
    ul { list-style:none; padding:0; margin:0; line-height:2; }
    a { color:var(--footer-link); text-decoration:none; opacity:.95; }
    a:hover { color: var(--clr-primary); }
    .sv-footer-contact {
      margin-top: 12px;
      border-top: 1px dashed color-mix(in srgb, var(--clr-border) 84%, transparent);
      padding-top: 10px;
    }
    .sv-footer-contact p {
      margin: 0 0 4px;
      color: var(--footer-muted);
      font-size: .82rem;
      line-height: 1.35;
    }
    .sv-footer-bottom {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid color-mix(in srgb, var(--clr-primary) 20%, var(--clr-border));
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }
    .sv-footer-bottom p {
      margin: 0;
      color: var(--footer-muted);
      font-size: .84rem;
    }
    .sv-footer-bottom__links {
      display: inline-flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .sv-footer-bottom__links a {
      font-size: .82rem;
      color: var(--footer-link);
    }
    [data-theme='dark'] .sv-footer {
      --footer-bg: linear-gradient(
        150deg,
        color-mix(in srgb, var(--clr-surface) 70%, #000) 0%,
        color-mix(in srgb, var(--clr-surface-alt) 64%, #000) 100%
      );
      --footer-text: color-mix(in srgb, var(--clr-text) 95%, white 5%);
      --footer-muted: var(--clr-text-muted);
      --footer-link: color-mix(in srgb, var(--clr-text) 86%, var(--clr-primary) 14%);
      --footer-input-bg: color-mix(in srgb, var(--clr-surface) 85%, #000 15%);
      --footer-input-border: color-mix(in srgb, var(--clr-border) 80%, var(--clr-primary) 20%);
    }
    [data-theme='dark'] .sv-footer .form-control::placeholder {
      color: color-mix(in srgb, #ffffff 88%, #cbd5e1 12%);
      opacity: 1;
    }
    [data-theme='dark'] .sv-footer a:hover { color: var(--clr-primary-light); }
    @media (max-width: 860px) {
      .sv-container { padding: 0 16px; }
      .sv-footer__cols { grid-template-columns:1fr; }
      .sv-footer-bottom { flex-direction: column; align-items: flex-start; }
      .sv-newsletter { flex-direction:column; max-width: 100%; }
      .sv-btn { width: 100%; }
    }
  `]
})
export class FooterComponent {
  private readonly marketing = inject(MarketingService);
  email = '';
  readonly message = signal<string | null>(null);
  readonly brochureUrl = this.marketing.brochureUrl();
  readonly currentYear = new Date().getFullYear();

  subscribe(): void {
    if (!this.email) return;
    this.marketing.subscribeNewsletter(this.email).subscribe({
      next: r => {
        this.message.set(r.alreadyExists ? 'Already subscribed. Thank you.' : 'Thanks, subscription confirmed.');
        this.email = '';
      },
      error: () => this.message.set('Unable to subscribe right now.')
    });
  }
}
