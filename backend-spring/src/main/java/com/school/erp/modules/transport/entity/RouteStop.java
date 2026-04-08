package com.school.erp.modules.transport.entity;
import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*; import lombok.*; import java.time.LocalTime;
@Entity @Table(name = "route_stops") @Getter @Setter @Builder @NoArgsConstructor @AllArgsConstructor
public class RouteStop extends BaseEntity {
    @Column(name = "route_id", nullable = false) private Long routeId;
    @Column(nullable = false, length = 100) private String name;
    @Column(name = "stop_time") private LocalTime stopTime;
    @Column(name = "stop_order") private Integer stopOrder;
}
