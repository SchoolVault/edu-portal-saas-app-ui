package com.school.erp.modules.hostel.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;

@Entity
@Table(name = "hostel_rooms")
public class HostelRoom extends BaseEntity {
    @Column(name = "room_number", length = 20)
    private String roomNumber;
    @Column(length = 50)
    private String block;
    private Integer floor;
    private Integer capacity;
    private Integer occupancy = 0;
    @Column(name = "room_type", length = 20)
    private String roomType;


    public static class HostelRoomBuilder {
        private String roomNumber;
        private String block;
        private Integer floor;
        private Integer capacity;
        private Integer occupancy;
        private String roomType;

        HostelRoomBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder roomNumber(final String roomNumber) {
            this.roomNumber = roomNumber;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder block(final String block) {
            this.block = block;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder floor(final Integer floor) {
            this.floor = floor;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder capacity(final Integer capacity) {
            this.capacity = capacity;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder occupancy(final Integer occupancy) {
            this.occupancy = occupancy;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public HostelRoom.HostelRoomBuilder roomType(final String roomType) {
            this.roomType = roomType;
            return this;
        }

        public HostelRoom build() {
            return new HostelRoom(this.roomNumber, this.block, this.floor, this.capacity, this.occupancy, this.roomType);
        }

        @Override
        public String toString() {
            return "HostelRoom.HostelRoomBuilder(roomNumber=" + this.roomNumber + ", block=" + this.block + ", floor=" + this.floor + ", capacity=" + this.capacity + ", occupancy=" + this.occupancy + ", roomType=" + this.roomType + ")";
        }
    }

    public static HostelRoom.HostelRoomBuilder builder() {
        return new HostelRoom.HostelRoomBuilder();
    }

    public String getRoomNumber() {
        return this.roomNumber;
    }

    public String getBlock() {
        return this.block;
    }

    public Integer getFloor() {
        return this.floor;
    }

    public Integer getCapacity() {
        return this.capacity;
    }

    public Integer getOccupancy() {
        return this.occupancy;
    }

    public String getRoomType() {
        return this.roomType;
    }

    public void setRoomNumber(final String roomNumber) {
        this.roomNumber = roomNumber;
    }

    public void setBlock(final String block) {
        this.block = block;
    }

    public void setFloor(final Integer floor) {
        this.floor = floor;
    }

    public void setCapacity(final Integer capacity) {
        this.capacity = capacity;
    }

    public void setOccupancy(final Integer occupancy) {
        this.occupancy = occupancy;
    }

    public void setRoomType(final String roomType) {
        this.roomType = roomType;
    }

    public HostelRoom() {
    }

    public HostelRoom(final String roomNumber, final String block, final Integer floor, final Integer capacity, final Integer occupancy, final String roomType) {
        this.roomNumber = roomNumber;
        this.block = block;
        this.floor = floor;
        this.capacity = capacity;
        this.occupancy = occupancy;
        this.roomType = roomType;
    }
}
