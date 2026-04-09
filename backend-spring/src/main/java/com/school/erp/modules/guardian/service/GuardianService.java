package com.school.erp.modules.guardian.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.guardian.dto.GuardianDTOs;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import com.school.erp.modules.guardian.repository.StudentGuardianMappingRepository;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GuardianService {

    private final GuardianRepository guardianRepository;
    private final StudentGuardianMappingRepository mappingRepository;
    private final StudentRepository studentRepository;

    public GuardianService(
            GuardianRepository guardianRepository,
            StudentGuardianMappingRepository mappingRepository,
            StudentRepository studentRepository) {
        this.guardianRepository = guardianRepository;
        this.mappingRepository = mappingRepository;
        this.studentRepository = studentRepository;
    }

    /**
     * Students visible to a parent user: legacy {@link Student#getParentId()} plus guardians linked to the same user id.
     */
    @Transactional(readOnly = true)
    public List<Student> findStudentsForParentUser(String tenantId, Long parentUserId) {
        Map<Long, Student> byId = new LinkedHashMap<>();
        studentRepository.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentUserId).forEach(s -> byId.put(s.getId(), s));
        List<Long> mappedStudentIds =
                mappingRepository.findStudentIdsLinkedToGuardianUser(tenantId, parentUserId, LocalDate.now());
        if (!mappedStudentIds.isEmpty()) {
            studentRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, mappedStudentIds).forEach(s -> byId.put(s.getId(), s));
        }
        return new ArrayList<>(byId.values());
    }

    @Transactional(readOnly = true)
    public boolean guardianUserHasAccessToStudent(String tenantId, Long parentUserId, Long studentId) {
        return studentRepository
                .findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .map(s -> parentUserId.equals(s.getParentId()))
                .orElse(false)
                || mappingRepository.existsActiveLinkForStudentAndGuardianUser(
                        tenantId, studentId, parentUserId, LocalDate.now());
    }

    @Transactional(readOnly = true)
    public List<GuardianDTOs.GuardianResponse> searchByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            return List.of();
        }
        String t = TenantContext.getTenantId();
        String normalized = phone.trim();
        return guardianRepository.findByTenantIdAndPrimaryPhoneAndIsDeletedFalse(t, normalized).stream()
                .map(this::toGuardianResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public GuardianDTOs.GuardianResponse getById(Long id) {
        Guardian g =
                guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Guardian", id));
        return toGuardianResponse(g);
    }

    @Transactional
    public GuardianDTOs.GuardianResponse create(GuardianDTOs.CreateGuardianRequest req) {
        Guardian g = new Guardian();
        g.setTenantId(TenantContext.getTenantId());
        applyCreate(g, req);
        return toGuardianResponse(guardianRepository.save(g));
    }

    @Transactional
    public GuardianDTOs.GuardianResponse update(Long id, GuardianDTOs.UpdateGuardianRequest req) {
        Guardian g =
                guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Guardian", id));
        if (req.getFullName() != null) g.setFullName(req.getFullName());
        if (req.getOccupation() != null) g.setOccupation(req.getOccupation());
        if (req.getPrimaryPhone() != null) g.setPrimaryPhone(req.getPrimaryPhone());
        if (req.getPhonesJson() != null) g.setPhonesJson(req.getPhonesJson());
        if (req.getEmailsJson() != null) g.setEmailsJson(req.getEmailsJson());
        if (req.getUserId() != null) g.setUserId(req.getUserId());
        if (req.getAttributesJson() != null) g.setAttributesJson(req.getAttributesJson());
        return toGuardianResponse(guardianRepository.save(g));
    }

    @Transactional(readOnly = true)
    public List<GuardianDTOs.MappingResponse> listMappingsForStudent(Long studentId) {
        String t = TenantContext.getTenantId();
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        List<StudentGuardianMapping> list = mappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(t, studentId);
        List<GuardianDTOs.MappingResponse> out = new ArrayList<>();
        for (StudentGuardianMapping m : list) {
            GuardianDTOs.MappingResponse r = toMappingResponse(m);
            guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(m.getGuardianId(), t).ifPresent(g -> r.setGuardianName(g.getFullName()));
            out.add(r);
        }
        return out;
    }

    @Transactional
    public GuardianDTOs.MappingResponse addMapping(Long studentId, GuardianDTOs.CreateMappingRequest req) {
        String t = TenantContext.getTenantId();
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getGuardianId(), t).orElseThrow(() -> new ResourceNotFoundException("Guardian", req.getGuardianId()));

        StudentGuardianMapping m = new StudentGuardianMapping();
        m.setTenantId(t);
        m.setStudentId(studentId);
        m.setGuardianId(req.getGuardianId());
        m.setRelationType(req.getRelationType());
        m.setIsPrimary(Boolean.TRUE.equals(req.getIsPrimary()));
        m.setIsEmergencyContact(Boolean.TRUE.equals(req.getIsEmergencyContact()));
        m.setCustodyType(req.getCustodyType());
        m.setEffectiveFrom(req.getEffectiveFrom() != null ? req.getEffectiveFrom() : LocalDate.now());
        m.setEffectiveTo(req.getEffectiveTo());
        StudentGuardianMapping saved = mappingRepository.save(m);

        if (Boolean.TRUE.equals(req.getIsPrimary())) {
            studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).ifPresent(st -> {
                st.setPrimaryContactGuardianId(req.getGuardianId());
                studentRepository.save(st);
            });
        }

        GuardianDTOs.MappingResponse r = toMappingResponse(saved);
        guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(saved.getGuardianId(), t).ifPresent(g -> r.setGuardianName(g.getFullName()));
        return r;
    }

    private void applyCreate(Guardian g, GuardianDTOs.CreateGuardianRequest req) {
        g.setFullName(req.getFullName());
        g.setOccupation(req.getOccupation());
        g.setPrimaryPhone(req.getPrimaryPhone());
        g.setPhonesJson(req.getPhonesJson());
        g.setEmailsJson(req.getEmailsJson());
        g.setUserId(req.getUserId());
        g.setAttributesJson(req.getAttributesJson());
    }

    private GuardianDTOs.GuardianResponse toGuardianResponse(Guardian g) {
        GuardianDTOs.GuardianResponse r = new GuardianDTOs.GuardianResponse();
        r.setId(g.getId());
        r.setFullName(g.getFullName());
        r.setOccupation(g.getOccupation());
        r.setPrimaryPhone(g.getPrimaryPhone());
        r.setPhonesJson(g.getPhonesJson());
        r.setEmailsJson(g.getEmailsJson());
        r.setUserId(g.getUserId());
        r.setAttributesJson(g.getAttributesJson());
        r.setTenantId(g.getTenantId());
        return r;
    }

    private GuardianDTOs.MappingResponse toMappingResponse(StudentGuardianMapping m) {
        GuardianDTOs.MappingResponse r = new GuardianDTOs.MappingResponse();
        r.setId(m.getId());
        r.setStudentId(m.getStudentId());
        r.setGuardianId(m.getGuardianId());
        r.setRelationType(m.getRelationType() != null ? m.getRelationType().name() : null);
        r.setIsPrimary(m.getIsPrimary());
        r.setIsEmergencyContact(m.getIsEmergencyContact());
        r.setCustodyType(m.getCustodyType());
        r.setEffectiveFrom(m.getEffectiveFrom());
        r.setEffectiveTo(m.getEffectiveTo());
        return r;
    }
}
