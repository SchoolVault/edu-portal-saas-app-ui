package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import org.springframework.stereotype.Component;

@Component
public class OtherBorrowerResolver implements LibraryBorrowerResolver {
    @Override
    public Enums.LibraryBorrowerType supportedType() {
        return Enums.LibraryBorrowerType.OTHER;
    }

    @Override
    public ResolvedBorrower resolve(String tenantId, BorrowerResolutionRequest request) {
        if (request.borrowerRefId() == null) {
            throw new BusinessException("Borrower reference id is required");
        }
        String displayName = request.borrowerDisplayName() == null ? "" : request.borrowerDisplayName().trim();
        if (displayName.isBlank()) {
            throw new BusinessException("Borrower display name is required for OTHER borrower type");
        }
        return new ResolvedBorrower(
                Enums.LibraryBorrowerType.OTHER,
                request.borrowerRefId(),
                request.borrowerUserId(),
                displayName,
                null,
                null);
    }
}
