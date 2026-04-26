package com.school.erp.modules.library.borrower;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.modules.student.entity.Student;
import com.school.erp.modules.student.repository.StudentRepository;
import org.springframework.stereotype.Component;

@Component
public class StudentBorrowerResolver implements LibraryBorrowerResolver {
    private final StudentRepository studentRepository;

    public StudentBorrowerResolver(StudentRepository studentRepository) {
        this.studentRepository = studentRepository;
    }

    @Override
    public Enums.LibraryBorrowerType supportedType() {
        return Enums.LibraryBorrowerType.STUDENT;
    }

    @Override
    public ResolvedBorrower resolve(String tenantId, BorrowerResolutionRequest request) {
        if (request.borrowerRefId() == null) {
            throw new BusinessException("Student borrower reference id is required");
        }
        Student s = studentRepository.findByIdAndTenantIdAndIsDeletedFalse(request.borrowerRefId(), tenantId)
                .orElseThrow(() -> new BusinessException("Student borrower was not found in this school"));
        String canonicalName = ((s.getFirstName() == null ? "" : s.getFirstName().trim()) + " "
                + (s.getLastName() == null ? "" : s.getLastName().trim())).trim();
        if (canonicalName.isBlank()) {
            canonicalName = request.borrowerDisplayName();
        }
        return new ResolvedBorrower(
                Enums.LibraryBorrowerType.STUDENT,
                s.getId(),
                s.getParentId(),
                canonicalName,
                s.getId(),
                canonicalName);
    }
}
