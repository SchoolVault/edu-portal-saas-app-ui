import type {
  ChatCounterpartInsight,
  ChatDirectoryClassRoster,
  ChatDirectoryResponse,
  ChatInboxConversation,
  ChatLinkedStudentBrief,
} from '../models/models';

/** Build a short class label from roster row (e.g. Class 8 + section A → "8A"). */
export function classShortFromRoster(roster: ChatDirectoryClassRoster): string {
  const sec = (roster.sectionName || '').replace(/\s+/g, '').trim();
  const m = (roster.className || '').match(/\d+/);
  const num = m ? m[0] : '';
  if (num && sec) {
    return `${num}${sec}`;
  }
  return [roster.className, roster.sectionName].filter(Boolean).join(' ').trim();
}

function collectParentStudentsFromRosters(
  parentUserId: number,
  rosters: ChatDirectoryClassRoster[] | undefined
): ChatLinkedStudentBrief[] {
  if (!rosters?.length) {
    return [];
  }
  const out: ChatLinkedStudentBrief[] = [];
  for (const r of rosters) {
    for (const s of r.students || []) {
      if (s.parent?.userId === parentUserId) {
        out.push({
          studentId: s.studentId,
          studentName: s.studentName,
          classShort: classShortFromRoster(r),
        });
      }
    }
  }
  return out;
}

/**
 * Merge server-provided {@link ChatInboxConversation.counterpartInsight} with client-side directory/roster data.
 * Server wins for linked lists when non-empty; otherwise PARENT rows are enriched from directory/teaching rosters.
 */
export function resolveCounterpartInsight(
  conv: ChatInboxConversation,
  opts: {
    myUserId: number | null;
    directory: ChatDirectoryResponse | null;
  }
): ChatCounterpartInsight | null {
  if (conv.type !== 'direct') {
    return conv.counterpartInsight ?? null;
  }
  const me = opts.myUserId;
  const other = conv.participants.find(p => p.userId !== me) ?? conv.participants[0];
  if (!other) {
    return conv.counterpartInsight ?? null;
  }

  const fromServer = conv.counterpartInsight;
  const roleCode = (fromServer?.roleCode || other.userRole || '').toUpperCase();
  if (!roleCode) {
    return null;
  }

  let linkedStudents = fromServer?.linkedStudents?.map(s => ({ ...s })) ?? [];
  let linkedStudentTotal = fromServer?.linkedStudentTotal;

  if (roleCode === 'PARENT' && linkedStudents.length === 0) {
    const card = opts.directory?.parents?.find(p => p.userId === other.userId);
    if (card?.linkedStudents?.length) {
      linkedStudents = card.linkedStudents.map(s => ({ ...s }));
      linkedStudentTotal = card.linkedStudentTotal ?? card.linkedStudents.length;
    } else {
      const fromRosters = collectParentStudentsFromRosters(other.userId, opts.directory?.myClassRosters);
      if (fromRosters.length) {
        linkedStudents = fromRosters;
        linkedStudentTotal = fromRosters.length;
      }
    }
  }

  const out: ChatCounterpartInsight = { roleCode };
  if (linkedStudents.length) {
    out.linkedStudents = linkedStudents;
    out.linkedStudentTotal = linkedStudentTotal ?? linkedStudents.length;
  } else if (linkedStudentTotal != null) {
    out.linkedStudentTotal = linkedStudentTotal;
  }
  return out;
}
