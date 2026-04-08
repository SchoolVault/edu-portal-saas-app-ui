package com.school.erp.modules.auth.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"tenant_id", "email"})
}, indexes = {
        @Index(name = "idx_user_tenant", columnNames = "tenant_id"),
        @Index(name = "idx_user_email", columnNames = {"tenant_id", "email"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class User extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 150)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(length = 20)
    private String phone;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Enums.Role role;

    @Column(length = 100)
    private String schoolCode;

    @Column(length = 500)
    private String avatar;
}
