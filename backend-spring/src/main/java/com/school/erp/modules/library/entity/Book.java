package com.school.erp.modules.library.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "books", indexes = {@Index(name = "idx_book_tenant", columnList = "tenant_id")})
public class Book extends BaseEntity {
    @Column(nullable = false, length = 200)
    private String title;
    @Column(length = 200)
    private String author;
    @Column(length = 20)
    private String isbn;
    @Column(length = 50)
    private String category;
    @Column(name = "total_copies")
    private Integer totalCopies;
    @Column(name = "available_copies")
    private Integer availableCopies;
    @Column(name = "shelf_location", length = 20)
    private String shelfLocation;

    public Book() {
    }

    public Book(String title, String author, String isbn, String category, Integer totalCopies, Integer availableCopies, String shelfLocation) {
        this.title = title;
        this.author = author;
        this.isbn = isbn;
        this.category = category;
        this.totalCopies = totalCopies;
        this.availableCopies = availableCopies;
        this.shelfLocation = shelfLocation;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getAuthor() {
        return author;
    }

    public void setAuthor(String author) {
        this.author = author;
    }

    public String getIsbn() {
        return isbn;
    }

    public void setIsbn(String isbn) {
        this.isbn = isbn;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public Integer getTotalCopies() {
        return totalCopies;
    }

    public void setTotalCopies(Integer totalCopies) {
        this.totalCopies = totalCopies;
    }

    public Integer getAvailableCopies() {
        return availableCopies;
    }

    public void setAvailableCopies(Integer availableCopies) {
        this.availableCopies = availableCopies;
    }

    public String getShelfLocation() {
        return shelfLocation;
    }

    public void setShelfLocation(String shelfLocation) {
        this.shelfLocation = shelfLocation;
    }
}
