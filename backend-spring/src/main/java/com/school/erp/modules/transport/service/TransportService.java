package com.school.erp.modules.transport.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.transport.dto.TransportDTOs;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.repository.*;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransportService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TransportService.class);
    private final TransportRouteRepository routeRepo;
    private final RouteStopRepository stopRepo;
    private final StudentTransportMappingRepository mappingRepo;
    private final TransportVehicleRepository vehicleRepo;
    private final TransportDriverRepository driverRepo;
    private final VehicleLiveLocationRepository liveRepo;

    @Cacheable(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public List<TransportDTOs.RouteResponse> getRoutes() {
        String t = TenantContext.getTenantId();
        return routeRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(r -> {
            List<RouteStop> stops = stopRepo.findByTenantIdAndRouteIdOrderByStopOrder(t, r.getId());
            List<StudentTransportMapping> students = mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, r.getId());
            String vehicleNumber = r.getVehicleNumber();
            String vehicleType = null;
            if (r.getVehicleId() != null) {
                var ov = vehicleRepo.findByIdAndTenantIdAndIsDeletedFalse(r.getVehicleId(), t);
                if (ov.isPresent()) {
                    vehicleNumber = ov.get().getRegistrationNumber();
                    vehicleType = ov.get().getVehicleType() != null ? ov.get().getVehicleType().name() : null;
                }
            }
            String driverName = r.getDriverName();
            String driverPhone = r.getDriverPhone();
            if (r.getDriverId() != null) {
                var od = driverRepo.findByIdAndTenantIdAndIsDeletedFalse(r.getDriverId(), t);
                if (od.isPresent()) {
                    driverName = od.get().getFullName();
                    driverPhone = od.get().getPhone();
                }
            }
            TransportDTOs.RouteResponse resp = TransportDTOs.RouteResponse.builder()
                    .id(r.getId())
                    .name(r.getName())
                    .vehicleNumber(vehicleNumber)
                    .driverName(driverName)
                    .driverPhone(driverPhone)
                    .assignedStudents(students.size())
                    .stops(stops.stream().map(s -> TransportDTOs.StopDTO.builder().id(s.getId()).name(s.getName()).time(s.getStopTime() != null ? s.getStopTime().toString() : null).order(s.getStopOrder()).build()).collect(Collectors.toList()))
                    .students(students.stream().map(m -> TransportDTOs.StudentMappingDTO.builder().id(m.getId()).studentId(m.getStudentId()).studentName(m.getStudentName()).pickupStop(m.getPickupStop()).dropStop(m.getDropStop()).build()).collect(Collectors.toList()))
                    .build();
            resp.setVehicleId(r.getVehicleId());
            resp.setDriverId(r.getDriverId());
            resp.setVehicleType(vehicleType);
            if (r.getVehicleId() != null) {
                liveRepo.findTopByTenantIdAndVehicleIdAndIsDeletedFalseOrderByRecordedAtDesc(t, r.getVehicleId()).ifPresent(loc -> {
                    resp.setLiveLatitude(loc.getLatitude() != null ? loc.getLatitude().doubleValue() : null);
                    resp.setLiveLongitude(loc.getLongitude() != null ? loc.getLongitude().doubleValue() : null);
                    resp.setLiveRecordedAt(loc.getRecordedAt() != null ? loc.getRecordedAt().toString() : null);
                });
            }
            return resp;
        }).collect(Collectors.toList());
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportRoute createRoute(TransportRoute route) {
        route.setTenantId(TenantContext.getTenantId());
        return routeRepo.save(route);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportRoute updateRoute(Long id, TransportRoute update) {
        String t = TenantContext.getTenantId();
        TransportRoute route = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Route", id));
        if (update.getName() != null) route.setName(update.getName());
        if (update.getVehicleNumber() != null) route.setVehicleNumber(update.getVehicleNumber());
        if (update.getDriverName() != null) route.setDriverName(update.getDriverName());
        if (update.getDriverPhone() != null) route.setDriverPhone(update.getDriverPhone());
        if (update.getVehicleId() != null) route.setVehicleId(update.getVehicleId());
        if (update.getDriverId() != null) route.setDriverId(update.getDriverId());
        return routeRepo.save(route);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public void deleteRoute(Long id) {
        String t = TenantContext.getTenantId();
        TransportRoute r = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Route", id));
        r.setIsDeleted(true);
        routeRepo.save(r);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public RouteStop addStop(RouteStop stop) {
        String t = TenantContext.getTenantId();
        routeRepo.findByIdAndTenantIdAndIsDeletedFalse(stop.getRouteId(), t)
                .orElseThrow(() -> new ResourceNotFoundException("Route", stop.getRouteId()));
        stop.setTenantId(t);
        return stopRepo.save(stop);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public void removeStop(Long stopId) {
        String t = TenantContext.getTenantId();
        RouteStop s = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, t).orElseThrow(() -> new ResourceNotFoundException("RouteStop", stopId));
        s.setIsDeleted(true);
        stopRepo.save(s);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public RouteStop updateStop(Long stopId, RouteStop patch) {
        String t = TenantContext.getTenantId();
        RouteStop s = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, t).orElseThrow(() -> new ResourceNotFoundException("RouteStop", stopId));
        if (patch.getName() != null) {
            s.setName(patch.getName());
        }
        if (patch.getStopOrder() != null) {
            s.setStopOrder(patch.getStopOrder());
        }
        if (patch.getStopTime() != null) {
            s.setStopTime(patch.getStopTime());
        }
        return stopRepo.save(s);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public StudentTransportMapping assignStudent(TransportDTOs.AssignStudentRequest req) {
        String t = TenantContext.getTenantId();
        routeRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getRouteId(), t).orElseThrow(() -> new ResourceNotFoundException("Route", req.getRouteId()));
        StudentTransportMapping m = StudentTransportMapping.builder().routeId(req.getRouteId()).studentId(req.getStudentId()).studentName(req.getStudentName()).pickupStop(req.getPickupStop()).dropStop(req.getDropStop()).build();
        m.setTenantId(t);
        mappingRepo.save(m);
        TransportRoute route = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getRouteId(), t).orElse(null);
        if (route != null) {
            route.setAssignedStudents((int) mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, req.getRouteId()).size());
            routeRepo.save(route);
        }
        return m;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public void removeStudentFromRoute(Long mappingId) {
        String t = TenantContext.getTenantId();
        StudentTransportMapping m = mappingRepo.findByIdAndTenantIdAndIsDeletedFalse(mappingId, t).orElseThrow(() -> new ResourceNotFoundException("Mapping", mappingId));
        Long routeId = m.getRouteId();
        m.setIsDeleted(true);
        mappingRepo.save(m);
        routeRepo.findByIdAndTenantIdAndIsDeletedFalse(routeId, t).ifPresent(route -> {
            route.setAssignedStudents((int) mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, routeId).size());
            routeRepo.save(route);
        });
    }

    @Transactional(readOnly = true)
    public List<TransportVehicle> listVehicles() {
        return vehicleRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportVehicle createVehicle(TransportVehicle v) {
        v.setTenantId(TenantContext.getTenantId());
        return vehicleRepo.save(v);
    }

    @Transactional(readOnly = true)
    public List<TransportDriver> listDrivers() {
        return driverRepo.findByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportDriver createDriver(TransportDriver d) {
        d.setTenantId(TenantContext.getTenantId());
        return driverRepo.save(d);
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public VehicleLiveLocation reportLiveLocation(Long vehicleId, Long routeId, java.math.BigDecimal lat, java.math.BigDecimal lng) {
        String t = TenantContext.getTenantId();
        vehicleRepo.findByIdAndTenantIdAndIsDeletedFalse(vehicleId, t).orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        VehicleLiveLocation loc = new VehicleLiveLocation();
        loc.setTenantId(t);
        loc.setVehicleId(vehicleId);
        loc.setRouteId(routeId);
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setRecordedAt(java.time.Instant.now());
        return liveRepo.save(loc);
    }

    public TransportService(
            final TransportRouteRepository routeRepo,
            final RouteStopRepository stopRepo,
            final StudentTransportMappingRepository mappingRepo,
            final TransportVehicleRepository vehicleRepo,
            final TransportDriverRepository driverRepo,
            final VehicleLiveLocationRepository liveRepo) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.mappingRepo = mappingRepo;
        this.vehicleRepo = vehicleRepo;
        this.driverRepo = driverRepo;
        this.liveRepo = liveRepo;
    }
}
