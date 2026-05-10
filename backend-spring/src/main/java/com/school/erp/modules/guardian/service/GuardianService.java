package com.school.erp.modules.guardian.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.common.util.PhoneNormalization;
import com.school.erp.modules.guardian.dto.GuardianDTOs;
import com.school.erp.modules.guardian.entity.Guardian;
import com.school.erp.modules.guardian.entity.StudentGuardianMapping;
import com.school.erp.modules.guardian.repository.GuardianRepository;
import com.school.erp.modules.guardian.repository.StudentGuardianMappingRepository;
import com.school.erp.modules.guardian.support.GuardianContactExtractor;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class GuardianService {

    private static final Logger log = LoggerFactory.getLogger(GuardianService.class);

    private final GuardianRepository guardianRepository;
    private final StudentGuardianMappingRepository mappingRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

    public GuardianService(
            GuardianRepository guardianRepository,
            StudentGuardianMappingRepository mappingRepository,
            StudentRepository studentRepository,
            ObjectMapper objectMapper) {
        this.guardianRepository = guardianRepository;
        this.mappingRepository = mappingRepository;
        this.studentRepository = studentRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Students visible to a parent user: legacy {@link Student#getParentId()} plus guardians linked to the same user id.
     */
    @Transactional(readOnly = true)
    public List<Student> findStudentsForParentUser(String tenantId, Long parentUserId) {
        log.debug("Attempting to resolve students for parent user tenantId={} parentUserId={}", tenantId, parentUserId);
        Map<Long, Student> byId = new LinkedHashMap<>();
        studentRepository.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentUserId).forEach(s -> byId.put(s.getId(), s));
        List<Long> mappedStudentIds =
                mappingRepository.findStudentIdsLinkedToGuardianUser(tenantId, parentUserId);
        if (!mappedStudentIds.isEmpty()) {
            studentRepository.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, mappedStudentIds).forEach(s -> byId.put(s.getId(), s));
        }
        List<Student> out = new ArrayList<>(byId.values());
        log.info("Resolved {} student(s) for parent user {} (tenant={})", out.size(), parentUserId, tenantId);
        return out;
    }

    @Transactional(readOnly = true)
    public boolean guardianUserHasAccessToStudent(String tenantId, Long parentUserId, Long studentId) {
        log.debug("Checking guardian access tenantId={} parentUserId={} studentId={}", tenantId, parentUserId, studentId);
        boolean ok = studentRepository
                .findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .map(s -> parentUserId.equals(s.getParentId()))
                .orElse(false)
                || mappingRepository.existsActiveLinkForStudentAndGuardianUser(
                        tenantId, studentId, parentUserId, LocalDate.now());
        if (!ok) {
            log.warn("Guardian access denied tenantId={} parentUserId={} studentId={}", tenantId, parentUserId, studentId);
        } else {
            log.debug("Guardian access granted tenantId={} parentUserId={} studentId={}", tenantId, parentUserId, studentId);
        }
        return ok;
    }

    @Transactional(readOnly = true)
    public List<GuardianDTOs.GuardianResponse> searchByPhone(String phone) {
        if (phone == null || phone.isBlank()) {
            log.debug("Guardian search skipped: blank phone");
            return List.of();
        }
        String t = TenantContext.getTenantId();
        List<String> keys = InternationalPhone.portalPhoneLookupKeys(phone.trim());
        if (keys.isEmpty()) {
            log.debug("Guardian search skipped: no lookup keys for input");
            return List.of();
        }
        log.debug("Searching guardians by phone keys (tenant={}, keyCount={})", t, keys.size());
        List<GuardianDTOs.GuardianResponse> list = guardianRepository
                .findByTenantIdAndPrimaryPhoneInAndIsDeletedFalse(t, keys)
                .stream()
                .map(this::toGuardianResponse)
                .toList();
        log.info("Guardian phone search tenant={} matches={}", t, list.size());
        return list;
    }

    @Transactional(readOnly = true)
    public GuardianDTOs.GuardianResponse getById(Long id) {
        log.debug("Fetching guardian by id={}", id);
        Guardian g =
                guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Guardian", id));
        log.info("Loaded guardian id={}", id);
        return toGuardianResponse(g);
    }

    @Transactional
    public GuardianDTOs.GuardianResponse create(GuardianDTOs.CreateGuardianRequest req) {
        log.info("Creating guardian primaryPhonePresent={}", req.getPrimaryPhone() != null);
        Guardian g = new Guardian();
        g.setTenantId(TenantContext.getTenantId());
        applyCreate(g, req);
        GuardianDTOs.GuardianResponse saved = toGuardianResponse(guardianRepository.save(g));
        log.info("Created guardian id={}", saved.getId());
        return saved;
    }

    @Transactional
    public GuardianDTOs.GuardianResponse update(Long id, GuardianDTOs.UpdateGuardianRequest req) {
        log.info("Updating guardian id={}", id);
        Guardian g =
                guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Guardian", id));
        if (req.getFullName() != null) {
            g.setFullName(req.getFullName());
        }
        if (req.getOccupation() != null) {
            g.setOccupation(req.getOccupation());
        }
        if (req.getPrimaryPhone() != null) {
            String raw = req.getPrimaryPhone().trim();
            if (raw.isEmpty()) {
                g.setPrimaryPhone(null);
                if (req.getPhonesJson() == null) {
                    g.setPhonesJson(null);
                }
            } else {
                String resolved = normalizePrimaryPhoneForStorage(raw);
                assertHandsetUniqueAmongGuardians(g.getTenantId(), id, resolved);
                g.setPrimaryPhone(resolved);
                if (req.getPhonesJson() == null) {
                    applyDefaultPhonesJson(g, resolved);
                }
            }
        }
        if (req.getPhonesJson() != null) {
            g.setPhonesJson(req.getPhonesJson().isBlank() ? null : req.getPhonesJson());
        }
        if (req.getEmailsJson() != null) {
            g.setEmailsJson(req.getEmailsJson());
        }
        if (req.getUserId() != null) {
            g.setUserId(req.getUserId());
        }
        if (req.getAttributesJson() != null) {
            g.setAttributesJson(req.getAttributesJson());
        }
        GuardianDTOs.GuardianResponse updated = toGuardianResponse(guardianRepository.save(g));
        log.info("Updated guardian id={}", id);
        return updated;
    }

    @Transactional(readOnly = true)
    public List<GuardianDTOs.MappingResponse> listMappingsForStudent(Long studentId) {
        String t = TenantContext.getTenantId();
        log.debug("Listing guardian mappings for studentId={}", studentId);
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        List<StudentGuardianMapping> list = mappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(t, studentId);
        List<GuardianDTOs.MappingResponse> out = new ArrayList<>();
        for (StudentGuardianMapping m : list) {
            GuardianDTOs.MappingResponse r = toMappingResponse(m);
            guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(m.getGuardianId(), t).ifPresent(g -> {
                r.setGuardianName(g.getFullName());
                r.setPrimaryPhone(g.getPrimaryPhone());
                r.setOccupation(g.getOccupation());
                enrichMappingFromGuardianRow(r, g);
            });
            out.add(r);
        }
        log.info("Listed {} guardian mapping(s) for studentId={}", out.size(), studentId);
        return out;
    }

    @Transactional
    public GuardianDTOs.MappingResponse addMapping(Long studentId, GuardianDTOs.CreateMappingRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Adding guardian mapping studentId={} guardianId={}", studentId, req.getGuardianId());
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(req.getGuardianId(), t).orElseThrow(() -> new ResourceNotFoundException("Guardian", req.getGuardianId()));

        if (mappingRepository.existsByTenantIdAndStudentIdAndGuardianIdAndIsDeletedFalse(t, studentId, req.getGuardianId())) {
            throw new DuplicateResourceException("This guardian is already linked to this student");
        }

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
        guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(saved.getGuardianId(), t).ifPresent(g -> {
            r.setGuardianName(g.getFullName());
            r.setPrimaryPhone(g.getPrimaryPhone());
            r.setOccupation(g.getOccupation());
            enrichMappingFromGuardianRow(r, g);
        });
        log.info("Saved guardian mapping id={} studentId={}", saved.getId(), studentId);
        return r;
    }

    @Transactional
    public GuardianDTOs.MappingResponse updateMapping(Long studentId, Long mappingId, GuardianDTOs.UpdateMappingRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Updating guardian mapping id={} for studentId={}", mappingId, studentId);
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        StudentGuardianMapping mapping = mappingRepository
                .findByIdAndTenantIdAndStudentIdAndIsDeletedFalse(mappingId, t, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGuardianMapping", mappingId));

        if (req.getRelationType() != null) {
            mapping.setRelationType(req.getRelationType());
        }
        if (req.getIsPrimary() != null) {
            mapping.setIsPrimary(req.getIsPrimary());
        }
        if (req.getIsEmergencyContact() != null) {
            mapping.setIsEmergencyContact(req.getIsEmergencyContact());
        }
        if (req.getCustodyType() != null) {
            mapping.setCustodyType(req.getCustodyType());
        }
        if (req.getEffectiveFrom() != null) {
            mapping.setEffectiveFrom(req.getEffectiveFrom());
        }
        if (req.getEffectiveTo() != null) {
            mapping.setEffectiveTo(req.getEffectiveTo());
        }

        StudentGuardianMapping saved = mappingRepository.save(mapping);
        if (Boolean.TRUE.equals(saved.getIsPrimary())) {
            List<StudentGuardianMapping> all = mappingRepository.findByTenantIdAndStudentIdAndIsDeletedFalse(t, studentId);
            for (StudentGuardianMapping row : all) {
                if (!row.getId().equals(saved.getId()) && Boolean.TRUE.equals(row.getIsPrimary())) {
                    row.setIsPrimary(false);
                    mappingRepository.save(row);
                }
            }
            studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, t).ifPresent(st -> {
                st.setPrimaryContactGuardianId(saved.getGuardianId());
                studentRepository.save(st);
            });
        }

        GuardianDTOs.MappingResponse r = toMappingResponse(saved);
        guardianRepository.findByIdAndTenantIdAndIsDeletedFalse(saved.getGuardianId(), t).ifPresent(g -> {
            r.setGuardianName(g.getFullName());
            r.setPrimaryPhone(g.getPrimaryPhone());
            r.setOccupation(g.getOccupation());
            enrichMappingFromGuardianRow(r, g);
        });
        log.info("Updated guardian mapping id={} for studentId={}", mappingId, studentId);
        return r;
    }

    @Transactional
    public void removeMapping(Long studentId, Long mappingId) {
        String tenantId = TenantContext.getTenantId();
        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", studentId));
        StudentGuardianMapping mapping = mappingRepository
                .findByIdAndTenantIdAndStudentIdAndIsDeletedFalse(mappingId, tenantId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("StudentGuardianMapping", mappingId));
        Long removedGuardianId = mapping.getGuardianId();
        mapping.setIsDeleted(true);
        mapping.setIsActive(false);
        mappingRepository.save(mapping);

        studentRepository.findByIdAndTenantIdAndIsDeletedFalse(studentId, tenantId).ifPresent(student -> {
            if (student.getPrimaryContactGuardianId() != null && student.getPrimaryContactGuardianId().equals(removedGuardianId)) {
                StudentGuardianMapping fallbackPrimary = mappingRepository
                        .findByTenantIdAndStudentIdAndIsDeletedFalse(tenantId, studentId)
                        .stream()
                        .findFirst()
                        .orElse(null);
                student.setPrimaryContactGuardianId(fallbackPrimary != null ? fallbackPrimary.getGuardianId() : null);
                studentRepository.save(student);
            }
        });
    }

    private void applyCreate(Guardian g, GuardianDTOs.CreateGuardianRequest req) {
        g.setFullName(req.getFullName());
        g.setOccupation(req.getOccupation());
        String tenantId = g.getTenantId();
        String resolved = normalizePrimaryPhoneForStorage(req.getPrimaryPhone());
        assertHandsetUniqueAmongGuardians(tenantId, null, resolved);
        g.setPrimaryPhone(resolved);
        if (req.getPhonesJson() != null && !req.getPhonesJson().isBlank()) {
            g.setPhonesJson(req.getPhonesJson());
        } else {
            applyDefaultPhonesJson(g, resolved);
        }
        g.setEmailsJson(req.getEmailsJson());
        g.setUserId(req.getUserId());
        g.setAttributesJson(req.getAttributesJson());
    }

    /**
     * {@code null} = no phone; {@code UNLINKED_*} = portal placeholder; else strict India mobile national 10 digits.
     */
    private static String normalizePrimaryPhoneForStorage(String raw) {
        String t = PhoneNormalization.trimToNull(raw);
        if (t == null) {
            return null;
        }
        if (t.startsWith("UNLINKED_")) {
            return t;
        }
        String national = InternationalPhone.nationalIndiaMobile10(t);
        if (national == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        return national;
    }

    private void assertHandsetUniqueAmongGuardians(String tenantId, Long excludeGuardianId, String storedPrimary) {
        if (storedPrimary == null || storedPrimary.startsWith("UNLINKED_")) {
            return;
        }
        List<String> keys = InternationalPhone.portalPhoneLookupKeys(storedPrimary);
        if (keys.isEmpty()) {
            return;
        }
        for (Guardian other : guardianRepository.findByTenantIdAndPrimaryPhoneInAndIsDeletedFalse(tenantId, keys)) {
            if (excludeGuardianId != null && other.getId().equals(excludeGuardianId)) {
                continue;
            }
            throw new DuplicateResourceException("A guardian with this mobile number already exists in this school");
        }
    }

    private void applyDefaultPhonesJson(Guardian g, String resolvedPrimary) {
        if (resolvedPrimary == null || resolvedPrimary.startsWith("UNLINKED_")) {
            g.setPhonesJson(null);
            return;
        }
        try {
            g.setPhonesJson(objectMapper.writeValueAsString(List.of(resolvedPrimary)));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("guardian phones_json", e);
        }
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

    private void enrichMappingFromGuardianRow(GuardianDTOs.MappingResponse r, Guardian g) {
        boolean linked = g.getUserId() != null && g.getUserId() > 0;
        r.setParentPortalLinked(linked);
        r.setEmail(GuardianContactExtractor.firstEmail(g.getEmailsJson(), objectMapper));
        r.setAdditionalPhones(GuardianContactExtractor.additionalPhones(g.getPhonesJson(), g.getPrimaryPhone(), objectMapper));
    }
}
