package com.school.erp.modules.library.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "library_reservations", indexes = {
        @Index(name = "idx_lr_tenant_status", columnList = "tenant_id, status"),
        @Index(name = "idx_lr_tenant_book", columnList = "tenant_id, book_id")
})
public class LibraryReservation extends BaseEntity {
    @Column(name = "book_id", nullable = false)
    private Long bookId;
    @Column(name = "book_title", length = 200)
    private String bookTitle;
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
    @Column(name = "status", length = 20)
    private String status;
    @Column(name = "requested_at")
    private LocalDateTime requestedAt;
    @Column(name = "expires_at")
    private LocalDateTime expiresAt;
    @Column(name = "fulfilled_issue_id")
    private Long fulfilledIssueId;
    @Column(name = "note", length = 300)
    private String note;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
    public Enums.LibraryBorrowerType getBorrowerType() { return borrowerType; }
    public void setBorrowerType(Enums.LibraryBorrowerType borrowerType) { this.borrowerType = borrowerType; }
    public Long getBorrowerRefId() { return borrowerRefId; }
    public void setBorrowerRefId(Long borrowerRefId) { this.borrowerRefId = borrowerRefId; }
    public Long getBorrowerUserId() { return borrowerUserId; }
    public void setBorrowerUserId(Long borrowerUserId) { this.borrowerUserId = borrowerUserId; }
    public String getBorrowerDisplayName() { return borrowerDisplayName; }
    public void setBorrowerDisplayName(String borrowerDisplayName) { this.borrowerDisplayName = borrowerDisplayName; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public LocalDateTime getRequestedAt() { return requestedAt; }
    public void setRequestedAt(LocalDateTime requestedAt) { this.requestedAt = requestedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
    public Long getFulfilledIssueId() { return fulfilledIssueId; }
    public void setFulfilledIssueId(Long fulfilledIssueId) { this.fulfilledIssueId = fulfilledIssueId; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
