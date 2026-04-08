package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "student_transport_mapping", indexes = {
    @Index(name = "idx_stm_student", columnNames = {"tenant_id", "student_id"}),
    @Index(name = "idx_stm_route", columnNames = {"tenant_id", "route_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class StudentTransportMapping extends BaseEntity {
    @Column(name = "route_id", nullable = false) private Long routeId;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "pickup_stop", length = 100) private String pickupStop;
    @Column(name = "drop_stop", length = 100) private String dropStop;
}
