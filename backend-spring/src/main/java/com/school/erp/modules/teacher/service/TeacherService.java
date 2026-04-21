package com.school.erp.modules.teacher.service;

import com.school.erp.common.dto.PageResponse;
import com.school.erp.common.enums.Enums;
import com.school.erp.common.exception.DuplicateResourceException;
import com.school.erp.common.exception.BusinessException;
import com.school.erp.common.importer.BulkImportRowPolicy;
import com.school.erp.common.importer.ZipCsvImportUtil;
import com.school.erp.common.exception.ResourceNotFoundException;
import com.school.erp.common.util.InternationalPhone;
import com.school.erp.modules.auth.entity.User;
import com.school.erp.modules.auth.repository.UserRepository;
import com.school.erp.modules.auth.service.PortalUserProvisioningService;
import com.school.erp.modules.academic.entity.ClassTeacherAssignment;
import com.school.erp.modules.academic.entity.SchoolClass;
import com.school.erp.modules.academic.entity.Section;
import com.school.erp.modules.academic.repository.ClassTeacherAssignmentRepository;
import com.school.erp.modules.academic.repository.SchoolClassRepository;
import com.school.erp.modules.academic.repository.SectionRepository;
import com.school.erp.common.jpa.EntitySnapshotCollections;
import com.school.erp.modules.teacher.dto.TeacherDTOs;
import com.school.erp.modules.teacher.entity.Teacher;
import com.school.erp.modules.teacher.repository.TeacherRepository;
import com.school.erp.cache.CacheService;
import com.school.erp.config.CacheConfig;
import com.school.erp.tenant.TenantContext;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.dao.DataIntegrityViolationException;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class TeacherService {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(TeacherService.class);
    private final TeacherRepository repo;
    private final SchoolClassRepository schoolClassRepository;
    private final SectionRepository sectionRepository;
    private final ClassTeacherAssignmentRepository classTeacherAssignmentRepository;
    private final PortalUserProvisioningService portalUserProvisioningService;
    private final UserRepository userRepository;
    private final ObjectProvider<CacheService> cacheService;

    @Cacheable(cacheNames = CacheConfig.TEACHER_DIRECTORY, keyGenerator = "tenantMethodParamsKeyGenerator", unless = "#result == null")
    @Transactional(readOnly = true)
    public PageResponse<TeacherDTOs.Response> getTeachers(int page, int size, String search) {
        String tenantId = TenantContext.getTenantId();
        String q = search == null ? "" : search.trim();
        log.debug("Listing teachers page={} size={} searchPresent={}", page, size, !q.isEmpty());
        Page<Teacher> result = repo.findByTenantIdAndSearch(tenantId, q, PageRequest.of(page, size, Sort.by("firstName")));
        log.info("Teachers page loaded page={} returned={} total={}", page, result.getNumberOfElements(), result.getTotalElements());
        Map<Long, List<String>> homeroomByTeacher = homeroomClassNamesByTeacherId(tenantId);
        return PageResponse.of(result.getContent().stream()
                .map(t -> applyAudienceVisibility(toRes(t, homeroomByTeacher.getOrDefault(t.getId(), List.of()))))
                .collect(Collectors.toList()), page, size, result.getTotalElements());
    }

    @Transactional(readOnly = true)
    public TeacherDTOs.Response getById(Long id) {
        log.debug("Fetching teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        TeacherDTOs.Response r = applyAudienceVisibility(toRes(t, homeroomClassNamesForTeacher(tenantId, t.getId())));
        log.info("Teacher loaded id={}", id);
        return r;
    }

    @Transactional
    public TeacherDTOs.Response create(TeacherDTOs.CreateRequest req) {
        log.info("Creating teacher email={}", req.getEmail());
        Teacher t = Teacher.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(req.getEmail())
                .phone(req.getPhone())
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joinDate(req.getJoinDate())
                .salary(req.getSalary())
                .subjects(req.getSubjects())
                .status(Enums.TeacherStatus.ACTIVE)
                .build();
        t.setTenantId(TenantContext.getTenantId());
        repo.save(t);
        log.info("Teacher created id={}", t.getId());
        evictTeacherDirectoryCache();
        return toRes(t, List.of());
    }

    /**
     * Bulk import path: optional portal user (teacher or library staff) linked to {@code teachers.user_id}.
     */
    @Transactional
    public TeacherDTOs.Response createForBulkImport(TeacherDTOs.CreateRequest req, boolean createPortal,
                                                     Enums.Role portalRole, Enums.LibraryStaffRole libraryStaffRole) {
        String tenantId = TenantContext.getTenantId();
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(java.util.Locale.ROOT) : null;
        if (email == null || email.isBlank()) {
            throw new com.school.erp.common.exception.BusinessException("Teacher email is required");
        }
        if (repo.existsByTenantIdAndEmailAndIsDeletedFalse(tenantId, email)) {
            throw new DuplicateResourceException("Teacher email already exists: " + email);
        }
        Teacher t = Teacher.builder()
                .firstName(req.getFirstName())
                .lastName(req.getLastName())
                .email(email)
                .phone(req.getPhone() != null ? req.getPhone().trim() : null)
                .qualification(req.getQualification())
                .specialization(req.getSpecialization())
                .joinDate(req.getJoinDate())
                .salary(req.getSalary())
                .subjects(req.getSubjects() != null ? req.getSubjects() : List.of())
                .status(Enums.TeacherStatus.ACTIVE)
                .build();
        if (libraryStaffRole != null) {
            t.setLibraryStaffRole(libraryStaffRole);
        }
        t.setTenantId(tenantId);
        repo.save(t);
        if (createPortal) {
            String display = req.getFirstName() + " " + req.getLastName();
            PortalUserProvisioningService.ProvisionResult pr = portalUserProvisioningService.ensureStaffUser(
                    tenantId, email, display.trim(), req.getPhone(), portalRole);
            t.setUserId(pr.userId());
            repo.save(t);
        }
        log.info("Teacher bulk row created id={} portalLinked={}", t.getId(), createPortal);
        evictTeacherDirectoryCache();
        return toRes(t, List.of());
    }

    /**
     * Idempotent teacher/staff import: update existing teacher row by email when policy is {@link BulkImportRowPolicy#UPSERT}.
     */
    @Transactional
    public TeacherDTOs.Response upsertTeacherForImport(TeacherDTOs.CreateRequest req, boolean createPortal,
                                                       Enums.Role portalRole, Enums.LibraryStaffRole libraryStaffRole,
                                                       BulkImportRowPolicy policy) {
        String tenantId = TenantContext.getTenantId();
        String email = req.getEmail() != null ? req.getEmail().trim().toLowerCase(Locale.ROOT) : null;
        if (email == null || email.isBlank()) {
            throw new com.school.erp.common.exception.BusinessException("Teacher email is required");
        }
        Optional<Teacher> existing = repo.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, email);
        if (existing.isEmpty()) {
            return createForBulkImport(req, createPortal, portalRole, libraryStaffRole);
        }
        if (policy == BulkImportRowPolicy.SKIP_IF_EXISTS) {
            return applyAudienceVisibility(toRes(existing.get(), homeroomClassNamesForTeacher(tenantId, existing.get().getId())));
        }
        if (policy == BulkImportRowPolicy.UPSERT) {
            TeacherDTOs.UpdateRequest ur = new TeacherDTOs.UpdateRequest();
            ur.setFirstName(req.getFirstName());
            ur.setLastName(req.getLastName());
            ur.setEmail(req.getEmail());
            ur.setPhone(req.getPhone());
            ur.setQualification(req.getQualification());
            ur.setSpecialization(req.getSpecialization());
            ur.setJoinDate(req.getJoinDate());
            ur.setSalary(req.getSalary());
            ur.setSubjects(req.getSubjects());
            ur.setBankAccountHolder(req.getBankAccountHolder());
            ur.setBankName(req.getBankName());
            ur.setBankAccountNumber(req.getBankAccountNumber());
            ur.setBankIfsc(req.getBankIfsc());
            return update(existing.get().getId(), ur);
        }
        throw new DuplicateResourceException("Teacher email already exists: " + email);
    }

    @Transactional
    public TeacherDTOs.Response update(Long id, TeacherDTOs.UpdateRequest req) {
        log.info("Updating teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        String actorRole = TenantContext.getUserRole();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        if (isAdminActor(actorRole) && hasSensitiveAdminEdit(req, t)) {
            throw new BusinessException(
                    "Admins can update school-assignment fields only. Contact details and bank details can be updated only by the teacher via their own profile."
            );
        }
        String previousEmail = t.getEmail();
        if (req.getFirstName() != null) t.setFirstName(req.getFirstName());
        if (req.getLastName() != null) t.setLastName(req.getLastName());
        if (req.getEmail() != null) {
            String normalizedEmail = req.getEmail().trim().toLowerCase(Locale.ROOT);
            repo.findByTenantIdAndEmailIgnoreCaseAndIsDeletedFalse(tenantId, normalizedEmail).ifPresent(existing -> {
                if (!existing.getId().equals(t.getId())) {
                    throw new DuplicateResourceException("Teacher email already exists: " + normalizedEmail);
                }
            });
            t.setEmail(normalizedEmail);
        }
        if (req.getPhone() != null) {
            String raw = req.getPhone().trim();
            if (raw.isEmpty()) {
                t.setPhone(null);
            } else {
                String canonicalPhone = InternationalPhone.canonical(raw);
                if (canonicalPhone == null) {
                    throw new BusinessException(InternationalPhone.invalidMessage());
                }
                t.setPhone(canonicalPhone);
            }
        }
        if (req.getQualification() != null) t.setQualification(req.getQualification());
        if (req.getSpecialization() != null) t.setSpecialization(req.getSpecialization());
        if (req.getJoinDate() != null) t.setJoinDate(req.getJoinDate());
        if (req.getSalary() != null) t.setSalary(req.getSalary());
        if (req.getSubjects() != null) t.setSubjects(req.getSubjects());
        if (req.getBankAccountHolder() != null) t.setBankAccountHolder(req.getBankAccountHolder());
        if (req.getBankName() != null) t.setBankName(req.getBankName());
        if (req.getBankAccountNumber() != null) t.setBankAccountNumber(req.getBankAccountNumber());
        if (req.getBankIfsc() != null) t.setBankIfsc(req.getBankIfsc());
        if (req.getStatus() != null && !req.getStatus().isBlank()) {
            try {
                Enums.TeacherStatus next = Enums.TeacherStatus.valueOf(req.getStatus().trim().toUpperCase(Locale.ROOT));
                t.setStatus(next);
                if (next == Enums.TeacherStatus.INACTIVE || next == Enums.TeacherStatus.RESIGNED) {
                    clearHomeroomForTeacher(t.getId(), TenantContext.getTenantId());
                }
            } catch (IllegalArgumentException ex) {
                log.warn("Ignoring invalid teacher status on update id={} status={}", id, req.getStatus());
            }
        }
        try {
            repo.save(t);
            syncLinkedPortalUserIdentity(tenantId, t, previousEmail);
        } catch (DataIntegrityViolationException ex) {
            throw new BusinessException("Duplicate contact values are not allowed for this school.");
        } catch (DuplicateResourceException | BusinessException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("Teacher update failed id={} tenant={} msg={}", id, tenantId, ex.getMessage(), ex);
            throw new BusinessException("Could not update teacher details right now. Please retry.");
        }
        log.info("Teacher updated id={}", id);
        evictTeacherDirectoryCache();
        return toRes(t, homeroomClassNamesForTeacher(tenantId, t.getId()));
    }

    private void syncLinkedPortalUserIdentity(String tenantId, Teacher teacher, String previousEmail) {
        if (teacher.getUserId() == null) {
            return;
        }
        Optional<User> maybeLinkedUser = userRepository.findByIdAndTenantIdAndIsDeletedFalse(teacher.getUserId(), tenantId);
        if (maybeLinkedUser.isEmpty()) {
            log.warn("Skipping portal-user identity sync for teacherId={} userId={} (missing linked user)", teacher.getId(), teacher.getUserId());
            return;
        }
        User linkedUser = maybeLinkedUser.get();
        if (teacher.getEmail() != null && (previousEmail == null || !teacher.getEmail().equalsIgnoreCase(previousEmail))) {
            if (userRepository.existsByEmailAndTenantIdAndIsDeletedFalse(teacher.getEmail(), tenantId)
                    && (linkedUser.getEmail() == null || !teacher.getEmail().equalsIgnoreCase(linkedUser.getEmail()))) {
                throw new DuplicateResourceException("User email already exists in this school: " + teacher.getEmail());
            }
            linkedUser.setEmail(teacher.getEmail());
        }
        if (teacher.getPhone() != null && !teacher.getPhone().isBlank()) {
            for (String key : InternationalPhone.compatibleLookupKeys(teacher.getPhone())) {
                if (!key.equals(linkedUser.getPhone()) && userRepository.existsByPhoneAndTenantIdAndIsDeletedFalse(key, tenantId)) {
                    throw new DuplicateResourceException("User phone already exists in this school: " + teacher.getPhone());
                }
            }
        }
        linkedUser.setPhone(teacher.getPhone());
        userRepository.save(linkedUser);
    }

    private static boolean isAdminActor(String role) {
        return role != null && role.trim().equalsIgnoreCase("ADMIN");
    }

    private static boolean hasSensitiveAdminEdit(TeacherDTOs.UpdateRequest req, Teacher current) {
        boolean emailChanged = req.getEmail() != null
                && !req.getEmail().trim().equalsIgnoreCase(current.getEmail() != null ? current.getEmail().trim() : "");
        boolean phoneChanged = req.getPhone() != null
                && !req.getPhone().trim().equals(current.getPhone() != null ? current.getPhone().trim() : "");
        return emailChanged
                || phoneChanged
                || req.getBankAccountHolder() != null
                || req.getBankName() != null
                || req.getBankAccountNumber() != null
                || req.getBankIfsc() != null;
    }

    @Transactional
    public void delete(Long id) {
        log.warn("Soft-deleting teacher id={}", id);
        String tenantId = TenantContext.getTenantId();
        Teacher t = repo.findByIdAndTenantIdAndIsDeletedFalse(id, tenantId).orElseThrow(() -> new ResourceNotFoundException("Teacher", id));
        clearHomeroomForTeacher(id, tenantId);
        t.setIsDeleted(true);
        repo.save(t);
        log.info("Teacher soft-deleted id={}", id);
        evictTeacherDirectoryCache();
    }

    private void clearHomeroomForTeacher(Long teacherPk, String tenantId) {
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            c.setClassTeacherId(null);
            c.setClassTeacherName(null);
            schoolClassRepository.save(c);
            log.info("Cleared homeroom for classId={} after teacher change teacherPk={}", c.getId(), teacherPk);
        }
        for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            sec.setClassTeacherId(null);
            sec.setClassTeacherName(null);
            sectionRepository.save(sec);
            log.info("Cleared section homeroom sectionId={} after teacher delete teacherPk={}", sec.getId(), teacherPk);
        }
    }

    @Transactional
    public List<TeacherDTOs.Response> importFromZip(MultipartFile file) {
        log.info("Importing teachers from zip teachers.csv");
        List<TeacherDTOs.Response> imported = ZipCsvImportUtil.readRows(file, "teachers.csv").stream().map(row -> {
            TeacherDTOs.CreateRequest request = new TeacherDTOs.CreateRequest();
            request.setFirstName(required(row, "firstname"));
            request.setLastName(required(row, "lastname"));
            request.setEmail(required(row, "email"));
            request.setPhone(blankToNull(row.get("phone")));
            request.setQualification(blankToNull(row.get("qualification")));
            request.setSpecialization(blankToNull(row.get("specialization")));
            request.setJoinDate(parseDate(row.get("joindate")));
            request.setSalary(parseDecimal(row.get("salary")));
            request.setSubjects(parseSubjects(row.get("subjects")));
            return create(request);
        }).collect(Collectors.toList());
        log.info("Teacher import finished count={}", imported.size());
        return imported;
    }

    public long count() {
        long n = repo.countByTenantIdAndIsDeletedFalse(TenantContext.getTenantId());
        log.debug("Teacher count tenant={} n={}", TenantContext.getTenantId(), n);
        return n;
    }

    /** CSV aligned with bulk import template ({@code teachers.csv} / {@code staff.csv}). */
    @Transactional(readOnly = true)
    public String exportTeachersAsCsv() {
        String tenantId = TenantContext.getTenantId();
        StringBuilder sb = new StringBuilder();
        sb.append("firstname,lastname,email,phone,qualification,specialization,joindate,salary,subjects,createportal,portalrole,libraryrole,importmode,bankaccountholder,bankname,bankaccountnumber,bankifsc,notifycredentials\n");
        for (Teacher t : repo.findByTenantIdAndIsDeletedFalse(tenantId)) {
            sb.append(csv(t.getFirstName())).append(',');
            sb.append(csv(t.getLastName())).append(',');
            sb.append(csv(t.getEmail())).append(',');
            sb.append(csv(t.getPhone())).append(',');
            sb.append(csv(t.getQualification())).append(',');
            sb.append(csv(t.getSpecialization())).append(',');
            sb.append(t.getJoinDate() != null ? t.getJoinDate() : "").append(',');
            sb.append(t.getSalary() != null ? t.getSalary().toPlainString() : "").append(',');
            sb.append(csv(t.getSubjects() != null ? String.join("|", t.getSubjects()) : "")).append(',');
            sb.append(t.getUserId() != null ? "Y" : "N").append(',');
            if (t.getLibraryStaffRole() != null) {
                sb.append("LIBRARY_STAFF");
            } else {
                sb.append("TEACHER");
            }
            sb.append(',');
            sb.append(t.getLibraryStaffRole() != null ? t.getLibraryStaffRole().name() : "").append(',');
            sb.append("UPSERT").append(',');
            sb.append(csv(t.getBankAccountHolder())).append(',');
            sb.append(csv(t.getBankName())).append(',');
            sb.append(csv(t.getBankAccountNumber())).append(',');
            sb.append(csv(t.getBankIfsc())).append(',');
            sb.append("N").append('\n');
        }
        return sb.toString();
    }

    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        String x = v.replace("\"", "\"\"");
        if (x.contains(",") || x.contains("\n") || x.contains("\"")) {
            return "\"" + x + "\"";
        }
        return x;
    }

    /**
     * Teachers browsing the staff directory see professional context (name, subjects, homeroom) without
     * HR / PII fields. Admins and non-teacher roles receive the full response.
     *
     * <p>The signed-in teacher’s own row keeps {@code userId} so the client can resolve portal user → teacher
     * primary key (timetable, roster scope) without exposing colleagues’ user ids.</p>
     */
    private TeacherDTOs.Response applyAudienceVisibility(TeacherDTOs.Response r) {
        if (!isCurrentCallerSchoolTeacher()) {
            return r;
        }
        Long viewerPortalUserId = TenantContext.getUserId();
        boolean isSelf = viewerPortalUserId != null && r.getUserId() != null && r.getUserId().equals(viewerPortalUserId);
        r.setSalary(null);
        r.setPhone(null);
        r.setEmail(null);
        r.setQualification(null);
        if (!isSelf) {
            r.setUserId(null);
        }
        r.setTenantId(null);
        return r;
    }

    private static boolean isCurrentCallerSchoolTeacher() {
        String fromCtx = TenantContext.getUserRole();
        if (fromCtx != null && "teacher".equalsIgnoreCase(fromCtx.trim())) {
            return true;
        }
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) {
            return false;
        }
        for (GrantedAuthority a : auth.getAuthorities()) {
            String authz = a.getAuthority();
            if (authz != null && "ROLE_TEACHER".equalsIgnoreCase(authz.trim())) {
                return true;
            }
        }
        return false;
    }

    /** {@link #getTeachers} is cached; invalidate on any teacher mutation so list rows stay aligned with detail. */
    private void evictTeacherDirectoryCache() {
        cacheService.ifAvailable(cs -> cs.clearRegion(CacheService.CacheRegion.TEACHER_DIRECTORY));
    }

    private TeacherDTOs.Response toRes(Teacher t, List<String> homeroomClassNames) {
        TeacherDTOs.Response r = TeacherDTOs.Response.builder().id(t.getId()).firstName(t.getFirstName()).lastName(t.getLastName()).email(t.getEmail()).phone(t.getPhone()).qualification(t.getQualification()).specialization(t.getSpecialization()).joinDate(t.getJoinDate()).salary(t.getSalary()).status(t.getStatus() != null ? t.getStatus().name().toLowerCase() : "active").subjects(EntitySnapshotCollections.detachList(t.getSubjects())).avatar(t.getAvatar()).tenantId(t.getTenantId()).build();
        r.setUserId(t.getUserId());
        if (t.getLibraryStaffRole() != null) {
            r.setLibraryStaffRole(t.getLibraryStaffRole().name().toLowerCase());
        }
        r.setHomeroomClassNames(homeroomClassNames != null ? homeroomClassNames : List.of());
        return r;
    }

    /**
     * Homeroom labels per teacher: merge {@code school_classes}/{@code sections} class-teacher columns
     * with active {@link ClassTeacherAssignment} rows so directory UI stays aligned with academic year assignments.
     */
    private Map<Long, List<String>> homeroomClassNamesByTeacherId(String tenantId) {
        Map<Long, LinkedHashSet<String>> acc = new HashMap<>();
        LocalDate today = LocalDate.now();

        List<SchoolClass> classes = schoolClassRepository.findByTenantIdAndIsDeletedFalseOrderByGrade(tenantId);
        for (SchoolClass c : classes) {
            List<Section> secs = sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId());
            if (secs.isEmpty()) {
                Long tid = c.getClassTeacherId();
                if (tid != null) {
                    acc.computeIfAbsent(tid, k -> new LinkedHashSet<>()).add(c.getName());
                }
            } else {
                for (Section sec : secs) {
                    if (sec.getClassTeacherId() != null) {
                        acc.computeIfAbsent(sec.getClassTeacherId(), k -> new LinkedHashSet<>()).add(c.getName() + "-" + sec.getName());
                    }
                }
            }
        }

        for (ClassTeacherAssignment a : classTeacherAssignmentRepository.findAllActiveOnOrAfter(tenantId, today)) {
            homeroomLabelForAssignment(tenantId, a).ifPresent(label ->
                    acc.computeIfAbsent(a.getTeacherId(), k -> new LinkedHashSet<>()).add(label));
        }

        Map<Long, List<String>> map = new HashMap<>();
        for (Map.Entry<Long, LinkedHashSet<String>> e : acc.entrySet()) {
            ArrayList<String> sorted = new ArrayList<>(e.getValue());
            Collections.sort(sorted);
            map.put(e.getKey(), sorted);
        }
        return map;
    }

    private List<String> homeroomClassNamesForTeacher(String tenantId, Long teacherPk) {
        LinkedHashSet<String> acc = new LinkedHashSet<>();
        homeroomClassNamesForTeacherFromSectionColumns(tenantId, teacherPk).forEach(acc::add);
        for (ClassTeacherAssignment a : classTeacherAssignmentRepository.findActiveForTeacher(tenantId, teacherPk, LocalDate.now())) {
            homeroomLabelForAssignment(tenantId, a).ifPresent(acc::add);
        }
        ArrayList<String> out = new ArrayList<>(acc);
        Collections.sort(out);
        return out;
    }

    /** Labels from {@code school_classes.class_teacher_id} / {@code sections.class_teacher_id} only. */
    private List<String> homeroomClassNamesForTeacherFromSectionColumns(String tenantId, Long teacherPk) {
        List<String> out = new ArrayList<>();
        for (SchoolClass c : schoolClassRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            if (sectionRepository.findByTenantIdAndClassIdAndIsDeletedFalse(tenantId, c.getId()).isEmpty()) {
                out.add(c.getName());
            }
        }
        for (Section sec : sectionRepository.findByTenantIdAndClassTeacherIdAndIsDeletedFalse(tenantId, teacherPk)) {
            schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(sec.getClassId(), tenantId)
                    .ifPresent(c -> out.add(c.getName() + "-" + sec.getName()));
        }
        return out;
    }

    private Optional<String> homeroomLabelForAssignment(String tenantId, ClassTeacherAssignment a) {
        Optional<SchoolClass> oc = schoolClassRepository.findByIdAndTenantIdAndIsDeletedFalse(a.getClassId(), tenantId);
        if (oc.isEmpty()) {
            return Optional.empty();
        }
        SchoolClass c = oc.get();
        if (a.getSectionId() == null) {
            return Optional.of(c.getName());
        }
        return sectionRepository.findByIdAndTenantIdAndIsDeletedFalse(a.getSectionId(), tenantId)
                .map(sec -> c.getName() + "-" + sec.getName());
    }

    public TeacherService(final TeacherRepository repo,
                          final SchoolClassRepository schoolClassRepository,
                          final SectionRepository sectionRepository,
                          final ClassTeacherAssignmentRepository classTeacherAssignmentRepository,
                          final PortalUserProvisioningService portalUserProvisioningService,
                          final UserRepository userRepository,
                          final ObjectProvider<CacheService> cacheService) {
        this.repo = repo;
        this.schoolClassRepository = schoolClassRepository;
        this.sectionRepository = sectionRepository;
        this.classTeacherAssignmentRepository = classTeacherAssignmentRepository;
        this.portalUserProvisioningService = portalUserProvisioningService;
        this.userRepository = userRepository;
        this.cacheService = cacheService;
    }

    private String required(Map<String, String> row, String key) {
        String value = blankToNull(row.get(key));
        if (value == null) {
            throw new com.school.erp.common.exception.BusinessException("Missing required column value: " + key);
        }
        return value;
    }

    private String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private java.time.LocalDate parseDate(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? java.time.LocalDate.parse(normalized) : null;
    }

    private BigDecimal parseDecimal(String value) {
        String normalized = blankToNull(value);
        return normalized != null ? new BigDecimal(normalized) : null;
    }

    private List<String> parseSubjects(String value) {
        String normalized = blankToNull(value);
        if (normalized == null) {
            return List.of();
        }
        return java.util.Arrays.stream(normalized.split("\\|"))
                .map(String::trim)
                .filter(part -> !part.isEmpty())
                .collect(Collectors.toList());
    }
}
