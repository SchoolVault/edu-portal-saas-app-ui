package com.school.erp.common.logging;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * DEBUG: service-layer entry/exit + timing without logging payloads (PII-safe, extensible).
 * Enable with {@code LOG_LEVEL_APP=DEBUG} or {@code logging.level.com.school.erp.modules=DEBUG}.
 */
@Aspect
@Component
public class ServiceLayerLoggingAspect {

    @Around("execution(* com.school.erp.modules..service..*.*(..))")
    public Object logServiceCall(ProceedingJoinPoint pjp) throws Throwable {
        Logger log = LoggerFactory.getLogger(pjp.getTarget().getClass());
        String sig = pjp.getSignature().getName();
        long t0 = System.nanoTime();
        boolean debug = log.isDebugEnabled();
        if (debug) {
            log.debug("service enter {} argCount={}", sig, pjp.getArgs() == null ? 0 : pjp.getArgs().length);
        }
        try {
            Object out = pjp.proceed();
            if (debug) {
                log.debug("service exit {} ({} ms)", sig, (System.nanoTime() - t0) / 1_000_000L);
            }
            return out;
        } catch (Throwable ex) {
            log.warn("service fail {} after {} ms: {}", sig, (System.nanoTime() - t0) / 1_000_000L, ex.toString());
            throw ex;
        }
    }
}
