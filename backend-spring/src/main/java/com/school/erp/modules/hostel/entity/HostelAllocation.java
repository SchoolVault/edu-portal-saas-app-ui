package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "hostel_allocations", indexes = {
    @Index(name = "idx_ha_student", columnNames = {"tenant_id", "student_id"}),
    @Index(name = "idx_ha_room", columnNames = {"tenant_id", "room_id"})
})
@Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class HostelAllocation extends BaseEntity {
    @Column(name = "room_id", nullable = false) private Long roomId;
    @Column(name = "room_number", length = 20) private String roomNumber;
    @Column(name = "student_id", nullable = false) private Long studentId;
    @Column(name = "student_name", length = 200) private String studentName;
    @Column(name = "from_date") private LocalDate fromDate;
    @Column(name = "to_date") private LocalDate toDate;
    @Enumerated(EnumType.STRING) @Column(length = 10) private Enums.HostelAllocationStatus status;
}
