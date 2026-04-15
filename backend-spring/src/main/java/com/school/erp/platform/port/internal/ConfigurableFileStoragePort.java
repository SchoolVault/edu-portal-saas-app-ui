package com.school.erp.platform.port.internal;

import com.school.erp.platform.port.FileStoragePort;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Locale;
import java.util.UUID;

@Service
public class ConfigurableFileStoragePort implements FileStoragePort {

    private final String publicBaseUrl;

    public ConfigurableFileStoragePort(
            @Value("${app.storage.public-base-url:http://localhost:8080/api/v1/documents/download/}") String publicBaseUrl) {
        this.publicBaseUrl = publicBaseUrl.endsWith("/") ? publicBaseUrl : publicBaseUrl + "/";
    }

    @Override
    public String buildObjectKey(String tenantId, String category, String sanitizedFileName) {
        String t = tenantId != null ? tenantId : "_";
        String c = category != null ? category.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "") : "misc";
        String f = sanitizedFileName != null ? sanitizedFileName.replaceAll("[^a-zA-Z0-9._-]", "_") : "file";
        return t + "/" + c + "/" + UUID.randomUUID() + "_" + f;
    }

    @Override
    public String buildPublicUrl(String tenantId, String storageKey) {
        if (storageKey == null || storageKey.isBlank()) {
            return publicBaseUrl;
        }
        return publicBaseUrl + storageKey;
    }
}
