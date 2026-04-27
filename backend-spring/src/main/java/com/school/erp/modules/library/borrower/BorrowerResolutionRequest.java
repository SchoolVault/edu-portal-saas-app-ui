package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;

/**
 * Input payload for borrower resolution in circulation workflows.
 */
public record BorrowerResolutionRequest(
        Enums.LibraryBorrowerType borrowerType,
        Long borrowerRefId,
        Long borrowerUserId,
        String borrowerDisplayName) {
}
