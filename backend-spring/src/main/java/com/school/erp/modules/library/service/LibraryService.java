package com.school.erp.modules.library.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.library.borrower.BorrowerRegistry;
import com.school.erp.modules.library.borrower.ResolvedBorrower;
import com.school.erp.modules.library.dto.LibraryDTOs;
import com.school.erp.modules.library.entity.*;
import com.school.erp.modules.library.repository.*;
import com.school.erp.modules.settings.repository.TenantConfigRepository;
import com.school.erp.tenant.TenantQueryPolicy;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.cache.annotation.Cacheable;
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
    private final BorrowerRegistry borrowerRegistry;
    private final LibraryBorrowerPolicyService borrowerPolicyService;
    private final LibraryMemberScopeService memberScopeService;
    private final TenantConfigRepository tenantConfigRepository;

    public LibraryService(
            BookRepository bookRepo,
            BookIssueRepository issueRepo,
            BorrowerRegistry borrowerRegistry,
            LibraryBorrowerPolicyService borrowerPolicyService,
            LibraryMemberScopeService memberScopeService,
            TenantConfigRepository tenantConfigRepository) {
        this.bookRepo = bookRepo;
        this.issueRepo = issueRepo;
        this.borrowerRegistry = borrowerRegistry;
        this.borrowerPolicyService = borrowerPolicyService;
        this.memberScopeService = memberScopeService;
        this.tenantConfigRepository = tenantConfigRepository;
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_CATALOG, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
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

    @Cacheable(cacheNames = CacheConfig.LIBRARY_CATALOG, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
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

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
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
        LibraryDTOs.IssueBorrowerRequest normalized = new LibraryDTOs.IssueBorrowerRequest();
        normalized.setBookId(req.getBookId());
        normalized.setBorrowerType(Enums.LibraryBorrowerType.STUDENT);
        normalized.setBorrowerRefId(req.getStudentId());
        normalized.setBorrowerDisplayName(req.getStudentName());
        normalized.setDueDays(req.getDueDays());
        BookIssue issue = issueBookInternal(normalized);
        log.info("Book issued: bookId={} to student {}", req.getBookId(), req.getStudentId());
        return toIssueResponse(issue);
    }

    @Transactional
    public LibraryDTOs.BorrowerIssueResponse issueBookForBorrower(LibraryDTOs.IssueBorrowerRequest req) {
        BookIssue issue = issueBookInternal(req);
        return toBorrowerIssueResponse(issue);
    }

    private BookIssue issueBookInternal(LibraryDTOs.IssueBorrowerRequest req) {
        Book book = requireBook(req.getBookId());
        borrowerPolicyService.assertBorrowerTypeAllowed(req.getBorrowerType());
        String tenantId = book.getTenantId();
        ResolvedBorrower resolved = borrowerRegistry.resolve(
                tenantId,
                req.getBorrowerType(),
                req.getBorrowerRefId(),
                req.getBorrowerUserId(),
                req.getBorrowerDisplayName());
        BookIssue issue = createAndPersistIssue(
                book,
                resolved.borrowerType(),
                resolved.borrowerRefId(),
                resolved.borrowerUserId(),
                resolved.borrowerDisplayName(),
                req.getDueDays());
        if (resolved.legacyStudentId() != null) {
            issue.setStudentId(resolved.legacyStudentId());
            issue.setStudentName(resolved.legacyStudentName());
            issueRepo.save(issue);
        }
        return issue;
    }

    private BookIssue createAndPersistIssue(
            Book book,
            Enums.LibraryBorrowerType borrowerType,
            Long borrowerRefId,
            Long borrowerUserId,
            String borrowerDisplayName,
            Integer dueDays) {
        String tenantId = book.getTenantId();
        if (Boolean.FALSE.equals(book.getIsActive())) {
            throw new BusinessException("This title is inactive in the catalog");
        }
        if (book.getAvailableCopies() <= 0) {
            throw new BusinessException("No copies available for: " + book.getTitle());
        }
        book.setAvailableCopies(book.getAvailableCopies() - 1);
        bookRepo.save(book);

        BookIssue issue = new BookIssue();
        issue.setBookId(book.getId());
        issue.setBookTitle(book.getTitle());
        issue.setBorrowerType(borrowerType);
        issue.setBorrowerRefId(borrowerRefId);
        issue.setBorrowerUserId(borrowerUserId);
        issue.setBorrowerDisplayName(borrowerDisplayName);
        issue.setIssueDate(LocalDate.now());
        issue.setDueDate(dueDays != null ? LocalDate.now().plusDays(dueDays) : LocalDate.now().plusDays(14));
        issue.setFine(BigDecimal.ZERO);
        issue.setStatus(Enums.BookIssueStatus.ISSUED);
        issue.setTenantId(tenantId);
        issueRepo.save(issue);
        return issue;
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

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getIssues(Enums.BookIssueStatus status) {
        List<BookIssue> issues = issueRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        return issues.stream()
                .filter(i -> status == null || effectiveIssueStatus(i) == status)
                .map(this::toIssueResponse)
                .toList();
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<LibraryDTOs.BookIssueResponse> getMemberIssues(Enums.BookIssueStatus status) {
        return getMemberIssuesPaged(0, 5000, status).getContent();
    }

    @Cacheable(cacheNames = CacheConfig.LIBRARY_ISSUES, keyGenerator = "tenantMethodParamsSchoolKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<LibraryDTOs.BookIssueResponse> getMemberIssuesPaged(int page, int size, Enums.BookIssueStatus status) {
        String tenantId = TenantContext.getTenantId();
        LibraryMemberScopeService.MemberBorrowerScope scope = memberScopeService.resolveCurrentMemberBorrowerScope();
        Long userId = scope.userId();
        List<Long> memberStudentIds = scope.studentBorrowerRefs();
        if ((userId == null) && memberStudentIds.isEmpty()) {
            return PageResponse.of(List.of(), page, size, 0);
        }
        List<Long> queryStudentRefs = memberStudentIds.isEmpty() ? List.of(-1L) : memberStudentIds;
        Pageable p = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "issueDate"));
        Page<BookIssue> pg;
        if (status == null) {
            pg = issueRepo.pageMemberVisibleIssues(tenantId, userId, queryStudentRefs, p);
        } else if (status == Enums.BookIssueStatus.OVERDUE) {
            pg = issueRepo.pageMemberVisibleOverdueIssues(tenantId, userId, queryStudentRefs, LocalDate.now(), p);
        } else {
            pg = issueRepo.pageMemberVisibleIssuesByStatus(tenantId, userId, queryStudentRefs, status, p);
        }
        List<LibraryDTOs.BookIssueResponse> content = pg.getContent().stream().map(this::toIssueResponse).toList();
        return PageResponse.of(content, page, size, pg.getTotalElements());
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
        Long studentId = i.getStudentId();
        String studentName = i.getStudentName();
        if (studentId == null && i.getBorrowerType() == Enums.LibraryBorrowerType.STUDENT) {
            studentId = i.getBorrowerRefId();
        }
        if ((studentName == null || studentName.isBlank()) && i.getBorrowerType() == Enums.LibraryBorrowerType.STUDENT) {
            studentName = i.getBorrowerDisplayName();
        }
        return LibraryDTOs.BookIssueResponse.builder()
                .id(i.getId()).bookId(i.getBookId()).bookTitle(i.getBookTitle())
                .studentId(studentId).studentName(studentName)
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine()).status(st != null ? st.name().toLowerCase() : null)
                .build();
    }

    private LibraryDTOs.BorrowerIssueResponse toBorrowerIssueResponse(BookIssue i) {
        Enums.BookIssueStatus st = effectiveIssueStatus(i);
        return LibraryDTOs.BorrowerIssueResponse.builder()
                .id(i.getId())
                .bookId(i.getBookId())
                .bookTitle(i.getBookTitle())
                .borrowerType(i.getBorrowerType())
                .borrowerRefId(i.getBorrowerRefId())
                .borrowerUserId(i.getBorrowerUserId())
                .borrowerDisplayName(i.getBorrowerDisplayName())
                .issueDate(i.getIssueDate() != null ? i.getIssueDate().toString() : null)
                .dueDate(i.getDueDate() != null ? i.getDueDate().toString() : null)
                .returnDate(i.getReturnDate() != null ? i.getReturnDate().toString() : null)
                .fine(i.getFine())
                .status(st != null ? st.name().toLowerCase() : null)
                .build();
    }
}
