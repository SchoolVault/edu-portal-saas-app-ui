package com.school.erp.modules.notification.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.entity.AcademicYearScopedEntity;
import com.school.erp.common.entity.AcademicYearScopeGuardListener;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import com.school.erp.tenant.hibernate.AcademicYearScopedFilter;

@Entity
@EntityListeners(AcademicYearScopeGuardListener.class)
@Filter(name = AcademicYearScopedFilter.NAME, condition = "academic_year_id = :academicYearId")
@Table(name = "notifications", indexes = {@Index(name = "idx_notif_user", columnList = "tenant_id, user_id"), @Index(name = "idx_notif_read", columnList = "tenant_id, user_id, is_read")})
public class Notification extends BaseEntity implements AcademicYearScopedEntity {
    @Column(name = "academic_year_id")
    private Long academicYearId;
    @Override
    public Long getAcademicYearId() {
        return academicYearId;
    }

    @Override
    public void setAcademicYearId(Long academicYearId) {
        this.academicYearId = academicYearId;
    }

    @Column(nullable = false, length = 200)
    private String title;
    @Column(length = 500)
    private String message;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(length = 10)
    private Enums.NotificationType type;
    @Column(name = "is_read")
    private Boolean isRead = false;
    @Column(name = "user_id", nullable = false)
    private Long userId;
    @Column(length = 300)
    private String link;


    public static class NotificationBuilder {
        private String title;
        private String message;
        private Enums.NotificationType type;
        private Boolean isRead;
        private Long userId;
        private String link;

        NotificationBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder title(final String title) {
            this.title = title;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder message(final String message) {
            this.message = message;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder type(final Enums.NotificationType type) {
            this.type = type;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder isRead(final Boolean isRead) {
            this.isRead = isRead;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder userId(final Long userId) {
            this.userId = userId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public Notification.NotificationBuilder link(final String link) {
            this.link = link;
            return this;
        }

        public Notification build() {
            return new Notification(this.title, this.message, this.type, this.isRead, this.userId, this.link);
        }

        @Override
        public String toString() {
            return "Notification.NotificationBuilder(title=" + this.title + ", message=" + this.message + ", type=" + this.type + ", isRead=" + this.isRead + ", userId=" + this.userId + ", link=" + this.link + ")";
        }
    }

    public static Notification.NotificationBuilder builder() {
        return new Notification.NotificationBuilder();
    }

    public String getTitle() {
        return this.title;
    }

    public String getMessage() {
        return this.message;
    }

    public Enums.NotificationType getType() {
        return this.type;
    }

    public Boolean getIsRead() {
        return this.isRead;
    }

    public Long getUserId() {
        return this.userId;
    }

    public String getLink() {
        return this.link;
    }

    public void setTitle(final String title) {
        this.title = title;
    }

    public void setMessage(final String message) {
        this.message = message;
    }

    public void setType(final Enums.NotificationType type) {
        this.type = type;
    }

    public void setIsRead(final Boolean isRead) {
        this.isRead = isRead;
    }

    public void setUserId(final Long userId) {
        this.userId = userId;
    }

    public void setLink(final String link) {
        this.link = link;
    }

    public Notification() {
    }

    public Notification(final String title, final String message, final Enums.NotificationType type, final Boolean isRead, final Long userId, final String link) {
        this.title = title;
        this.message = message;
        this.type = type;
        this.isRead = isRead;
        this.userId = userId;
        this.link = link;
    }
}
