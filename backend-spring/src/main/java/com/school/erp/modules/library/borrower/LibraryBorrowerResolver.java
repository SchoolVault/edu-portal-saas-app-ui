package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;

/**
 * Strategy contract for borrower-type-specific validation and canonicalization.
 */
public interface LibraryBorrowerResolver {
    Enums.LibraryBorrowerType supportedType();

    ResolvedBorrower resolve(String tenantId, BorrowerResolutionRequest request);
}
