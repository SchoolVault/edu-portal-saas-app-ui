package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;

/**
 * Canonical borrower identity persisted in {@code book_issues}.
 */
public record ResolvedBorrower(
        Enums.LibraryBorrowerType borrowerType,
        Long borrowerRefId,
        Long borrowerUserId,
        String borrowerDisplayName,
        Long legacyStudentId,
        String legacyStudentName) {
}
