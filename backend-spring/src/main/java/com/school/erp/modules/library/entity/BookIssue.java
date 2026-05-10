package com.school.erp.modules.library.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "book_issues", indexes = {
        @Index(name = "idx_bi_student",
                columnList = "tenant_id, student_id"),
        @Index(name = "idx_bi_borrower_ref",
                columnList = "tenant_id, borrower_type, borrower_ref_id"),
        @Index(name = "idx_bi_borrower_user",
                columnList = "tenant_id, borrower_user_id")})
public class BookIssue extends BaseEntity implements AcademicYearScopedEntity {
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Override
    public Long getAcademicYearId() {
        return academicYearId;
    }

    @Override
    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    @Column(name = "book_id", nullable = false)
    private Long bookId;
    @Column(name = "book_title", length = 200)
    private String bookTitle;
    @Column(name = "student_id")
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "borrower_type", length = 20)
    private Enums.LibraryBorrowerType borrowerType;
    @Column(name = "borrower_ref_id")
    private Long borrowerRefId;
    @Column(name = "borrower_user_id")
    private Long borrowerUserId;
    @Column(name = "borrower_display_name", length = 200)
    private String borrowerDisplayName;
    @Column(name = "issue_date")
    private LocalDate issueDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "return_date")
    private LocalDate returnDate;
    @Column(precision = 8, scale = 2)
    private BigDecimal fine;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private Enums.BookIssueStatus status;

    public BookIssue() {
    }

    public BookIssue(Long bookId, String bookTitle, Long studentId, String studentName, LocalDate issueDate, LocalDate dueDate,
                     LocalDate returnDate, BigDecimal fine, Enums.BookIssueStatus status) {
        this.bookId = bookId;
        this.bookTitle = bookTitle;
        this.studentId = studentId;
        this.studentName = studentName;
        this.issueDate = issueDate;
        this.dueDate = dueDate;
        this.returnDate = returnDate;
        this.fine = fine;
        this.status = status;
    }

    public Long getBookId() {
        return bookId;
    }

    public void setBookId(Long bookId) {
        this.bookId = bookId;
    }

    public String getBookTitle() {
        return bookTitle;
    }

    public void setBookTitle(String bookTitle) {
        this.bookTitle = bookTitle;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getStudentName() {
        return studentName;
    }

    public void setStudentName(String studentName) {
        this.studentName = studentName;
    }

    public Enums.LibraryBorrowerType getBorrowerType() {
        return borrowerType;
    }

    public void setBorrowerType(Enums.LibraryBorrowerType borrowerType) {
        this.borrowerType = borrowerType;
    }

    public Long getBorrowerRefId() {
        return borrowerRefId;
    }

    public void setBorrowerRefId(Long borrowerRefId) {
        this.borrowerRefId = borrowerRefId;
    }

    public Long getBorrowerUserId() {
        return borrowerUserId;
    }

    public void setBorrowerUserId(Long borrowerUserId) {
        this.borrowerUserId = borrowerUserId;
    }

    public String getBorrowerDisplayName() {
        return borrowerDisplayName;
    }

    public void setBorrowerDisplayName(String borrowerDisplayName) {
        this.borrowerDisplayName = borrowerDisplayName;
    }

    public LocalDate getIssueDate() {
        return issueDate;
    }

    public void setIssueDate(LocalDate issueDate) {
        this.issueDate = issueDate;
    }

    public LocalDate getDueDate() {
        return dueDate;
    }

    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }

    public LocalDate getReturnDate() {
        return returnDate;
    }

    public void setReturnDate(LocalDate returnDate) {
        this.returnDate = returnDate;
    }

    public BigDecimal getFine() {
        return fine;
    }

    public void setFine(BigDecimal fine) {
        this.fine = fine;
    }

    public Enums.BookIssueStatus getStatus() {
        return status;
    }

    public void setStatus(Enums.BookIssueStatus status) {
        this.status = status;
    }
}
