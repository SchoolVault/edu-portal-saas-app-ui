package com.school.erp.modules.documents.service;

import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.repository.DocumentRepository;
import com.school.erp.tenant.TenantContext;
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
        List<Document> docs;
        if (ownerType != null && !ownerType.isBlank() && ownerId != null) {
            try {
                docs = repo.findByTenantIdAndOwnerTypeAndOwnerIdAndIsDeletedFalse(t, Enums.DocumentOwnerType.valueOf(ownerType.toUpperCase()), ownerId);
            } catch (IllegalArgumentException ex) {
                docs = repo.findByTenantIdAndIsDeletedFalse(t);
            }
        } else {
            docs = repo.findByTenantIdAndIsDeletedFalse(t);
        }
        if (category != null && !category.isBlank()) {
            docs = docs.stream().filter(d -> category.equalsIgnoreCase(d.getCategory() != null ? d.getCategory().name() : "")).toList();
        }
        return docs;
    }

    @Transactional
    public Document upload(Document doc) {
        doc.setTenantId(TenantContext.getTenantId());
        doc.setUploadedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "system");
        if (doc.getFileVersion() == null) {
            doc.setFileVersion(1);
        }
        return repo.save(doc);
    }

    @Transactional
    public Document update(Long id, Document update) {
        String t = TenantContext.getTenantId();
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
        return repo.save(doc);
    }

    @Transactional
    public void delete(Long id) {
        String t = TenantContext.getTenantId();
        Document doc = repo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Document", id));
        String role = TenantContext.getUserRole();
        Long uid = TenantContext.getUserId();
        boolean admin = role != null && (role.equalsIgnoreCase("ADMIN") || role.equalsIgnoreCase("SUPER_ADMIN"));
        boolean owner = uid != null && doc.getUploadedBy() != null && doc.getUploadedBy().equals(String.valueOf(uid));
        if (!admin && !owner) {
            throw new UnauthorizedException("You can only delete documents you uploaded (or as admin)");
        }
        doc.setIsDeleted(true);
        repo.save(doc);
    }

    public DocumentService(final DocumentRepository repo) {
        this.repo = repo;
    }
}
