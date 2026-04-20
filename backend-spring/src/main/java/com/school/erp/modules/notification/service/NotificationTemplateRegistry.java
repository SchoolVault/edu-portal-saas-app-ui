package com.school.erp.modules.notification.service;

import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;

/**
 * Channel + locale aware template registry.
 * Keeps rendering contract stable for mock and real providers.
 */
@Service
public class NotificationTemplateRegistry {
    private static final String DEFAULT_LOCALE = "en";
    private final Map<String, Map<String, String>> templates = new ConcurrentHashMap<>();

    public void registerTemplate(String channel, String templateKey, String locale, String templateBody) {
        String key = normalizeChannel(channel) + ":" + normalizeTemplateKey(templateKey);
        templates.computeIfAbsent(key, ignored -> new ConcurrentHashMap<>())
                .put(normalizeLocale(locale), templateBody);
    }

    public String resolveTemplate(String channel, String templateKey, String locale) {
        String key = normalizeChannel(channel) + ":" + normalizeTemplateKey(templateKey);
        Map<String, String> localized = templates.get(key);
        if (localized == null || localized.isEmpty()) {
            return null;
        }
        String localeKey = normalizeLocale(locale);
        if (localized.containsKey(localeKey)) {
            return localized.get(localeKey);
        }
        return localized.getOrDefault(DEFAULT_LOCALE, localized.values().iterator().next());
    }

    private String normalizeChannel(String channel) {
        return channel == null ? "SMS" : channel.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeTemplateKey(String templateKey) {
        return templateKey == null ? "DEFAULT" : templateKey.trim().toUpperCase(Locale.ROOT);
    }

    private String normalizeLocale(String locale) {
        return locale == null || locale.isBlank() ? DEFAULT_LOCALE : locale.trim().toLowerCase(Locale.ROOT);
    }
}
