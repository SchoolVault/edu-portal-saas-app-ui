package com.school.erp.modules.documents.service;

import com.school.erp.common.exception.ResourceNotFoundException;
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
    public List<Document> getDocuments(String category) {
        List<Document> docs = repo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        if (category != null && !category.isBlank()) {
            docs = docs.stream().filter(d -> category.equalsIgnoreCase(d.getCategory() != null ? d.getCategory().name() : "")).toList();
        }
        return docs;
    }

    @Transactional
    public Document upload(Document doc) {
        doc.setTenantId(TenantContext.getTenantId());
        doc.setUploadedBy(TenantContext.getUserId() != null ? TenantContext.getUserId().toString() : "system");
        return repo.save(doc);
    }

    @Transactional
    public Document update(Long id, Document update) {
        Document doc = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document", id));
        if (update.getName() != null) doc.setName(update.getName());
        if (update.getCategory() != null) doc.setCategory(update.getCategory());
        return repo.save(doc);
    }

    @Transactional
    public void delete(Long id) {
        Document doc = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Document", id));
        doc.setIsDeleted(true);
        repo.save(doc);
    }

    public DocumentService(final DocumentRepository repo) {
        this.repo = repo;
    }
}
