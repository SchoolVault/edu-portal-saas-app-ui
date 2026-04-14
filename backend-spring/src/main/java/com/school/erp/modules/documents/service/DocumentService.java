package com.school.erp.modules.documents.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.repository.DocumentRepository;
import com.school.erp.tenant.TenantContext;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class DocumentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DocumentService.class);
    private final DocumentRepository repo;

    @Transactional(readOnly = true)
    public List<Document> getDocuments(String category, String ownerType, Long ownerId) {
        String t = TenantContext.getTenantId();
        log.debug("Listing documents tenantId={} category={} ownerType={} ownerId={}", t, category, ownerType, ownerId);
        List<Document> docs;
        if (ownerType != null && !ownerType.isBlank() && ownerId != null) {
            try {
                docs = repo.findByTenantIdAndOwnerTypeAndOwnerIdAndIsDeletedFalse(t, Enums.DocumentOwnerType.valueOf(ownerType.toUpperCase()), ownerId);
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid ownerType '{}', falling back to tenant-wide list", ownerType);
                docs = repo.findByTenantIdAndIsDeletedFalse(t);
            }
        } else {
            docs = repo.findByTenantIdAndIsDeletedFalse(t);
        }
        if (category != null && !category.isBlank()) {
            docs = docs.stream().filter(d -> category.equalsIgnoreCase(d.getCategory() != null ? d.getCategory().name() : "")).toList();
        }
        log.info("Documents query returned count={} tenantId={}", docs.size(), t);
        return docs;
    }

    @Transactional(readOnly = true)
    public PageResponse<Document> getDocumentsPaged(int page, int size, String category, String ownerType, Long ownerId, String q) {
        String t = TenantContext.getTenantId();
        Enums.DocumentCategory cat = null;
        if (category != null && !category.isBlank()) {
            try {
                cat = Enums.DocumentCategory.valueOf(category.trim().toUpperCase());
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid document category '{}'", category);
            }
        }
        Enums.DocumentOwnerType ot = null;
        Long oid = null;
        if (ownerType != null && !ownerType.isBlank() && ownerId != null) {
            try {
                ot = Enums.DocumentOwnerType.valueOf(ownerType.trim().toUpperCase());
                oid = ownerId;
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid ownerType '{}', listing tenant-wide paged", ownerType);
            }
        }
        String qq = q == null || q.isBlank() ? "" : q.trim();
        Page<Document> pg = repo.pageFiltered(t, cat, ot, oid, qq, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        log.info("Documents paged page={} total={}", page, pg.getTotalElements());
        return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
    }

    @Transactional
    public Document upload(Document doc) {
        log.info("Uploading document name={} category={}", doc.getName(), doc.getCategory());
        doc.setTenantId(TenantContext.getTenantId());
        doc.setUploadedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "system");
        if (doc.getFileVersion() == null) {
            doc.setFileVersion(1);
        }
        Document saved = repo.save(doc);
        log.info("Document stored id={} version={}", saved.getId(), saved.getFileVersion());
        return saved;
    }

    @Transactional
    public Document update(Long id, Document update) {
        String t = TenantContext.getTenantId();
        log.info("Updating document id={}", id);
        Document doc = repo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Document", id));
        if (update.getName() != null) doc.setName(update.getName());
        if (update.getCategory() != null) doc.setCategory(update.getCategory());
        if (update.getOwnerType() != null) doc.setOwnerType(update.getOwnerType());
        if (update.getOwnerId() != null) doc.setOwnerId(update.getOwnerId());
        if (update.getVisibilityScope() != null) doc.setVisibilityScope(update.getVisibilityScope());
        if (update.getFileVersion() != null) doc.setFileVersion(update.getFileVersion());
        if (update.getMimeType() != null) doc.setMimeType(update.getMimeType());
        if (update.getSizeBytes() != null) doc.setSizeBytes(update.getSizeBytes());
        if (update.getStorageKey() != null) doc.setStorageKey(update.getStorageKey());
        if (update.getParentFolderId() != null) doc.setParentFolderId(update.getParentFolderId());
        if (update.getTagsJson() != null) doc.setTagsJson(update.getTagsJson());
        if (update.getFileUrl() != null) doc.setFileUrl(update.getFileUrl());
        Document saved = repo.save(doc);
        log.info("Document updated id={}", id);
        return saved;
    }

    @Transactional
    public void delete(Long id) {
        String t = TenantContext.getTenantId();
        log.debug("Delete document requested id={}", id);
        Document doc = repo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Document", id));
        String role = TenantContext.getUserRole();
        Long uid = TenantContext.getUserId();
        boolean admin = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("SUPER_ADMIN"));
        boolean owner = uid != null && doc.getUploadedBy() != null && doc.getUploadedBy().equals(String.valueOf(uid));
        if (!admin && !owner) {
            log.warn("Document delete denied id={} userId={} role={}", id, uid, role);
            throw new UnauthorizedException("You can only delete documents you uploaded (or as admin)");
        }
        doc.setIsDeleted(true);
        repo.save(doc);
        log.info("Document soft-deleted id={}", id);
    }

    public DocumentService(final DocumentRepository repo) {
        this.repo = repo;
    }
}
