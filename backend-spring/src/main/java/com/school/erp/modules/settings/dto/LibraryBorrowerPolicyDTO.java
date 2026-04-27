package com.school.erp.modules.settings.dto;

import com.school.erp.common.enums.Enums;

import java.util.List;

/**
 * Tenant-level library borrower policy.
 */
public class LibraryBorrowerPolicyDTO {
    private List<Enums.LibraryBorrowerType> allowedBorrowerTypes;

    public List<Enums.LibraryBorrowerType> getAllowedBorrowerTypes() {
        return allowedBorrowerTypes;
    }

    public void setAllowedBorrowerTypes(List<Enums.LibraryBorrowerType> allowedBorrowerTypes) {
        this.allowedBorrowerTypes = allowedBorrowerTypes;
    }
}
