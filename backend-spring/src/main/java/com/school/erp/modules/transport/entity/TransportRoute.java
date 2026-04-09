package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "transport_routes")
public class TransportRoute extends BaseEntity {
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "vehicle_number", length = 20)
    private String vehicleNumber;
    @Column(name = "driver_name", length = 100)
    private String driverName;
    @Column(name = "driver_phone", length = 20)
    private String driverPhone;
    @Column(name = "assigned_students")
    private Integer assignedStudents = 0;
    @Column(name = "vehicle_id")
    private Long vehicleId;
    @Column(name = "driver_id")
    private Long driverId;


    public static class TransportRouteBuilder {
        private String name;
        private String vehicleNumber;
        private String driverName;
        private String driverPhone;
        private Integer assignedStudents;
        private Long vehicleId;
        private Long driverId;

        TransportRouteBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public TransportRoute.TransportRouteBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TransportRoute.TransportRouteBuilder vehicleNumber(final String vehicleNumber) {
            this.vehicleNumber = vehicleNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TransportRoute.TransportRouteBuilder driverName(final String driverName) {
            this.driverName = driverName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TransportRoute.TransportRouteBuilder driverPhone(final String driverPhone) {
            this.driverPhone = driverPhone;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public TransportRoute.TransportRouteBuilder assignedStudents(final Integer assignedStudents) {
            this.assignedStudents = assignedStudents;
            return this;
        }

        public TransportRoute.TransportRouteBuilder vehicleId(final Long vehicleId) {
            this.vehicleId = vehicleId;
            return this;
        }

        public TransportRoute.TransportRouteBuilder driverId(final Long driverId) {
            this.driverId = driverId;
            return this;
        }

        public TransportRoute build() {
            return new TransportRoute(this.name, this.vehicleNumber, this.driverName, this.driverPhone, this.assignedStudents, this.vehicleId, this.driverId);
        }

        @Override
        public String toString() {
            return "TransportRoute.TransportRouteBuilder(name=" + this.name + ", vehicleNumber=" + this.vehicleNumber + ", driverName=" + this.driverName + ", driverPhone=" + this.driverPhone + ", assignedStudents=" + this.assignedStudents + ", vehicleId=" + this.vehicleId + ", driverId=" + this.driverId + ")";
        }
    }

    public static TransportRoute.TransportRouteBuilder builder() {
        return new TransportRoute.TransportRouteBuilder();
    }

    public String getName() {
        return this.name;
    }

    public String getVehicleNumber() {
        return this.vehicleNumber;
    }

    public String getDriverName() {
        return this.driverName;
    }

    public String getDriverPhone() {
        return this.driverPhone;
    }

    public Integer getAssignedStudents() {
        return this.assignedStudents;
    }

    public Long getVehicleId() {
        return vehicleId;
    }

    public Long getDriverId() {
        return driverId;
    }

    public void setVehicleId(final Long vehicleId) {
        this.vehicleId = vehicleId;
    }

    public void setDriverId(final Long driverId) {
        this.driverId = driverId;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setVehicleNumber(final String vehicleNumber) {
        this.vehicleNumber = vehicleNumber;
    }

    public void setDriverName(final String driverName) {
        this.driverName = driverName;
    }

    public void setDriverPhone(final String driverPhone) {
        this.driverPhone = driverPhone;
    }

    public void setAssignedStudents(final Integer assignedStudents) {
        this.assignedStudents = assignedStudents;
    }

    public TransportRoute() {
    }

    public TransportRoute(final String name, final String vehicleNumber, final String driverName, final String driverPhone, final Integer assignedStudents, final Long vehicleId, final Long driverId) {
        this.name = name;
        this.vehicleNumber = vehicleNumber;
        this.driverName = driverName;
        this.driverPhone = driverPhone;
        this.assignedStudents = assignedStudents;
        this.vehicleId = vehicleId;
        this.driverId = driverId;
    }
}
