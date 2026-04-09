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
        Page<Teacher> result = repo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId(), PageRequest.of(page, size, Sort.by("firstName")));
        return PageResponse.of(result.getContent().stream().map(this::toRes).collect(Collectors.toList()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public TeacherDTOs.Response getById(Long id) {
        return toRes(repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Teacher", id)));
    }

    @Transactional
    public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
        Teacher t = Teacher.builder().firstName(req.getFirstName()).lastName(req.getLastName()).email(req.getEmail()).phone(req.getPhone()).qualification(req.getQualification()).specialization(req.getSpecialization()).joinDate(req.getJoinDate()).salary(req.getSalary()).subjects(req.getSubjects()).status(Enums.TeacherStatus.ACTIVE).build();
        t.setTenantId(TenantContext.getTenantId());
        repo.save(t);
        return toRes(t);
    }

    @Transactional
    public TeacherDTOs.Response update(Long id, TeacherDTOs.UpdateRequest req) {
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
        return toRes(t);
    }

    @Transactional
    public void delete(Long id) {
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId()).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        t.setIsDeleted(true);
        repo.save(t);
    }

    @Transactional
    public List<TeacherDTOs.Response> importFromZip(MultipartFile file) {
        return ZipCsvImportUtil.readRows(file, "teachers.csv").stream().map(row -> {
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
    }

    public long count() {
        return repo.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
    }

    private TeacherDTOs.Response toRes(Teacher t) {
        return TeacherDTOs.Response.builder().id(t.getId()).firstName(t.getFirstName()).lastName(t.getLastName()).email(t.getEmail()).phone(t.getPhone()).qualification(t.getQualification()).specialization(t.getSpecialization()).joinDate(t.getJoinDate()).salary(t.getSalary()).status(t.getStatus() != null ? t.getStatus().name().toLowerCase() : "active").subjects(t.getSubjects()).avatar(t.getAvatar()).tenantId(t.getTenantId()).build();
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
