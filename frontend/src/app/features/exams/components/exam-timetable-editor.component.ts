import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-exam-timetable-editor',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="exam-timetable-editor">
      <ng-content></ng-content>
    </section>
  `,
})
export class ExamTimetableEditorComponent {}
