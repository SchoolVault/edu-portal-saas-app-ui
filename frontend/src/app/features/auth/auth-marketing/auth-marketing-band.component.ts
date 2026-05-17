import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-marketing-band',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section
      class="auth-marketing-band"
      lang="en"
      dir="ltr"
      aria-label="Marketing and contact (English)"
    ></section>
  `,
})
export class AuthMarketingBandComponent {}
