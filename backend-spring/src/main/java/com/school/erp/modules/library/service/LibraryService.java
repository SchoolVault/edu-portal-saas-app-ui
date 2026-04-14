package com.school.erp.modules.library.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.*;
import com.school.erp.modules.library.repository.*;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantContext;
import com.school.erp.tenant.TenantQueryPolicy;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class LibraryService {
    private static final Logger log = LoggerFactory.getLogger(LibraryService.class);

    private final BookRepository bookRepo;
    private final BookIssueRepository issueRepo;
    private final TenantConfigRepository tenantConfigRepository;

    public LibraryService(BookRepository bookRepo, BookIssueRepository issueRepo, TenantConfigRepository tenantConfigRepository) {
        this.bookRepo = bookRepo;
        this.issueRepo = issueRepo;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    @Transactional(readOnly = true)
    public List<Book> getBooks(String search, boolean includeInactive) {
        List<Book> books = bookRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (!includeInactive) {
            books = books.stream().filter(b -> !Boolean.FALSE.equals(b.getIsActive())).toList();
        }
        if (search != null && !search.isBlank()) {
            String s = search.toLowerCase();
            return books.stream().filter(b ->
                    b.getTitle().toLowerCase().contains(s) || b.getAuthor().toLowerCase().contains(s) || b.getIsbn().contains(s)
            ).toList();
        }
        return books;
    }

    @Transactional(readOnly = true)
    public PageResponse<Book> getBooksPaged(int page, int size, String search, String category, String catalogScope) {
        String t = TenantContext.getTenantId();
        String s = search == null || search.isBlank() ? "" : search.trim();
        String cat = category == null || category.isBlank() ? "" : category.trim();
        String scope = catalogScope == null || catalogScope.isBlank() ? "ACTIVE" : catalogScope.trim().toUpperCase();
        if (!scope.equals("ALL") && !scope.equals("ACTIVE") && !scope.equals("INACTIVE")) {
            scope = "ACTIVE";
        }
        Pageable p = PageRequest.of(page, size, Sort.by("title"));
        Page<Book> pg = bookRepo.pageBooks(t, s, cat, scope, p);
        log.debug("Books paged page={} total={} scope={}", page, pg.getTotalElements(), scope);
        return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<LibraryDTOs.BookIssueResponse> getIssuesPaged(int page, int size, Enums.BookIssueStatus status) {
        String t = TenantContext.getTenantId();
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));
        Page<BookIssue> pg;
        if (status == null) {
            pg = issueRepo.findByTenantIdAndIsDeletedFalseOrderByIssueDateDesc(t, p);
        } else if (status == Enums.BookIssueStatus.OVERDUE) {
            pg = issueRepo.pageOverdue(t, LocalDate.now(), p);
        } else {
            pg = issueRepo.findByTenantIdAndStatusAndIsDeletedFalseOrderByIssueDateDesc(t, status, p);
        }
        List<LibraryDTOs.BookIssueResponse> content = pg.getContent().stream().map(this::toIssueResponse).toList();
        return PageResponse.of(content, page, size, pg.getTotalElements());
    }

    @Transactional
    public Book addBook(Book book) {
        book.setTenantId(TenantContext.getTenantId());
        if (book.getIsActive() == null) {
            book.setIsActive(true);
        }
        if (book.getAvailableCopies() == null) book.setAvailableCopies(book.getTotalCopies());
        return bookRepo.save(book);
    }

    private Book requireBook(Long bookId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return bookRepo.findById(bookId).filter(b -> !Boolean.TRUE.equals(b.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
        }
        return bookRepo.findByIdAndTenantIdAndIsDeletedFalse(bookId, t).orElseThrow(() -> new ResourceNotFoundException("Book", bookId));
    }

    private BookIssue requireIssue(Long issueId) {
        String t = TenantContext.getTenantId();
        if (TenantQueryPolicy.isPlatformSuperAdmin()) {
            return issueRepo.findById(issueId).filter(i -> !Boolean.TRUE.equals(i.getIsDeleted())).orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));
        }
        return issueRepo.findByIdAndTenantIdAndIsDeletedFalse(issueId, t).orElseThrow(() -> new ResourceNotFoundException("BookIssue", issueId));
    }

    @Transactional
    public Book setCatalogActive(Long bookId, boolean active) {
        Book book = requireBook(bookId);
        book.setIsActive(active);
        return bookRepo.save(book);
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse issueBook(LibraryDTOs.IssueBookRequest req) {
        Book book = requireBook(req.getBookId());
        String t = book.getTenantId();
        if (Boolean.FALSE.equals(book.getIsActive())) {
            throw new BusinessException("This title is inactive in the catalog");
        }
        if (book.getAvailableCopies() <= 0) throw new BusinessException("No copies available for: " + book.getTitle());

        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepo.save(book);

        BookIssue issue = new BookIssue();
        issue.setBookId(req.getBookId());
        issue.setBookTitle(book.getTitle());
        issue.setStudentId(req.getStudentId());
        issue.setStudentName(req.getStudentName());
        issue.setIssueDate(LocalDate.now());
        issue.setDueDate(req.getDueDays() != null ? LocalDate.now().plusDays(req.getDueDays()) : LocalDate.now().plusDays(14));
        issue.setFine(BigDecimal.ZERO);
        issue.setStatus(Enums.BookIssueStatus.ISSUED);
        issue.setTenantId(t);
        issueRepo.save(issue);

        log.info("Book issued: {} to student {}", book.getTitle(), req.getStudentId());
        return toIssueResponse(issue);
    }

    @Transactional
    public LibraryDTOs.BookIssueResponse returnBook(Long issueId, LibraryDTOs.ReturnBookRequest req) {
        BookIssue issue = requireIssue(issueId);
        String t = issue.getTenantId();
        if (issue.getStatus() == Enums.BookIssueStatus.RETURNED) throw new BusinessException("Book already returned");

        LocalDate returnDate = LocalDate.now();
        if (req != null && req.getReturnDate() != null && !req.getReturnDate().isBlank()) {
            returnDate = LocalDate.parse(req.getReturnDate().trim());
        }

        BigDecimal perDay = resolveFinePerDay(t, req != null ? req.getFinePerDay() : null);

        issue.setReturnDate(returnDate);
        issue.setStatus(Enums.BookIssueStatus.RETURNED);

        if (returnDate.isAfter(issue.getDueDate())) {
            long daysOverdue = ChronoUnit.DAYS.between(issue.getDueDate(), returnDate);
            if (daysOverdue < 0) daysOverdue = 0;
            issue.setFine(perDay.multiply(BigDecimal.valueOf(daysOverdue)));
        } else {
            issue.setFine(BigDecimal.ZERO);
        }

        issueRepo.save(issue);

        Book book = bookRepo.findByIdAndTenantIdAndIsDeletedFalse(issue.getBookId(), t).orElse(null);
        if (book != null) {
            book.setAvailableCopies(book.getAvailableCopies() + 1);
            bookRepo.save(book);
        }

        log.info("Book returned: {} fine={}", issue.getBookTitle(), issue.getFine());
        return toIssueResponse(issue);
    }

    private BigDecimal resolveFinePerDay(String tenantId, BigDecimal override) {
        if (override != null && override.compareTo(BigDecimal.ZERO) > 0) {
            return override;
        }
        return tenantConfigRepository.findByTenantId(tenantId)
                .map(c -> c.getLibraryFinePerDay() != null ? c.getLibraryFinePerDay() : BigDecimal.TEN)
                .orElse(BigDecimal.TEN);
    }

    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getIssues(Enums.BookIssueStatus status) {
        List<BookIssue> issues = issueRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        return issues.stream()
                .filter(i -> status == null || effectiveIssueStatus(i) == status)
                .map(this::toIssueResponse)
                .toList();
    }

    private static Enums.BookIssueStatus effectiveIssueStatus(BookIssue i) {
        Enums.BookIssueStatus st = i.getStatus();
        if (st == Enums.BookIssueStatus.ISSUED && i.getDueDate() != null && LocalDate.now().isAfter(i.getDueDate())) {
            return Enums.BookIssueStatus.OVERDUE;
        }
        return st;
    }

    private LibraryDTOs.BookIssueResponse toIssueResponse(BookIssue i) {
        Enums.BookIssueStatus st = effectiveIssueStatus(i);
        return LibraryDTOs.BookIssueResponse.builder()
                .id(i.getId()).bookId(i.getBookId()).bookTitle(i.getBookTitle())
                .studentId(i.getStudentId()).studentName(i.getStudentName())
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine()).status(st != null ? st.name().toLowerCase() : null)
                .build();
    }
}
