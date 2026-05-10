package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import org.springframework.stereotype.Service;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Registry of borrower resolvers by type.
 * New borrower integrations plug in by adding one {@link LibraryBorrowerResolver} bean.
 */
@Service
public class BorrowerRegistry {
    private final Map<Enums.LibraryBorrowerType, LibraryBorrowerResolver> resolvers;

    public BorrowerRegistry(List<LibraryBorrowerResolver> resolverList) {
        this.resolvers = new EnumMap<>(Enums.LibraryBorrowerType.class);
        for (LibraryBorrowerResolver r : resolverList) {
            this.resolvers.put(r.supportedType(), r);
        }
    }

    public ResolvedBorrower resolve(
            String tenantId,
            Enums.LibraryBorrowerType borrowerType,
            Long borrowerRefId,
            Long borrowerUserId,
            String borrowerDisplayName) {
        Enums.LibraryBorrowerType t = borrowerType == null ? Enums.LibraryBorrowerType.OTHER : borrowerType;
        LibraryBorrowerResolver resolver = resolvers.get(t);
        if (resolver == null) {
            throw new BusinessException("Unsupported borrower type: " + t);
        }
        return resolver.resolve(tenantId, new BorrowerResolutionRequest(t, borrowerRefId, borrowerUserId, borrowerDisplayName));
    }
}
