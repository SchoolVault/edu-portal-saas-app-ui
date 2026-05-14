import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-exam-shell',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="exam-shell">
      <ng-content></ng-content>
    </section>
  `,
})
export class ExamShellComponent {}
