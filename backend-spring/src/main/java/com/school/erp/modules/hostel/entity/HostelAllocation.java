package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import com.school.erp.common.enums.Enums;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "hostel_allocations", indexes = {@Index(name = "idx_ha_student", columnList = "tenant_id, student_id"), @Index(name = "idx_ha_room", columnList = "tenant_id, room_id")})
public class HostelAllocation extends BaseEntity {
    @Column(name = "room_id", nullable = false)
    private Long roomId;
    @Column(name = "room_number", length = 20)
    private String roomNumber;
    @Column(name = "student_id", nullable = false)
    private Long studentId;
    @Column(name = "student_name", length = 200)
    private String studentName;
    @Column(name = "from_date")
    private LocalDate fromDate;
    @Column(name = "to_date")
    private LocalDate toDate;
    @Enumerated(EnumType.STRING)
    @Column(length = 10)
    private Enums.HostelAllocationStatus status;


    public static class HostelAllocationBuilder {
        private Long roomId;
        private String roomNumber;
        private Long studentId;
        private String studentName;
        private LocalDate fromDate;
        private LocalDate toDate;
        private Enums.HostelAllocationStatus status;

        HostelAllocationBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder roomId(final Long roomId) {
            this.roomId = roomId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder roomNumber(final String roomNumber) {
            this.roomNumber = roomNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder studentId(final Long studentId) {
            this.studentId = studentId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder studentName(final String studentName) {
            this.studentName = studentName;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder fromDate(final LocalDate fromDate) {
            this.fromDate = fromDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder toDate(final LocalDate toDate) {
            this.toDate = toDate;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelAllocation.HostelAllocationBuilder status(final Enums.HostelAllocationStatus status) {
            this.status = status;
            return this;
        }

        public HostelAllocation build() {
            return new HostelAllocation(this.roomId, this.roomNumber, this.studentId, this.studentName, this.fromDate, this.toDate, this.status);
        }

        @Override
        public String toString() {
            return "HostelAllocation.HostelAllocationBuilder(roomId=" + this.roomId + ", roomNumber=" + this.roomNumber + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", fromDate=" + this.fromDate + ", toDate=" + this.toDate + ", status=" + this.status + ")";
        }
    }

    public static HostelAllocation.HostelAllocationBuilder builder() {
        return new HostelAllocation.HostelAllocationBuilder();
    }

    public Long getRoomId() {
        return this.roomId;
    }

    public String getRoomNumber() {
        return this.roomNumber;
    }

    public Long getStudentId() {
        return this.studentId;
    }

    public String getStudentName() {
        return this.studentName;
    }

    public LocalDate getFromDate() {
        return this.fromDate;
    }

    public LocalDate getToDate() {
        return this.toDate;
    }

    public Enums.HostelAllocationStatus getStatus() {
        return this.status;
    }

    public void setRoomId(final Long roomId) {
        this.roomId = roomId;
    }

    public void setRoomNumber(final String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public void setStudentId(final Long studentId) {
        this.studentId = studentId;
    }

    public void setStudentName(final String studentName) {
        this.studentName = studentName;
    }

    public void setFromDate(final LocalDate fromDate) {
        this.fromDate = fromDate;
    }

    public void setToDate(final LocalDate toDate) {
        this.toDate = toDate;
    }

    public void setStatus(final Enums.HostelAllocationStatus status) {
        this.status = status;
    }

    public HostelAllocation() {
    }

    public HostelAllocation(final Long roomId, final String roomNumber, final Long studentId, final String studentName, final LocalDate fromDate, final LocalDate toDate, final Enums.HostelAllocationStatus status) {
        this.roomId = roomId;
        this.roomNumber = roomNumber;
        this.studentId = studentId;
        this.studentName = studentName;
        this.fromDate = fromDate;
        this.toDate = toDate;
        this.status = status;
    }
}
