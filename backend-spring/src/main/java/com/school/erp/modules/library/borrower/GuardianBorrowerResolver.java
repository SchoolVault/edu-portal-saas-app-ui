package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import org.springframework.stereotype.Component;

@Component
public class GuardianBorrowerResolver implements LibraryBorrowerResolver {
    private final GuardianRepository guardianRepository;

    public GuardianBorrowerResolver(GuardianRepository guardianRepository) {
        this.guardianRepository = guardianRepository;
    }

    @Override
    public Enums.LibraryBorrowerType supportedType() {
        return Enums.LibraryBorrowerType.GUARDIAN;
    }

    @Override
    public ResolvedBorrower resolve(String tenantId, BorrowerResolutionRequest request) {
        if (request.borrowerRefId() == null) {
            throw new BusinessException("Guardian borrower reference id is required");
        }
        Guardian g = guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(request.borrowerRefId(), tenantId)
                .orElseThrow(() -> new BusinessException("Guardian borrower was not found in this school"));
        String name = g.getFullName() != null && !g.getFullName().isBlank() ? g.getFullName().trim() : request.borrowerDisplayName();
        return new ResolvedBorrower(
                Enums.LibraryBorrowerType.GUARDIAN,
                g.getId(),
                g.getUserId(),
                name,
                null,
                null);
    }
}
