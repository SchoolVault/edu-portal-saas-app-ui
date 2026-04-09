package com.school.erp.modules.transport.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public class TransportDTOs {

    public static class RouteResponse {
        private Long id;
        private String name;
        private String vehicleNumber;
        private String driverName;
        private String driverPhone;
        private int assignedStudents;
        private List<StopDTO> stops;
        private List<StudentMappingDTO> students;
        private Long vehicleId;
        private Long driverId;
        private String vehicleType;
        private Double liveLatitude;
        private Double liveLongitude;
        private String liveRecordedAt;


        public static class RouteResponseBuilder {
            private Long id;
            private String name;
            private String vehicleNumber;
            private String driverName;
            private String driverPhone;
            private int assignedStudents;
            private List<StopDTO> stops;
            private List<StudentMappingDTO> students;

            RouteResponseBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder vehicleNumber(final String vehicleNumber) {
                this.vehicleNumber = vehicleNumber;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder driverName(final String driverName) {
                this.driverName = driverName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder driverPhone(final String driverPhone) {
                this.driverPhone = driverPhone;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder assignedStudents(final int assignedStudents) {
                this.assignedStudents = assignedStudents;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder stops(final List<StopDTO> stops) {
                this.stops = stops;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.RouteResponse.RouteResponseBuilder students(final List<StudentMappingDTO> students) {
                this.students = students;
                return this;
            }

            public TransportDTOs.RouteResponse build() {
                return new TransportDTOs.RouteResponse(this.id, this.name, this.vehicleNumber, this.driverName, this.driverPhone, this.assignedStudents, this.stops, this.students);
            }

            @Override
            public String toString() {
                return "TransportDTOs.RouteResponse.RouteResponseBuilder(id=" + this.id + ", name=" + this.name + ", vehicleNumber=" + this.vehicleNumber + ", driverName=" + this.driverName + ", driverPhone=" + this.driverPhone + ", assignedStudents=" + this.assignedStudents + ", stops=" + this.stops + ", students=" + this.students + ")";
            }
        }

        public static TransportDTOs.RouteResponse.RouteResponseBuilder builder() {
            return new TransportDTOs.RouteResponse.RouteResponseBuilder();
        }

        public Long getId() {
            return this.id;
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

        public int getAssignedStudents() {
            return this.assignedStudents;
        }

        public List<StopDTO> getStops() {
            return this.stops;
        }

        public List<StudentMappingDTO> getStudents() {
            return this.students;
        }

        public void setId(final Long id) {
            this.id = id;
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

        public void setAssignedStudents(final int assignedStudents) {
            this.assignedStudents = assignedStudents;
        }

        public void setStops(final List<StopDTO> stops) {
            this.stops = stops;
        }

        public void setStudents(final List<StudentMappingDTO> students) {
            this.students = students;
        }

        public Long getVehicleId() {
            return vehicleId;
        }

        public void setVehicleId(Long vehicleId) {
            this.vehicleId = vehicleId;
        }

        public Long getDriverId() {
            return driverId;
        }

        public void setDriverId(Long driverId) {
            this.driverId = driverId;
        }

        public String getVehicleType() {
            return vehicleType;
        }

        public void setVehicleType(String vehicleType) {
            this.vehicleType = vehicleType;
        }

        public Double getLiveLatitude() {
            return liveLatitude;
        }

        public void setLiveLatitude(Double liveLatitude) {
            this.liveLatitude = liveLatitude;
        }

        public Double getLiveLongitude() {
            return liveLongitude;
        }

        public void setLiveLongitude(Double liveLongitude) {
            this.liveLongitude = liveLongitude;
        }

        public String getLiveRecordedAt() {
            return liveRecordedAt;
        }

        public void setLiveRecordedAt(String liveRecordedAt) {
            this.liveRecordedAt = liveRecordedAt;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TransportDTOs.RouteResponse)) return false;
            final TransportDTOs.RouteResponse other = (TransportDTOs.RouteResponse) o;
            if (!other.canEqual((Object) this)) return false;
            if (this.getAssignedStudents() != other.getAssignedStudents()) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$vehicleNumber = this.getVehicleNumber();
            final Object other$vehicleNumber = other.getVehicleNumber();
            if (this$vehicleNumber == null ? other$vehicleNumber != null : !this$vehicleNumber.equals(other$vehicleNumber)) return false;
            final Object this$driverName = this.getDriverName();
            final Object other$driverName = other.getDriverName();
            if (this$driverName == null ? other$driverName != null : !this$driverName.equals(other$driverName)) return false;
            final Object this$driverPhone = this.getDriverPhone();
            final Object other$driverPhone = other.getDriverPhone();
            if (this$driverPhone == null ? other$driverPhone != null : !this$driverPhone.equals(other$driverPhone)) return false;
            final Object this$stops = this.getStops();
            final Object other$stops = other.getStops();
            if (this$stops == null ? other$stops != null : !this$stops.equals(other$stops)) return false;
            final Object this$students = this.getStudents();
            final Object other$students = other.getStudents();
            if (this$students == null ? other$students != null : !this$students.equals(other$students)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TransportDTOs.RouteResponse;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            result = result * PRIME + this.getAssignedStudents();
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $vehicleNumber = this.getVehicleNumber();
            result = result * PRIME + ($vehicleNumber == null ? 43 : $vehicleNumber.hashCode());
            final Object $driverName = this.getDriverName();
            result = result * PRIME + ($driverName == null ? 43 : $driverName.hashCode());
            final Object $driverPhone = this.getDriverPhone();
            result = result * PRIME + ($driverPhone == null ? 43 : $driverPhone.hashCode());
            final Object $stops = this.getStops();
            result = result * PRIME + ($stops == null ? 43 : $stops.hashCode());
            final Object $students = this.getStudents();
            result = result * PRIME + ($students == null ? 43 : $students.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TransportDTOs.RouteResponse(id=" + this.getId() + ", name=" + this.getName() + ", vehicleNumber=" + this.getVehicleNumber() + ", driverName=" + this.getDriverName() + ", driverPhone=" + this.getDriverPhone() + ", assignedStudents=" + this.getAssignedStudents() + ", stops=" + this.getStops() + ", students=" + this.getStudents() + ")";
        }

        public RouteResponse() {
        }

        public RouteResponse(final Long id, final String name, final String vehicleNumber, final String driverName, final String driverPhone, final int assignedStudents, final List<StopDTO> stops, final List<StudentMappingDTO> students) {
            this.id = id;
            this.name = name;
            this.vehicleNumber = vehicleNumber;
            this.driverName = driverName;
            this.driverPhone = driverPhone;
            this.assignedStudents = assignedStudents;
            this.stops = stops;
            this.students = students;
        }
    }


    public static class StopDTO {
        private Long id;
        private String name;
        private String time;
        private Integer order;


        public static class StopDTOBuilder {
            private Long id;
            private String name;
            private String time;
            private Integer order;

            StopDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StopDTO.StopDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StopDTO.StopDTOBuilder name(final String name) {
                this.name = name;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StopDTO.StopDTOBuilder time(final String time) {
                this.time = time;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StopDTO.StopDTOBuilder order(final Integer order) {
                this.order = order;
                return this;
            }

            public TransportDTOs.StopDTO build() {
                return new TransportDTOs.StopDTO(this.id, this.name, this.time, this.order);
            }

            @Override
            public String toString() {
                return "TransportDTOs.StopDTO.StopDTOBuilder(id=" + this.id + ", name=" + this.name + ", time=" + this.time + ", order=" + this.order + ")";
            }
        }

        public static TransportDTOs.StopDTO.StopDTOBuilder builder() {
            return new TransportDTOs.StopDTO.StopDTOBuilder();
        }

        public Long getId() {
            return this.id;
        }

        public String getName() {
            return this.name;
        }

        public String getTime() {
            return this.time;
        }

        public Integer getOrder() {
            return this.order;
        }

        public void setId(final Long id) {
            this.id = id;
        }

        public void setName(final String name) {
            this.name = name;
        }

        public void setTime(final String time) {
            this.time = time;
        }

        public void setOrder(final Integer order) {
            this.order = order;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TransportDTOs.StopDTO)) return false;
            final TransportDTOs.StopDTO other = (TransportDTOs.StopDTO) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$id = this.getId();
            final Object other$id = other.getId();
            if (this$id == null ? other$id != null : !this$id.equals(other$id)) return false;
            final Object this$order = this.getOrder();
            final Object other$order = other.getOrder();
            if (this$order == null ? other$order != null : !this$order.equals(other$order)) return false;
            final Object this$name = this.getName();
            final Object other$name = other.getName();
            if (this$name == null ? other$name != null : !this$name.equals(other$name)) return false;
            final Object this$time = this.getTime();
            final Object other$time = other.getTime();
            if (this$time == null ? other$time != null : !this$time.equals(other$time)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TransportDTOs.StopDTO;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $id = this.getId();
            result = result * PRIME + ($id == null ? 43 : $id.hashCode());
            final Object $order = this.getOrder();
            result = result * PRIME + ($order == null ? 43 : $order.hashCode());
            final Object $name = this.getName();
            result = result * PRIME + ($name == null ? 43 : $name.hashCode());
            final Object $time = this.getTime();
            result = result * PRIME + ($time == null ? 43 : $time.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TransportDTOs.StopDTO(id=" + this.getId() + ", name=" + this.getName() + ", time=" + this.getTime() + ", order=" + this.getOrder() + ")";
        }

        public StopDTO() {
        }

        public StopDTO(final Long id, final String name, final String time, final Integer order) {
            this.id = id;
            this.name = name;
            this.time = time;
            this.order = order;
        }
    }


    public static class StudentMappingDTO {
        private Long id;
        private Long studentId;
        private String studentName;
        private String pickupStop;
        private String dropStop;


        public static class StudentMappingDTOBuilder {
            private Long id;
            private Long studentId;
            private String studentName;
            private String pickupStop;
            private String dropStop;

            StudentMappingDTOBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder id(final Long id) {
                this.id = id;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder pickupStop(final String pickupStop) {
                this.pickupStop = pickupStop;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder dropStop(final String dropStop) {
                this.dropStop = dropStop;
                return this;
            }

            public TransportDTOs.StudentMappingDTO build() {
                return new TransportDTOs.StudentMappingDTO(this.id, this.studentId, this.studentName, this.pickupStop, this.dropStop);
            }

            @Override
            public String toString() {
                return "TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder(id=" + this.id + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", pickupStop=" + this.pickupStop + ", dropStop=" + this.dropStop + ")";
            }
        }

        public static TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder builder() {
            return new TransportDTOs.StudentMappingDTO.StudentMappingDTOBuilder();
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

        public String getPickupStop() {
            return this.pickupStop;
        }

        public String getDropStop() {
            return this.dropStop;
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

        public void setPickupStop(final String pickupStop) {
            this.pickupStop = pickupStop;
        }

        public void setDropStop(final String dropStop) {
            this.dropStop = dropStop;
        }

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TransportDTOs.StudentMappingDTO)) return false;
            final TransportDTOs.StudentMappingDTO other = (TransportDTOs.StudentMappingDTO) o;
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
            final Object this$pickupStop = this.getPickupStop();
            final Object other$pickupStop = other.getPickupStop();
            if (this$pickupStop == null ? other$pickupStop != null : !this$pickupStop.equals(other$pickupStop)) return false;
            final Object this$dropStop = this.getDropStop();
            final Object other$dropStop = other.getDropStop();
            if (this$dropStop == null ? other$dropStop != null : !this$dropStop.equals(other$dropStop)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TransportDTOs.StudentMappingDTO;
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
            final Object $pickupStop = this.getPickupStop();
            result = result * PRIME + ($pickupStop == null ? 43 : $pickupStop.hashCode());
            final Object $dropStop = this.getDropStop();
            result = result * PRIME + ($dropStop == null ? 43 : $dropStop.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TransportDTOs.StudentMappingDTO(id=" + this.getId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", pickupStop=" + this.getPickupStop() + ", dropStop=" + this.getDropStop() + ")";
        }

        public StudentMappingDTO() {
        }

        public StudentMappingDTO(final Long id, final Long studentId, final String studentName, final String pickupStop, final String dropStop) {
            this.id = id;
            this.studentId = studentId;
            this.studentName = studentName;
            this.pickupStop = pickupStop;
            this.dropStop = dropStop;
        }
    }


    public static class AssignStudentRequest {
        @NotNull
        private Long routeId;
        @NotNull
        private Long studentId;
        private String studentName;
        private String pickupStop;
        private String dropStop;


        public static class AssignStudentRequestBuilder {
            private Long routeId;
            private Long studentId;
            private String studentName;
            private String pickupStop;
            private String dropStop;

            AssignStudentRequestBuilder() {
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder routeId(final Long routeId) {
                this.routeId = routeId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder studentId(final Long studentId) {
                this.studentId = studentId;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder studentName(final String studentName) {
                this.studentName = studentName;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder pickupStop(final String pickupStop) {
                this.pickupStop = pickupStop;
                return this;
            }

            /**
             * @return {@code this}.
             */
            public TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder dropStop(final String dropStop) {
                this.dropStop = dropStop;
                return this;
            }

            public TransportDTOs.AssignStudentRequest build() {
                return new TransportDTOs.AssignStudentRequest(this.routeId, this.studentId, this.studentName, this.pickupStop, this.dropStop);
            }

            @Override
            public String toString() {
                return "TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder(routeId=" + this.routeId + ", studentId=" + this.studentId + ", studentName=" + this.studentName + ", pickupStop=" + this.pickupStop + ", dropStop=" + this.dropStop + ")";
            }
        }

        public static TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder builder() {
            return new TransportDTOs.AssignStudentRequest.AssignStudentRequestBuilder();
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

        @Override
        public boolean equals(final Object o) {
            if (o == this) return true;
            if (!(o instanceof TransportDTOs.AssignStudentRequest)) return false;
            final TransportDTOs.AssignStudentRequest other = (TransportDTOs.AssignStudentRequest) o;
            if (!other.canEqual((Object) this)) return false;
            final Object this$routeId = this.getRouteId();
            final Object other$routeId = other.getRouteId();
            if (this$routeId == null ? other$routeId != null : !this$routeId.equals(other$routeId)) return false;
            final Object this$studentId = this.getStudentId();
            final Object other$studentId = other.getStudentId();
            if (this$studentId == null ? other$studentId != null : !this$studentId.equals(other$studentId)) return false;
            final Object this$studentName = this.getStudentName();
            final Object other$studentName = other.getStudentName();
            if (this$studentName == null ? other$studentName != null : !this$studentName.equals(other$studentName)) return false;
            final Object this$pickupStop = this.getPickupStop();
            final Object other$pickupStop = other.getPickupStop();
            if (this$pickupStop == null ? other$pickupStop != null : !this$pickupStop.equals(other$pickupStop)) return false;
            final Object this$dropStop = this.getDropStop();
            final Object other$dropStop = other.getDropStop();
            if (this$dropStop == null ? other$dropStop != null : !this$dropStop.equals(other$dropStop)) return false;
            return true;
        }

        protected boolean canEqual(final Object other) {
            return other instanceof TransportDTOs.AssignStudentRequest;
        }

        @Override
        public int hashCode() {
            final int PRIME = 59;
            int result = 1;
            final Object $routeId = this.getRouteId();
            result = result * PRIME + ($routeId == null ? 43 : $routeId.hashCode());
            final Object $studentId = this.getStudentId();
            result = result * PRIME + ($studentId == null ? 43 : $studentId.hashCode());
            final Object $studentName = this.getStudentName();
            result = result * PRIME + ($studentName == null ? 43 : $studentName.hashCode());
            final Object $pickupStop = this.getPickupStop();
            result = result * PRIME + ($pickupStop == null ? 43 : $pickupStop.hashCode());
            final Object $dropStop = this.getDropStop();
            result = result * PRIME + ($dropStop == null ? 43 : $dropStop.hashCode());
            return result;
        }

        @Override
        public String toString() {
            return "TransportDTOs.AssignStudentRequest(routeId=" + this.getRouteId() + ", studentId=" + this.getStudentId() + ", studentName=" + this.getStudentName() + ", pickupStop=" + this.getPickupStop() + ", dropStop=" + this.getDropStop() + ")";
        }

        public AssignStudentRequest() {
        }

        public AssignStudentRequest(final Long routeId, final Long studentId, final String studentName, final String pickupStop, final String dropStop) {
            this.routeId = routeId;
            this.studentId = studentId;
            this.studentName = studentName;
            this.pickupStop = pickupStop;
            this.dropStop = dropStop;
        }
    }
}
