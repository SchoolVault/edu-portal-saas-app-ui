package com.school.erp.modules.lifecycle.service;

import com.school.erp.modules.academic.entity.AcademicYear;
import com.school.erp.modules.academic.repository.AcademicYearRepository;
import com.school.erp.modules.lifecycle.config.DataLifecycleProperties;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

/**
 * Classifies academic years as HOT, WARM, or COLD for indexing, cache, and archival flows.
 */
@Service
public class AcademicYearTemperatureService {

    public enum DataTemperature {
        HOT,
        WARM,
        COLD
    }

    private final AcademicYearRepository academicYearRepository;
    private final DataLifecycleProperties dataLifecycleProperties;

    public AcademicYearTemperatureService(
            AcademicYearRepository academicYearRepository,
            DataLifecycleProperties dataLifecycleProperties) {
        this.academicYearRepository = academicYearRepository;
        this.dataLifecycleProperties = dataLifecycleProperties;
    }

    public DataTemperature classify(String tenantId, Long academicYearId) {
        if (tenantId == null || tenantId.isBlank() || academicYearId == null) {
            return DataTemperature.HOT;
        }

        List<AcademicYear> orderedYears = academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .sorted(Comparator.comparing(AcademicYear::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();

        int targetIndex = -1;
        for (int i = 0; i < orderedYears.size(); i++) {
            if (academicYearId.equals(orderedYears.get(i).getId())) {
                targetIndex = i;
                break;
            }
        }
        if (targetIndex < 0) {
            return DataTemperature.HOT;
        }

        int hotWindow = Math.max(0, dataLifecycleProperties.getHotWindowYears());
        int warmWindow = Math.max(hotWindow, dataLifecycleProperties.getWarmWindowYears());

        if (targetIndex <= hotWindow) {
            return DataTemperature.HOT;
        }
        if (targetIndex <= warmWindow) {
            return DataTemperature.WARM;
        }
        return DataTemperature.COLD;
    }

    public boolean isArchiveCandidate(String tenantId, Long academicYearId) {
        if (tenantId == null || tenantId.isBlank() || academicYearId == null) {
            return false;
        }
        List<AcademicYear> orderedYears = academicYearRepository.findByTenantIdAndIsDeletedFalse(tenantId).stream()
                .sorted(Comparator.comparing(AcademicYear::getStartDate, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
        for (int i = 0; i < orderedYears.size(); i++) {
            if (academicYearId.equals(orderedYears.get(i).getId())) {
                return i >= Math.max(1, dataLifecycleProperties.getArchiveAfterYears());
            }
        }
        return false;
    }
}
