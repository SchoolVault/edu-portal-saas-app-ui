package com.school.erp.modules.documents.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.UnauthorizedException;
import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;
import com.school.erp.modules.documents.entity.Document;
import com.school.erp.modules.documents.repository.DocumentRepository;
import com.school.erp.platform.port.FileStoragePort;
import com.school.erp.tenant.TenantContext;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
public class DocumentService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(DocumentService.class);
    private final DocumentRepository repo;
    private final FileStoragePort fileStoragePort;
    private final DocumentBinaryStoreService binaryStoreService;
    private final CurrentAcademicYearResolver currentAcademicYearResolver;

    @Transactional(readOnly = true)
    public List<Document> getDocuments(String category, String ownerType, Long ownerId, Long academicYearId) {
        String t = TenantContext.getTenantId();
        Long effectiveAcademicYearId = resolveAcademicYearOrCurrent(academicYearId, t);
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
        if (effectiveAcademicYearId != null) {
            docs = docs.stream().filter(d -> effectiveAcademicYearId.equals(d.getAcademicYearId())).toList();
        }
        if (category != null && !category.isBlank()) {
            docs = docs.stream().filter(d -> category.equalsIgnoreCase(d.getCategory() != null ? d.getCategory().name() : "")).toList();
        }
        log.info("Documents query returned count={} tenantId={}", docs.size(), t);
        return docs;
    }

    @Transactional(readOnly = true)
    public PageResponse<Document> getDocumentsPaged(int page, int size, String category, String ownerType, Long ownerId, Long academicYearId, String q) {
        String t = TenantContext.getTenantId();
        Long effectiveAcademicYearId = resolveAcademicYearOrCurrent(academicYearId, t);
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
        Page<Document> pg = repo.pageFiltered(t, cat, effectiveAcademicYearId, ot, oid, qq, PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        log.info("Documents paged page={} total={}", page, pg.getTotalElements());
        return PageResponse.of(pg.getContent(), page, size, pg.getTotalElements());
    }

    @Transactional
    public Document uploadBinary(MultipartFile file,
                                 String name,
                                 String category,
                                 String ownerType,
                                 Long ownerId,
                                 Long academicYearId,
                                 String visibilityScope,
                                 Long parentFolderId,
                                 String tagsJson) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException("File is required.");
        }
        String originalName = file.getOriginalFilename() == null ? "document.bin" : file.getOriginalFilename().trim();
        String finalName = (name == null || name.isBlank()) ? originalName : name.trim();
        String tenantId = TenantContext.getTenantId();
        Long effectiveAcademicYearId = resolveAcademicYearOrCurrent(academicYearId, tenantId);
        Enums.DocumentCategory cat = parseCategory(category);
        Enums.DocumentOwnerType ot = parseOwnerType(ownerType);
        Enums.DocumentVisibilityScope vs = parseVisibilityScope(visibilityScope);
        String storageKey = fileStoragePort.buildObjectKey(tenantId, cat.name().toLowerCase(Locale.ROOT), UUID.randomUUID() + "_" + originalName);
        DocumentBinaryStoreService.StoredFile stored = binaryStoreService.store(tenantId, effectiveAcademicYearId, storageKey, file);

        Document doc = new Document();
        doc.setTenantId(tenantId);
        doc.setName(finalName);
        doc.setCategory(cat);
        doc.setFileType(guessFileType(file.getOriginalFilename()));
        doc.setUploadedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "system");
        doc.setOwnerType(ot);
        doc.setOwnerId(ownerId);
        doc.setAcademicYearId(effectiveAcademicYearId);
        doc.setVisibilityScope(vs);
        doc.setParentFolderId(parentFolderId);
        doc.setTagsJson(tagsJson);
        doc.setStorageKey(storageKey);
        doc.setMimeType(stored.mimeType());
        doc.setSizeBytes(stored.sizeBytes());
        doc.setFileSize(formatSizeLabel(stored.sizeBytes()));
        doc.setChecksumSha256(stored.checksumSha256());
        doc.setFileUrl(null);
        doc.setFileVersion(1);
        Document saved = repo.save(doc);
        saved.setFileUrl("/api/v1/documents/" + saved.getId() + "/download");
        return repo.save(saved);
    }

    @Transactional(readOnly = true)
    public Resource loadBinary(Long id) {
        Document doc = repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", id));
        return binaryStoreService.load(doc.getTenantId(), doc.getAcademicYearId(), doc.getStorageKey());
    }

    @Transactional(readOnly = true)
    public Document getById(Long id) {
        return repo.findByIdAndTenantIdAndIsDeletedFalse(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResourceNotFoundException("Document", id));
    }

    @Transactional
    public Document upload(Document doc) {
        log.info("Uploading document name={} category={}", doc.getName(), doc.getCategory());
        doc.setTenantId(TenantContext.getTenantId());
        doc.setUploadedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "system");
        if (doc.getStorageKey() == null || doc.getStorageKey().isBlank()) {
            String cat = doc.getCategory() != null ? doc.getCategory().name() : "document";
            doc.setStorageKey(fileStoragePort.buildObjectKey(doc.getTenantId(), cat, doc.getName()));
        }
        if (doc.getFileUrl() == null || doc.getFileUrl().isBlank()) {
            doc.setFileUrl(fileStoragePort.buildPublicUrl(doc.getTenantId(), doc.getStorageKey()));
        }
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
        doc.markSoftDeleted();
        repo.save(doc);
        log.info("Document soft-deleted id={}", id);
    }

    public DocumentService(final DocumentRepository repo,
                           final FileStoragePort fileStoragePort,
                           final DocumentBinaryStoreService binaryStoreService,
                           final CurrentAcademicYearResolver currentAcademicYearResolver) {
        this.repo = repo;
        this.fileStoragePort = fileStoragePort;
        this.binaryStoreService = binaryStoreService;
        this.currentAcademicYearResolver = currentAcademicYearResolver;
    }

    private Long resolveAcademicYearOrCurrent(Long requestedAcademicYearId, String tenantId) {
        if (requestedAcademicYearId != null) {
            return requestedAcademicYearId;
        }
        Long currentAcademicYearId = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
        if (currentAcademicYearId != null) {
            return currentAcademicYearId;
        }
        return null;
    }

    private static String formatSizeLabel(long sizeBytes) {
        double mb = sizeBytes / (1024.0 * 1024.0);
        if (mb >= 1.0) return String.format(Locale.ROOT, "%.2f MB", mb);
        double kb = sizeBytes / 1024.0;
        return String.format(Locale.ROOT, "%.1f KB", kb);
    }

    private static String guessFileType(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "BIN";
        return fileName.substring(fileName.lastIndexOf('.') + 1).toUpperCase(Locale.ROOT);
    }

    private static Enums.DocumentCategory parseCategory(String category) {
        if (category == null || category.isBlank()) return Enums.DocumentCategory.GENERAL;
        try {
            return Enums.DocumentCategory.valueOf(category.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid document category.");
        }
    }

    private static Enums.DocumentOwnerType parseOwnerType(String ownerType) {
        if (ownerType == null || ownerType.isBlank()) return null;
        try {
            return Enums.DocumentOwnerType.valueOf(ownerType.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid owner type.");
        }
    }

    private static Enums.DocumentVisibilityScope parseVisibilityScope(String visibilityScope) {
        if (visibilityScope == null || visibilityScope.isBlank()) return Enums.DocumentVisibilityScope.PRIVATE;
        try {
            return Enums.DocumentVisibilityScope.valueOf(visibilityScope.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new BusinessException("Invalid visibility scope.");
        }
    }
}
