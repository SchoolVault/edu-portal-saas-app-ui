package com.school.erp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.Arrays;

@SpringBootApplication
@EnableJpaAuditing
@EnableAsync
@EnableScheduling
public class SchoolErpApplication {

    private static final Logger log = LoggerFactory.getLogger(SchoolErpApplication.class);

    public static void main(String[] args) {
        ConfigurableApplicationContext ctx = SpringApplication.run(SchoolErpApplication.class, args);
        log.info("School ERP API ready activeProfiles={} pid={}",
                Arrays.toString(ctx.getEnvironment().getActiveProfiles()),
                ProcessHandle.current().pid());
    }
}
