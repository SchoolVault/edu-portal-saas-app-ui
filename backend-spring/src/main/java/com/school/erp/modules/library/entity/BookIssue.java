package com.school.erp.modules.library.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "book_issues", indexes = {
        @Index(name = "idx_bi_student",
                columnList = "tenant_id, student_id")})
public class BookIssue extends BaseEntity {
    @Column(name = "book_id", nullable = false)
    private Long bookId;
    @Column(name = "book_title", length = 200)
    private String bookTitle;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "issue_date")
    private LocalDate issueDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "return_date")
    private LocalDate returnDate;
    @Column(precision = 8, scale = 2)
    private BigDecimal fine;
    @Enumerated(EnumType.STRING)
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
