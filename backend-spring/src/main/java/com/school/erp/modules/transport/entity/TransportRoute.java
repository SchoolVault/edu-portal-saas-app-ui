package com.school.erp.modules.transport.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "transport_routes") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class TransportRoute extends BaseEntity {
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "vehicle_number", length = 20) private String vehicleNumber;
    @Column(name = "driver_name", length = 100) private String driverName;
    @Column(name = "driver_phone", length = 20) private String driverPhone;
    @Column(name = "assigned_students") private Integer assignedStudents = 0;
}
