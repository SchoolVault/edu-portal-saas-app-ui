package com.school.erp.modules.student.port;

import com.school.erp.common.enums.Enums;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Component
public class StudentPersistenceJpaAdapter implements StudentPersistencePort {

    private final StudentRepository delegate;

    public StudentPersistenceJpaAdapter(StudentRepository delegate) {
        this.delegate = delegate;
    }

    @Override
    public Page<Student> findByTenantIdAndIsDeletedFalse(String tenantId, Pageable pageable) {
        return delegate.findByTenantIdAndIsDeletedFalse(tenantId, pageable);
    }

    @Override
    public List<Student> findByTenantIdAndIsDeletedFalse(String tenantId) {
        return delegate.findByTenantIdAndIsDeletedFalse(tenantId);
    }

    @Override
    public Optional<Student> findByIdAndTenantIdAndIsDeletedFalse(Long id, String tenantId) {
        return delegate.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId);
    }

    @Override
    public List<Student> findByTenantIdAndClassIdAndIsDeletedFalse(String tenantId, Long classId) {
        return delegate.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, classId);
    }

    @Override
    public List<Student> findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(String tenantId, Long classId, Long sectionId) {
        return delegate.findByTenantIdAndClassIdAndSectionIdAndIsDeletedFalse(tenantId, classId, sectionId);
    }

    @Override
    public List<Student> findByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId) {
        return delegate.findByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentId);
    }

    @Override
    public long countByTenantIdAndParentIdAndIsDeletedFalse(String tenantId, Long parentId) {
        return delegate.countByTenantIdAndParentIdAndIsDeletedFalse(tenantId, parentId);
    }

    @Override
    public List<Student> findByTenantIdAndIdInAndIsDeletedFalse(String tenantId, List<Long> ids) {
        return delegate.findByTenantIdAndIdInAndIsDeletedFalse(tenantId, ids);
    }

    @Override
    public Page<Student> findByFilters(String tenantId, Long classId, Long sectionId, Enums.StudentStatus status, String search, Pageable pageable) {
        return delegate.findByFilters(tenantId, classId, sectionId, status, search, pageable);
    }

    @Override
    public Page<Student> findByFiltersClassScope(String tenantId, Collection<Long> classIds, Long classId, Long sectionId, Enums.StudentStatus status, String search, Pageable pageable) {
        return delegate.findByFiltersClassScope(tenantId, classIds, classId, sectionId, status, search, pageable);
    }

    @Override
    public long countByTenantIdAndIsDeletedFalse(String tenantId) {
        return delegate.countByTenantIdAndIsDeletedFalse(tenantId);
    }

    @Override
    public boolean existsByTenantIdAndAdmissionNumber(String tenantId, String admissionNumber) {
        return delegate.existsByTenantIdAndAdmissionNumber(tenantId, admissionNumber);
    }

    @Override
    public Student save(Student student) {
        return delegate.save(student);
    }

    @Override
    public List<Student> saveAll(Iterable<Student> students) {
        return delegate.saveAll(students);
    }

    @Override
    public List<Student> findAllById(Iterable<Long> ids) {
        return delegate.findAllById(ids);
    }
}
