package com.school.erp.common.observability;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.reflect.MethodSignature;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

/**
 * Captures controller latency by module/controller/method.
 * Bounded tags only (no tenant/user/request-id) to avoid high-cardinality leaks.
 */
@Aspect
@Component
@ConditionalOnProperty(prefix = "app.observability.api-timing", name = "enabled", havingValue = "true", matchIfMissing = true)
public class ApiLatencyMetricsAspect {

    private final MeterRegistry meterRegistry;

    public ApiLatencyMetricsAspect(MeterRegistry meterRegistry) {
        this.meterRegistry = meterRegistry;
    }

    @Around("execution(public * com.school.erp.modules..*Controller.*(..))")
    public Object measureControllerLatency(ProceedingJoinPoint pjp) throws Throwable {
        MethodSignature sig = (MethodSignature) pjp.getSignature();
        String className = sig.getDeclaringType().getSimpleName();
        String method = sig.getName();
        String module = resolveModule(sig.getDeclaringTypeName());

        long startNs = System.nanoTime();
        try {
            Object out = pjp.proceed();
            record(module, className, method, "success", System.nanoTime() - startNs);
            return out;
        } catch (Throwable ex) {
            record(module, className, method, "error", System.nanoTime() - startNs);
            throw ex;
        }
    }

    private void record(String module, String controller, String method, String outcome, long elapsedNs) {
        Timer.builder("erp.api.latency")
                .description("Controller API latency")
                .tag("module", module)
                .tag("controller", controller)
                .tag("method", method)
                .tag("outcome", outcome)
                .register(meterRegistry)
                .record(elapsedNs, TimeUnit.NANOSECONDS);
    }

    private String resolveModule(String declaringTypeName) {
        String token = ".modules.";
        int idx = declaringTypeName.indexOf(token);
        if (idx < 0) {
            return "unknown";
        }
        String tail = declaringTypeName.substring(idx + token.length());
        int dot = tail.indexOf('.');
        if (dot < 0) {
            return tail;
        }
        return tail.substring(0, dot);
    }
}

