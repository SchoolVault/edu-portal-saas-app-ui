package com.school.erp.modules.documents.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;

@Entity
@Table(name = "documents")
public class Document extends BaseEntity {
    @Column(nullable = false, length = 200)
    private String name;
    @Column(name = "file_type", length = 20)
    private String fileType;
    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private Enums.DocumentCategory category;
    @Column(name = "uploaded_by", length = 100)
    private String uploadedBy;
    @Column(name = "file_size", length = 20)
    private String fileSize;
    @Column(name = "file_url", length = 500)
    private String fileUrl;
    @Column(name = "related_entity_id")
    private Long relatedEntityId;
    @Column(name = "related_entity_type", length = 50)
    private String relatedEntityType;


    public static class DocumentBuilder {
        private String name;
        private String fileType;
        private Enums.DocumentCategory category;
        private String uploadedBy;
        private String fileSize;
        private String fileUrl;
        private Long relatedEntityId;
        private String relatedEntityType;

        DocumentBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder fileType(final String fileType) {
            this.fileType = fileType;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder category(final Enums.DocumentCategory category) {
            this.category = category;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder uploadedBy(final String uploadedBy) {
            this.uploadedBy = uploadedBy;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder fileSize(final String fileSize) {
            this.fileSize = fileSize;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder fileUrl(final String fileUrl) {
            this.fileUrl = fileUrl;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder relatedEntityId(final Long relatedEntityId) {
            this.relatedEntityId = relatedEntityId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Document.DocumentBuilder relatedEntityType(final String relatedEntityType) {
            this.relatedEntityType = relatedEntityType;
            return this;
        }

        public Document build() {
            return new Document(this.name, this.fileType, this.category, this.uploadedBy, this.fileSize, this.fileUrl, this.relatedEntityId, this.relatedEntityType);
        }

        @Override
        public String toString() {
            return "Document.DocumentBuilder(name=" + this.name + ", fileType=" + this.fileType + ", category=" + this.category + ", uploadedBy=" + this.uploadedBy + ", fileSize=" + this.fileSize + ", fileUrl=" + this.fileUrl + ", relatedEntityId=" + this.relatedEntityId + ", relatedEntityType=" + this.relatedEntityType + ")";
        }
    }

    public static Document.DocumentBuilder builder() {
        return new Document.DocumentBuilder();
    }

    public String getName() {
        return this.name;
    }

    public String getFileType() {
        return this.fileType;
    }

    public Enums.DocumentCategory getCategory() {
        return this.category;
    }

    public String getUploadedBy() {
        return this.uploadedBy;
    }

    public String getFileSize() {
        return this.fileSize;
    }

    public String getFileUrl() {
        return this.fileUrl;
    }

    public Long getRelatedEntityId() {
        return this.relatedEntityId;
    }

    public String getRelatedEntityType() {
        return this.relatedEntityType;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setFileType(final String fileType) {
        this.fileType = fileType;
    }

    public void setCategory(final Enums.DocumentCategory category) {
        this.category = category;
    }

    public void setUploadedBy(final String uploadedBy) {
        this.uploadedBy = uploadedBy;
    }

    public void setFileSize(final String fileSize) {
        this.fileSize = fileSize;
    }

    public void setFileUrl(final String fileUrl) {
        this.fileUrl = fileUrl;
    }

    public void setRelatedEntityId(final Long relatedEntityId) {
        this.relatedEntityId = relatedEntityId;
    }

    public void setRelatedEntityType(final String relatedEntityType) {
        this.relatedEntityType = relatedEntityType;
    }

    public Document() {
    }

    public Document(final String name, final String fileType, final Enums.DocumentCategory category, final String uploadedBy, final String fileSize, final String fileUrl, final Long relatedEntityId, final String relatedEntityType) {
        this.name = name;
        this.fileType = fileType;
        this.category = category;
        this.uploadedBy = uploadedBy;
        this.fileSize = fileSize;
        this.fileUrl = fileUrl;
        this.relatedEntityId = relatedEntityId;
        this.relatedEntityType = relatedEntityType;
    }
}
