package com.school.erp.modules.hostel.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*;
@Entity @Table(name = "hostel_rooms") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class HostelRoom extends BaseEntity {
    @Column(name = "room_number", length = 20) private String roomNumber;
    @Column(length = 50) private String block;
    private Integer floor;
    private Integer capacity;
    private Integer occupancy = 0;
    @Column(name = "room_type", length = 20) private String roomType;
}
