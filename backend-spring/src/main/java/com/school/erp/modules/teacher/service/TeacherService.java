package com.school.erp.modules.teacher.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TeacherService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TeacherService.class);
    private final TeacherRepository repo;
    private final SchoolClassRepository schoolClassRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;

    @Transactional(readOnly = true)
    public PageResponse<TeacherDTOs.Response> getTeachers(int page, int size) {
        String tenantId = TenantContext.getTenantId();
        log.debug("Listing teachers page={} size={}", page, size);
        Page<Teacher> result = repo.findByTenantIdAndIsDeletedFalse(tenantId, PageRequest.of(page, size, Sort.by("firstName")));
        log.info("Teachers page loaded page={} returned={} total={}", page, result.getNumberOfElements(), result.getTotalElements());
        return PageResponse.of(result.getContent().stream().map(this::toRes).collect(Collectors.toList()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public TeacherDTOs.Response getById(Long id) {
        log.debug("Fetching teacher id={}", id);
        TeacherDTOs.Response r = toRes(repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Teacher", id)));
        log.info("Teacher loaded id={}", id);
        return r;
    }

    @Transactional
    public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
        log.info("Creating teacher email={}", req.getEmail());
        Teacher t = Teacher.builder().firstName(req.getFirstName()).lastName(req.getLastName()).email(req.getEmail()).phone(req.getPhone()).qualification(req.getQualification()).specialization(req.getSpecialization()).joinDate(req.getJoinDate()).salary(req.getSalary()).subjects(req.getSubjects()).status(Enums.TeacherStatus.ACTIVE).build();
        t.setTenantId(TenantContext.getTenantId());
        repo.save(t);
        log.info("Teacher created id={}", t.getId());
        return toRes(t);
    }

    /**
     * Bulk import path: optional portal user (teacher or library staff) linked to {@code teachers.user_id}.
     */
    @Transactional
    public TeacherDTOs.Response createForBulkImport(TeacherDTOs.CreateRequest req, boolean createPortal,
                                                     Enums.Role portalRole, Enums.LibraryStaffRole libraryStaffRole) {
        String tenantId = TenantContext.getTenantId();
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : null;
        if (email == null || email.isBlank()) {
            throw new com.school.erp.common.exception.BusinessException("Teacher email is required");
        }
        if (repo.existsByTenantIdAndEmailAndIsDeletedFalse(tenantId, email)) {
            throw new DuplicateResourceException("Teacher email already exists: " + email);
        }
        Teacher t = Teacher.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(email)
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joinDate(req.getJoinDate())
                .salary(req.getSalary())
                .subjects(req.getSubjects() != null ? req.getSubjects() : List.of())
                .status(Enums.TeacherStatus.ACTIVE)
                .build();
        if (libraryStaffRole != null) {
            t.setLibraryStaffRole(libraryStaffRole);
        }
        t.setTenantId(tenantId);
        repo.save(t);
        if (createPortal) {
            String display = req.getFirstName() + " " + req.getLastName();
            PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUser(
                    tenantId, email, display.trim(), req.getPhone(), portalRole);
            t.setUserId(pr.userId());
            repo.save(t);
        }
        log.info("Teacher bulk row created id={} portalLinked={}", t.getId(), createPortal);
        return toRes(t);
    }

    @Transactional
    public TeacherDTOs.Response update(Long id, TeacherDTOs.UpdateRequest req) {
        log.info("Updating teacher id={}", id);
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        if (req.getFirstName() != null) t.setFirstName(req.getFirstName());
        if (req.getLastName() != null) t.setLastName(req.getLastName());
        if (req.getEmail() != null) t.setEmail(req.getEmail());
        if (req.getPhone() != null) t.setPhone(req.getPhone());
        if (req.getQualification() != null) t.setQualification(req.getQualification());
        if (req.getSpecialization() != null) t.setSpecialization(req.getSpecialization());
        if (req.getSalary() != null) t.setSalary(req.getSalary());
        if (req.getSubjects() != null) t.setSubjects(req.getSubjects());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            try {
                Enums.TeacherStatus next = Enums.TeacherStatus.valueOf(req.getStatus().trim().toUpperCase(Locale.ROOT));
                t.setStatus(next);
                if (next == Enums.TeacherStatus.INACTIVE || next == Enums.TeacherStatus.RESIGNED) {
                    clearHomeroomForTeacher(t.getId(), TenantContext.getTenantId());
                }
            } catch (IllegalArgumentException ex) {
                log.warn("Ignoring invalid teacher status on update id={} status={}", id, req.getStatus());
            }
        }
        repo.save(t);
        log.info("Teacher updated id={}", id);
        return toRes(t);
    }

    @Transactional
    public void delete(Long id) {
        log.warn("Soft-deleting teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        clearHomeroomForTeacher(id, tenantId);
        t.setIsDeleted(true);
        repo.save(t);
        log.info("Teacher soft-deleted id={}", id);
    }

    private void clearHomeroomForTeacher(Long teacherPk, String tenantId) {
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            c.setClassTeacherId(null);
            c.setClassTeacherName(null);
            schoolClassRepository.save(c);
            log.info("Cleared homeroom for classId={} after teacher change teacherPk={}", c.getId(), teacherPk);
        }
    }

    @Transactional
    public List<TeacherDTOs.Response> importFromZip(MultipartFile file) {
        log.info("Importing teachers from zip teachers.csv");
        List<TeacherDTOs.Response> imported = ZipCsvImportUtil.readRows(file, "teachers.csv").stream().map(row -> {
            TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
            request.setFirstName(required(row, "firstname"));
            request.setLastName(required(row, "lastname"));
            request.setEmail(required(row, "email"));
            request.setPhone(blankToNull(row.get("phone")));
            request.setQualification(blankToNull(row.get("qualification")));
            request.setSpecialization(blankToNull(row.get("specialization")));
            request.setJoinDate(parseDate(row.get("joindate")));
            request.setSalary(parseDecimal(row.get("salary")));
            request.setSubjects(parseSubjects(row.get("subjects")));
            return create(request);
        }).collect(Collectors.toList());
        log.info("Teacher import finished count={}", imported.size());
        return imported;
    }

    public long count() {
        long n = repo.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        log.debug("Teacher count tenant={} n={}", TenantContext.getTenantId(), n);
        return n;
    }

    /** CSV aligned with bulk import template ({@code teachers.csv} / {@code staff.csv}). */
    @Transactional(readOnly = true)
    public String exportTeachersAsCsv() {
        String tenantId = TenantContext.getTenantId();
        StringBuilder sb = new StringBuilder();
        sb.append("firstname,lastname,email,phone,qualification,specialization,joindate,salary,subjects,createportal,portalrole,libraryrole\n");
        for (Teacher t : repo.findByTenantIdAndIsDeletedFalse(tenantId)) {
            sb.append(csv(t.getFirstName())).append(',');
            sb.append(csv(t.getLastName())).append(',');
            sb.append(csv(t.getEmail())).append(',');
            sb.append(csv(t.getPhone())).append(',');
            sb.append(csv(t.getQualification())).append(',');
            sb.append(csv(t.getSpecialization())).append(',');
            sb.append(t.getJoinDate() != null ? t.getJoinDate() : "").append(',');
            sb.append(t.getSalary() != null ? t.getSalary().toPlainString() : "").append(',');
            sb.append(csv(t.getSubjects() != null ? String.join("|", t.getSubjects()) : "")).append(',');
            sb.append(t.getUserId() != null ? "Y" : "N").append(',');
            if (t.getLibraryStaffRole() != null) {
                sb.append("LIBRARY_STAFF");
            } else {
                sb.append("TEACHER");
            }
            sb.append(',');
            sb.append(t.getLibraryStaffRole() != null ? t.getLibraryStaffRole().name() : "").append('\n');
        }
        return sb.toString();
    }

    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        String x = v.replace("\"", "\"\"");
        if (x.contains(",") || x.contains("\n") || x.contains("\"")) {
            return "\"" + x + "\"";
        }
        return x;
    }

    private TeacherDTOs.Response toRes(Teacher t) {
        TeacherDTOs.Response r = TeacherDTOs.Response.builder().id(t.getId()).firstName(t.getFirstName()).lastName(t.getLastName()).email(t.getEmail()).phone(t.getPhone()).qualification(t.getQualification()).specialization(t.getSpecialization()).joinDate(t.getJoinDate()).salary(t.getSalary()).status(t.getStatus() != null ? t.getStatus().name().toLowerCase() : "active").subjects(t.getSubjects()).avatar(t.getAvatar()).tenantId(t.getTenantId()).build();
        r.setUserId(t.getUserId());
        if (t.getLibraryStaffRole() != null) {
            r.setLibraryStaffRole(t.getLibraryStaffRole().name().toLowerCase());
        }
        return r;
    }

    public TeacherService(final TeacherRepository repo,
                          final SchoolClassRepository schoolClassRepository,
                          final PortalUserProvisioningService portalUserProvisioningService) {
        this.repo = repo;
        this.schoolClassRepository = schoolClassRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
    }

    private String required(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new com.school.erp.common.exception.BusinessException("Missing required column value: " + key);
        }
        return value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private java.time.LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? java.time.LocalDate.parse(normalized) : null;
    }

    private BigDecimal parseDecimal(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? new BigDecimal(normalized) : null;
    }

    private List<String> parseSubjects(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return List.of();
        }
        return java.util.Arrays.stream(normalized.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toList());
    }
}
