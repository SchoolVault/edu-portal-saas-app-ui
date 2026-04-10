package com.school.erp.modules.teacher.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.common.exception.ResourceNotFoundException;
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
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class TeacherService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TeacherService.class);
    private final TeacherRepository repo;

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
        repo.save(t);
        log.info("Teacher updated id={}", id);
        return toRes(t);
    }

    @Transactional
    public void delete(Long id) {
        log.warn("Soft-deleting teacher id={}", id);
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        t.setIsDeleted(true);
        repo.save(t);
        log.info("Teacher soft-deleted id={}", id);
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

    private TeacherDTOs.Response toRes(Teacher t) {
        TeacherDTOs.Response r = TeacherDTOs.Response.builder().id(t.getId()).firstName(t.getFirstName()).lastName(t.getLastName()).email(t.getEmail()).phone(t.getPhone()).qualification(t.getQualification()).specialization(t.getSpecialization()).joinDate(t.getJoinDate()).salary(t.getSalary()).status(t.getStatus() != null ? t.getStatus().name().toLowerCase() : "active").subjects(t.getSubjects()).avatar(t.getAvatar()).tenantId(t.getTenantId()).build();
        r.setUserId(t.getUserId());
        if (t.getLibraryStaffRole() != null) {
            r.setLibraryStaffRole(t.getLibraryStaffRole().name().toLowerCase());
        }
        return r;
    }

    public TeacherService(final TeacherRepository repo) {
        this.repo = repo;
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
