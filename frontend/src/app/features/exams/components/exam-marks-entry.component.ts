import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-exam-marks-entry',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="exam-marks-entry">
      <ng-content></ng-content>
    </section>
  `,
})
export class ExamMarksEntryComponent {}
