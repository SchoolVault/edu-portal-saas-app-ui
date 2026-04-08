package com.school.erp.modules.settings.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "tenant_configs", uniqueConstraints = @UniqueConstraint(columnNames = "tenant_id"))
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TenantConfig extends BaseEntity {
    @Column(name = "school_name", nullable = false, length = 200) private String schoolName;
    @Column(name = "school_code", nullable = false, length = 20) private String schoolCode;
    @Column(length = 500) private String logo;
    @Column(length = 500) private String address;
    @Column(length = 20) private String phone;
    @Column(length = 150) private String email;
    @Column(name = "primary_color", length = 10) private String primaryColor;
    @Column(name = "secondary_color", length = 10) private String secondaryColor;
    @Column(name = "features_json", columnDefinition = "TEXT") private String featuresJson;
}
