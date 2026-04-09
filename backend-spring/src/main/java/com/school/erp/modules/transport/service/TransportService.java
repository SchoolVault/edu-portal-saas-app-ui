package com.school.erp.modules.transport.service;

import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.modules.transport.dto.TransportDTOs;
import com.school.erp.modules.transport.entity.*;
import com.school.erp.modules.transport.repository.*;
import com.school.erp.tenant.TenantContext;
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

    @Transactional(readOnly = true)
    public List<TransportDTOs.RouteResponse> getRoutes() {
        String t = TenantContext.getTenantId();
        return routeRepo.findByTenantIdAndIsDeletedFalse(t).stream().map(r -> {
            List<RouteStop> stops = stopRepo.findByTenantIdAndRouteIdOrderByStopOrder(t, r.getId());
            List<StudentTransportMapping> students = mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, r.getId());
            return TransportDTOs.RouteResponse.builder().id(r.getId()).name(r.getName()).vehicleNumber(r.getVehicleNumber()).driverName(r.getDriverName()).driverPhone(r.getDriverPhone()).assignedStudents(students.size()).stops(stops.stream().map(s -> TransportDTOs.StopDTO.builder().id(s.getId()).name(s.getName()).time(s.getStopTime() != null ? s.getStopTime().toString() : null).order(s.getStopOrder()).build()).collect(Collectors.toList())).students(students.stream().map(m -> TransportDTOs.StudentMappingDTO.builder().id(m.getId()).studentId(m.getStudentId()).studentName(m.getStudentName()).pickupStop(m.getPickupStop()).dropStop(m.getDropStop()).build()).collect(Collectors.toList())).build();
        }).collect(Collectors.toList());
    }

    @Transactional
    public TransportRoute createRoute(TransportRoute route) {
        route.setTenantId(TenantContext.getTenantId());
        return routeRepo.save(route);
    }

    @Transactional
    public TransportRoute updateRoute(Long id, TransportRoute update) {
        TransportRoute route = routeRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Route", id));
        if (update.getName() != null) route.setName(update.getName());
        if (update.getVehicleNumber() != null) route.setVehicleNumber(update.getVehicleNumber());
        if (update.getDriverName() != null) route.setDriverName(update.getDriverName());
        if (update.getDriverPhone() != null) route.setDriverPhone(update.getDriverPhone());
        return routeRepo.save(route);
    }

    @Transactional
    public void deleteRoute(Long id) {
        TransportRoute r = routeRepo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Route", id));
        r.setIsDeleted(true);
        routeRepo.save(r);
    }

    @Transactional
    public RouteStop addStop(RouteStop stop) {
        stop.setTenantId(TenantContext.getTenantId());
        return stopRepo.save(stop);
    }

    @Transactional
    public void removeStop(Long stopId) {
        stopRepo.deleteById(stopId);
    }

    @Transactional
    public StudentTransportMapping assignStudent(TransportDTOs.AssignStudentRequest req) {
        String t = TenantContext.getTenantId();
        StudentTransportMapping m = StudentTransportMapping.builder().routeId(req.getRouteId()).studentId(req.getStudentId()).studentName(req.getStudentName()).pickupStop(req.getPickupStop()).dropStop(req.getDropStop()).build();
        m.setTenantId(t);
        mappingRepo.save(m);
        // Update assigned count
        TransportRoute route = routeRepo.findById(req.getRouteId()).orElse(null);
        if (route != null) {
            route.setAssignedStudents((int) mappingRepo.findByTenantIdAndRouteIdAndIsDeletedFalse(t, req.getRouteId()).size());
            routeRepo.save(route);
        }
        return m;
    }

    @Transactional
    public void removeStudentFromRoute(Long mappingId) {
        StudentTransportMapping m = mappingRepo.findById(mappingId).orElseThrow(() -> new ResourceNotFoundException("Mapping", mappingId));
        m.setIsDeleted(true);
        mappingRepo.save(m);
    }

    public TransportService(final TransportRouteRepository routeRepo, final RouteStopRepository stopRepo, final StudentTransportMappingRepository mappingRepo) {
        this.routeRepo = routeRepo;
        this.stopRepo = stopRepo;
        this.mappingRepo = mappingRepo;
    }
}
