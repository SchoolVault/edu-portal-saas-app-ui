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

import java.math.BigDecimal;

@Entity
@Table(name = "library_fine_policies", indexes = {
        @Index(name = "idx_lfp_tenant_type", columnList = "tenant_id, borrower_type")
})
public class LibraryFinePolicy extends BaseEntity {
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "borrower_type", length = 20, nullable = false)
    private Enums.LibraryBorrowerType borrowerType;
    @Column(name = "fine_per_day", precision = 10, scale = 2)
    private BigDecimal finePerDay;
    @Column(name = "grace_days")
    private Integer graceDays;
    @Column(name = "max_books")
    private Integer maxBooks;
    @Column(name = "max_borrow_days")
    private Integer maxBorrowDays;

    public Enums.LibraryBorrowerType getBorrowerType() { return borrowerType; }
    public void setBorrowerType(Enums.LibraryBorrowerType borrowerType) { this.borrowerType = borrowerType; }
    public BigDecimal getFinePerDay() { return finePerDay; }
    public void setFinePerDay(BigDecimal finePerDay) { this.finePerDay = finePerDay; }
    public Integer getGraceDays() { return graceDays; }
    public void setGraceDays(Integer graceDays) { this.graceDays = graceDays; }
    public Integer getMaxBooks() { return maxBooks; }
    public void setMaxBooks(Integer maxBooks) { this.maxBooks = maxBooks; }
    public Integer getMaxBorrowDays() { return maxBorrowDays; }
    public void setMaxBorrowDays(Integer maxBorrowDays) { this.maxBorrowDays = maxBorrowDays; }
}
