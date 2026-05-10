package com.school.erp.modules.library.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;

@Entity
@Table(name = "library_inventory_ledger", indexes = {
        @Index(name = "idx_lil_tenant_book", columnList = "tenant_id, book_id, created_at")
})
public class LibraryInventoryLedger extends BaseEntity {
    @Column(name = "book_id", nullable = false)
    private Long bookId;
    @Column(name = "book_title", length = 200)
    private String bookTitle;
    @Column(name = "action", length = 30, nullable = false)
    private String action;
    @Column(name = "quantity", nullable = false)
    private Integer quantity;
    @Column(name = "total_copies_after")
    private Integer totalCopiesAfter;
    @Column(name = "available_copies_after")
    private Integer availableCopiesAfter;
    @Column(name = "note", length = 300)
    private String note;

    public Long getBookId() { return bookId; }
    public void setBookId(Long bookId) { this.bookId = bookId; }
    public String getBookTitle() { return bookTitle; }
    public void setBookTitle(String bookTitle) { this.bookTitle = bookTitle; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
    public Integer getTotalCopiesAfter() { return totalCopiesAfter; }
    public void setTotalCopiesAfter(Integer totalCopiesAfter) { this.totalCopiesAfter = totalCopiesAfter; }
    public Integer getAvailableCopiesAfter() { return availableCopiesAfter; }
    public void setAvailableCopiesAfter(Integer availableCopiesAfter) { this.availableCopiesAfter = availableCopiesAfter; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
