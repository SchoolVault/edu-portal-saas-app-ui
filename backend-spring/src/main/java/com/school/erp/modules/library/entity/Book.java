package com.school.erp.modules.library.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "books", indexes = {@Index(name = "idx_book_tenant", columnNames = "tenant_id")})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class Book extends BaseEntity {
    @Column(nullable = false, length = 200) private String title;
    @Column(length = 200) private String author;
    @Column(length = 20) private String isbn;
    @Column(length = 50) private String category;
    @Column(name = "total_copies") private Integer totalCopies;
    @Column(name = "available_copies") private Integer availableCopies;
    @Column(name = "shelf_location", length = 20) private String shelfLocation;
}
