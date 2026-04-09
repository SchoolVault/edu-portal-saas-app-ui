package com.school.erp.modules.hostel.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.List;

public class HostelDTOs {

    public static class RoomResponse {
        private Long id;
        private String roomNumber;
        private String block;
        private Integer floor;
        private Integer capacity;
        private int occupancy;
        private String roomType;
        private List<AllocationDTO> residents;
        private Long hostelId;
        private String hostelName;


        public static class RoomResponseBuilder {
            private Long id;
            private String roomNumber;
            private String block;
            private Integer floor;
            private Integer capacity;
            private int occupancy;
            private String roomType;
            private List<AllocationDTO> residents;

            RoomResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder roomNumber(final String roomNumber) {
                this.roomNumber = roomNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder block(final String block) {
                this.block = block;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder floor(final Integer floor) {
                this.floor = floor;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder capacity(final Integer capacity) {
                this.capacity = capacity;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder occupancy(final int occupancy) {
                this.occupancy = occupancy;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder roomType(final String roomType) {
                this.roomType = roomType;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.RoomResponse.RoomResponseBuilder residents(final List<AllocationDTO> residents) {
                this.residents = residents;
                return this;
            }

            public HostelDTOs.RoomResponse build() {
                return new HostelDTOs.RoomResponse(this.id, this.roomNumber, this.block, this.floor, this.capacity, this.occupancy, this.roomType, this.residents);
            }

            @Override
            public String toString() {
                return "HostelDTOs.RoomResponse.RoomResponseBuilder(id=" + this.id + ", roomNumber=" + this.roomNumber + ", block=" + this.block + ", floor=" + this.floor + ", capacity=" + this.capacity + ", occupancy=" + this.occupancy + ", roomType=" + this.roomType + ", residents=" + this.residents + ")";
            }
        }

        public static HostelDTOs.RoomResponse.RoomResponseBuilder builder() {
            return new HostelDTOs.RoomResponse.RoomResponseBuilder();
        }

        public Long getId() {
            return this.id;
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

        public int getOccupancy() {
            return this.occupancy;
        }

        public String getRoomType() {
            return this.roomType;
        }

        public List<AllocationDTO> getResidents() {
            return this.residents;
        }

        public Long getHostelId() {
            return hostelId;
        }

        public void setHostelId(Long hostelId) {
            this.hostelId = hostelId;
        }

        public String getHostelName() {
            return hostelName;
        }

        public void setHostelName(String hostelName) {
            this.hostelName = hostelName;
        }

        public void setId(final Long id) {
            this.id = id;
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

        public void setOccupancy(final int occupancy) {
            this.occupancy = occupancy;
        }

        public void setRoomType(final String roomType) {
            this.roomType = roomType;
        }

        public void setResidents(final List<AllocationDTO> residents) {
            this.residents = residents;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof HostelDTOs.RoomResponse)) return false;
            final HostelDTOs.RoomResponse other = (HostelDTOs.RoomResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getOccupancy() != other.getOccupancy()) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$floor = this.getFloor();
            final Object other$floor = other.getFloor();
            if (this$floor == null ? other$floor != null : !this$floor.equals(other$floor)) return false;
            final Object this$capacity = this.getCapacity();
            final Object other$capacity = other.getCapacity();
            if (this$capacity == null ? other$capacity != null : !this$capacity.equals(other$capacity)) return false;
            final Object this$roomNumber = this.getRoomNumber();
            final Object other$roomNumber = other.getRoomNumber();
            if (this$roomNumber == null ? other$roomNumber != null : !this$roomNumber.equals(other$roomNumber)) return false;
            final Object this$block = this.getBlock();
            final Object other$block = other.getBlock();
            if (this$block == null ? other$block != null : !this$block.equals(other$block)) return false;
            final Object this$roomType = this.getRoomType();
            final Object other$roomType = other.getRoomType();
            if (this$roomType == null ? other$roomType != null : !this$roomType.equals(other$roomType)) return false;
            final Object this$residents = this.getResidents();
            final Object other$residents = other.getResidents();
            if (this$residents == null ? other$residents != null : !this$residents.equals(other$residents)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof HostelDTOs.RoomResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            result = result * PRIME + this.getOccupancy();
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $floor = this.getFloor();
            result = result * PRIME + ($floor == null ? 43 : $floor.hashCode());
            final Object $capacity = this.getCapacity();
            result = result * PRIME + ($capacity == null ? 43 : $capacity.hashCode());
            final Object $roomNumber = this.getRoomNumber();
            result = result * PRIME + ($roomNumber == null ? 43 : $roomNumber.hashCode());
            final Object $block = this.getBlock();
            result = result * PRIME + ($block == null ? 43 : $block.hashCode());
            final Object $roomType = this.getRoomType();
            result = result * PRIME + ($roomType == null ? 43 : $roomType.hashCode());
            final Object $residents = this.getResidents();
            result = result * PRIME + ($residents == null ? 43 : $residents.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "HostelDTOs.RoomResponse(id=" + this.getId() + ", roomNumber=" + this.getRoomNumber() + ", block=" + this.getBlock() + ", floor=" + this.getFloor() + ", capacity=" + this.getCapacity() + ", occupancy=" + this.getOccupancy() + ", roomType=" + this.getRoomType() + ", residents=" + this.getResidents() + ")";
        }

        public RoomResponse() {
        }

        public RoomResponse(final Long id, final String roomNumber, final String block, final Integer floor, final Integer capacity, final int occupancy, final String roomType, final List<AllocationDTO> residents) {
            this.id = id;
            this.roomNumber = roomNumber;
            this.block = block;
            this.floor = floor;
            this.capacity = capacity;
            this.occupancy = occupancy;
            this.roomType = roomType;
            this.residents = residents;
        }
    }


    public static class AllocationDTO {
        private Long id;
        private Long studentId;
        private String studentName;
        private String fromDate;
        private String toDate;
        private String status;


        public static class AllocationDTOBuilder {
            private Long id;
            private Long studentId;
            private String studentName;
            private String fromDate;
            private String toDate;
            private String status;

            AllocationDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder fromDate(final String fromDate) {
                this.fromDate = fromDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder toDate(final String toDate) {
                this.toDate = toDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocationDTO.AllocationDTOBuilder status(final String status) {
                this.status = status;
                return this;
            }

            public HostelDTOs.AllocationDTO build() {
                return new HostelDTOs.AllocationDTO(this.id, this.studentId, this.studentName, this.fromDate, this.toDate, this.status);
            }

            @Override
            public String toString() {
                return "HostelDTOs.AllocationDTO.AllocationDTOBuilder(id=" + this.id + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", fromDate=" + this.fromDate + ", toDate=" + this.toDate + ", status=" + this.status + ")";
            }
        }

        public static HostelDTOs.AllocationDTO.AllocationDTOBuilder builder() {
            return new HostelDTOs.AllocationDTO.AllocationDTOBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public Long getStudentId() {
            return this.studentId;
        }

        public String getStudentName() {
            return this.studentName;
        }

        public String getFromDate() {
            return this.fromDate;
        }

        public String getToDate() {
            return this.toDate;
        }

        public String getStatus() {
            return this.status;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setStudentId(final Long studentId) {
            this.studentId = studentId;
        }

        public void setStudentName(final String studentName) {
            this.studentName = studentName;
        }

        public void setFromDate(final String fromDate) {
            this.fromDate = fromDate;
        }

        public void setToDate(final String toDate) {
            this.toDate = toDate;
        }

        public void setStatus(final String status) {
            this.status = status;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof HostelDTOs.AllocationDTO)) return false;
            final HostelDTOs.AllocationDTO other = (HostelDTOs.AllocationDTO) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$fromDate = this.getFromDate();
            final Object other$fromDate = other.getFromDate();
            if (this$fromDate == null ? other$fromDate != null : !this$fromDate.equals(other$fromDate)) return false;
            final Object this$toDate = this.getToDate();
            final Object other$toDate = other.getToDate();
            if (this$toDate == null ? other$toDate != null : !this$toDate.equals(other$toDate)) return false;
            final Object this$status = this.getStatus();
            final Object other$status = other.getStatus();
            if (this$status == null ? other$status != null : !this$status.equals(other$status)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof HostelDTOs.AllocationDTO;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $fromDate = this.getFromDate();
            result = result * PRIME + ($fromDate == null ? 43 : $fromDate.hashCode());
            final Object $toDate = this.getToDate();
            result = result * PRIME + ($toDate == null ? 43 : $toDate.hashCode());
            final Object $status = this.getStatus();
            result = result * PRIME + ($status == null ? 43 : $status.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "HostelDTOs.AllocationDTO(id=" + this.getId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", fromDate=" + this.getFromDate() + ", toDate=" + this.getToDate() + ", status=" + this.getStatus() + ")";
        }

        public AllocationDTO() {
        }

        public AllocationDTO(final Long id, final Long studentId, final String studentName, final String fromDate, final String toDate, final String status) {
            this.id = id;
            this.studentId = studentId;
            this.studentName = studentName;
            this.fromDate = fromDate;
            this.toDate = toDate;
            this.status = status;
        }
    }


    public static class AllocateRequest {
        @NotNull
        private Long roomId;
        @NotNull
        private Long studentId;
        private String studentName;
        private LocalDate fromDate;
        private LocalDate toDate;


        public static class AllocateRequestBuilder {
            private Long roomId;
            private Long studentId;
            private String studentName;
            private LocalDate fromDate;
            private LocalDate toDate;

            AllocateRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocateRequest.AllocateRequestBuilder roomId(final Long roomId) {
                this.roomId = roomId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocateRequest.AllocateRequestBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocateRequest.AllocateRequestBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocateRequest.AllocateRequestBuilder fromDate(final LocalDate fromDate) {
                this.fromDate = fromDate;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.AllocateRequest.AllocateRequestBuilder toDate(final LocalDate toDate) {
                this.toDate = toDate;
                return this;
            }

            public HostelDTOs.AllocateRequest build() {
                return new HostelDTOs.AllocateRequest(this.roomId, this.studentId, this.studentName, this.fromDate, this.toDate);
            }

            @Override
            public String toString() {
                return "HostelDTOs.AllocateRequest.AllocateRequestBuilder(roomId=" + this.roomId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", fromDate=" + this.fromDate + ", toDate=" + this.toDate + ")";
            }
        }

        public static HostelDTOs.AllocateRequest.AllocateRequestBuilder builder() {
            return new HostelDTOs.AllocateRequest.AllocateRequestBuilder();
        }

        public Long getRoomId() {
            return this.roomId;
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

        public void setRoomId(final Long roomId) {
            this.roomId = roomId;
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

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof HostelDTOs.AllocateRequest)) return false;
            final HostelDTOs.AllocateRequest other = (HostelDTOs.AllocateRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$roomId = this.getRoomId();
            final Object other$roomId = other.getRoomId();
            if (this$roomId == null ? other$roomId != null : !this$roomId.equals(other$roomId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$fromDate = this.getFromDate();
            final Object other$fromDate = other.getFromDate();
            if (this$fromDate == null ? other$fromDate != null : !this$fromDate.equals(other$fromDate)) return false;
            final Object this$toDate = this.getToDate();
            final Object other$toDate = other.getToDate();
            if (this$toDate == null ? other$toDate != null : !this$toDate.equals(other$toDate)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof HostelDTOs.AllocateRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $roomId = this.getRoomId();
            result = result * PRIME + ($roomId == null ? 43 : $roomId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $fromDate = this.getFromDate();
            result = result * PRIME + ($fromDate == null ? 43 : $fromDate.hashCode());
            final Object $toDate = this.getToDate();
            result = result * PRIME + ($toDate == null ? 43 : $toDate.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "HostelDTOs.AllocateRequest(roomId=" + this.getRoomId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", fromDate=" + this.getFromDate() + ", toDate=" + this.getToDate() + ")";
        }

        public AllocateRequest() {
        }

        public AllocateRequest(final Long roomId, final Long studentId, final String studentName, final LocalDate fromDate, final LocalDate toDate) {
            this.roomId = roomId;
            this.studentId = studentId;
            this.studentName = studentName;
            this.fromDate = fromDate;
            this.toDate = toDate;
        }
    }


    public static class HostelStats {
        private int totalRooms;
        private int totalCapacity;
        private int totalOccupancy;
        private int availableBeds;
        private int blocks;


        public static class HostelStatsBuilder {
            private int totalRooms;
            private int totalCapacity;
            private int totalOccupancy;
            private int availableBeds;
            private int blocks;

            HostelStatsBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.HostelStats.HostelStatsBuilder totalRooms(final int totalRooms) {
                this.totalRooms = totalRooms;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.HostelStats.HostelStatsBuilder totalCapacity(final int totalCapacity) {
                this.totalCapacity = totalCapacity;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.HostelStats.HostelStatsBuilder totalOccupancy(final int totalOccupancy) {
                this.totalOccupancy = totalOccupancy;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.HostelStats.HostelStatsBuilder availableBeds(final int availableBeds) {
                this.availableBeds = availableBeds;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public HostelDTOs.HostelStats.HostelStatsBuilder blocks(final int blocks) {
                this.blocks = blocks;
                return this;
            }

            public HostelDTOs.HostelStats build() {
                return new HostelDTOs.HostelStats(this.totalRooms, this.totalCapacity, this.totalOccupancy, this.availableBeds, this.blocks);
            }

            @Override
            public String toString() {
                return "HostelDTOs.HostelStats.HostelStatsBuilder(totalRooms=" + this.totalRooms + ", totalCapacity=" + this.totalCapacity + ", totalOccupancy=" + this.totalOccupancy + ", availableBeds=" + this.availableBeds + ", blocks=" + this.blocks + ")";
            }
        }

        public static HostelDTOs.HostelStats.HostelStatsBuilder builder() {
            return new HostelDTOs.HostelStats.HostelStatsBuilder();
        }

        public int getTotalRooms() {
            return this.totalRooms;
        }

        public int getTotalCapacity() {
            return this.totalCapacity;
        }

        public int getTotalOccupancy() {
            return this.totalOccupancy;
        }

        public int getAvailableBeds() {
            return this.availableBeds;
        }

        public int getBlocks() {
            return this.blocks;
        }

        public void setTotalRooms(final int totalRooms) {
            this.totalRooms = totalRooms;
        }

        public void setTotalCapacity(final int totalCapacity) {
            this.totalCapacity = totalCapacity;
        }

        public void setTotalOccupancy(final int totalOccupancy) {
            this.totalOccupancy = totalOccupancy;
        }

        public void setAvailableBeds(final int availableBeds) {
            this.availableBeds = availableBeds;
        }

        public void setBlocks(final int blocks) {
            this.blocks = blocks;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof HostelDTOs.HostelStats)) return false;
            final HostelDTOs.HostelStats other = (HostelDTOs.HostelStats) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getTotalRooms() != other.getTotalRooms()) return false;
            if (this.getTotalCapacity() != other.getTotalCapacity()) return false;
            if (this.getTotalOccupancy() != other.getTotalOccupancy()) return false;
            if (this.getAvailableBeds() != other.getAvailableBeds()) return false;
            if (this.getBlocks() != other.getBlocks()) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof HostelDTOs.HostelStats;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            result = result * PRIME + this.getTotalRooms();
            result = result * PRIME + this.getTotalCapacity();
            result = result * PRIME + this.getTotalOccupancy();
            result = result * PRIME + this.getAvailableBeds();
            result = result * PRIME + this.getBlocks();
            return result;
        }

        @Override
        public String toString() {
            return "HostelDTOs.HostelStats(totalRooms=" + this.getTotalRooms() + ", totalCapacity=" + this.getTotalCapacity() + ", totalOccupancy=" + this.getTotalOccupancy() + ", availableBeds=" + this.getAvailableBeds() + ", blocks=" + this.getBlocks() + ")";
        }

        public HostelStats() {
        }

        public HostelStats(final int totalRooms, final int totalCapacity, final int totalOccupancy, final int availableBeds, final int blocks) {
            this.totalRooms = totalRooms;
            this.totalCapacity = totalCapacity;
            this.totalOccupancy = totalOccupancy;
            this.availableBeds = availableBeds;
            this.blocks = blocks;
        }
    }

    public static class HostelSummary {
        private Long id;
        private String name;
        private String code;
        private String genderScope;
        private int roomCount;
        private int availableBeds;

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getCode() {
            return code;
        }

        public void setCode(String code) {
            this.code = code;
        }

        public String getGenderScope() {
            return genderScope;
        }

        public void setGenderScope(String genderScope) {
            this.genderScope = genderScope;
        }

        public int getRoomCount() {
            return roomCount;
        }

        public void setRoomCount(int roomCount) {
            this.roomCount = roomCount;
        }

        public int getAvailableBeds() {
            return availableBeds;
        }

        public void setAvailableBeds(int availableBeds) {
            this.availableBeds = availableBeds;
        }
    }
}
