package com.school.erp.security;

import com.school.erp.modules.academic.service.CurrentAcademicYearResolver;
import com.school.erp.tenant.AcademicYearContext;
import com.school.erp.tenant.TenantContext;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Binds academic year to request scope for authenticated tenant requests.
 */
@Component
public class AcademicYearContextFilter extends OncePerRequestFilter {

    private final CurrentAcademicYearResolver currentAcademicYearResolver;

    public AcademicYearContextFilter(CurrentAcademicYearResolver currentAcademicYearResolver) {
        this.currentAcademicYearResolver = currentAcademicYearResolver;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = TenantContext.getTenantId();
            if (tenantId != null && !tenantId.isBlank()) {
                Long academicYearId = currentAcademicYearResolver.resolveCurrentAcademicYearId(tenantId);
                if (academicYearId == null) {
                    if (!isPlatformSuperAdminRequest()) {
                        response.sendError(HttpServletResponse.SC_BAD_REQUEST, "Academic year is not configured for this tenant");
                        return;
                    }
                } else {
                    AcademicYearContext.setAcademicYearId(academicYearId);
                }
            }
            filterChain.doFilter(request, response);
        } finally {
            AcademicYearContext.clear();
        }
    }

    private static boolean isPlatformSuperAdminRequest() {
        String role = TenantContext.getUserRole();
        return role != null && role.equalsIgnoreCase("SUPER_ADMIN");
    }
}
