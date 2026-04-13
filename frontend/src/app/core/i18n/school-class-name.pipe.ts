import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { formatSchoolClassName } from './school-class-display';

/** Localizes canonical class display names from API/mocks; custom names pass through unchanged. */
@Pipe({
  name: 'schoolClassName',
  standalone: true,
  pure: false,
})
export class SchoolClassNamePipe implements PipeTransform {
  private readonly tr = inject(TranslateService);

  transform(value: string | null | undefined): string {
    return formatSchoolClassName(value, this.tr);
  }
}
