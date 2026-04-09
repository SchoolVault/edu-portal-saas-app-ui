package com.school.erp.modules.communication.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "announcements", indexes = {@Index(name = "idx_ann_tenant", columnList = "tenant_id")})
public class Announcement extends BaseEntity {
    @Column(nullable = false, length = 200)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    @Column(length = 200)
    private String author;
    @Column(name = "author_role", length = 20)
    private String authorRole;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "target_audience", length = 20)
    private Enums.TargetAudience targetAudience;
    @Column(name = "target_class_id")
    private Long targetClassId;
    @Column(name = "target_section_id")
    private Long targetSectionId;


    public static class AnnouncementBuilder {
        private String title;
        private String content;
        private String author;
        private String authorRole;
        private Enums.TargetAudience targetAudience;
        private Long targetClassId;
        private Long targetSectionId;

        AnnouncementBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder title(final String title) {
            this.title = title;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder content(final String content) {
            this.content = content;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder author(final String author) {
            this.author = author;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder authorRole(final String authorRole) {
            this.authorRole = authorRole;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder targetAudience(final Enums.TargetAudience targetAudience) {
            this.targetAudience = targetAudience;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Announcement.AnnouncementBuilder targetClassId(final Long targetClassId) {
            this.targetClassId = targetClassId;
            return this;
        }

        public Announcement.AnnouncementBuilder targetSectionId(final Long targetSectionId) {
            this.targetSectionId = targetSectionId;
            return this;
        }

        public Announcement build() {
            return new Announcement(this.title, this.content, this.author, this.authorRole, this.targetAudience, this.targetClassId, this.targetSectionId);
        }

        @Override
        public String toString() {
            return "Announcement.AnnouncementBuilder(title=" + this.title + ", content=" + this.content + ", author=" + this.author + ", authorRole=" + this.authorRole + ", targetAudience=" + this.targetAudience + ", targetClassId=" + this.targetClassId + ", targetSectionId=" + this.targetSectionId + ")";
        }
    }

    public static Announcement.AnnouncementBuilder builder() {
        return new Announcement.AnnouncementBuilder();
    }

    public String getTitle() {
        return this.title;
    }

    public String getContent() {
        return this.content;
    }

    public String getAuthor() {
        return this.author;
    }

    public String getAuthorRole() {
        return this.authorRole;
    }

    public Enums.TargetAudience getTargetAudience() {
        return this.targetAudience;
    }

    public Long getTargetClassId() {
        return this.targetClassId;
    }

    public Long getTargetSectionId() {
        return this.targetSectionId;
    }

    public void setTitle(final String title) {
        this.title = title;
    }

    public void setContent(final String content) {
        this.content = content;
    }

    public void setAuthor(final String author) {
        this.author = author;
    }

    public void setAuthorRole(final String authorRole) {
        this.authorRole = authorRole;
    }

    public void setTargetAudience(final Enums.TargetAudience targetAudience) {
        this.targetAudience = targetAudience;
    }

    public void setTargetClassId(final Long targetClassId) {
        this.targetClassId = targetClassId;
    }

    public void setTargetSectionId(final Long targetSectionId) {
        this.targetSectionId = targetSectionId;
    }

    public Announcement() {
    }

    public Announcement(final String title, final String content, final String author, final String authorRole, final Enums.TargetAudience targetAudience, final Long targetClassId, final Long targetSectionId) {
        this.title = title;
        this.content = content;
        this.author = author;
        this.authorRole = authorRole;
        this.targetAudience = targetAudience;
        this.targetClassId = targetClassId;
        this.targetSectionId = targetSectionId;
    }
}
