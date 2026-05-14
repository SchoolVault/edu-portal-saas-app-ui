import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-exam-config-engine',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="exam-config-engine">
      <ng-content></ng-content>
    </section>
  `,
})
export class ExamConfigEngineComponent {}
