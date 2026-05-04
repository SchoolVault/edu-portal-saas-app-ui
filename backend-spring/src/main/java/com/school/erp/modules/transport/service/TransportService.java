package com.school.erp.modules.transport.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.transport.dto.TransportDTOs;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.repository.*;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
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
        log.debug("Loading transport routes tenantId={}", t);
        List<TransportDTOs.RouteResponse> routes = routeRepo.findByTenantIdAndIsDeletedFalse(t).stream()
                .map(r -> buildRouteResponse(r, t))
                .collect(Collectors.toList());
        log.info("Loaded {} transport route(s) tenantId={}", routes.size(), t);
        return routes;
    }

    /** Paged routes (not Redis-cached per page; use after mutations or for large fleets). */
    @Transactional(readOnly = true)
    public PageResponse<TransportDTOs.RouteResponse> getRoutesPaged(int page, int size, String q) {
        String t = TenantContext.getTenantId();
        Pageable pageable = PageRequest.of(page, size, Sort.by("name"));
        Page<TransportRoute> pr = (q != null && !q.isBlank())
                ? routeRepo.findByTenantIdAndIsDeletedFalseAndNameContainingIgnoreCase(t, q.trim(), pageable)
                : routeRepo.findByTenantIdAndIsDeletedFalse(t, pageable);
        return PageResponse.fromSpringPage(pr.map(r -> buildRouteResponse(r, t)));
    }

    private TransportDTOs.RouteResponse buildRouteResponse(TransportRoute r, String t) {
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
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportRoute createRoute(TransportRoute route) {
        log.info("Creating transport route name={}", route.getName());
        route.setTenantId(TenantContext.getTenantId());
        route.setDriverPhone(canonicalPhoneOptional(route.getDriverPhone()));
        TransportRoute saved = routeRepo.save(route);
        log.info("Transport route created id={}", saved.getId());
        return saved;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportRoute updateRoute(Long id, TransportRoute update) {
        String t = TenantContext.getTenantId();
        log.info("Updating transport route id={}", id);
        TransportRoute route = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(id, t).orElseThrow(() -> new ResourceNotFoundException("Route", id));
        if (update.getName() != null) route.setName(update.getName());
        if (update.getVehicleNumber() != null) route.setVehicleNumber(update.getVehicleNumber());
        if (update.getDriverName() != null) route.setDriverName(update.getDriverName());
        if (update.getDriverPhone() != null) route.setDriverPhone(canonicalPhoneOptional(update.getDriverPhone()));
        if (update.getVehicleId() != null) route.setVehicleId(update.getVehicleId());
        if (update.getDriverId() != null) route.setDriverId(update.getDriverId());
        TransportRoute saved = routeRepo.save(route);
        log.info("Transport route updated id={}", id);
        return saved;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public void deleteRoute(Long id) {
        String t = TenantContext.getTenantId();
        log.warn("Soft-deleting transport route id={}", id);
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
        RouteStop saved = stopRepo.save(stop);
        log.info("Route stop added id={} routeId={}", saved.getId(), stop.getRouteId());
        return saved;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public void removeStop(Long stopId) {
        String t = TenantContext.getTenantId();
        RouteStop s = stopRepo.findByIdAndTenantIdAndIsDeletedFalse(stopId, t).orElseThrow(() -> new ResourceNotFoundException("RouteStop", stopId));
        s.setIsDeleted(true);
        stopRepo.save(s);
        log.info("Route stop removed stopId={}", stopId);
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
        RouteStop saved = stopRepo.save(s);
        log.info("Route stop updated stopId={}", stopId);
        return saved;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public StudentTransportMapping assignStudent(TransportDTOs.AssignStudentRequest req) {
        String t = TenantContext.getTenantId();
        log.info("Assigning student {} to route {}", req.getStudentId(), req.getRouteId());
        routeRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getRouteId(), t).orElseThrow(() -> new ResourceNotFoundException("Route", req.getRouteId()));
        StudentTransportMapping m = StudentTransportMapping.builder().routeId(req.getRouteId()).studentId(req.getStudentId()).studentName(req.getStudentName()).pickupStop(req.getPickupStop()).dropStop(req.getDropStop()).build();
        m.setTenantId(t);
        mappingRepo.save(m);
        TransportRoute route = routeRepo.findByIdAndTenantIdAndIsDeletedFalse(req.getRouteId(), t).orElse(null);
        if (route != null) {
            route.setAssignedStudents((int) mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, req.getRouteId()).size());
            routeRepo.save(route);
        }
        log.info("Student transport mapping saved mappingId={} routeId={}", m.getId(), req.getRouteId());
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
        log.info("Student removed from route mappingId={}", mappingId);
    }

    @Transactional(readOnly = true)
    public List<TransportVehicle> listVehicles() {
        String t = TenantContext.getTenantId();
        List<TransportVehicle> list = vehicleRepo.findByTenantIdAndIsDeletedFalse(t);
        log.info("Listed {} vehicle(s)", list.size());
        return list;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportVehicle createVehicle(TransportVehicle v) {
        v.setTenantId(TenantContext.getTenantId());
        TransportVehicle saved = vehicleRepo.save(v);
        log.info("Vehicle created id={}", saved.getId());
        return saved;
    }

    @Transactional(readOnly = true)
    public List<TransportDriver> listDrivers() {
        String t = TenantContext.getTenantId();
        List<TransportDriver> list = driverRepo.findByTenantIdAndIsDeletedFalse(t);
        log.info("Listed {} driver(s)", list.size());
        return list;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public TransportDriver createDriver(TransportDriver d) {
        d.setTenantId(TenantContext.getTenantId());
        d.setPhone(canonicalPhoneOptional(d.getPhone()));
        TransportDriver saved = driverRepo.save(d);
        log.info("Driver created id={}", saved.getId());
        return saved;
    }

    @CacheEvict(cacheNames = CacheConfig.TRANSPORT_ROUTES, keyGenerator = "tenantKeyGenerator")
    @Transactional
    public VehicleLiveLocation reportLiveLocation(Long vehicleId, Long routeId, java.math.BigDecimal lat, java.math.BigDecimal lng) {
        String t = TenantContext.getTenantId();
        log.debug("Live location vehicleId={} routeId={}", vehicleId, routeId);
        vehicleRepo.findByIdAndTenantIdAndIsDeletedFalse(vehicleId, t).orElseThrow(() -> new ResourceNotFoundException("Vehicle", vehicleId));
        VehicleLiveLocation loc = new VehicleLiveLocation();
        loc.setTenantId(t);
        loc.setVehicleId(vehicleId);
        loc.setRouteId(routeId);
        loc.setLatitude(lat);
        loc.setLongitude(lng);
        loc.setRecordedAt(java.time.Instant.now());
        VehicleLiveLocation saved = liveRepo.save(loc);
        log.debug("Live location recorded id={}", saved.getId());
        return saved;
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

    private String canonicalPhoneOptional(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String national = InternationalPhone.nationalIndiaMobile10(raw.trim());
        if (national == null) {
            throw new BusinessException(InternationalPhone.importPhoneInvalidMessage());
        }
        return national;
    }
}
