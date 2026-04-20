import type { TranslateService } from '@ngx-translate/core';
import type { SchoolClass, TimetableConflictPayload } from '../models/models';
import { formatSchoolClassDisplayName } from '../i18n/school-class-display';

/**
 * Human-readable class/section labels for timetable conflict dialogs (grid, onboarding, future flows).
 * Keeps raw numeric ids out of end-user copy.
 */
export interface TimetableConflictHumanLabels {
  classDisplayName: (classId: number | null | undefined) => string;
  sectionDisplayForClass: (classId: number | null | undefined, sectionId: number | null | undefined) => string;
}

export function createTimetableConflictHumanLabels(
  classes: SchoolClass[],
  translate: TranslateService
): TimetableConflictHumanLabels {
  const classDisplayName = (classId: number | null | undefined): string => {
    if (classId == null || classId === 0) {
      return '—';
    }
    return formatSchoolClassDisplayName(classId, classes.find(c => c.id === classId)?.name?.trim(), translate);
  };

  const sectionDisplayForClass = (
    classId: number | null | undefined,
    sectionId: number | null | undefined
  ): string => {
    if (classId == null || classId === 0) {
      return '—';
    }
    const c = classes.find(x => x.id === classId);
    if (!c?.sections?.length) {
      return translate.instant('timetable.sectionWholeClass');
    }
    const sid = sectionId == null || sectionId === 0 ? null : sectionId;
    if (sid == null) {
      return translate.instant('timetable.sectionWholeClass');
    }
    return c.sections.find(s => s.id === sid)?.name?.trim() || String(sid);
  };

  return { classDisplayName, sectionDisplayForClass };
}

export interface BuildTimetableConflictDialogInput {
  translate: TranslateService;
  conflict: TimetableConflictPayload;
  labels: TimetableConflictHumanLabels;
  /** Class/section for the slot the user is trying to save (shown for TEACHER_DOUBLE_BOOKED). */
  pendingClassId?: number | null;
  pendingSectionId?: number | null;
  /** When false, omit the “replace hint” bullet (rare). Default true. */
  includeReplaceHint?: boolean;
}

/** Strings ready for {@link ConfirmDialogService.confirm}. */
export interface TimetableConflictDialogStrings {
  title: string;
  message: string;
  details: string[];
  confirmLabel: string;
  cancelLabel: string;
}

/**
 * Builds conflict dialog copy shared by the master timetable grid and teacher schedule onboarding.
 */
export function buildTimetableConflictDialogStrings(input: BuildTimetableConflictDialogInput): TimetableConflictDialogStrings {
  const { translate, conflict: p, labels, pendingClassId, pendingSectionId, includeReplaceHint = true } = input;
  const isClassPeriodTaken = p.conflictType === 'CLASS_PERIOD_OCCUPIED';
  const blockingClassId = p.conflictingClassId ?? p.classId;
  const blockingSectionId = p.conflictingSectionId ?? p.sectionId;

  const blockingClassLabel = labels.classDisplayName(blockingClassId);
  const blockingSectionLabel = labels.sectionDisplayForClass(blockingClassId, blockingSectionId);

  const title = translate.instant(isClassPeriodTaken ? 'timetable.conflictClassTitle' : 'timetable.conflictTeacherTitle');
  const message = isClassPeriodTaken
    ? translate.instant('timetable.conflictClassMessage', {
        subject: p.subjectName ?? '—',
        teacher: p.teacherName ?? '—',
        day: p.day,
        period: String(p.period),
      })
    : translate.instant('timetable.conflictTeacherMessage', {
        subject: p.subjectName ?? '—',
        teacher: p.teacherName ?? '—',
        clazz: blockingClassLabel,
        section: blockingSectionLabel,
        day: p.day,
        period: String(p.period),
      });

  const details: string[] = [
    translate.instant('timetable.conflictDetailPeriod', { day: p.day, period: p.period }),
  ];

  if (!isClassPeriodTaken) {
    details.push(
      translate.instant('timetable.conflictDetailPendingAssignment', {
        clazz: labels.classDisplayName(pendingClassId),
        section: labels.sectionDisplayForClass(pendingClassId, pendingSectionId),
      })
    );
  }

  if (includeReplaceHint) {
    details.push(translate.instant('timetable.conflictReplaceHint'));
  }

  return {
    title,
    message,
    details,
    confirmLabel: translate.instant('timetable.conflictReplace'),
    cancelLabel: translate.instant('timetable.conflictKeep'),
  };
}
