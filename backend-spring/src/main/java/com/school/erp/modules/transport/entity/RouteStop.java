package com.school.erp.modules.transport.entity;

import com.school.erp.common.entity.BaseEntity;
import jakarta.persistence.*;
import java.time.LocalTime;

@Entity
@Table(name = "route_stops")
public class RouteStop extends BaseEntity {
    @Column(name = "route_id", nullable = false)
    private Long routeId;
    @Column(nullable = false, length = 100)
    private String name;
    @Column(name = "stop_time")
    private LocalTime stopTime;
    @Column(name = "stop_order")
    private Integer stopOrder;
    private java.math.BigDecimal latitude;
    private java.math.BigDecimal longitude;
    @Column(name = "estimated_travel_minutes")
    private Integer estimatedTravelMinutes;


    public static class RouteStopBuilder {
        private Long routeId;
        private String name;
        private LocalTime stopTime;
        private Integer stopOrder;

        RouteStopBuilder() {
        }

        /**
         * @return {@code this}.
         */
        public RouteStop.RouteStopBuilder routeId(final Long routeId) {
            this.routeId = routeId;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public RouteStop.RouteStopBuilder name(final String name) {
            this.name = name;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public RouteStop.RouteStopBuilder stopTime(final LocalTime stopTime) {
            this.stopTime = stopTime;
            return this;
        }

        /**
         * @return {@code this}.
         */
        public RouteStop.RouteStopBuilder stopOrder(final Integer stopOrder) {
            this.stopOrder = stopOrder;
            return this;
        }

        public RouteStop build() {
            return new RouteStop(this.routeId, this.name, this.stopTime, this.stopOrder);
        }

        @Override
        public String toString() {
            return "RouteStop.RouteStopBuilder(routeId=" + this.routeId + ", name=" + this.name + ", stopTime=" + this.stopTime + ", stopOrder=" + this.stopOrder + ")";
        }
    }

    public static RouteStop.RouteStopBuilder builder() {
        return new RouteStop.RouteStopBuilder();
    }

    public Long getRouteId() {
        return this.routeId;
    }

    public String getName() {
        return this.name;
    }

    public LocalTime getStopTime() {
        return this.stopTime;
    }

    public Integer getStopOrder() {
        return this.stopOrder;
    }

    public java.math.BigDecimal getLatitude() {
        return latitude;
    }

    public void setLatitude(java.math.BigDecimal latitude) {
        this.latitude = latitude;
    }

    public java.math.BigDecimal getLongitude() {
        return longitude;
    }

    public void setLongitude(java.math.BigDecimal longitude) {
        this.longitude = longitude;
    }

    public Integer getEstimatedTravelMinutes() {
        return estimatedTravelMinutes;
    }

    public void setEstimatedTravelMinutes(Integer estimatedTravelMinutes) {
        this.estimatedTravelMinutes = estimatedTravelMinutes;
    }

    public void setRouteId(final Long routeId) {
        this.routeId = routeId;
    }

    public void setName(final String name) {
        this.name = name;
    }

    public void setStopTime(final LocalTime stopTime) {
        this.stopTime = stopTime;
    }

    public void setStopOrder(final Integer stopOrder) {
        this.stopOrder = stopOrder;
    }

    public RouteStop() {
    }

    public RouteStop(final Long routeId, final String name, final LocalTime stopTime, final Integer stopOrder) {
        this.routeId = routeId;
        this.name = name;
        this.stopTime = stopTime;
        this.stopOrder = stopOrder;
    }
}
