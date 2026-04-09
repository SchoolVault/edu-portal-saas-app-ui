package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "student_transport_mapping", indexes = {@Index(name = "idx_stm_student", columnList = "tenant_id, student_id"), @Index(name = "idx_stm_route", columnList = "tenant_id, route_id")})
public class StudentTransportMapping extends BaseEntity {
    @Column(name = "route_id", nullable = false)
    private Long routeId;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "pickup_stop", length = 100)
    private String pickupStop;
    @Column(name = "drop_stop", length = 100)
    private String dropStop;


    public static class StudentTransportMappingBuilder {
        private Long routeId;
        private Long studentId;
        private String studentName;
        private String pickupStop;
        private String dropStop;

        StudentTransportMappingBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public StudentTransportMapping.StudentTransportMappingBuilder routeId(final Long routeId) {
            this.routeId = routeId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public StudentTransportMapping.StudentTransportMappingBuilder studentId(final Long studentId) {
            this.studentId = studentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public StudentTransportMapping.StudentTransportMappingBuilder studentName(final String studentName) {
            this.studentName = studentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public StudentTransportMapping.StudentTransportMappingBuilder pickupStop(final String pickupStop) {
            this.pickupStop = pickupStop;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public StudentTransportMapping.StudentTransportMappingBuilder dropStop(final String dropStop) {
            this.dropStop = dropStop;
            return this;
        }

        public StudentTransportMapping build() {
            return new StudentTransportMapping(this.routeId, this.studentId, this.studentName, this.pickupStop, this.dropStop);
        }

        @Override
        public String toString() {
            return "StudentTransportMapping.StudentTransportMappingBuilder(routeId=" + this.routeId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", pickupStop=" + this.pickupStop + ", dropStop=" + this.dropStop + ")";
        }
    }

    public static StudentTransportMapping.StudentTransportMappingBuilder builder() {
        return new StudentTransportMapping.StudentTransportMappingBuilder();
    }

    public Long getRouteId() {
        return this.routeId;
    }

    public Long getStudentId() {
        return this.studentId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public String getPickupStop() {
        return this.pickupStop;
    }

    public String getDropStop() {
        return this.dropStop;
    }

    public void setRouteId(final Long routeId) {
        this.routeId = routeId;
    }

    public void setStudentId(final Long studentId) {
        this.studentId = studentId;
    }

    public void setStudentName(final String studentName) {
        this.studentName = studentName;
    }

    public void setPickupStop(final String pickupStop) {
        this.pickupStop = pickupStop;
    }

    public void setDropStop(final String dropStop) {
        this.dropStop = dropStop;
    }

    public StudentTransportMapping() {
    }

    public StudentTransportMapping(final Long routeId, final Long studentId, final String studentName, final String pickupStop, final String dropStop) {
        this.routeId = routeId;
        this.studentId = studentId;
        this.studentName = studentName;
        this.pickupStop = pickupStop;
        this.dropStop = dropStop;
    }
}
