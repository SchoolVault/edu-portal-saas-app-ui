package com.school.erp.modules.student.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.student.dto.StudentDTOs;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import com.school.erp.tenant.TenantContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;

    @Transactional(readOnly = true)
    public PageResponse<StudentDTOs.Response> getStudents(int page, int size, Long classId,
                                                           Enums.StudentStatus status, String search, String sortBy, String direction) {
        String tenantId = TenantContext.getTenantId();
        Sort sort = Sort.by(Sort.Direction.fromString(direction != null ? direction : "asc"), sortBy != null ? sortBy : "firstName");
        Page<Student> result = studentRepository.findByFilters(tenantId, classId, status, search, PageRequest.of(page, size, sort));
        List<StudentDTOs.Response> content = result.getContent().stream().map(this::toResponse).collect(Collectors.toList());
        return PageResponse.of(content, page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public StudentDTOs.Response getStudentById(Long id) {
        Student student = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        return toResponse(student);
    }

    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClass(Long classId) {
        return studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(TenantContext.getTenantId(), classId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudentDTOs.Response> getStudentsByClassAndSection(Long classId, Long sectionId) {
        return studentRepository.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(TenantContext.getTenantId(), classId, sectionId)
                .stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public StudentDTOs.Response createStudent(StudentDTOs.CreateRequest request) {
        String tenantId = TenantContext.getTenantId();
        String admNo = request.getAdmissionNumber();
        if (admNo == null || admNo.isBlank()) {
            admNo = "ADM" + System.currentTimeMillis();
        }
        if (studentRepository.existsByTenantIdAndAdmissionNumber(tenantId, admNo)) {
            throw new DuplicateResourceException("Admission number already exists: " + admNo);
        }

        Student student = Student.builder()
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .classId(request.getClassId())
                .sectionId(request.getSectionId())
                .rollNumber(request.getRollNumber())
                .admissionNumber(admNo)
                .admissionDate(request.getAdmissionDate() != null ? request.getAdmissionDate() : LocalDate.now())
                .parentId(request.getParentId())
                .parentName(request.getParentName())
                .address(request.getAddress())
                .bloodGroup(request.getBloodGroup())
                .status(Enums.StudentStatus.ACTIVE)
                .build();
        student.setTenantId(tenantId);
        student.setCreatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);

        studentRepository.save(student);
        log.info("Student created: {} {} [{}]", student.getFirstName(), student.getLastName(), student.getAdmissionNumber());
        return toResponse(student);
    }

    @Transactional
    public StudentDTOs.Response updateStudent(Long id, StudentDTOs.UpdateRequest request) {
        Student student = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));

        if (request.getFirstName() != null) student.setFirstName(request.getFirstName());
        if (request.getLastName() != null) student.setLastName(request.getLastName());
        if (request.getEmail() != null) student.setEmail(request.getEmail());
        if (request.getPhone() != null) student.setPhone(request.getPhone());
        if (request.getDateOfBirth() != null) student.setDateOfBirth(request.getDateOfBirth());
        if (request.getGender() != null) student.setGender(request.getGender());
        if (request.getClassId() != null) student.setClassId(request.getClassId());
        if (request.getSectionId() != null) student.setSectionId(request.getSectionId());
        if (request.getRollNumber() != null) student.setRollNumber(request.getRollNumber());
        if (request.getParentId() != null) student.setParentId(request.getParentId());
        if (request.getParentName() != null) student.setParentName(request.getParentName());
        if (request.getAddress() != null) student.setAddress(request.getAddress());
        if (request.getBloodGroup() != null) student.setBloodGroup(request.getBloodGroup());
        if (request.getStatus() != null) student.setStatus(request.getStatus());
        student.setUpdatedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : null);

        studentRepository.save(student);
        return toResponse(student);
    }

    @Transactional
    public void deleteStudent(Long id) {
        Student student = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", id));
        student.setIsDeleted(true);
        studentRepository.save(student);
        log.info("Student soft-deleted: {}", id);
    }

    @Transactional
    public List<StudentDTOs.Response> bulkCreate(StudentDTOs.BulkUploadRequest request) {
        return request.getStudents().stream().map(this::createStudent).collect(Collectors.toList());
    }

    @Transactional
    public int promoteStudents(StudentDTOs.PromotionRequest request) {
        String tenantId = TenantContext.getTenantId();
        List<Student> students;
        if (request.getStudentIds() != null && !request.getStudentIds().isEmpty()) {
            students = studentRepository.findAllById(request.getStudentIds()).stream()
                    .filter(s -> s.getTenantId().equals(tenantId) && !s.getIsDeleted())
                    .collect(Collectors.toList());
        } else {
            students = studentRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, request.getFromClassId());
        }
        students.forEach(s -> {
            s.setClassId(request.getToClassId());
            s.setSectionId(null); // Reset section - to be reassigned
        });
        studentRepository.saveAll(students);
        log.info("Promoted {} students from class {} to class {}", students.size(), request.getFromClassId(), request.getToClassId());
        return students.size();
    }

    public long countStudents() {
        return studentRepository.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
    }

    private StudentDTOs.Response toResponse(Student s) {
        return StudentDTOs.Response.builder()
                .id(s.getId()).firstName(s.getFirstName()).lastName(s.getLastName())
                .email(s.getEmail()).phone(s.getPhone())
                .dateOfBirth(s.getDateOfBirth()).gender(s.getGender() != null ? s.getGender().name().toLowerCase() : null)
                .classId(s.getClassId()).sectionId(s.getSectionId())
                .rollNumber(s.getRollNumber()).admissionNumber(s.getAdmissionNumber())
                .admissionDate(s.getAdmissionDate()).parentId(s.getParentId()).parentName(s.getParentName())
                .address(s.getAddress()).bloodGroup(s.getBloodGroup()).avatar(s.getAvatar())
                .status(s.getStatus() != null ? s.getStatus().name().toLowerCase() : "active")
                .tenantId(s.getTenantId())
                .build();
    }
}
