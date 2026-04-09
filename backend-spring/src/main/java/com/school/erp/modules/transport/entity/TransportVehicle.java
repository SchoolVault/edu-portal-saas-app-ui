package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "transport_vehicles", indexes = @Index(name = "idx_transport_vehicle_tenant", columnList = "tenant_id"))
public class TransportVehicle extends BaseEntity {
    @Column(name = "registration_number", nullable = false, length = 40)
    private String registrationNumber;
    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "vehicle_type", nullable = false, length = 30)
    private Enums.VehicleType vehicleType = Enums.VehicleType.BUS;
    @Column(nullable = false)
    private Integer capacity = 40;
    @Column(length = 80)
    private String model;

    public String getRegistrationNumber() {
        return registrationNumber;
    }

    public void setRegistrationNumber(String registrationNumber) {
        this.registrationNumber = registrationNumber;
    }

    public Enums.VehicleType getVehicleType() {
        return vehicleType;
    }

    public void setVehicleType(Enums.VehicleType vehicleType) {
        this.vehicleType = vehicleType;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }
}
