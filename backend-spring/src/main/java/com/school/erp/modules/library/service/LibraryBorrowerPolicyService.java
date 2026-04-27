package com.school.erp.modules.library.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.settings.dto.LibraryBorrowerPolicyDTO;
import com.school.erp.modules.settings.entity.TenantConfig;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.EnumSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
public class LibraryBorrowerPolicyService {
    private static final Set<Enums.LibraryBorrowerType> DEFAULT_ALLOWED =
            EnumSet.of(Enums.LibraryBorrowerType.STUDENT, Enums.LibraryBorrowerType.STAFF);

    private final TenantConfigRepository tenantConfigRepository;
    private final ObjectMapper objectMapper;

    public LibraryBorrowerPolicyService(TenantConfigRepository tenantConfigRepository, ObjectMapper objectMapper) {
        this.tenantConfigRepository = tenantConfigRepository;
        this.objectMapper = objectMapper;
    }

    @Transactional(readOnly = true)
    public LibraryBorrowerPolicyDTO getPolicyForCurrentTenant() {
        TenantConfig config = requireTenantConfig();
        EnumSet<Enums.LibraryBorrowerType> allowed = readAllowed(config);
        LibraryBorrowerPolicyDTO out = new LibraryBorrowerPolicyDTO();
        out.setAllowedBorrowerTypes(allowed.stream().toList());
        return out;
    }

    @Transactional
    public LibraryBorrowerPolicyDTO updatePolicyForCurrentTenant(LibraryBorrowerPolicyDTO request) {
        TenantConfig config = requireTenantConfig();
        EnumSet<Enums.LibraryBorrowerType> allowed = normalizeRequested(request);
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("allowedBorrowerTypes", allowed.stream().map(Enum::name).toList());
        try {
            config.setLibraryBorrowerPolicyJson(objectMapper.writeValueAsString(payload));
            tenantConfigRepository.save(config);
        } catch (Exception e) {
            throw new BusinessException("Unable to update library borrower policy");
        }
        LibraryBorrowerPolicyDTO out = new LibraryBorrowerPolicyDTO();
        out.setAllowedBorrowerTypes(allowed.stream().toList());
        return out;
    }

    @Transactional(readOnly = true)
    public void assertBorrowerTypeAllowed(Enums.LibraryBorrowerType borrowerType) {
        Enums.LibraryBorrowerType t = borrowerType == null ? Enums.LibraryBorrowerType.OTHER : borrowerType;
        EnumSet<Enums.LibraryBorrowerType> allowed = readAllowed(requireTenantConfig());
        if (!allowed.contains(t)) {
            throw new BusinessException("Borrower type not allowed for this school: " + t.name());
        }
    }

    private TenantConfig requireTenantConfig() {
        return tenantConfigRepository.findByTenantId(TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Tenant settings not configured"));
    }

    private EnumSet<Enums.LibraryBorrowerType> normalizeRequested(LibraryBorrowerPolicyDTO request) {
        List<Enums.LibraryBorrowerType> list = request != null ? request.getAllowedBorrowerTypes() : null;
        if (list == null || list.isEmpty()) {
            throw new BusinessException("At least one allowed borrower type is required");
        }
        EnumSet<Enums.LibraryBorrowerType> acc = EnumSet.noneOf(Enums.LibraryBorrowerType.class);
        for (Enums.LibraryBorrowerType t : list) {
            if (t != null) {
                acc.add(t);
            }
        }
        if (acc.isEmpty()) {
            throw new BusinessException("At least one valid borrower type is required");
        }
        return acc;
    }

    private EnumSet<Enums.LibraryBorrowerType> readAllowed(TenantConfig config) {
        if (config.getLibraryBorrowerPolicyJson() == null || config.getLibraryBorrowerPolicyJson().isBlank()) {
            return EnumSet.copyOf(DEFAULT_ALLOWED);
        }
        try {
            Map<String, Object> raw = objectMapper.readValue(config.getLibraryBorrowerPolicyJson(), new TypeReference<>() {});
            Object val = raw.get("allowedBorrowerTypes");
            if (!(val instanceof List<?> list) || list.isEmpty()) {
                return EnumSet.copyOf(DEFAULT_ALLOWED);
            }
            EnumSet<Enums.LibraryBorrowerType> acc = EnumSet.noneOf(Enums.LibraryBorrowerType.class);
            for (Object it : list) {
                if (it instanceof String s) {
                    try {
                        acc.add(Enums.LibraryBorrowerType.valueOf(s.trim().toUpperCase()));
                    } catch (IllegalArgumentException ignored) {
                        // ignore unknown type values
                    }
                }
            }
            return acc.isEmpty() ? EnumSet.copyOf(DEFAULT_ALLOWED) : acc;
        } catch (Exception e) {
            return EnumSet.copyOf(DEFAULT_ALLOWED);
        }
    }
}
